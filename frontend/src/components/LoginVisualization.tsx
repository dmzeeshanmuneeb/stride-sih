"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Html } from "@react-three/drei";
import * as THREE from "three";

const AtmosphericModel = () => {
  const innerRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Group>(null);
  const windRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const { mouse, camera } = useThree();
  
  const targetCameraPos = useRef(new THREE.Vector3(0, 0, 8));

  // Inner vortex
  const innerParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 2000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.5 + 0.2;
      const spiral = angle + r * 4;
      const x = Math.cos(spiral) * r;
      const z = Math.sin(spiral) * r;
      const y = (Math.random() - 0.5) * 0.5 + (2 - r) * 0.3;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  // Outer flow
  const outerParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 3000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 3 + 1.5;
      const spiral = angle + r * 2;
      const x = Math.cos(spiral) * r;
      const z = Math.sin(spiral) * r;
      const y = (Math.random() - 0.5) * 0.2 + (4 - r) * 0.1;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  // Wind curves
  const windParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 1500; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 4 + 0.5;
      const spiral = angle + r * 3;
      const x = Math.cos(spiral) * r;
      const z = Math.sin(spiral) * r;
      const y = (Math.random() - 0.5) * 0.8;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (innerRef.current) innerRef.current.rotation.y = -t * 0.15;
    if (outerRef.current) outerRef.current.rotation.y = -t * 0.05;
    if (windRef.current) windRef.current.rotation.y = -t * 0.08;
    
    if (coreRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.1;
      coreRef.current.scale.set(scale, scale, scale);
    }

    // Subtle parallax
    targetCameraPos.current.x = mouse.x * 1.5;
    targetCameraPos.current.y = mouse.y * 1.5;
    
    camera.position.x += (targetCameraPos.current.x - camera.position.x) * 0.02;
    camera.position.y += (targetCameraPos.current.y - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group rotation={[0.4, 0, 0]}>
      {/* Core Eye Accent */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      <group ref={innerRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[innerParticles, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.03} color="#38bdf8" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </group>
      
      <group ref={outerRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[outerParticles, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.025} color="#0284c7" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </group>

      <group ref={windRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[windParticles, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.015} color="#0ea5e9" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </group>

      {/* Floating Holographic Labels */}
      <Html position={[2.5, 1.5, 0]} center zIndexRange={[100, 0]}>
        <div style={{ color: "#38bdf8", fontFamily: "Inter", fontSize: "0.75rem", letterSpacing: "1px", textShadow: "0 0 10px rgba(56,189,248,0.8)", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginBottom: "2px" }}>CONFIDENCE</div>
          <div style={{ fontWeight: 600, fontSize: "1rem" }}>94.7%</div>
        </div>
      </Html>

      <Html position={[-2.5, 1, 0]} center zIndexRange={[100, 0]}>
        <div style={{ color: "#34d399", fontFamily: "Inter", fontSize: "0.75rem", letterSpacing: "1px", textShadow: "0 0 10px rgba(52,211,153,0.8)", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginBottom: "2px" }}>INTENSITY</div>
          <div style={{ fontWeight: 600, fontSize: "1rem" }}>128 km/h</div>
        </div>
      </Html>

      <Html position={[1.5, -1.5, 1]} center zIndexRange={[100, 0]}>
        <div style={{ color: "#f87171", fontFamily: "Inter", fontSize: "0.75rem", letterSpacing: "1px", textShadow: "0 0 10px rgba(248,113,113,0.8)", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginBottom: "2px" }}>TRACK CONFIDENCE</div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>HIGH</div>
        </div>
      </Html>
    </group>
  );
};

export default function LoginVisualization() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: mounted ? 1 : 0, transition: "opacity 2s ease" }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.5} />
        <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={1} />
        <AtmosphericModel />
      </Canvas>
    </div>
  );
}
