import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { Lighting } from './components/environment/Lighting';
import { TestGround } from './components/environment/TestGround';
import { Vehicle } from './components/vehicle/Vehicle';
import { SedanModel } from './components/vehicle/SedanModel';
import { Suspense } from 'react';
import { Physics } from '@react-three/rapier';

function App() {
  return (
    <Canvas shadows camera={{ position: [5, 5, 10], fov: 50 }}>
      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} />
      <Lighting />

      {/* Vehicles */}
      <Suspense fallback={null}>
        <Physics>
          <Vehicle position={[0, 5, 0]}>
            <SedanModel />
          </Vehicle>

          {/* Visual-only reference model without physics */}
          <group position={[4, 0, 0]}>
            <SedanModel />
          </group>

          <TestGround />
        </Physics>
      </Suspense>

      {/* Camera Controls */}
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />
    </Canvas>
  );
}

export default App;
