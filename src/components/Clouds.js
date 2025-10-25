import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Cloud } from "@react-three/drei";

const GiantCloud = () => {
    const ref = useRef();

    useFrame((state, delta) => {
      if (ref.current) {
        ref.current.rotation.y += delta * 0.03;
      }
    });

    return (
      <group ref={ref} position={[0, 0, 0]} scale={[2.5, 2.5, 2.5]}>
        <Cloud
          position={[0, 0, 0]} // ensure no offset
          opacity={0.4}
          speed={0.3}
          width={5}
          depth={1.5}
          segments={30}
        />
      </group>
    );
  };

  const Clouds = () => {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          pointerEvents: "none", // allow clicks through
        }}
      >
        <Canvas camera={{ position: [0, 0, 15], fov: 70 }}>
          <color attach="background" args={["#ffffff"]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[0, 0, 5]} intensity={1.5} />
          <Suspense fallback={null}>
            <GiantCloud />
          </Suspense>
        </Canvas>
      </div>
    );
  };


  export default React.memo(Clouds);
