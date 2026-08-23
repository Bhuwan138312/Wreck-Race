import { useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { vehicleState } from '../../store/vehicleState';
export interface WheelConfig {
  position: THREE.Vector3; // Local connection point on chassis
  radius: number;
  isFrontWheel?: boolean;
  meshRef?: RefObject<THREE.Object3D | null>;
}

export interface RaycastVehicleConfig {
  wheels: WheelConfig[];
  suspensionRestLength: number;
  suspensionStiffness: number;
  suspensionDamping: number;
  debugLinesRef?: RefObject<THREE.LineSegments | null>;
  controls?: React.MutableRefObject<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    reset: boolean;
  }>;
  engine?: {
    maxSpeed: number; // in km/h
    engineForce: number;
  };
  handling?: {
    baseSteeringAngle?: number;
    highSpeedSteeringAngle?: number;
    arcadeGripFactor?: number;
  };
}

const localDown = new THREE.Vector3(0, -1, 0);
const localUp = new THREE.Vector3(0, 1, 0);

export function useRaycastVehicle(
  chassisRef: RefObject<RapierRigidBody | null>,
  config: RaycastVehicleConfig
) {
  const { rapier } = useRapier();
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useBeforePhysicsStep((world) => {
    const currentConfig = configRef.current;
    const chassis = chassisRef.current;
    if (!chassis) return;

    // Get current chassis transform
    const translation = chassis.translation();
    const rotation = chassis.rotation();
    const chassisPos = new THREE.Vector3(translation.x, translation.y, translation.z);
    const chassisQuat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

    // Calculate world down and up directions
    const worldDown = localDown.clone().applyQuaternion(chassisQuat);
    const worldUp = localUp.clone().applyQuaternion(chassisQuat);

    let debugLinePositions: Float32Array | null = null;
    if (currentConfig.debugLinesRef && currentConfig.debugLinesRef.current) {
      debugLinePositions = currentConfig.debugLinesRef.current.geometry.attributes.position.array as Float32Array;
    }

    // Calculate common velocity variables
    const localForward = new THREE.Vector3(0, 0, 1);
    const worldForward = localForward.clone().applyQuaternion(chassisQuat);
    const velocity = chassis.linvel();
    const velocityVec = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
    const forwardSpeed = velocityVec.dot(worldForward);

    // Calculate target steering angle for visual animation
    const maxForwardSpeed = (currentConfig.engine?.maxSpeed ?? 42) / 3.6;

    // Speed-sensitive steering: reduce the max steering angle as forward
    // speed increases. This is standard in real cars and in most car games —
    // without it, a full steering angle at high speed demands more lateral
    // grip than the tires can supply, which is what was causing the rear
    // to slip/drift specifically at higher forward speeds (reverse never
    // got fast enough to expose the same demand).
    const baseMaxSteeringAngle = currentConfig.handling?.baseSteeringAngle ?? (Math.PI / 5.2);
    const minMaxSteeringAngle = currentConfig.handling?.highSpeedSteeringAngle ?? (Math.PI / 15);
    const speedForMinSteering = maxForwardSpeed;

    const speedFactor01 = THREE.MathUtils.clamp(Math.abs(forwardSpeed) / speedForMinSteering, 0, 1);
    const maxSteeringAngle = THREE.MathUtils.lerp(baseMaxSteeringAngle, minMaxSteeringAngle, speedFactor01);

    let targetSteeringAngle = 0;
    if (currentConfig.controls && currentConfig.controls.current) {
      if (currentConfig.controls.current.left) targetSteeringAngle = maxSteeringAngle;
      if (currentConfig.controls.current.right) targetSteeringAngle = -maxSteeringAngle;
    }
    const visualSteeringSpeed = 3.5;

    // For each wheel
    for (let i = 0; i < currentConfig.wheels.length; i++) {
      const wheel = currentConfig.wheels[i];
      const maxRayDistance = currentConfig.suspensionRestLength + wheel.radius;
      const wheelWorldPos = wheel.position.clone().applyQuaternion(chassisQuat).add(chassisPos);

      const ray = new rapier.Ray(
        { x: wheelWorldPos.x, y: wheelWorldPos.y, z: wheelWorldPos.z },
        { x: worldDown.x, y: worldDown.y, z: worldDown.z }
      );

      const hit = world.castRay(ray, maxRayDistance, true, undefined, undefined, undefined, chassis);

      let hitDistance = maxRayDistance;
      if (hit && hit.collider) {
        hitDistance = (hit as any).toi ?? (hit as any).timeOfImpact ?? (hit as any).distance ?? maxRayDistance;
      }

      if (hitDistance < maxRayDistance) {
        // --- Suspension (spring + damper), compression clamped to real travel ---
        const rawCompression = maxRayDistance - hitDistance;
        const compression = Math.max(0, Math.min(rawCompression, currentConfig.suspensionRestLength));

        const velocityAtPoint = chassis.velocityAtPoint({
          x: wheelWorldPos.x,
          y: wheelWorldPos.y,
          z: wheelWorldPos.z,
        });
        const velAtPointVec = new THREE.Vector3(velocityAtPoint.x, velocityAtPoint.y, velocityAtPoint.z);
        const suspensionVelocity = velAtPointVec.dot(worldUp);

        const springForce = currentConfig.suspensionStiffness * compression;
        const dampingForce = currentConfig.suspensionDamping * suspensionVelocity;

        let totalForce = springForce - dampingForce;
        if (totalForce < 0) totalForce = 0; // suspension only pushes, never pulls

        const forceVec = worldUp.clone().multiplyScalar(totalForce);
        chassis.applyImpulseAtPoint(
          { x: forceVec.x * world.timestep, y: forceVec.y * world.timestep, z: forceVec.z * world.timestep },
          { x: wheelWorldPos.x, y: wheelWorldPos.y, z: wheelWorldPos.z },
          true
        );

        // --- Lateral tire force (arcade style: kill lateral velocity) ---
        let currentSteeringAngle = 0;
        if (wheel.isFrontWheel && wheel.meshRef && wheel.meshRef.current) {
          currentSteeringAngle = wheel.meshRef.current.rotation.y;
        }

        const wheelForward = worldForward.clone();
        if (wheel.isFrontWheel) {
          wheelForward.applyAxisAngle(worldUp, currentSteeringAngle);
        }
        const wheelRight = worldUp.clone().cross(wheelForward).normalize();

        const vLat = velAtPointVec.dot(wheelRight);

        // To remove slip/drift, we directly calculate the force needed to stop the
        // wheel's lateral velocity, providing an "on rails" planted feel.
        // If the car tilts past ~45 degrees (worldUp.y < 0.7), we aggressively cut lateral grip 
        // so it loses traction and falls over naturally instead of balancing on two wheels.
        let tiltGripMultiplier = 1.0;
        if (worldUp.y < 0.7) {
          tiltGripMultiplier = Math.max(0, (worldUp.y - 0.2) / 0.5);
        }

        const massPerWheel = chassis.mass() / currentConfig.wheels.length;
        // We use a factor slightly less than 1 (0.8) to prevent physics jitter
        // when multiple wheels are resolving their lateral constraints at once.
        const baseArcadeGrip = currentConfig.handling?.arcadeGripFactor ?? 0.8;
        const arcadeGripFactor = baseArcadeGrip * tiltGripMultiplier;
        let lateralForce = (-vLat * massPerWheel * arcadeGripFactor) / world.timestep;

        const Fz = Math.max(0, totalForce);
        // Cap relative to load, using a high effective friction coefficient
        const tireFrictionCoefficient = 8.0;
        const maxLateralForce = tireFrictionCoefficient * Fz;
        lateralForce = THREE.MathUtils.clamp(lateralForce, -maxLateralForce, maxLateralForce);

        const lateralImpulse = wheelRight.clone().multiplyScalar(lateralForce * world.timestep);
        chassis.applyImpulseAtPoint(
          { x: lateralImpulse.x, y: lateralImpulse.y, z: lateralImpulse.z },
          { x: wheelWorldPos.x, y: wheelWorldPos.y, z: wheelWorldPos.z },
          true
        );
      }

      // Update visual wheel position, steering, and rotation
      if (wheel.meshRef && wheel.meshRef.current) {
        const mesh = wheel.meshRef.current;

        if (mesh.rotation.order !== 'YXZ') {
          mesh.rotation.order = 'YXZ';
        }

        mesh.position.y = wheel.position.y + wheel.radius - hitDistance;

        if (wheel.isFrontWheel) {
          mesh.rotation.y = THREE.MathUtils.lerp(
            mesh.rotation.y,
            targetSteeringAngle,
            visualSteeringSpeed * world.timestep
          );
        }

        const angularVelocity = forwardSpeed / wheel.radius;
        mesh.rotation.x += angularVelocity * world.timestep;
      }

      if (debugLinePositions) {
        const index = i * 6;
        debugLinePositions[index] = wheelWorldPos.x;
        debugLinePositions[index + 1] = wheelWorldPos.y;
        debugLinePositions[index + 2] = wheelWorldPos.z;

        const hitPointWorld = wheelWorldPos.clone().add(worldDown.clone().multiplyScalar(hitDistance));
        debugLinePositions[index + 3] = hitPointWorld.x;
        debugLinePositions[index + 4] = hitPointWorld.y;
        debugLinePositions[index + 5] = hitPointWorld.z;
      }
    }

    // --- Basic Arcade Driving Controls (throttle only — steering is now
    // handled entirely by the lateral tire forces above, not scripted torque) ---
    if (currentConfig.controls && currentConfig.controls.current) {
      const { forward, backward } = currentConfig.controls.current;

      const maxForwardSpeed = (currentConfig.engine?.maxSpeed ?? 42) / 3.6;
      const maxReverseSpeed = -20 / 3.6; // ~20 km/h reverse
      const acceleration = currentConfig.engine?.engineForce ?? 8;

      let engineForce = 0;

      if (forward) {
        if (forwardSpeed < maxForwardSpeed) {
          engineForce = acceleration;
        }
      } else if (backward) {
        if (forwardSpeed > maxReverseSpeed) {
          engineForce = -acceleration;
        }
      } else {
        // Coasting friction: reduced from 2.0 to 0.5 to let the car roll longer before stopping
        engineForce = -forwardSpeed * 0.5;
      }

      if (Math.abs(engineForce) > 0.01) {
        const forceVec = worldForward.clone().multiplyScalar(engineForce * world.timestep * chassis.mass());
        chassis.applyImpulse(forceVec, true);
      }

      // NOTE: the old "Steering logic" block that applied a direct yaw
      // torque impulse based on left/right input has been removed.
      // Turning now emerges entirely from the lateral tire forces above,
      // which act off-center at each wheel and naturally produce both a
      // net sideways force and a yaw torque, the same way real tires do.
    }

    if (currentConfig.debugLinesRef && currentConfig.debugLinesRef.current) {
      currentConfig.debugLinesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // --- Update UI State ---
    vehicleState.speed = Math.abs(forwardSpeed) * 3.6; // convert m/s to km/h

    if (currentConfig.controls && currentConfig.controls.current) {
      const { forward, backward } = currentConfig.controls.current;
      if (Math.abs(forwardSpeed) < 0.5 && !forward && !backward) {
        vehicleState.gear = 'P';
      } else if (forwardSpeed < -0.5 || (backward && forwardSpeed < 0.5)) {
        vehicleState.gear = 'R';
      } else {
        vehicleState.gear = 'D';
      }

      const maxForwardSpeed = (currentConfig.engine?.maxSpeed ?? 42) / 3.6;

      // Calculate RPM purely based on speed so it accurately decreases as speed decreases
      let rpm = 0.1 + (Math.abs(forwardSpeed) / maxForwardSpeed) * 0.9;

      vehicleState.rpm = Math.min(1, Math.max(0, rpm));
    }

    // --- Flip Detection & Reset Logic ---
    const isFlipped = worldUp.y < 0.2;
    vehicleState.isFlipped = isFlipped;

    if (currentConfig.controls?.current.reset) {
      currentConfig.controls.current.reset = false; // Consume input

      // Extract current yaw to keep the vehicle facing the same way
      const euler = new THREE.Euler().setFromQuaternion(chassisQuat, 'YXZ');
      const resetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, euler.y, 0, 'YXZ'));

      chassis.setRotation(resetQuat, true);

      // Nudge up to prevent clipping
      chassis.setTranslation({ x: chassisPos.x, y: chassisPos.y + 2.0, z: chassisPos.z }, true);

      // Zero out all velocities
      chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
      chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  });
}