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

      {/* Speed Bumps for Suspension Testing */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.025, 5]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[10, 0.05, 0.5]} />
          <meshStandardMaterial color="#f0d000" />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.04, 10]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[10, 0.08, 0.6]} />
          <meshStandardMaterial color="#f0d000" />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.06, 15]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[10, 0.12, 0.8]} />
          <meshStandardMaterial color="#f0d000" />
        </mesh>
      </RigidBody>

      {/* Asymmetric Bumps to test individual wheel travel */}
      <RigidBody type="fixed" colliders="cuboid" position={[-2.5, 0.04, -5]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[3, 0.08, 0.5]} />
          <meshStandardMaterial color="#ff5555" />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" colliders="cuboid" position={[2.5, 0.04, -8]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[3, 0.08, 0.5]} />
          <meshStandardMaterial color="#ff5555" />
        </mesh>
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
