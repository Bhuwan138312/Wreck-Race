import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

type PoliceModelProps = ThreeElements['group'] & {
  wheelRefs?: React.RefObject<THREE.Object3D>[];
};

export function PoliceModel({ wheelRefs, ...props }: PoliceModelProps) {
  const { nodes, materials } = useGLTF('/police.glb') as any;
  return (
    <group {...props} dispose={null}>
      {/* Chassis/Body with grill */}
      <mesh castShadow receiveShadow geometry={nodes.body.geometry} material={materials.colormap} position={[0, 0.2, -0.025]}>
        <mesh castShadow receiveShadow geometry={nodes.grill.geometry} material={materials.colormap} position={[0, 0.074, 1.475]} />
      </mesh>
      {/* Rear Left Wheel */}
      <mesh ref={wheelRefs?.[2]} castShadow receiveShadow geometry={nodes['wheel-back-left'].geometry} material={materials.colormap} position={[0.3, 0.3, -0.81]} />
      {/* Rear Right Wheel */}
      <mesh ref={wheelRefs?.[3]} castShadow receiveShadow geometry={nodes['wheel-back-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, -0.81]} />
      {/* Front Left Wheel */}
      <mesh ref={wheelRefs?.[0]} castShadow receiveShadow geometry={nodes['wheel-front-left'].geometry} material={materials.colormap} position={[0.3, 0.3, 0.81]} />
      {/* Front Right Wheel */}
      <mesh ref={wheelRefs?.[1]} castShadow receiveShadow geometry={nodes['wheel-front-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, 0.81]} />
    </group>
  );
}

useGLTF.preload('/police.glb');
