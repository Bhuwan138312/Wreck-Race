import { useEffect } from 'react';

type CameraToggleProps = {
  mode: 'follow' | 'dev';
  onToggle: () => void;
};

export function CameraToggle({ mode, onToggle }: CameraToggleProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c') {
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '10px 15px',
      borderRadius: '8px',
      color: 'white',
      fontFamily: 'sans-serif',
      fontSize: 14,
      pointerEvents: 'auto',
      zIndex: 100
    }}>
      <button 
        onClick={onToggle}
        style={{
          background: '#44cc44',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Toggle Camera (C)
      </button>
      <span>Mode: <strong style={{ color: mode === 'follow' ? '#44cc44' : '#cc4444' }}>{mode.toUpperCase()}</strong></span>
    </div>
  );
}
