import { useEffect, useState } from 'react';
import { useSphericalJoint } from '@react-three/rapier';
import { couplingManager, couplingState } from '../../systems/CouplingManager';

export function CouplerJoint() {
  const [coupledTrailerId, setCoupledTrailerId] = useState<string | null>(null);

  useEffect(() => {
    // Sync initial
    setCoupledTrailerId(couplingManager.coupledTrailerId);

    // Subscribe
    const unsubscribe = couplingState.subscribe(() => {
      setCoupledTrailerId(couplingManager.coupledTrailerId);
    });
    return unsubscribe;
  }, []);

  if (!coupledTrailerId || !couplingManager.vehicleRef) {
    return null;
  }

  const trailerData = couplingManager.trailers.get(coupledTrailerId);
  if (!trailerData || !trailerData.ref) {
    return null;
  }

  return (
    <Joint
      body1={couplingManager.vehicleRef}
      body2={trailerData.ref}
      anchor1={couplingManager.vehicleHitchOffset}
      anchor2={trailerData.hitchOffset}
    />
  );
}

// Separate component for the actual joint to ensure refs are valid before mounting
function Joint({ body1, body2, anchor1, anchor2 }: { body1: any, body2: any, anchor1: [number, number, number], anchor2: [number, number, number] }) {
  useSphericalJoint(body1, body2, [
    anchor1, // anchor on vehicle
    anchor2  // anchor on trailer
  ]);

  return null;
}
