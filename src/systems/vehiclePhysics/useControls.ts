import { useRef, useEffect } from 'react';

export function useControls() {
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          controls.current.forward = true;
          break;
        case 'a':
        case 'arrowleft':
          controls.current.left = true;
          break;
        case 's':
        case 'arrowdown':
          controls.current.backward = true;
          break;
        case 'd':
        case 'arrowright':
          controls.current.right = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          controls.current.forward = false;
          break;
        case 'a':
        case 'arrowleft':
          controls.current.left = false;
          break;
        case 's':
        case 'arrowdown':
          controls.current.backward = false;
          break;
        case 'd':
        case 'arrowright':
          controls.current.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return controls;
}
