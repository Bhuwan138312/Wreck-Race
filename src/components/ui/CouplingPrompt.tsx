import { useEffect, useState } from 'react';
import { couplingState } from '../../systems/CouplingManager';

export function CouplingPrompt() {
  const [canCouple, setCanCouple] = useState(false);
  const [isCoupled, setIsCoupled] = useState(false);

  useEffect(() => {
    // Synchronize initial state
    setCanCouple(couplingState.canCouple);
    setIsCoupled(couplingState.isCoupled);

    // Subscribe to state changes
    const unsubscribe = couplingState.subscribe(() => {
      setCanCouple(couplingState.canCouple);
      setIsCoupled(couplingState.isCoupled);
    });

    return unsubscribe;
  }, []);

  if (!canCouple && !isCoupled) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        pointerEvents: 'none',
        zIndex: 1000,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      Press <kbd style={{ backgroundColor: '#444', padding: '2px 8px', borderRadius: '4px', margin: '0 4px', borderBottom: '2px solid #222' }}>T</kbd> to {isCoupled ? 'Detach' : 'Attach'} Trailer
    </div>
  );
}
