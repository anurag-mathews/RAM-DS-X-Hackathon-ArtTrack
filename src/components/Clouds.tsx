// components/Clouds.tsx
import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Cloud } from "@react-three/drei";
import * as THREE from "three";

const CloudField: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_s, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.015; // very gentle
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* Left/top */}
      <Cloud
        position={[-4, 2, -2]}
        opacity={0.55}
        speed={0.18}
        segments={20}
        bounds={[1.8, 0.8, 0.8]}
        volume={3}
        color="#cdd8ef"
      />
      {/* Center/back (subtle) */}
      <Cloud
        position={[0, -1, -4]}
        opacity={0.45}
        speed={0.16}
        segments={20}
        bounds={[2.2, 0.9, 0.9]}
        volume={3.2}
        color="#d7e1f4"
      />
      {/* Right/mid */}
      <Cloud
        position={[3.5, 1.2, -2.5]}
        opacity={0.5}
        speed={0.2}
        segments={20}
        bounds={[1.6, 0.7, 0.7]}
        volume={2.6}
        color="#c7d3ea"
      />
    </group>
  );
};

const BackgroundClouds: React.FC = () => {
  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    []
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 22], fov: 60 }} // pulled back to fit all clouds
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={["#ffffff"]} />
        <ambientLight intensity={1.05} />
        <directionalLight position={[0, 2, 6]} intensity={1.1} />
        <Suspense fallback={null}>
          {reduceMotion ? null : <CloudField />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default React.memo(BackgroundClouds);
