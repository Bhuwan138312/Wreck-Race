import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider, CylinderCollider, useRevoluteJoint, type RapierRigidBody } from '@react-three/rapier';
import { couplingManager, couplingState } from '../../systems/CouplingManager';

// ---------------------------------------------------------------------------
// TRAILER PARAMETERS
// ---------------------------------------------------------------------------
const P = {
  railX: 0.55, // shrunk width
  bedFront: 0.70, // further shrunk length
  bedRear: -0.70, // further shrunk length
  floorY: 0.42, // drastically lowered floor so it's not floating high above the wheels
  beamThk: 0.07, // slightly thinner frame
  wheelR: 0.28, // smaller wheel radius
  wheelW: 0.18, // thinner wheel width
  trackHalf: 0.65, // shrunk wheel track
  wheelZ: -0.15, // shifted axle to match shrunk bed
  gateH: 0.65, // shorter front gate
  sideH: 0.32, // shorter sides
  tongueLen: 0.80, // slightly shorter straight tongue
  axleY: 0.28, // Computed in user code as P.wheelR
  railY: 0.42 - 0.07 / 2, // floorY - beamThk/2
  hitchZ: 0.70 + 0.80, // bedFront + tongueLen
};

// ---------------------------------------------------------------------------
// BEAM COMPONENT
// ---------------------------------------------------------------------------
function Beam({ start, end, thickness, material, thicknessY }: { start: [number, number, number], end: [number, number, number], thickness: number, material: THREE.Material, thicknessY?: number }) {
  const meshData = useMemo(() => {
    const pa = new THREE.Vector3(...start);
    const pb = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(pb, pa);
    const length = dir.length();
    const pos = pa.clone().add(pb).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    return { pos, quaternion, length };
  }, [start, end]);

  return (
    <mesh position={meshData.pos} quaternion={meshData.quaternion} material={material} castShadow receiveShadow>
      <boxGeometry args={[thickness, thicknessY || thickness, meshData.length]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// TRAILER COMPONENT
// ---------------------------------------------------------------------------
export function Trailer({ id = 'trailer-1', ...props }: any) {
  const trailerId = id;
  const chassisRef = useRef<RapierRigidBody>(null);
  const [isCoupled, setIsCoupled] = useState(false);

  // Load SUV model to extract the wheels
  const { nodes, materials } = useGLTF('/suv.glb') as any;
  const wheelLRef = useRef<RapierRigidBody>(null);
  const wheelRRef = useRef<RapierRigidBody>(null);

  // ---------------------------------------------------------------------------
  // MATERIALS
  // ---------------------------------------------------------------------------
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c92ac', roughness: 0.4, metalness: 0.7 }), []);
  const fenderMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c92ac', roughness: 0.45, metalness: 0.6 }), []);
  const tireMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#333333', roughness: 1.0, metalness: 0.0 }), []); // Flat dark grey
  const rimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cccccc', roughness: 1.0, metalness: 0.0 }), []); // Flat light grey
  const hubMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#888888', roughness: 1.0, metalness: 0.0 }), []); // Flat mid grey
  const springMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2c32', roughness: 0.8, metalness: 0.4 }), []); // Dark rugged steel
  const chainMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7a808d', roughness: 0.5, metalness: 0.7 }), []);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff4400', emissive: '#ff4400', emissiveIntensity: 0.9, roughness: 0.5 }), []);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 0.8, metalness: 0.1 }), []); // Wooden floor color

  // Mesh texture generation
  const meshTexBase = useMemo(() => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return new THREE.Texture();
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    const step = 32;
    for (let x = 0; x <= size; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke(); }
    for (let y = 0; y <= size; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  const getMeshMaterial = (repeatX: number, repeatY: number) => {
    const tex = meshTexBase.clone();
    tex.repeat.set(repeatX, repeatY);
    return new THREE.MeshStandardMaterial({
      map: tex, color: '#b0b5c0', transparent: true, alphaTest: 0.4,
      side: THREE.DoubleSide, roughness: 0.55, metalness: 0.35
    });
  };

  const fenderGeometry = useMemo(() => {
    const R_inner = P.wheelR + 0.04; // Reduced gap from 0.07 to 0.04
    const R_outer = R_inner + 0.015; // 1.5cm thickness
    const width = P.wheelW + 0.04; // Tighter fender width (only 2cm padding on each side)

    const angleTrim = Math.PI / 7; // Trim about 25 degrees off each end
    const startAngle = angleTrim;
    const endAngle = Math.PI - angleTrim;

    const shape = new THREE.Shape();
    // Outer curve
    shape.absarc(0, 0, R_outer, startAngle, endAngle, false);
    // Connect to inner curve
    shape.lineTo(R_inner * Math.cos(endAngle), R_inner * Math.sin(endAngle));
    // Inner curve (drawn backwards)
    shape.absarc(0, 0, R_inner, endAngle, startAngle, true);
    // Connect back to start
    shape.lineTo(R_outer * Math.cos(startAngle), R_outer * Math.sin(startAngle));

    const extrudeSettings = {
      depth: width,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      curveSegments: 20
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -width / 2); // Center along extrusion axis
    return geo;
  }, [P.wheelR, P.wheelW]);

  const leafSpringGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // A shallow arc spanning 0.6 meters to act as a leaf spring
    shape.moveTo(-0.3, 0.08); // front mount
    shape.quadraticCurveTo(0, -0.05, 0.3, 0.08); // rear mount
    shape.lineTo(0.3, 0.06);
    shape.quadraticCurveTo(0, -0.07, -0.3, 0.06);
    shape.lineTo(-0.3, 0.08);
    const extrudeSettings = { depth: 0.05, bevelEnabled: false, curveSegments: 8 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -0.025); // center depth
    return geo;
  }, []);

  // ---------------------------------------------------------------------------
  // PHYSICS COUPLING
  // ---------------------------------------------------------------------------
  const hitchOffset: [number, number, number] = [0, P.railY, P.hitchZ];
  const startY = 0.05; // Spawns perfectly on the ground since the wheels rest at Y=0

  useRevoluteJoint(chassisRef as any, wheelLRef as any, [
    [-P.trackHalf, P.axleY, P.wheelZ],
    [0, 0, 0],
    [1, 0, 0]
  ]);

  useRevoluteJoint(chassisRef as any, wheelRRef as any, [
    [P.trackHalf, P.axleY, P.wheelZ],
    [0, 0, 0],
    [1, 0, 0]
  ]);

  useEffect(() => {
    couplingManager.registerTrailer(trailerId, chassisRef, hitchOffset);
    return () => {
      couplingManager.unregisterTrailer(trailerId);
    };
  }, [trailerId]);

  useEffect(() => {
    const updateCoupling = () => {
      setIsCoupled(couplingManager.coupledTrailerId === trailerId);
    };
    updateCoupling();
    return couplingState.subscribe(updateCoupling);
  }, [trailerId]);

  return (
    <group {...props}>
      <RigidBody
        ref={chassisRef}
        type="dynamic"
        colliders={false}
        mass={50} // Increased mass significantly for physics stability against the heavy car
        linearDamping={0.1}
        angularDamping={0.5}
        position={[0, startY, 0]}
      >
        {/* Chassis physics collider (approximated for the bed area) */}
        <CuboidCollider args={[P.railX, 0.05, (P.bedFront - P.bedRear) / 2]} position={[0, P.floorY, (P.bedFront + P.bedRear) / 2]} />

        {/* Tongue physics collider to prevent clipping into ground */}
        <CuboidCollider args={[0.05, 0.05, P.tongueLen / 2]} position={[0, P.railY, P.bedFront + P.tongueLen / 2]} />

        {/* Trailer Jack physics collider (keeps it propped up) */}
        {!isCoupled && <CuboidCollider args={[0.04, P.railY / 2, 0.04]} position={[0, P.railY / 2, P.hitchZ - 0.2]} />}

        {/* 1. MAIN FRAME RAILS & SUSPENSION */}
        <group name="main-frame">
          {/* Left/Right */}
          <Beam start={[-P.railX, P.railY, P.bedRear - 0.035]} end={[-P.railX, P.railY, P.bedFront + 0.035]} thickness={P.beamThk} material={frameMat} />
          <Beam start={[P.railX, P.railY, P.bedRear - 0.035]} end={[P.railX, P.railY, P.bedFront + 0.035]} thickness={P.beamThk} material={frameMat} />
          {/* Front/Back */}
          <Beam start={[-P.railX - 0.035, P.railY, P.bedFront]} end={[P.railX + 0.035, P.railY, P.bedFront]} thickness={P.beamThk} material={frameMat} />
          <Beam start={[-P.railX - 0.035, P.railY, P.bedRear]} end={[P.railX + 0.035, P.railY, P.bedRear]} thickness={P.beamThk} material={frameMat} />

          {/* Chassis cross-beam above axle */}
          <Beam start={[-P.railX, P.railY, P.wheelZ]} end={[P.railX, P.railY, P.wheelZ]} thickness={P.beamThk * 0.85} material={frameMat} />

          {/* Actual Wheel Axle Tube */}
          <Beam start={[-P.trackHalf, P.axleY, P.wheelZ]} end={[P.trackHalf, P.axleY, P.wheelZ]} thickness={0.05} material={frameMat} />

          {/* Leaf Springs */}
          {[-1, 1].map(sign => (
            <mesh key={sign} position={[sign * P.railX, P.axleY + 0.05, P.wheelZ]} rotation={[0, Math.PI / 2, 0]} geometry={leafSpringGeo} material={springMat} castShadow />
          ))}
        </group>

        {/* CARGO FLOOR */}
        <mesh position={[0, P.floorY + 0.0225, (P.bedFront + P.bedRear) / 2]} castShadow receiveShadow material={floorMat}>
          <boxGeometry args={[P.railX * 2, 0.045, P.bedFront - P.bedRear]} />
        </mesh>

        {/* 2/3. CARGO CAGE PANELS */}
        <group name="front-gate">
          <mesh position={[0, P.floorY + P.gateH / 2, P.bedFront]} material={getMeshMaterial((P.railX * 2) / 0.16, P.gateH / 0.16)}>
            <planeGeometry args={[P.railX * 2, P.gateH]} />
          </mesh>
          <mesh position={[0, P.floorY + P.gateH, P.bedFront]} material={frameMat} castShadow receiveShadow>
            <boxGeometry args={[P.railX * 2, 0.05, 0.05]} />
          </mesh>
          <Beam start={[-P.railX, P.floorY, P.bedFront]} end={[-P.railX, P.floorY + P.gateH, P.bedFront]} thickness={0.045} material={frameMat} />
          <Beam start={[P.railX, P.floorY, P.bedFront]} end={[P.railX, P.floorY + P.gateH, P.bedFront]} thickness={0.045} material={frameMat} />
        </group>

        <group name="left-side-panel">
          <mesh position={[-P.railX, P.floorY + P.sideH / 2, (P.bedFront + P.bedRear) / 2]} rotation={[0, Math.PI / 2, 0]} material={getMeshMaterial((P.bedFront - P.bedRear) / 0.16, P.sideH / 0.16)}>
            <planeGeometry args={[P.bedFront - P.bedRear, P.sideH]} />
          </mesh>
          <Beam start={[-P.railX, P.floorY + P.sideH, P.bedRear]} end={[-P.railX, P.floorY + P.sideH, P.bedFront]} thickness={0.045} material={frameMat} />
          <Beam start={[-P.railX, P.floorY, P.bedRear]} end={[-P.railX, P.floorY + P.sideH, P.bedRear]} thickness={0.045} material={frameMat} />
          <Beam start={[-P.railX, P.floorY, P.bedFront]} end={[-P.railX, P.floorY + P.sideH, P.bedFront]} thickness={0.045} material={frameMat} />
        </group>

        <group name="right-side-panel">
          <mesh position={[P.railX, P.floorY + P.sideH / 2, (P.bedFront + P.bedRear) / 2]} rotation={[0, Math.PI / 2, 0]} material={getMeshMaterial((P.bedFront - P.bedRear) / 0.16, P.sideH / 0.16)}>
            <planeGeometry args={[P.bedFront - P.bedRear, P.sideH]} />
          </mesh>
          <Beam start={[P.railX, P.floorY + P.sideH, P.bedRear]} end={[P.railX, P.floorY + P.sideH, P.bedFront]} thickness={0.045} material={frameMat} />
          <Beam start={[P.railX, P.floorY, P.bedRear]} end={[P.railX, P.floorY + P.sideH, P.bedRear]} thickness={0.045} material={frameMat} />
          <Beam start={[P.railX, P.floorY, P.bedFront]} end={[P.railX, P.floorY + P.sideH, P.bedFront]} thickness={0.045} material={frameMat} />
        </group>

        <group name="rear-panel">
          <mesh position={[0, P.floorY + P.sideH / 2, P.bedRear]} material={getMeshMaterial((P.railX * 2) / 0.16, P.sideH / 0.16)}>
            <planeGeometry args={[P.railX * 2, P.sideH]} />
          </mesh>
          <Beam start={[-P.railX, P.floorY + P.sideH, P.bedRear]} end={[P.railX, P.floorY + P.sideH, P.bedRear]} thickness={0.045} material={frameMat} />
          <Beam start={[-P.railX, P.floorY, P.bedRear]} end={[-P.railX, P.floorY + P.sideH, P.bedRear]} thickness={0.045} material={frameMat} />
          <Beam start={[P.railX, P.floorY, P.bedRear]} end={[P.railX, P.floorY + P.sideH, P.bedRear]} thickness={0.045} material={frameMat} />
          {/* Reflectors */}
          <mesh position={[-P.railX * 0.88, P.floorY + 0.16, P.bedRear - 0.01]} material={accentMat}>
            <boxGeometry args={[0.05, 0.09, 0.02]} />
          </mesh>
          <mesh position={[P.railX * 0.88, P.floorY + 0.16, P.bedRear - 0.01]} material={accentMat}>
            <boxGeometry args={[0.05, 0.09, 0.02]} />
          </mesh>
        </group>

        {/* 4/6. AXLE */}
        <Beam start={[-P.trackHalf, P.axleY, P.wheelZ]} end={[P.trackHalf, P.axleY, P.wheelZ]} thickness={0.06} material={hubMat} />
        <Beam start={[-P.railX, P.railY, P.wheelZ]} end={[-P.railX, P.axleY, P.wheelZ]} thickness={0.05} material={frameMat} />
        <Beam start={[P.railX, P.railY, P.wheelZ]} end={[P.railX, P.axleY, P.wheelZ]} thickness={0.05} material={frameMat} />

        {/* 5. FENDERS */}
        {[-1, 1].map((sign) => {
          const R = P.wheelR + 0.04; // Matched to R_inner
          const dz = R * 0.71, dy = R * 0.71;
          return (
            <group key={sign} position={[sign * P.trackHalf, P.axleY, P.wheelZ]}>
              <mesh geometry={fenderGeometry} rotation={[0, -Math.PI / 2, 0]} material={fenderMat} castShadow receiveShadow />
              <Beam start={[0, dy, -dz]} end={[sign * P.railX - sign * P.trackHalf, P.floorY - P.axleY, -dz]} thickness={0.03} material={frameMat} />
              <Beam start={[0, dy, dz]} end={[sign * P.railX - sign * P.trackHalf, P.floorY - P.axleY, dz]} thickness={0.03} material={frameMat} />
            </group>
          );
        })}

        {/* 7/8. TOW FRAME + HITCH */}
        <group name="tow-frame">
          {/* Single straight center tongue pole */}
          <Beam start={[0, P.railY, P.bedFront]} end={[0, P.railY, P.hitchZ - 0.15]} thickness={0.065} material={frameMat} />

          {/* Trailer Jack Visual */}
          {!isCoupled && (
            <group>
              <Beam start={[0, P.railY, P.hitchZ - 0.2]} end={[0, 0.05, P.hitchZ - 0.2]} thickness={0.04} material={frameMat} />
              <mesh position={[0, 0.025, P.hitchZ - 0.2]} material={tireMat} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
              </mesh>
            </group>
          )}
        </group>

        <group name="tow-hitch">
          {/* Receiver block - positioned BEFORE the physics anchor */}
          <mesh position={[0, P.railY, P.hitchZ - 0.075]} material={hubMat} castShadow>
            <boxGeometry args={[0.10, 0.10, 0.15]} />
          </mesh>
          {/* Hitch ball/cup - positioned EXACTLY on the physics anchor */}
          <mesh position={[0, P.railY, P.hitchZ]} material={rimMat} castShadow>
            <sphereGeometry args={[0.06, 12, 10]} />
          </mesh>
          {/* Target Highlight */}
          <mesh position={[0, P.railY, P.hitchZ]}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshBasicMaterial color="red" wireframe />
          </mesh>
        </group>

        {/* 10. SAFETY CHAINS */}
        <group name="safety-chains">
          {[-1, 1].map((sign) => {
            const start = [sign * 0.05, P.railY - 0.02, P.bedFront + 0.2] as [number, number, number];
            const mid = [sign * 0.08, P.railY - 0.12, P.hitchZ - 0.35] as [number, number, number];
            const end = [0, P.railY - 0.03, P.hitchZ - 0.02] as [number, number, number];
            return (
              <group key={sign}>
                <Beam start={start} end={mid} thickness={0.018} material={chainMat} />
                <Beam start={mid} end={end} thickness={0.018} material={chainMat} />
              </group>
            );
          })}
        </group>
      </RigidBody>

      {/* 4. WHEELS */}
      {[-1, 1].map((sign) => {
        // sign > 0 (+X) is Left in Three.js, sign < 0 (-X) is Right
        const wheelGeo = sign > 0 ? nodes['wheel-back-left'].geometry : nodes['wheel-back-right'].geometry;
        const scale = P.wheelR / 0.3; // Scale SUV wheel (r=0.3) to match trailer's wheelR
        const scaleX = scale * 0.65; // Make the wheel significantly thinner (65% of original width)
        return (
          <RigidBody
            key={sign}
            ref={sign < 0 ? wheelLRef : wheelRRef}
            name={sign < 0 ? "wheel-left" : "wheel-right"}
            type="dynamic"
            colliders={false}
            mass={5.0} // Increased mass so joints don't glitch under the heavy 50kg chassis
            friction={1.5}
            position={[sign * P.trackHalf, P.axleY + startY, P.wheelZ]}
          >
            <mesh geometry={wheelGeo} material={materials.colormap} scale={[scaleX, scale, scale]} castShadow receiveShadow />
            <CylinderCollider args={[P.wheelW / 2, P.wheelR]} rotation={[0, 0, Math.PI / 2]} />
          </RigidBody>
        );
      })}

    </group>
  );
}

useGLTF.preload('/suv.glb');
