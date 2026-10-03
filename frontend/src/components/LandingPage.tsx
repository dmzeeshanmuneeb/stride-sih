"use client";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Stars, Line, Html } from "@react-three/drei";
import * as THREE from "three";

// Using the existing satellite background as a texture for the earth
const Earth = () => {
  const earthRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Group>(null);
  
  let texture;
  try {
    texture = useLoader(THREE.TextureLoader, '/satellite_bg.jpg');
  } catch (e) {
    texture = null;
  }

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0002;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <group rotation={[0.3, -0.5, 0]}>
      {/* Earth Surface */}
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[1.98, 64, 64]} />
          <meshStandardMaterial 
            color="#020617" 
            emissive="#082f49"
            emissiveIntensity={0.2}
            map={texture || undefined}
            roughness={0.9}
          />
        </mesh>
        
        {/* Subtle Lat/Lon Grid */}
        <mesh>
          <sphereGeometry args={[1.99, 32, 32]} />
          <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.03} />
        </mesh>
        
        {/* Cyclone anchored to Earth's rotation */}
        <CycloneSystem />
      </group>

      {/* Independent Cloud Layer */}
      <group ref={cloudRef}>
        <mesh>
          <sphereGeometry args={[2.01, 64, 64]} />
          <meshStandardMaterial 
            color="#e2e8f0" 
            transparent 
            opacity={0.05} 
            blending={THREE.AdditiveBlending}
            roughness={1}
          />
        </mesh>
      </group>

      {/* Atmospheric Glow */}
      <mesh scale={1.05}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial 
          color="#0284c7" 
          transparent 
          opacity={0.08} 
          blending={THREE.AdditiveBlending} 
          side={THREE.BackSide} 
        />
      </mesh>
    </group>
  );
};

const CycloneSystem = () => {
  // Position over Indian Ocean roughly
  const lat = 15;
  const lon = 85;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const r = 2.02;
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);

  const innerRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Group>(null);
  const windRef = useRef<THREE.Group>(null);

  // Inner Eye Wall (fast, dense)
  const innerParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 800; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.15; // keep away from center to form eye
      const spiral = angle + radius * 10;
      const px = Math.cos(spiral) * radius;
      const pz = Math.sin(spiral) * radius;
      const py = (Math.random() - 0.5) * 0.05 + (0.2 - radius) * 0.2;
      pts.push(px, py, pz);
    }
    return new Float32Array(pts);
  }, []);

  // Outer spiral bands (slower, wider)
  const outerParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 1500; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.6;
      const spiral = angle + radius * 5;
      const px = Math.cos(spiral) * radius;
      const pz = Math.sin(spiral) * radius;
      const py = (Math.random() - 0.5) * 0.02 + (0.8 - radius) * 0.1;
      pts.push(px, py, pz);
    }
    return new Float32Array(pts);
  }, []);

  // Wind flow curves (sparse, sweeping)
  const windParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 600; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.9;
      const spiral = angle + radius * 3;
      const px = Math.cos(spiral) * radius;
      const pz = Math.sin(spiral) * radius;
      const py = (Math.random() - 0.5) * 0.01;
      pts.push(px, py, pz);
    }
    return new Float32Array(pts);
  }, []);

  useFrame(() => {
    if (innerRef.current) innerRef.current.rotation.y -= 0.04;
    if (outerRef.current) outerRef.current.rotation.y -= 0.015;
    if (windRef.current) windRef.current.rotation.y -= 0.025;
  });

  return (
    <group position={[x, y, z]} rotation={[-Math.PI/2 - 0.2, 0, -theta]}>
      <group>
        <group ref={innerRef}>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[innerParticles, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.015} color="#e0f2fe" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </points>
        </group>
        
        <group ref={outerRef}>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[outerParticles, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.02} color="#38bdf8" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
          </points>
        </group>

        <group ref={windRef}>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[windParticles, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.01} color="#0ea5e9" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
          </points>
        </group>

        {/* The Eye */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
      </group>

      {/* Forecast Trajectory */}
      <group position={[0.2, 0, -0.2]} rotation={[0, -0.5, 0]}>
        <Line
          points={[
            [0, 0, 0],
            [0.3, 0.02, -0.2],
            [0.55, 0.03, -0.45],
            [0.75, 0.01, -0.7],
            [0.85, -0.02, -0.95],
          ]}
          color="#34d399"
          lineWidth={2}
          dashed={true}
          dashSize={0.05}
          dashScale={1}
          opacity={0.6}
          transparent
        />
        {/* Forecast Points */}
        <mesh position={[0.3, 0.02, -0.2]}><sphereGeometry args={[0.015, 8, 8]} /><meshBasicMaterial color="#34d399" /></mesh>
        <mesh position={[0.55, 0.03, -0.45]}><sphereGeometry args={[0.015, 8, 8]} /><meshBasicMaterial color="#34d399" /></mesh>
        <mesh position={[0.75, 0.01, -0.7]}><sphereGeometry args={[0.015, 8, 8]} /><meshBasicMaterial color="#34d399" /></mesh>
        <mesh position={[0.85, -0.02, -0.95]}><sphereGeometry args={[0.02, 8, 8]} /><meshBasicMaterial color="#ef4444" /></mesh>
      </group>

      {/* AI HUD */}
      <Html position={[0.5, 0.2, 0.5]} center className="ai-hud-container">
        <div style={{
          background: "rgba(2, 6, 23, 0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          borderRadius: "8px",
          padding: "12px",
          width: "180px",
          color: "white",
          fontFamily: "'Inter', sans-serif",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          pointerEvents: "none"
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#38bdf8", marginBottom: "8px", letterSpacing: "1px" }}>
            ● AI CYCLONE DETECTED
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
            <span style={{ color: "#94a3b8" }}>CONFIDENCE</span>
            <span style={{ fontWeight: 600, color: "#34d399" }}>94.7%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
            <span style={{ color: "#94a3b8" }}>INTENSITY</span>
            <span style={{ fontWeight: 600 }}>128 km/h</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
            <span style={{ color: "#94a3b8" }}>FORECAST</span>
            <span style={{ fontWeight: 600 }}>72 HOURS</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span style={{ color: "#94a3b8" }}>STATUS</span>
            <span style={{ fontWeight: 600, color: "#f87171" }}>ACTIVE</span>
          </div>
        </div>
      </Html>
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
        background: "radial-gradient(circle at center, #0a1128 0%, #020617 100%)",
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
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 3, 5]} intensity={1.5} color="#e0f2fe" />
          <directionalLight position={[-5, -3, -5]} intensity={0.2} color="#0ea5e9" />
          
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={3}
            saturation={0}
            fade
            speed={0.5}
          />
          <Earth />
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
            "linear-gradient(90deg, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.3) 40%, rgba(2,6,23,0) 100%)",
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
          style={{ height: "72px", width: "72px", objectFit: "contain" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div
          style={{
            color: "white",
            fontSize: "1.3rem",
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
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.25rem",
          opacity: mounted ? 1 : 0,
          transition: "opacity 1s ease 1.5s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 10px #10b981",
            }}
          />
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "1px" }}>
            SYSTEM ONLINE
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#38bdf8",
              boxShadow: "0 0 10px #38bdf8",
              animation: "pulse 2s infinite"
            }}
          />
          <div style={{ color: "#38bdf8", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "1px" }}>
            AI CYCLONE DETECTED
          </div>
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
            AI-POWERED TROPICAL CYCLONE INTELLIGENCE
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
              background: "rgba(2, 6, 23, 0.4)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(34, 211, 238, 0.4)",
              color: "white",
              padding: "1rem 2.5rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: "4px",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(34, 211, 238, 0.15), inset 0 0 15px rgba(34, 211, 238, 0.05)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              letterSpacing: "1px"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 5px 25px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)";
              e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.8)";
              const arrow = e.currentTarget.querySelector('.arrow');
              if(arrow) (arrow as HTMLElement).style.transform = "translateX(5px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(34, 211, 238, 0.15), inset 0 0 15px rgba(34, 211, 238, 0.05)";
              e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)";
              const arrow = e.currentTarget.querySelector('.arrow');
              if(arrow) (arrow as HTMLElement).style.transform = "translateX(0)";
            }}
          >
            ENTER STRIDE-AI <span className="arrow" style={{ transition: "transform 0.3s ease", display: "inline-block" }}>→</span>
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
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}} />
    </div>
  );
}
