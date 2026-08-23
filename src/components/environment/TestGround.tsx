import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Grid } from '@react-three/drei';

export function TestGround() {
  const size = 40;
  const thickness = 1;
  
  // Arena border dimensions
  const wallHeight = 0.5;
  const wallThickness = 0.5;

  return (
    <group>
      <RigidBody type="fixed" colliders={false} friction={1}>
        {/* Exact physics collider matching the visual ground */}
        <CuboidCollider args={[size / 2, thickness / 2, size / 2]} position={[0, -thickness / 2, 0]} friction={1} />
        
        {/* Solid base mesh to catch shadows */}
        <mesh receiveShadow position={[0, -thickness / 2, 0]}>
          <boxGeometry args={[size, thickness, size]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>

        {/* Grid overlay for visual reference */}
        <Grid 
          position={[0, 0.01, 0]} 
          args={[size, size]} 
          cellSize={1} 
          cellThickness={1} 
          cellColor="#cccccc" 
          sectionSize={5} 
          sectionThickness={1.5} 
          sectionColor="#aaaaaa" 
          fadeDistance={size} 
        />
      </RigidBody>

      {/* Visual Arena Borders (No Physics) */}
      <mesh receiveShadow castShadow position={[0, wallHeight / 2, size / 2]}>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#cc4444" />
      </mesh>
      <mesh receiveShadow castShadow position={[0, wallHeight / 2, -size / 2]}>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#cc4444" />
      </mesh>
      <mesh receiveShadow castShadow position={[size / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color="#cc4444" />
      </mesh>
      <mesh receiveShadow castShadow position={[-size / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color="#cc4444" />
      </mesh>
    </group>
  );
}
