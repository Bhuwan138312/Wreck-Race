import { useState } from 'react';

type VehicleSelectorProps = {
  selectedModel: 'sedan' | 'police' | 'suv' | 'firetruck' | 'delivery' | 'garbage-truck' | 'crossover' | 'taxi' | 'race';
  onSelect: (model: 'sedan' | 'police' | 'suv' | 'firetruck' | 'delivery' | 'garbage-truck' | 'crossover' | 'taxi' | 'race') => void;
};

export function VehicleSelector({ selectedModel, onSelect }: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const options: ('sedan' | 'police' | 'suv' | 'firetruck' | 'delivery' | 'garbage-truck' | 'crossover' | 'taxi' | 'race')[] = ['sedan', 'police', 'suv', 'firetruck', 'delivery', 'garbage-truck', 'crossover', 'taxi', 'race'];

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 20px',
        borderRadius: '8px',
        backdropFilter: 'blur(4px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        cursor: 'pointer',
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '180px',
        boxSizing: 'border-box'
      }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedModel}</span>
        <span>▼</span>
      </div>

      {isOpen && (
        <div style={{
          marginTop: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onSelect(opt);
                setIsOpen(false);
              }}
              style={{
                backgroundColor: selectedModel === opt ? 'rgba(58, 148, 25, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedModel === opt ? '2px solid #3A9419' : '2px solid transparent',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                width: '100px'
              }}
            >
              <img
                src={`/previews/${opt}.png`}
                alt={opt}
                style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '8px' }}
              />
              <span style={{
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                fontSize: '12px',
                fontFamily: 'sans-serif'
              }}>
                {opt}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
