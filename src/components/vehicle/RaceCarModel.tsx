import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

type RaceCarModelProps = ThreeElements['group'] & {
  wheelRefs?: React.RefObject<THREE.Object3D>[];
};

export function RaceCarModel({ wheelRefs, ...props }: RaceCarModelProps) {
  const { nodes, materials } = useGLTF('/race.glb') as any;
  return (
    <group {...props} dispose={null}>
      {/* Chassis/Body */}
      <mesh castShadow receiveShadow geometry={nodes.body.geometry} material={materials.colormap} position={[0, 0.1, 0]} />
      
      {/* Rear Left Wheel */}
      <mesh ref={wheelRefs?.[2]} castShadow receiveShadow geometry={nodes['wheel-back-left'].geometry} material={materials.colormap} position={[0.35, 0.3, -0.88]} />
      {/* Rear Right Wheel */}
      <mesh ref={wheelRefs?.[3]} castShadow receiveShadow geometry={nodes['wheel-back-right'].geometry} material={materials.colormap} position={[-0.35, 0.3, -0.88]} />
      {/* Front Left Wheel */}
      <mesh ref={wheelRefs?.[0]} castShadow receiveShadow geometry={nodes['wheel-front-left'].geometry} material={materials.colormap} position={[0.35, 0.3, 0.64]} />
      {/* Front Right Wheel */}
      <mesh ref={wheelRefs?.[1]} castShadow receiveShadow geometry={nodes['wheel-front-right'].geometry} material={materials.colormap} position={[-0.35, 0.3, 0.64]} />
    </group>
  );
}

useGLTF.preload('/race.glb');
