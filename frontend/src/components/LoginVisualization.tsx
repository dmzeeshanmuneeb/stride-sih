"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Html, Line, Stars } from "@react-three/drei";
import * as THREE from "three";

const EARTH_RADIUS = 10;
const INITIAL_LAT = 15;
const INITIAL_LON = 88;

const getSphericalPos = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const createCloudPuff = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(200, 240, 255, 0.8)");
    gradient.addColorStop(0.6, "rgba(100, 200, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
};

const CycloneClouds = () => {
  const count = 3000;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cloudTex = useMemo(() => createCloudPuff(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const arms = 6;
      const armIndex = i % arms;
      const t = Math.random();
      const r = 0.05 + t * 0.8;
      const baseAngle = (armIndex / arms) * Math.PI * 2;
      const spiralTwist = r * 8; 
      const angleVariance = (Math.random() - 0.5) * 1.2 * (1 - t * 0.5); 
      const angle = baseAngle - spiralTwist + angleVariance;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = (Math.random() - 0.5) * 0.1 + 0.05; 
      
      const scale = 0.03 + t * 0.15 + Math.random() * 0.04;

      dummy.position.set(x, y, z);
      dummy.rotation.z = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Cyberpunk glowing colors near center, white outer
      if (t < 0.3) {
        color.setRGB(0.2, 0.8, 1);
      } else {
        const intensity = 0.9 - t * 0.3;
        color.setRGB(intensity, intensity, intensity + 0.1);
      }
      color.toArray(colors, i * 3);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute("color", new THREE.InstancedBufferAttribute(colors, 3));
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = -clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={cloudTex} 
        vertexColors 
        transparent 
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

const HUDChips = ({ latLon }: { latLon: { lat: number, lon: number } }) => {
  return (
    <Html position={[0.7, 0.7, 0]} center style={{ pointerEvents: 'none' }}>
      <div style={{
        background: "rgba(5, 7, 13, 0.6)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(47, 212, 255, 0.3)",
        boxShadow: "0 0 15px rgba(47, 212, 255, 0.2)",
        padding: "1rem",
        borderRadius: "8px",
        color: "#ffffff",
        fontFamily: "'Space Grotesk', sans-serif",
        width: "220px",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem"
      }}>
        <div style={{ fontSize: "0.7rem", color: "#2fd4ff", letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase" }}>Target Lock</div>
        <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>Cyclone 04B</div>
        
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          <span style={{ color: "#8b9bb4" }}>Wind</span>
          <span style={{ color: "#ff7a2f", fontWeight: 600 }}>185 km/h</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
          <span style={{ color: "#8b9bb4" }}>Pressure</span>
          <span style={{ color: "#2fd4ff", fontWeight: 600 }}>940 hPa</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
          <span style={{ color: "#8b9bb4" }}>Landfall ETA</span>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>36h</span>
        </div>
        <div style={{ width: "100%", height: "2px", background: "linear-gradient(90deg, #ff7a2f, transparent)", marginTop: "0.5rem" }} />
      </div>
    </Html>
  );
};

const InteractiveCycloneSystem = () => {
  const [latLon, setLatLon] = useState({ lat: INITIAL_LAT, lon: INITIAL_LON });
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    setLatLon(prev => ({
      lat: prev.lat + 0.001,
      lon: prev.lon - 0.001
    }));
    
    if (groupRef.current) {
      const pos = getSphericalPos(latLon.lat, latLon.lon, EARTH_RADIUS + 0.02);
      groupRef.current.position.copy(pos);
      groupRef.current.lookAt(new THREE.Vector3(0, 0, 0));
    }
  });

  const trajectoryPoints: [number, number, number][] = [];
  for (let i = 0; i <= 10; i++) {
    const pLat = latLon.lat + i * 1.5;
    const pLon = latLon.lon - i * 1.2;
    const p = getSphericalPos(pLat, pLon, EARTH_RADIUS + 0.01);
    trajectoryPoints.push([p.x, p.y, p.z]);
  }

  return (
    <>
      <group ref={groupRef}>
        <CycloneClouds />
        <HUDChips latLon={latLon} />
      </group>

      <group>
        <Line
          points={trajectoryPoints}
          color="#ff7a2f"
          lineWidth={2}
          dashed={true}
          dashSize={0.2}
          dashScale={1}
          transparent
          opacity={0.8}
        />
      </group>
    </>
  );
};

const PulsingMarker = ({ lat, lon, label }: { lat: number, lon: number, label: string }) => {
  const pos = getSphericalPos(lat, lon, EARTH_RADIUS + 0.005);
  return (
    <Html position={[pos.x, pos.y, pos.z]} center style={{ pointerEvents: 'none' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: "0.6rem", color: "#2fd4ff", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px", textShadow: "0 0 10px #2fd4ff" }}>
          {label}
        </div>
        <div className="marker-pulse" />
      </div>
    </Html>
  );
};

const EarthMap = () => {
  let texture = null;
  try {
    texture = useLoader(THREE.TextureLoader, '/satellite_bg.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
  } catch(e) {}

  return (
    <group>
      <mesh name="EarthSphere">
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          map={texture || undefined}
          color={texture ? "#aaaaaa" : "#05070d"} 
          roughness={0.9}
        />
      </mesh>
      
      {/* Fresnel Atmosphere */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.2, 64, 64]} />
        <meshBasicMaterial 
          color="#1e6bff" 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending} 
          side={THREE.BackSide} 
        />
      </mesh>

      <PulsingMarker lat={22.57} lon={88.36} label="KOLKATA" />
      <PulsingMarker lat={13.08} lon={80.27} label="CHENNAI" />
      <PulsingMarker lat={19.07} lon={72.87} label="MUMBAI" />
    </group>
  );
};

const SceneSetup = () => {
  const { camera, mouse } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const target = getSphericalPos(18, 80, EARTH_RADIUS);
    const camPos = getSphericalPos(10, 88, EARTH_RADIUS + 5);
    camera.position.copy(camPos);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * 0.03;
      groupRef.current.rotation.x = -mouse.y * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 5, 10]} intensity={1.5} color="#2fd4ff" />
      <directionalLight position={[-10, 0, -10]} intensity={0.5} color="#1e6bff" />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <EarthMap />
      <InteractiveCycloneSystem />
    </group>
  );
};

export default function LoginVisualization() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: mounted ? 1 : 0, transition: "opacity 1.5s ease" }}>
      <Canvas>
        <color attach="background" args={['#020305']} />
        <SceneSetup />
      </Canvas>
      <div style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0, width: "100%",
        background: "linear-gradient(90deg, transparent 40%, rgba(5,7,13,0.9) 70%, #05070d 100%)",
        pointerEvents: "none"
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseMarker {
          0% { transform: scale(0.5); opacity: 1; box-shadow: 0 0 0 0 rgba(47, 212, 255, 0.7); }
          70% { transform: scale(2); opacity: 0; box-shadow: 0 0 0 10px rgba(47, 212, 255, 0); }
          100% { transform: scale(0.5); opacity: 0; }
        }
        .marker-pulse {
          width: 8px;
          height: 8px;
          background: #2fd4ff;
          border-radius: 50%;
          animation: pulseMarker 2s infinite;
        }
      `}} />
    </div>
  );
}
