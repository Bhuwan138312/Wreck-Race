import { useEffect, useRef } from 'react';
import { vehicleState } from '../../store/vehicleState';

export function Speedometer() {
  const speedRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const rpmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updateUI = () => {
      if (speedRef.current) {
        let displaySpeed = Math.round(vehicleState.speed);
        if (displaySpeed > 42) displaySpeed = 42;
        speedRef.current.innerText = displaySpeed.toString().padStart(2, '0');
      }
      if (gearRef.current) {
        const gear = vehicleState.gear;
        gearRef.current.innerText = gear;
        if (gear === 'D') gearRef.current.style.color = '#266210';
        else if (gear === 'R') gearRef.current.style.color = '#FF1414';
        else gearRef.current.style.color = '#FFE70C'; // P
      }
      if (rpmRef.current) {
        const speed = vehicleState.speed;
        let displayRpm = vehicleState.rpm;

        // Rev limiter animation: bounce between 97% and 100% when at max RPM
        if (displayRpm >= 0.99) {
          const isLimiting = Math.floor(performance.now() / 50) % 2 === 0; // medium-fast visible loop (60ms)
          displayRpm = isLimiting ? 0.97 : 1.0;
          rpmRef.current.style.transition = 'width 0.03s linear, background-color 0.3s ease'; // very fast visible sliding
        } else {
          rpmRef.current.style.transition = 'width 0.1s linear, background-color 0.3s ease'; // normal width transition
        }

        rpmRef.current.style.width = `${displayRpm * 100}%`;

        if (speed >= 35) {
          rpmRef.current.style.backgroundColor = '#FF1414';
        } else if (speed >= 20) {
          rpmRef.current.style.backgroundColor = '#FF870E';
        } else {
          rpmRef.current.style.backgroundColor = '#3A9419';
        }
      }
      animationFrameId = requestAnimationFrame(updateUI);
    };

    updateUI();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      right: '40px',
      fontFamily: '"Inter", sans-serif',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      userSelect: 'none',
      pointerEvents: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <span ref={gearRef} style={{ fontSize: '32px', fontWeight: 'bold' }}>P</span>
        <span ref={speedRef} style={{ fontSize: '80px', fontWeight: '900', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>00</span>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>km/h</span>
      </div>
      <div style={{
        width: '100%',
        height: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '6px',
        overflow: 'hidden',
        marginTop: '8px'
      }}>
        <div ref={rpmRef} style={{
          height: '100%',
          width: '0%',
          backgroundColor: '#3A9419',
          borderRadius: '6px',
          transition: 'width 0.1s linear, background-color 0.3s ease'
        }} />
      </div>
    </div>
  );
}
