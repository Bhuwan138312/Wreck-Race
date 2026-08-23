import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

type GarbageTruckModelProps = ThreeElements['group'] & {
  wheelRefs?: React.RefObject<THREE.Object3D>[];
};

export function GarbageTruckModel({ wheelRefs, ...props }: GarbageTruckModelProps) {
  const { nodes, materials } = useGLTF('/garbage-truck.glb') as any;
  return (
    <group {...props} dispose={null}>
      {/* Chassis/Body */}
      <mesh castShadow receiveShadow geometry={nodes.body.geometry} material={materials.colormap} position={[0, 0.125, 0.025]} />
      {/* Arm */}
      <mesh castShadow receiveShadow geometry={nodes.arm.geometry} material={materials.colormap} position={[0, 0.482, 0.324]} />
      {/* Trash */}
      <mesh castShadow receiveShadow geometry={nodes.trash.geometry} material={materials.colormap} position={[0.016, 1.275, -0.133]} />
      
      {/* Rear Left Wheel */}
      <mesh ref={wheelRefs?.[2]} castShadow receiveShadow geometry={nodes['wheel-back-left'].geometry} material={materials.colormap} position={[0.3, 0.3, -0.51]} />
      {/* Rear Right Wheel */}
      <mesh ref={wheelRefs?.[3]} castShadow receiveShadow geometry={nodes['wheel-back-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, -0.51]} />
      {/* Front Left Wheel */}
      <mesh ref={wheelRefs?.[0]} castShadow receiveShadow geometry={nodes['wheel-front-left'].geometry} material={materials.colormap} position={[0.3, 0.3, 1.11]} />
      {/* Front Right Wheel */}
      <mesh ref={wheelRefs?.[1]} castShadow receiveShadow geometry={nodes['wheel-front-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, 1.11]} />
    </group>
  );
}

useGLTF.preload('/garbage-truck.glb');
