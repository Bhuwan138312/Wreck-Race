import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

type SedanSportsModelProps = ThreeElements['group'] & {
  wheelRefs?: React.RefObject<THREE.Object3D>[];
};

export function SedanSportsModel({ wheelRefs, ...props }: SedanSportsModelProps) {
  const { nodes, materials } = useGLTF('/sedan-sports.glb') as any;
  return (
    <group {...props} dispose={null}>
      {/* Chassis/Body */}
      <mesh castShadow receiveShadow geometry={nodes.body.geometry} material={materials.colormap} position={[0, 0.15, -0.025]} />
      {/* Spoiler */}
      <mesh castShadow receiveShadow geometry={nodes.spoiler.geometry} material={materials.colormap} position={[0, 0.45, -1.044]} />
      
      {/* Rear Left Wheel */}
      <mesh ref={wheelRefs?.[2]} castShadow receiveShadow geometry={nodes['wheel-back-left'].geometry} material={materials.colormap} position={[0.3, 0.3, -0.66]} />
      {/* Rear Right Wheel */}
      <mesh ref={wheelRefs?.[3]} castShadow receiveShadow geometry={nodes['wheel-back-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, -0.66]} />
      {/* Front Left Wheel */}
      <mesh ref={wheelRefs?.[0]} castShadow receiveShadow geometry={nodes['wheel-front-left'].geometry} material={materials.colormap} position={[0.3, 0.3, 0.66]} />
      {/* Front Right Wheel */}
      <mesh ref={wheelRefs?.[1]} castShadow receiveShadow geometry={nodes['wheel-front-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, 0.66]} />
    </group>
  );
}

useGLTF.preload('/sedan-sports.glb');
