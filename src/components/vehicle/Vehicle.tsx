import React, { useRef, useEffect } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import { RigidBody, CuboidCollider, BallCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useRaycastVehicle } from '../../systems/vehiclePhysics/useRaycastVehicle';
import { useControls } from '../../systems/vehiclePhysics/useControls';

type VehicleProps = ThreeElements['group'] & {
  children: React.ReactElement;
};

export function Vehicle({ children, ...props }: VehicleProps) {
  const chassisRef = useRef<RapierRigidBody>(null);
  
  const wheelRefs = [
    useRef<THREE.Object3D>(null), // FL
    useRef<THREE.Object3D>(null), // FR
    useRef<THREE.Object3D>(null), // RL
    useRef<THREE.Object3D>(null), // RR
  ];

  const debugLinesRef = useRef<THREE.LineSegments>(null);
  const controls = useControls();

  useEffect(() => {
    if (debugLinesRef.current) {
      // 4 wheels * 2 points (start, end) * 3 coords (x, y, z) = 24
      const positions = new Float32Array(24); 
      debugLinesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }, []);

  useRaycastVehicle(chassisRef, {
    wheels: [
      { position: new THREE.Vector3(0.3, 0.3, 0.66), radius: 0.3, isFrontWheel: true, meshRef: wheelRefs[0] },   // Front Left
      { position: new THREE.Vector3(-0.3, 0.3, 0.66), radius: 0.3, isFrontWheel: true, meshRef: wheelRefs[1] },  // Front Right
      { position: new THREE.Vector3(0.3, 0.3, -0.66), radius: 0.3, meshRef: wheelRefs[2] },  // Rear Left
      { position: new THREE.Vector3(-0.3, 0.3, -0.66), radius: 0.3, meshRef: wheelRefs[3] }, // Rear Right
    ],
    suspensionRestLength: 0.06, 
    suspensionStiffness: 90,
    suspensionDamping: 6,
    debugLinesRef,
    controls,
  });

  return (
    <group>
      <RigidBody
        ref={chassisRef}
        type="dynamic"
        colliders={false}
        mass={1}
        linearDamping={0.3}
        angularDamping={1.2}
        enabledRotations={[true, true, true]}
        position={props.position}
        rotation={props.rotation}
      >
        {/* Adjusted collider to provide clearance for the wheels */}
        <CuboidCollider args={[0.35, 0.20, 0.8]} position={[0, 0.45, 0]} />
        
        {/* Physical wheel colliders to act as a hard stop against the ground. Friction is 0 so they slide over bumps instead of snagging. */}
        <BallCollider args={[0.3]} position={[0.3, 0.3, 0.66]} friction={0} restitution={0} />
        <BallCollider args={[0.3]} position={[-0.3, 0.3, 0.66]} friction={0} restitution={0} />
        <BallCollider args={[0.3]} position={[0.3, 0.3, -0.66]} friction={0} restitution={0} />
        <BallCollider args={[0.3]} position={[-0.3, 0.3, -0.66]} friction={0} restitution={0} />

        {React.cloneElement(children as React.ReactElement<any>, { wheelRefs })}
      </RigidBody>
      
      {/* Debug Raycast Lines (drawn in world space) */}
      <lineSegments ref={debugLinesRef} frustumCulled={false}>
        <bufferGeometry />
        <lineBasicMaterial color="hotpink" depthTest={false} transparent opacity={0.8} linewidth={2} />
      </lineSegments>
    </group>
  );
}
