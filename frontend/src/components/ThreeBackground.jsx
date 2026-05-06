import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

function AnimatedSphere() {
  const meshRef = useRef();
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Manually increment time to avoid using the deprecated THREE.Clock provided by state.clock
      timeRef.current += delta;
      meshRef.current.rotation.x = timeRef.current * 0.2;
      meshRef.current.rotation.y = timeRef.current * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={2}>
      <MeshDistortMaterial
        color="#7c3aed"
        attach="material"
        distort={0.4}
        speed={2}
        roughness={0.2}
        transparent
        opacity={0.15}
      />
    </Sphere>
  );
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas 
        camera={{ position: [0, 0, 5] }}
        // Setting clock to null might prevent R3F from creating a THREE.Clock instance
        // depending on the version of R3F, but usually we just avoid using it.
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
}
