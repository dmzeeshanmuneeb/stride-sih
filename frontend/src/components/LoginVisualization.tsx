"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

const R = 5; // Earth Radius
const CYCLONE_LAT = 20;
const CYCLONE_LON = 85;

// Convert Lat/Lon to spherical coordinates
const getSphericalPos = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

const VolumetricCyclone = () => {
  const count = 3000;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pos = getSphericalPos(CYCLONE_LAT, CYCLONE_LON, R + 0.02);

  useEffect(() => {
    if (!meshRef.current || !groupRef.current) return;
    
    // Orient the group so it sits flat on the surface
    groupRef.current.position.copy(pos);
    groupRef.current.lookAt(new THREE.Vector3(0, 0, 0)); // Z points to center

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const colorArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Exponential distribution to cluster near eye but keep eye clear
      const r = Math.random() < 0.05 ? Math.random() * 0.05 : 0.08 + Math.pow(Math.random(), 1.5) * 0.4;
      const spiral = angle + r * 5;
      
      const x = Math.cos(spiral) * r;
      const y = Math.sin(spiral) * r;
      
      // Radar intensity / height
      let height = 0;
      if (r < 0.08) {
         height = 0.01;
         color.set("#020617"); // clear eye
      } else if (r < 0.15) {
         height = 0.15 * (1 - (r - 0.08) / 0.07);
         color.set(THREE.MathUtils.lerp(0x4c0519, 0xe11d48, (r - 0.08) / 0.07)); // maroon to red
      } else if (r < 0.25) {
         height = 0.08 * (1 - (r - 0.15) / 0.1);
         color.set(THREE.MathUtils.lerp(0xe11d48, 0xf59e0b, (r - 0.15) / 0.1)); // red to orange
      } else if (r < 0.35) {
         height = 0.04 * (1 - (r - 0.25) / 0.1);
         color.set(THREE.MathUtils.lerp(0xf59e0b, 0x10b981, (r - 0.25) / 0.1)); // orange to green
      } else {
         height = 0.015;
         color.set(THREE.MathUtils.lerp(0x10b981, 0x0ea5e9, (r - 0.35) / 0.15)); // green to blue
      }
      
      // Since Z points to center, -Z points outward to space
      dummy.position.set(x, y, -height / 2);
      dummy.scale.set(0.008, 0.008, height);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      color.toArray(colorArray, i * 3);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
  }, [pos]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // slowly rotate the cyclone on its own Z axis
      groupRef.current.rotation.z = -clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial vertexColors transparent opacity={0.85} />
      </instancedMesh>
    </group>
  );
};

const ForecastTrack = () => {
  // Generate forecast points along a curve starting from the cyclone
  const pts: [number, number, number][] = [];
  const markers = [];
  
  // Track bends north-west
  for (let i = 0; i <= 4; i++) {
    const p = getSphericalPos(CYCLONE_LAT + i * 2.5, CYCLONE_LON - i * 1.5, R + 0.03);
    pts.push([p.x, p.y, p.z]);
    if (i > 0) {
      markers.push({ pos: p, label: `+${i * 12}H` });
    }
  }

  return (
    <group>
      <Line
        points={pts}
        color="#ffffff"
        lineWidth={1.5}
        dashed={true}
        dashSize={0.05}
        dashScale={1}
        transparent
        opacity={0.8}
      />
      {markers.map((m, idx) => (
        <group key={idx} position={[m.pos.x, m.pos.y, m.pos.z]}>
          <mesh>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <Html position={[0.05, 0.05, 0]} center className="forecast-label">
            <div style={{ color: "white", fontSize: "0.55rem", fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.8)", fontFamily: "Inter", whiteSpace: "nowrap" }}>
              {m.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
};

const EarthSystem = () => {
  const earthGroup = useRef<THREE.Group>(null);
  const { mouse, camera } = useThree();
  
  let texture = null;
  try {
    texture = useLoader(THREE.TextureLoader, '/satellite_bg.jpg');
  } catch(e) {}

  // Position camera to look across the earth at the cyclone
  useEffect(() => {
    const cyclonePos = getSphericalPos(CYCLONE_LAT, CYCLONE_LON, R);
    // Camera slightly south-east of the cyclone, looking at it
    const camPos = getSphericalPos(CYCLONE_LAT - 15, CYCLONE_LON + 20, R + 1.2);
    camera.position.copy(camPos);
    camera.lookAt(cyclonePos);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    if (earthGroup.current) {
      // Subtle earth rotation independent of mouse
      earthGroup.current.rotation.y += 0.0001;
      
      // Parallax interaction (very subtle)
      const targetX = mouse.x * 0.05;
      const targetY = mouse.y * 0.05;
      earthGroup.current.rotation.z += (targetX - earthGroup.current.rotation.z) * 0.05;
      earthGroup.current.rotation.x += (-targetY - earthGroup.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={earthGroup}>
      {/* Base Earth */}
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial 
          map={texture || undefined}
          color={texture ? "#ffffff" : "#020617"} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[R + 0.1, 64, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.05} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </mesh>

      <VolumetricCyclone />
      <ForecastTrack />

      {/* Subtle Scientific Overlays */}
      <Html position={getSphericalPos(CYCLONE_LAT + 5, CYCLONE_LON + 15, R + 0.1).toArray()} center>
        <div style={{
          borderLeft: "1px solid rgba(255,255,255,0.4)",
          paddingLeft: "8px",
          color: "rgba(255,255,255,0.8)",
          fontFamily: "Inter",
          fontSize: "0.6rem",
          letterSpacing: "1px",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
        }}>
          RADAR REFLECTIVITY<br/>
          <span style={{color: "#f59e0b", fontWeight: 600}}>HIGH INTENSITY</span>
        </div>
      </Html>
      
      <Html position={getSphericalPos(CYCLONE_LAT - 8, CYCLONE_LON - 10, R + 0.1).toArray()} center>
        <div style={{
          borderLeft: "1px solid rgba(255,255,255,0.4)",
          paddingLeft: "8px",
          color: "rgba(255,255,255,0.8)",
          fontFamily: "Inter",
          fontSize: "0.6rem",
          letterSpacing: "1px",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
        }}>
          WIND FIELD VECTOR<br/>
          <span style={{color: "#38bdf8", fontWeight: 600}}>120 KNOTS</span>
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
      <Canvas>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <EarthSystem />
      </Canvas>
    </div>
  );
}
