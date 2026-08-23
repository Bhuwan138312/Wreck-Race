import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Grid } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export function TestGround() {
  const size = 80;
  const thickness = 1;

  // Arena border dimensions
  const wallHeight = 2.0;
  const wallThickness = 0.5;

  const obstacles = useMemo(() => {
    const items = [];
    const numObstacles = 15; // Placed carefully
    for (let i = 0; i < numObstacles; i++) {
      let x = 0, z = 0;
      let valid = false;
      while (!valid) {
        x = (Math.random() - 0.5) * (size - 20); // Keep away from walls
        z = (Math.random() - 0.5) * (size - 20);
        
        // Keep clear of the center test areas and spawn
        const nearCenterFeatures = x > -15 && x < 20 && z > -20 && z < 20;
        
        if (!nearCenterFeatures) {
          valid = true;
        }
      }
      
      const width = 1 + Math.random() * 3;
      const height = 0.5 + Math.random() * 2;
      const depth = 1 + Math.random() * 3;
      const rotation = Math.random() * Math.PI;
      const color = new THREE.Color().setHSL(Math.random(), 0.6, 0.4).getStyle();
      
      items.push({ x, z, width, height, depth, rotation, color });
    }
    return items;
  }, [size]);

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

      {/* Hill/Slopes Section */}
      <group position={[10, 0, 0]}>
        {/* Flat Platform at the top */}
        {/* Platform is 3 units high, so Y center is 1.5. Z edges are at -2 and -8. Top is Y=3. */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 1.5, -5]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[6, 3, 6]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        </RigidBody>

        {/* Gentle Uphill Ramp (Green) */}
        {/* Perfectly aligned to Z = -2, Y = 3 */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 1.4029857499854668, 3.9757464374963667]} rotation={[0.24497866312686417, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[6, 0.2, 12.36931687685298]} />
            <meshStandardMaterial color="#44cc44" />
          </mesh>
        </RigidBody>

        {/* Steep Downhill Ramp (Blue) */}
        {/* Perfectly aligned to Z = -8, Y = 3 */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 1.4063670822430956, -11.96488765584116]} rotation={[-0.35877067027057225, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[6, 0.2, 8.54400374531753]} />
            <meshStandardMaterial color="#4444cc" />
          </mesh>
        </RigidBody>
      </group>

      {/* Random Obstacles */}
      {obstacles.map((obs, i) => (
        <RigidBody key={`obs-${i}`} type="fixed" colliders="cuboid" position={[obs.x, obs.height / 2, obs.z]} rotation={[0, obs.rotation, 0]} friction={0.8}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[obs.width, obs.height, obs.depth]} />
            <meshStandardMaterial color={obs.color} />
          </mesh>
        </RigidBody>
      ))}

      {/* Arena Borders with Physics Collision */}
      <RigidBody type="fixed" colliders="cuboid" friction={1}>
        <mesh receiveShadow castShadow position={[0, wallHeight / 2, size / 2]}>
          <boxGeometry args={[size, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#cc4444" />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" colliders="cuboid" friction={1}>
        <mesh receiveShadow castShadow position={[0, wallHeight / 2, -size / 2]}>
          <boxGeometry args={[size, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#cc4444" />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" colliders="cuboid" friction={1}>
        <mesh receiveShadow castShadow position={[size / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, size]} />
          <meshStandardMaterial color="#cc4444" />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" colliders="cuboid" friction={1}>
        <mesh receiveShadow castShadow position={[-size / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, size]} />
          <meshStandardMaterial color="#cc4444" />
        </mesh>
      </RigidBody>
    </group>
  );
}
