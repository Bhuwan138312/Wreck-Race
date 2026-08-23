import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { Lighting } from './components/environment/Lighting';
import { TestGround } from './components/environment/TestGround';
import { Vehicle } from './components/vehicle/Vehicle';
import { Trailer } from './components/vehicle/Trailer';
import { Physics } from '@react-three/rapier';
import { Speedometer } from './components/ui/Speedometer';
import { VehicleSelector } from './components/ui/VehicleSelector';
import { CameraToggle } from './components/ui/CameraToggle';
import { CouplingPrompt } from './components/ui/CouplingPrompt';
import { CouplerJoint } from './components/vehicle/CouplerJoint';

function App() {
  const [selectedCar, setSelectedCar] = useState<'sedan' | 'police' | 'suv' | 'firetruck' | 'delivery' | 'garbage-truck' | 'crossover' | 'taxi' | 'race'>('sedan');
  const [cameraMode, setCameraMode] = useState<'follow' | 'dev'>('follow');

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows camera={{ position: [5, 5, 10], fov: 50 }}>
        {/* Environment */}
        <Sky sunPosition={[100, 20, 100]} />
        <Lighting />

        {/* Vehicles */}
        <Suspense fallback={null}>
          <Physics>
            {/* The physics component dynamically adapts to the selected car! */}
            <Vehicle position={[0, 5, 0]} modelId={selectedCar} cameraMode={cameraMode} />
            <Trailer position={[5, 0.5, -10]} rotation={[0, Math.PI / 4, 0]} />
            <Trailer position={[-5, 0.5, -10]} rotation={[0, -Math.PI / 4, 0]} />
            <TestGround />
            <CouplerJoint />
          </Physics>
        </Suspense>

        {/* Camera Controls */}
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} enabled={cameraMode === 'dev'} />
      </Canvas>
      <Speedometer />
      <VehicleSelector selectedModel={selectedCar} onSelect={setSelectedCar} />
      <CameraToggle mode={cameraMode} onToggle={() => setCameraMode(m => m === 'follow' ? 'dev' : 'follow')} />
      <CouplingPrompt />
    </div>
  );
}

export default App;
