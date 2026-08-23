import { RapierRigidBody } from '@react-three/rapier';

export type TrailerData = {
  id: string;
  ref: React.RefObject<RapierRigidBody | null>;
  hitchOffset: [number, number, number];
};

class CouplingManager {
  vehicleRef: React.RefObject<RapierRigidBody | null> | null = null;
  vehicleHitchOffset: [number, number, number] = [0, 0, 0];
  
  trailers: Map<string, TrailerData> = new Map();
  
  coupledTrailerId: string | null = null;
  canCoupleTrailerId: string | null = null;

  registerVehicle(ref: React.RefObject<RapierRigidBody | null>, hitchOffset: [number, number, number]) {
    this.vehicleRef = ref;
    this.vehicleHitchOffset = hitchOffset;
  }

  registerTrailer(id: string, ref: React.RefObject<RapierRigidBody | null>, hitchOffset: [number, number, number]) {
    this.trailers.set(id, { id, ref, hitchOffset });
  }

  unregisterTrailer(id: string) {
    this.trailers.delete(id);
    if (this.coupledTrailerId === id) this.coupledTrailerId = null;
    if (this.canCoupleTrailerId === id) this.canCoupleTrailerId = null;
    notifyCouplingState();
  }
}

export const couplingManager = new CouplingManager();

// Simple pub-sub for UI updates
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const notifyCouplingState = () => {
  listeners.forEach(l => l());
};

export const couplingState = {
  get canCouple() {
    return couplingManager.canCoupleTrailerId !== null;
  },
  get isCoupled() {
    return couplingManager.coupledTrailerId !== null;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }
};
