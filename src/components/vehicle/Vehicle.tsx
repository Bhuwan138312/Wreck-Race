import { useRef, useEffect } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import { RigidBody, CuboidCollider, BallCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useRaycastVehicle } from '../../systems/vehiclePhysics/useRaycastVehicle';
import { useControls } from '../../systems/vehiclePhysics/useControls';
import { useFrame } from '@react-three/fiber';
import { couplingManager, notifyCouplingState } from '../../systems/CouplingManager';

import { SedanModel } from './SedanModel';
import { PoliceModel } from './PoliceModel';
import { SUVModel } from './SUVModel';
import { FiretruckModel } from './FiretruckModel';
import { DeliveryModel } from './DeliveryModel';
import { GarbageTruckModel } from './GarbageTruckModel';
import { SedanSportsModel } from './SedanSportsModel';
import { TaxiModel } from './TaxiModel';
import { RaceCarModel } from './RaceCarModel';

import { FollowCamera } from '../camera/FollowCamera';

type VehicleProps = ThreeElements['group'] & {
  modelId: 'sedan' | 'police' | 'suv' | 'firetruck' | 'delivery' | 'garbage-truck' | 'crossover' | 'taxi' | 'race';
  cameraMode?: 'follow' | 'dev';
};

const vehicleConfigs = {
  sedan: {
    wheels: [
      { pos: [0.3, 0.3, 0.66], radius: 0.3, front: true },
      { pos: [-0.3, 0.3, 0.66], radius: 0.3, front: true },
      { pos: [0.3, 0.3, -0.66], radius: 0.3, front: false },
      { pos: [-0.3, 0.3, -0.66], radius: 0.3, front: false },
    ],
    colliderArgs: [0.35, 0.20, 0.8] as [number, number, number],
    colliderPos: [0, 0.25, 0] as [number, number, number],
    component: SedanModel,
    mass: 1,
    engine: { maxSpeed: 85 },
    handling: { highSpeedSteeringAngle: Math.PI / 12, arcadeGripFactor: 0.7 },
    suspension: {
      // Increased travel (0.06 -> 0.08) so the collision box doesn't bottom out on small bumps, and increased damping to eliminate bouncing
      restLength: 0.08,
      stiffness: 90,
      damping: 15
    }
  },
  crossover: {
    wheels: [
      { pos: [0.33, 0.3, 0.66], radius: 0.3, front: true },
      { pos: [-0.33, 0.3, 0.66], radius: 0.3, front: true },
      { pos: [0.33, 0.3, -0.66], radius: 0.3, front: false },
      { pos: [-0.33, 0.3, -0.66], radius: 0.3, front: false },
    ],
    colliderArgs: [0.35, 0.30, 0.8] as [number, number, number],
    colliderPos: [0, 0.45, 0.1] as [number, number, number],
    component: SedanSportsModel,
    mass: 2.0,
    engine: { maxSpeed: 78 },
    handling: { highSpeedSteeringAngle: Math.PI / 10, arcadeGripFactor: 0.9 },
    suspension: {
      restLength: 0.12,
      stiffness: 60,
      damping: 6
    }
  },
  taxi: {
    wheels: [
      { pos: [0.33, 0.3, 0.76], radius: 0.3, front: true },
      { pos: [-0.33, 0.3, 0.76], radius: 0.3, front: true },
      { pos: [0.33, 0.3, -0.76], radius: 0.3, front: false },
      { pos: [-0.33, 0.3, -0.76], radius: 0.3, front: false },
    ],
    colliderArgs: [0.35, 0.30, 0.9] as [number, number, number],
    colliderPos: [0, 0.45, 0.1] as [number, number, number],
    component: TaxiModel,
    mass: 2.0,
    engine: { maxSpeed: 78 },
    handling: { highSpeedSteeringAngle: Math.PI / 10, arcadeGripFactor: 0.9 },
    suspension: {
      restLength: 0.12,
      stiffness: 60,
      damping: 6
    }
  },
  race: {
    // Ultra-wide track and stiff F1 setup
    wheels: [
      { pos: [0.4, 0.3, 0.64], radius: 0.3, front: true },
      { pos: [-0.4, 0.3, 0.64], radius: 0.3, front: true },
      { pos: [0.4, 0.3, -0.88], radius: 0.3, front: false },
      { pos: [-0.4, 0.3, -0.88], radius: 0.3, front: false },
    ],
    // Extremely low center of gravity
    colliderArgs: [0.35, 0.15, 0.8] as [number, number, number],
    colliderPos: [0, 0.25, -0.1] as [number, number, number],
    component: RaceCarModel,
    mass: 1.0, // Light and agile
    engine: {
      maxSpeed: 100, // 100 km/h top speed
      engineForce: 25 // Insane acceleration
    },
    handling: { highSpeedSteeringAngle: Math.PI / 8, arcadeGripFactor: 1.0 },
    suspension: {
      restLength: 0.04, // Very short travel
      stiffness: 150,   // Extremely stiff springs
      damping: 20       // Heavy damping to prevent any bouncing
    }
  },
  police: {
    wheels: [
      { pos: [0.3, 0.3, 0.81], radius: 0.3, front: true },
      { pos: [-0.3, 0.3, 0.81], radius: 0.3, front: true },
      { pos: [0.3, 0.3, -0.81], radius: 0.3, front: false },
      { pos: [-0.3, 0.3, -0.81], radius: 0.3, front: false },
    ],
    colliderArgs: [0.35, 0.20, 0.95] as [number, number, number],
    colliderPos: [0, 0.45, 0] as [number, number, number],
    component: PoliceModel,
    mass: 1.1,
    engine: { maxSpeed: 92 },
    handling: { highSpeedSteeringAngle: Math.PI / 8, arcadeGripFactor: 0.95 },
    suspension: {
      restLength: 0.08,
      stiffness: 90,
      damping: 15
    }
  },
  suv: {
    wheels: [
      { pos: [0.36, 0.3, 0.76], radius: 0.3, front: true },
      { pos: [-0.36, 0.3, 0.76], radius: 0.3, front: true },
      { pos: [0.36, 0.3, -0.56], radius: 0.3, front: false },
      { pos: [-0.36, 0.3, -0.56], radius: 0.3, front: false },
    ],
    colliderArgs: [0.35, 0.30, 0.8] as [number, number, number],
    colliderPos: [0, 0.40, 0.1] as [number, number, number],
    component: SUVModel,
    mass: 2.0,
    engine: { maxSpeed: 76 },
    handling: { highSpeedSteeringAngle: Math.PI / 12, arcadeGripFactor: 0.9 },
    suspension: {
      restLength: 0.14,
      stiffness: 45,
      damping: 4.5
    }
  },
  firetruck: {
    wheels: [
      { pos: [0.48, 0.3, 0.96], radius: 0.3, front: true },
      { pos: [-0.48, 0.3, 0.96], radius: 0.3, front: true },
      { pos: [0.48, 0.3, -0.66], radius: 0.3, front: false },
      { pos: [-0.48, 0.3, -0.66], radius: 0.3, front: false },
    ],
    colliderArgs: [0.4, 0.35, 1.2] as [number, number, number],
    colliderPos: [0, 0.45, 0] as [number, number, number],
    component: FiretruckModel,
    mass: 4.5,
    engine: { maxSpeed: 65 }, // Fallback logic for unspecified
    handling: { highSpeedSteeringAngle: Math.PI / 12, arcadeGripFactor: 0.85 },
    suspension: {
      restLength: 0.13,
      stiffness: 85,
      damping: 8.5
    }
  },
  delivery: {
    wheels: [
      { pos: [0.40, 0.3, 1.01], radius: 0.3, front: true },
      { pos: [-0.40, 0.3, 1.01], radius: 0.3, front: true },
      { pos: [0.40, 0.3, -0.61], radius: 0.3, front: false },
      { pos: [-0.40, 0.3, -0.61], radius: 0.3, front: false },
    ],
    colliderArgs: [0.35, 0.30, 1.0] as [number, number, number],
    colliderPos: [0, 0.40, 0.1] as [number, number, number],
    component: DeliveryModel,
    mass: 2.8,
    engine: { maxSpeed: 70 },
    handling: { highSpeedSteeringAngle: Math.PI / 12, arcadeGripFactor: 0.9 },
    suspension: {
      restLength: 0.12,
      stiffness: 70,
      damping: 7
    }
  },
  'garbage-truck': {
    wheels: [
      { pos: [0.48, 0.3, 1.11], radius: 0.3, front: true },
      { pos: [-0.48, 0.3, 1.11], radius: 0.3, front: true },
      { pos: [0.48, 0.3, -0.51], radius: 0.3, front: false },
      { pos: [-0.48, 0.3, -0.51], radius: 0.3, front: false },
    ],
    colliderArgs: [0.4, 0.35, 1.3] as [number, number, number],
    colliderPos: [0, 0.45, 0] as [number, number, number],
    component: GarbageTruckModel,
    mass: 4.0,
    engine: { maxSpeed: 60 },
    handling: { highSpeedSteeringAngle: Math.PI / 12, arcadeGripFactor: 0.85 },
    suspension: {
      restLength: 0.13,
      stiffness: 95,
      damping: 9.5
    }
  }
};

export function Vehicle({ modelId, cameraMode = 'dev', ...props }: VehicleProps) {
  const chassisRef = useRef<RapierRigidBody>(null);
  const cameraTargetRef = useRef<THREE.Group>(null);
  const debugLinesRef = useRef<THREE.LineSegments>(null);
  const controls = useControls();

  const wheelRefs = [
    useRef<THREE.Object3D>(null), // FL
    useRef<THREE.Object3D>(null), // FR
    useRef<THREE.Object3D>(null), // RL
    useRef<THREE.Object3D>(null), // RR
  ];

  const config = vehicleConfigs[modelId] || vehicleConfigs.sedan;

  const hitchOffset: [number, number, number] = [0, 0.35, config.colliderPos[2] - config.colliderArgs[2] - 0.3];

  useEffect(() => {
    couplingManager.registerVehicle(chassisRef, hitchOffset);
  }, [config.colliderPos, config.colliderArgs]);

  useEffect(() => {
    if (debugLinesRef.current) {
      const positions = new Float32Array(24);
      debugLinesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }, []);

  const mappedWheels = config.wheels.map((w, i) => ({
    position: new THREE.Vector3(...w.pos),
    radius: w.radius,
    isFrontWheel: w.front,
    meshRef: wheelRefs[i]
  }));

  useRaycastVehicle(chassisRef, {
    wheels: mappedWheels,
    suspensionRestLength: config.suspension.restLength,
    suspensionStiffness: config.suspension.stiffness,
    suspensionDamping: config.suspension.damping,
    engine: (config as any).engine,
    handling: (config as any).handling,
    controls,
    debugLinesRef
  });

  // Global variables for coupling to avoid garbage collection in useFrame
  const tempVec1 = new THREE.Vector3();
  const tempVec2 = new THREE.Vector3();

  useFrame(() => {
    if (!chassisRef.current) return;

    // If we're already coupled, just allow uncoupling via 'T'
    if (couplingManager.coupledTrailerId) {
      // CouplingManager.canCouple is handled below for the uncouple case (just true when coupled)
      return;
    }

    const vehicleTranslation = chassisRef.current.translation();
    const vehicleRotation = chassisRef.current.rotation();

    // Calculate world position of vehicle hitch
    tempVec1.set(...hitchOffset);
    tempVec1.applyQuaternion(new THREE.Quaternion(vehicleRotation.x, vehicleRotation.y, vehicleRotation.z, vehicleRotation.w));
    tempVec1.add(new THREE.Vector3(vehicleTranslation.x, vehicleTranslation.y, vehicleTranslation.z));

    let closestTrailer: string | null = null;
    let minDistance = 2.0; // Coupling distance threshold (2 units)

    // Check all trailers
    couplingManager.trailers.forEach((trailer) => {
      if (!trailer.ref.current) return;

      const tTrans = trailer.ref.current.translation();
      const tRot = trailer.ref.current.rotation();

      // Calculate world position of trailer hitch
      tempVec2.set(...trailer.hitchOffset);
      tempVec2.applyQuaternion(new THREE.Quaternion(tRot.x, tRot.y, tRot.z, tRot.w));
      tempVec2.add(new THREE.Vector3(tTrans.x, tTrans.y, tTrans.z));

      const dist = tempVec1.distanceTo(tempVec2);
      if (dist < minDistance) {
        minDistance = dist;
        closestTrailer = trailer.id;
      }
    });

    if (couplingManager.canCoupleTrailerId !== closestTrailer) {
      couplingManager.canCoupleTrailerId = closestTrailer;
      notifyCouplingState();
    }
  });

  // Handle 'T' key press for coupling/uncoupling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't') {
        if (couplingManager.coupledTrailerId) {
          // Uncouple
          couplingManager.coupledTrailerId = null;
          notifyCouplingState();
        } else if (couplingManager.canCoupleTrailerId) {
          // Couple
          const trailer = couplingManager.trailers.get(couplingManager.canCoupleTrailerId);
          if (trailer && trailer.ref.current && chassisRef.current) {
            // Compute the target position for the trailer to avoid physics snap
            const vTrans = chassisRef.current.translation();
            const vRot = chassisRef.current.rotation();
            const vHitchWorld = new THREE.Vector3(...hitchOffset)
              .applyQuaternion(new THREE.Quaternion(vRot.x, vRot.y, vRot.z, vRot.w))
              .add(new THREE.Vector3(vTrans.x, vTrans.y, vTrans.z));

            const tTrans = trailer.ref.current.translation();
            const tRot = trailer.ref.current.rotation();
            const tHitchWorld = new THREE.Vector3(...trailer.hitchOffset)
              .applyQuaternion(new THREE.Quaternion(tRot.x, tRot.y, tRot.z, tRot.w))
              .add(new THREE.Vector3(tTrans.x, tTrans.y, tTrans.z));

            // Shift trailer by the exact distance between the hitches
            const delta = vHitchWorld.sub(tHitchWorld);

            trailer.ref.current.setTranslation({
              x: tTrans.x + delta.x,
              y: tTrans.y + delta.y,
              z: tTrans.z + delta.z
            }, true);

            // Kill any residual velocities to prevent post-teleport jitter
            trailer.ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            trailer.ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          }

          couplingManager.coupledTrailerId = couplingManager.canCoupleTrailerId;
          couplingManager.canCoupleTrailerId = null; // hide the prompt
          notifyCouplingState();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ModelComponent = config.component;

  return (
    <group>
      <RigidBody
        ref={chassisRef}
        type="dynamic"
        colliders={false}
        mass={config.mass || 1}
        linearDamping={0.3}
        angularDamping={0.3}
        enabledRotations={[true, true, true]}
        position={props.position}
        rotation={props.rotation}
      >
        <CuboidCollider args={config.colliderArgs} position={config.colliderPos} />

        {config.wheels.map((w, i) => (
          <BallCollider key={i} args={[w.radius]} position={w.pos as [number, number, number]} friction={0} restitution={0} />
        ))}

        <group ref={cameraTargetRef} />

        <ModelComponent wheelRefs={wheelRefs as any} />

        {/* Vehicle Hitch Highlight */}
        <mesh position={hitchOffset}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
      </RigidBody>

      <lineSegments ref={debugLinesRef} frustumCulled={false} visible={false}>
        <bufferGeometry />
        <lineBasicMaterial color="hotpink" depthTest={false} transparent opacity={0.8} linewidth={2} />
      </lineSegments>

      {/* Follow Camera Manager */}
      <FollowCamera targetRef={cameraTargetRef} enabled={cameraMode === 'follow'} />
    </group>
  );
}
