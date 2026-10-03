"use client";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Line } from "@react-three/drei";
import * as THREE from "three";

const ParticleGlobe = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const pts = [];
    const numPoints = 8000;
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      const r = 2;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0005;
      pointsRef.current.rotation.z = 0.1;
    }
  });

  return (
    <group rotation={[0.2, 0, 0]}>
      {/* Core dark sphere */}
      <mesh>
        <sphereGeometry args={[1.98, 32, 32]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      {/* Particle shell */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          color="#0ea5e9"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

const Cyclone = () => {
  const groupRef = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 2000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 2) * 0.8;
      const spiral = angle + r * 6;
      const x = Math.cos(spiral) * r;
      const z = Math.sin(spiral) * r;
      const y = (Math.random() - 0.5) * 0.1 + (1 - r) * 0.15;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= 0.02;
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.03;
      groupRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <group position={[1.3, 0.7, 1.2]} rotation={[0.6, -0.4, -0.2]}>
      <group ref={groupRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particles, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.025}
            color="#38bdf8"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
        {/* Eye */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
      </group>

      {/* Forecast Line */}
      <Line
        points={[
          [0, 0, 0],
          [-0.3, 0.1, 0.4],
          [-0.7, 0.15, 0.8],
          [-1.2, 0.2, 1.1],
        ]}
        color="#34d399"
        lineWidth={2}
        dashed={true}
      />
      {/* Target point */}
      <mesh position={[-1.2, 0.2, 1.1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
    </group>
  );
};

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(() => {
      onEnter();
    }, 1000); // 1s fade out
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        background: "#020617",
        zIndex: 9999,
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(1.05)" : "scale(1)",
        transition: "opacity 1s ease, transform 1s ease",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 3D Scene */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: mounted ? 1 : 0,
          transition: "opacity 2s ease 0.5s",
        }}
      >
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <ParticleGlobe />
          <Cyclone />
        </Canvas>
      </div>

      {/* Overlay UI */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(2,6,23,0.8) 0%, rgba(2,6,23,0.2) 40%, rgba(2,6,23,0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "2rem",
          left: "3rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-20px)",
          transition: "all 1s ease 1s",
        }}
      >
        <img
          src="/stride_ai_logo.png"
          alt="STRIDE-AI"
          style={{ height: "40px", objectFit: "contain" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div
          style={{
            color: "white",
            fontSize: "1.2rem",
            fontWeight: 700,
            letterSpacing: "2px",
          }}
        >
          STRIDE-AI
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "2.5rem",
          right: "3rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          opacity: mounted ? 1 : 0,
          transition: "opacity 1s ease 1.5s",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 10px #10b981",
          }}
        />
        <div
          style={{
            color: "#94a3b8",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "1px",
          }}
        >
          SYSTEM ONLINE
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "5%",
          transform: "translateY(-50%)",
          maxWidth: "600px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s ease 1.5s",
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: "4.5rem",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "0 0 1rem 0",
              textShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            STRIDE-AI
          </h1>
          <h2
            style={{
              color: "#38bdf8",
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 1.5rem 0",
              letterSpacing: "1px",
            }}
          >
            AI-Powered Tropical Cyclone Intelligence
          </h2>
          <p
            style={{
              color: "#cbd5e1",
              fontSize: "1.1rem",
              lineHeight: 1.6,
              margin: "0 0 3rem 0",
              maxWidth: "480px",
            }}
          >
            Detect. Track. Predict. <br />
            <br />
            Advanced artificial intelligence for cyclone identification,
            intensity estimation, and trajectory forecasting.
          </p>
        </div>

        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s ease 2s",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={handleEnter}
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              padding: "1rem 2.5rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: "30px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(14, 165, 233, 0.4)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 15px 35px rgba(14, 165, 233, 0.6)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 10px 25px rgba(14, 165, 233, 0.4)";
            }}
          >
            ENTER STRIDE-AI <span style={{ transition: "transform 0.3s ease" }}>→</span>
          </button>
        </div>
      </div>
      
      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "5%",
          color: "#475569",
          fontSize: "0.85rem",
          letterSpacing: "1px",
          opacity: mounted ? 1 : 0,
          transition: "opacity 1s ease 2.5s",
        }}
      >
        REAL-TIME ATMOSPHERIC INTELLIGENCE
      </div>
    </div>
  );
}
