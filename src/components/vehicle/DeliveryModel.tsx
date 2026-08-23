import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

type DeliveryModelProps = ThreeElements['group'] & {
  wheelRefs?: React.RefObject<THREE.Object3D>[];
};

export function DeliveryModel({ wheelRefs, ...props }: DeliveryModelProps) {
  const { nodes, materials } = useGLTF('/delivery.glb') as any;
  return (
    <group {...props} dispose={null}>
      {/* Chassis/Body */}
      <mesh castShadow receiveShadow geometry={nodes.body.geometry} material={materials.colormap} position={[0, 0.15, -0.025]} />
      {/* Door */}
      <mesh castShadow receiveShadow geometry={nodes.door.geometry} material={materials.colormap} position={[0, 1.5, -1.475]} />
      
      {/* Rear Left Wheel */}
      <mesh ref={wheelRefs?.[2]} castShadow receiveShadow geometry={nodes['wheel-back-left'].geometry} material={materials.colormap} position={[0.3, 0.3, -0.61]} />
      {/* Rear Right Wheel */}
      <mesh ref={wheelRefs?.[3]} castShadow receiveShadow geometry={nodes['wheel-back-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, -0.61]} />
      {/* Front Left Wheel */}
      <mesh ref={wheelRefs?.[0]} castShadow receiveShadow geometry={nodes['wheel-front-left'].geometry} material={materials.colormap} position={[0.3, 0.3, 1.01]} />
      {/* Front Right Wheel */}
      <mesh ref={wheelRefs?.[1]} castShadow receiveShadow geometry={nodes['wheel-front-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, 1.01]} />
    </group>
  );
}

useGLTF.preload('/delivery.glb');
