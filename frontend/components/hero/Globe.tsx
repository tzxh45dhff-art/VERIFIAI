"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleGlobe() {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pts: number[] = [];
    const cols: number[] = [];
    const n = 800;
    const blue = new THREE.Color("#3B82F6");
    const cyan = new THREE.Color("#06B6D4");

    for (let i = 0; i < n; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = 2;
      pts.push(r * Math.sin(theta) * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta));
      const mix = Math.random();
      const c = blue.clone().lerp(cyan, mix);
      cols.push(c.r, c.g, c.b);
    }
    return { positions: new Float32Array(pts), colors: new Float32Array(cols) };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.08;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.1;
    // Pulse scale
    const s = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.012;
    ref.current.scale.setScalar(s);
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial vertexColors transparent opacity={0.8} size={0.04} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function Globe() {
  return (
    <div className="w-full h-full" aria-hidden="true">
      <Suspense fallback={<div className="w-full h-full" />}>
        <Canvas camera={{ position: [0, 0, 5.5], fov: 55 }} gl={{ antialias: true, alpha: true }}>
          <ParticleGlobe />
        </Canvas>
      </Suspense>
    </div>
  );
}
