import type { RefObject } from 'react';
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

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
  }>;
}

const localDown = new THREE.Vector3(0, -1, 0);
const localUp = new THREE.Vector3(0, 1, 0);

export function useRaycastVehicle(
  chassisRef: RefObject<RapierRigidBody | null>,
  config: RaycastVehicleConfig
) {
  const { rapier } = useRapier();

  useBeforePhysicsStep((world) => {
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
    if (config.debugLinesRef && config.debugLinesRef.current) {
      debugLinePositions = config.debugLinesRef.current.geometry.attributes.position.array as Float32Array;
    }

    // Calculate common velocity variables
    const localForward = new THREE.Vector3(0, 0, 1);
    const worldForward = localForward.clone().applyQuaternion(chassisQuat);
    const velocity = chassis.linvel();
    const velocityVec = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
    const forwardSpeed = velocityVec.dot(worldForward);

    // Calculate target steering angle for visual animation
    let targetSteeringAngle = 0;
    const maxSteeringAngle = Math.PI / 6; // 30 degrees
    if (config.controls && config.controls.current) {
       if (config.controls.current.left) targetSteeringAngle = maxSteeringAngle;
       if (config.controls.current.right) targetSteeringAngle = -maxSteeringAngle;
    }
    const visualSteeringSpeed = 8.0;

    // For each wheel
    for (let i = 0; i < config.wheels.length; i++) {
      const wheel = config.wheels[i];
      // Max ray distance is rest length + wheel radius
      const maxRayDistance = config.suspensionRestLength + wheel.radius;

      // Get wheel world position
      const wheelWorldPos = wheel.position.clone().applyQuaternion(chassisQuat).add(chassisPos);

      // Create ray
      const ray = new rapier.Ray(
        { x: wheelWorldPos.x, y: wheelWorldPos.y, z: wheelWorldPos.z },
        { x: worldDown.x, y: worldDown.y, z: worldDown.z }
      );

      // Exclude the entire chassis RigidBody (including all its colliders) from the raycast
      const hit = world.castRay(ray, maxRayDistance, true, undefined, undefined, undefined, chassis);

      let hitDistance = maxRayDistance;
      if (hit && hit.collider) {
        hitDistance = (hit as any).toi ?? (hit as any).timeOfImpact ?? (hit as any).distance ?? maxRayDistance;
      }

      if (hitDistance < maxRayDistance) {
        // Calculate compression (0 = fully extended, >0 = compressed)
        // Clamp compression so it never exceeds the physical suspension travel
        const rawCompression = maxRayDistance - hitDistance;
        const compression = Math.max(0, Math.min(rawCompression, config.suspensionRestLength));

        // Calculate suspension velocity
        // Get velocity of the chassis at the wheel connection point
        const velocityAtPoint = chassis.velocityAtPoint({
          x: wheelWorldPos.x,
          y: wheelWorldPos.y,
          z: wheelWorldPos.z
        });

        const velocityVec = new THREE.Vector3(velocityAtPoint.x, velocityAtPoint.y, velocityAtPoint.z);
        // Project velocity onto the suspension axis (world Up)
        const suspensionVelocity = velocityVec.dot(worldUp);

        // Calculate forces
        const springForce = config.suspensionStiffness * compression;
        const dampingForce = config.suspensionDamping * suspensionVelocity;

        let totalForce = springForce - dampingForce;

        // Prevent suspension from pulling the car down (force should only push up)
        if (totalForce < 0) totalForce = 0;

        // Apply force to chassis at the wheel connection point
        const forceVec = worldUp.clone().multiplyScalar(totalForce);
        chassis.applyImpulseAtPoint(
          { x: forceVec.x * world.timestep, y: forceVec.y * world.timestep, z: forceVec.z * world.timestep },
          { x: wheelWorldPos.x, y: wheelWorldPos.y, z: wheelWorldPos.z },
          true
        );

        // Simple temporary horizontal friction to prevent sliding on flat ground
        // Removes the vertical velocity to find pure lateral movement
        const pointVel = new THREE.Vector3(velocityAtPoint.x, velocityAtPoint.y, velocityAtPoint.z);
        const verticalVel = worldUp.clone().multiplyScalar(pointVel.dot(worldUp));
        const lateralVel = pointVel.clone().sub(verticalVel);

        // Apply a damping impulse opposite to the lateral velocity
        const lateralDamping = 5.0;
        const frictionImpulse = lateralVel.clone().multiplyScalar(-lateralDamping * world.timestep);

        chassis.applyImpulseAtPoint(
          { x: frictionImpulse.x, y: frictionImpulse.y, z: frictionImpulse.z },
          { x: wheelWorldPos.x, y: wheelWorldPos.y, z: wheelWorldPos.z },
          true
        );
      }

      // Update visual wheel position, steering, and rotation
      if (wheel.meshRef && wheel.meshRef.current) {
        const mesh = wheel.meshRef.current;
        
        // Ensure proper Euler order so spinning (X) happens around the steered axis (Y)
        if (mesh.rotation.order !== 'YXZ') {
          mesh.rotation.order = 'YXZ';
        }

        mesh.position.y = wheel.position.y + wheel.radius - hitDistance;
        
        // Visual steering
        if (wheel.isFrontWheel) {
           mesh.rotation.y = THREE.MathUtils.lerp(
             mesh.rotation.y, 
             targetSteeringAngle, 
             visualSteeringSpeed * world.timestep
           );
        }

        // Spin the wheel based on actual forward speed
        const angularVelocity = forwardSpeed / wheel.radius;
        mesh.rotation.x += angularVelocity * world.timestep;
      }

      // Update debug raycast lines
      if (debugLinePositions) {
        const index = i * 6; // 2 points * 3 coords
        
        // Start point (mount point on chassis)
        debugLinePositions[index] = wheelWorldPos.x;
        debugLinePositions[index + 1] = wheelWorldPos.y;
        debugLinePositions[index + 2] = wheelWorldPos.z;
        
        // End point (ground hit point)
        const hitPointWorld = wheelWorldPos.clone().add(worldDown.clone().multiplyScalar(hitDistance));
        debugLinePositions[index + 3] = hitPointWorld.x;
        debugLinePositions[index + 4] = hitPointWorld.y;
        debugLinePositions[index + 5] = hitPointWorld.z;
      }
    }

    // --- Basic Arcade Driving Controls ---
    if (config.controls && config.controls.current) {
      const { forward, backward, left, right } = config.controls.current;
      
      const maxForwardSpeed = 15;
      const maxReverseSpeed = -8;
      const acceleration = 25;
      
      let engineForce = 0;
      
      // Eased throttle logic: force decreases as car approaches max speed
      if (forward) {
        const speedFactor = Math.max(0, 1 - (forwardSpeed / maxForwardSpeed));
        engineForce = acceleration * speedFactor;
      } else if (backward) {
        const speedFactor = Math.max(0, 1 - (forwardSpeed / maxReverseSpeed));
        engineForce = -acceleration * speedFactor;
      } else {
        // Simple rolling resistance / engine braking when no throttle is applied
        engineForce = -forwardSpeed * 2.0;
      }
      
      if (Math.abs(engineForce) > 0.01) {
        // Apply impulse at center of mass
        const forceVec = worldForward.clone().multiplyScalar(engineForce * world.timestep * chassis.mass());
        chassis.applyImpulse(forceVec, true);
      }
      
      // Steering logic
      const turnRate = 2.5; 
      // Only steer if moving (arcade-style grounded realism)
      if (Math.abs(forwardSpeed) > 0.5) {
        let steeringInput = 0;
        if (left) steeringInput = 1;
        if (right) steeringInput = -1;
        
        // Reverse steering direction if going backwards for natural feel
        if (forwardSpeed < 0) {
           steeringInput = -steeringInput;
        }

        if (steeringInput !== 0) {
           const torque = steeringInput * turnRate * chassis.mass();
           // Apply yaw torque around the global Y axis (pitch/roll are locked)
           chassis.applyTorqueImpulse({ x: 0, y: torque * world.timestep, z: 0 }, true);
        }
      }
    }

    // Flag debug lines for rendering update
    if (config.debugLinesRef && config.debugLinesRef.current) {
      config.debugLinesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
}
