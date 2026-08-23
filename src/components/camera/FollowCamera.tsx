import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { vehicleState } from '../../store/vehicleState';


type FollowCameraProps = {
  targetRef: React.RefObject<THREE.Group | null>;
  enabled: boolean;
};

// Helper for shortest angle interpolation
function lerpAngle(start: number, end: number, t: number) {
  let delta = end - start;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return start + delta * t;
}

export function FollowCamera({ targetRef, enabled }: FollowCameraProps) {
  const { camera, gl } = useThree();

  // Internal state for smooth trailing
  const currentYawRef = useRef(0);
  const currentLookAtRef = useRef(new THREE.Vector3());
  const currentPosRef = useRef(new THREE.Vector3());
  
  // Drag state
  const isDraggingRef = useRef(false);
  const dragYawOffsetRef = useRef(0);
  const dragPitchOffsetRef = useRef(0);
  const dragTimerRef = useRef(0);
  const previousPointerRef = useRef({ x: 0, y: 0 });
  const isReversingRef = useRef(false);

  // Camera settings
  const followDistance = 8.0;
  const followHeight = 2.5;
  const lookAtHeight = 1.0;

  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      // Only trigger drag on the canvas area
      if (e.target !== gl.domElement) return;
      isDraggingRef.current = true;
      previousPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      
      const deltaX = e.clientX - previousPointerRef.current.x;
      const deltaY = e.clientY - previousPointerRef.current.y;
      previousPointerRef.current = { x: e.clientX, y: e.clientY };

      // Sensitivity
      dragYawOffsetRef.current -= deltaX * 0.005;
      dragPitchOffsetRef.current += deltaY * 0.005;

      // Clamp pitch so camera doesn't flip under the ground or over the top
      dragPitchOffsetRef.current = THREE.MathUtils.clamp(
        dragPitchOffsetRef.current,
        -Math.PI / 8, // Don't go too far under
        Math.PI / 3   // Don't go straight overhead
      );
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      dragTimerRef.current = 1.5; // Wait 1.5 seconds before auto-recentering
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [enabled, gl.domElement]);

  // Temporary vectors to avoid garbage collection overhead
  const chassisPos = useRef(new THREE.Vector3());
  const chassisQuat = useRef(new THREE.Quaternion());

  // We use late render priority so the camera updates after the physics/vehicle moves
  useFrame((_, delta) => {
    if (!enabled) return;
    const target = targetRef.current;
    if (!target) return;

    target.getWorldPosition(chassisPos.current);
    target.getWorldQuaternion(chassisQuat.current);
    
    const localForward = new THREE.Vector3(0, 0, 1);
    const worldForward = localForward.clone().applyQuaternion(chassisQuat.current);
    
    if (vehicleState.gear === 'R' && vehicleState.speed >= 5) {
      isReversingRef.current = true;
    } else if (vehicleState.gear === 'D') {
      isReversingRef.current = false;
    }
    
    // Calculate the vehicle's actual yaw
    let targetYaw = Math.atan2(worldForward.x, worldForward.z);
    
    // Flip camera if reversing
    if (isReversingRef.current) {
      targetYaw += Math.PI;
    }
    
    // Auto-recenter logic
    if (!isDraggingRef.current) {
      if (dragTimerRef.current > 0) {
        dragTimerRef.current -= delta;
      } else {
        // Smoothly ease the drag offsets back to 0
        dragYawOffsetRef.current = THREE.MathUtils.lerp(dragYawOffsetRef.current, 0, delta * 4.0);
        dragPitchOffsetRef.current = THREE.MathUtils.lerp(dragPitchOffsetRef.current, 0, delta * 4.0);
      }
    }

    // Smoothly follow the car's yaw (unless we are manually orbiting significantly? No, we always track 
    // the car's yaw as the base, and add the manual offset on top. This ensures if the car turns while 
    // we are dragging, we stay relative to the car).
    // The base trailing yaw has a nice lag to it:
    currentYawRef.current = lerpAngle(currentYawRef.current, targetYaw, delta * 5.0);

    const totalYaw = currentYawRef.current + dragYawOffsetRef.current;
    
    // Calculate camera orbit offset
    // base horizontal distance
    let hDist = followDistance * Math.cos(dragPitchOffsetRef.current);
    let vDist = followDistance * Math.sin(dragPitchOffsetRef.current);
    
    const offsetX = Math.sin(totalYaw + Math.PI) * hDist;
    const offsetZ = Math.cos(totalYaw + Math.PI) * hDist;
    const offsetY = followHeight + vDist;
    
    const idealPos = new THREE.Vector3(
      chassisPos.current.x + offsetX,
      chassisPos.current.y + offsetY,
      chassisPos.current.z + offsetZ
    );
    
    // Prevent camera from clipping through the absolute ground plane (0)
    if (idealPos.y < 0.2) {
      idealPos.y = 0.2;
    }

    const idealLookAt = new THREE.Vector3(
      chassisPos.current.x,
      chassisPos.current.y + lookAtHeight,
      chassisPos.current.z
    );

    // Initial setup snapping
    if (currentPosRef.current.lengthSq() === 0) {
      currentPosRef.current.copy(idealPos);
      currentLookAtRef.current.copy(idealLookAt);
    }

    // Smooth position and lookat
    currentPosRef.current.lerp(idealPos, delta * 10.0);
    currentLookAtRef.current.lerp(idealLookAt, delta * 15.0);

    // Apply to camera
    camera.position.copy(currentPosRef.current);
    camera.lookAt(currentLookAtRef.current);
  });

  return null;
}
