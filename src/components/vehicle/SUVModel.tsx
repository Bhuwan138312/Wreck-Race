import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';

export function SUVModel(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/suv.glb') as any;
  return (
    <group {...props} dispose={null}>
      {/* Chassis/Body with spare wheel */}
      <mesh castShadow receiveShadow geometry={nodes.body.geometry} material={materials.colormap} position={[0, 0.2, 0]}>
        <mesh castShadow receiveShadow geometry={nodes['wheel-back'].geometry} material={materials.colormap} position={[0, 0.5, -1.05]} />
      </mesh>
      {/* Rear Left Wheel */}
      <mesh castShadow receiveShadow geometry={nodes['wheel-back-left'].geometry} material={materials.colormap} position={[0.3, 0.3, -0.56]} />
      {/* Rear Right Wheel */}
      <mesh castShadow receiveShadow geometry={nodes['wheel-back-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, -0.56]} />
      {/* Front Left Wheel */}
      <mesh castShadow receiveShadow geometry={nodes['wheel-front-left'].geometry} material={materials.colormap} position={[0.3, 0.3, 0.76]} />
      {/* Front Right Wheel */}
      <mesh castShadow receiveShadow geometry={nodes['wheel-front-right'].geometry} material={materials.colormap} position={[-0.3, 0.3, 0.76]} />
    </group>
  );
}

useGLTF.preload('/suv.glb');
