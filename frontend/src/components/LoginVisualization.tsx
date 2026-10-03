"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
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

const getLatLonFromPos = (pos: THREE.Vector3, radius: number) => {
  const phi = Math.acos(pos.y / radius);
  const theta = Math.atan2(pos.z, -pos.x);
  const lat = 90 - (phi * 180) / Math.PI;
  const lon = (theta * 180) / Math.PI - 180;
  return { lat, lon: lon < -180 ? lon + 360 : lon };
};

const createCloudPuff = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(240, 245, 255, 0.8)");
    gradient.addColorStop(0.6, "rgba(220, 230, 240, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
};

const CycloneClouds = () => {
  const count = 2000;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cloudTex = useMemo(() => createCloudPuff(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const arms = 5;
      const armIndex = i % arms;
      const t = Math.random();
      
      const r = 0.05 + t * 0.8;
      
      const baseAngle = (armIndex / arms) * Math.PI * 2;
      const spiralTwist = r * 7; 
      const angleVariance = (Math.random() - 0.5) * 0.9 * (1 - t * 0.4); 
      
      const angle = baseAngle - spiralTwist + angleVariance;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = (Math.random() - 0.5) * 0.06 + 0.03; 
      
      const scale = 0.06 + t * 0.15 + Math.random() * 0.05;

      dummy.position.set(x, y, z);
      dummy.rotation.z = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const intensity = 0.85 - t * 0.4 - Math.random() * 0.1;
      color.setRGB(intensity, intensity, intensity + 0.05);
      color.toArray(colors, i * 3);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute("color", new THREE.InstancedBufferAttribute(colors, 3));
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = -clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={cloudTex} 
        vertexColors 
        transparent 
        opacity={0.4}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </instancedMesh>
  );
};

const InteractiveCycloneSystem = () => {
  const [latLon, setLatLon] = useState({ lat: INITIAL_LAT, lon: INITIAL_LON });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  const { camera, raycaster, pointer, scene } = useThree();
  const earthMesh = scene.getObjectByName("EarthSphere");

  useFrame(() => {
    if (!isDragging) {
      setLatLon(prev => ({
        lat: prev.lat + 0.0005,
        lon: prev.lon - 0.0005
      }));
    }
    
    if (groupRef.current) {
      const pos = getSphericalPos(latLon.lat, latLon.lon, EARTH_RADIUS + 0.02);
      groupRef.current.position.copy(pos);
      groupRef.current.lookAt(new THREE.Vector3(0, 0, 0));
    }
  });

  const onPointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };

  const onPointerUp = () => {
    setIsDragging(false);
    if (isHovered) document.body.style.cursor = 'grab';
    else document.body.style.cursor = 'auto';
  };

  const onPointerMove = (e: any) => {
    if (isDragging && earthMesh) {
      e.stopPropagation();
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(earthMesh);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const newLatLon = getLatLonFromPos(point, EARTH_RADIUS);
        setLatLon(prev => ({
          lat: prev.lat + (newLatLon.lat - prev.lat) * 0.15,
          lon: prev.lon + (newLatLon.lon - prev.lon) * 0.15
        }));
      }
    }
  };

  const trajectoryPoints: [number, number, number][] = [];
  const markers = [];
  for (let i = 0; i <= 6; i++) {
    const pLat = latLon.lat + i * 1.5;
    const pLon = latLon.lon - i * 1.2;
    const p = getSphericalPos(pLat, pLon, EARTH_RADIUS + 0.01);
    trajectoryPoints.push([p.x, p.y, p.z]);
    if (i > 0) {
      markers.push({ pos: p });
    }
  }

  return (
    <>
      <group 
        ref={groupRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); if (!isDragging) document.body.style.cursor = 'grab'; }}
        onPointerOut={(e) => { setIsHovered(false); if (!isDragging) document.body.style.cursor = 'auto'; }}
      >
        <mesh visible={false}>
          <circleGeometry args={[0.8, 16]} />
          <meshBasicMaterial />
        </mesh>
        
        <CycloneClouds />

        {isHovered && !isDragging && (
          <Html position={[0.5, 0.5, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: "rgba(10, 10, 10, 0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "12px",
              borderRadius: "4px",
              color: "#e2e8f0",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.75rem",
              backdropFilter: "blur(4px)",
              width: "180px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
            }}>
              <div style={{ fontWeight: 600, color: "#fff", marginBottom: "4px" }}>CYCLONE</div>
              <div style={{ color: "#94a3b8", marginBottom: "8px", fontSize: "0.7rem" }}>Bay of Bengal</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Wind:</span> <span style={{ color: "#fff" }}>128 km/h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Pressure:</span> <span style={{ color: "#fff" }}>978 hPa</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ color: "#f87171" }}>Severe Cyclonic Storm</span>
              </div>
            </div>
          </Html>
        )}
      </group>

      <group>
        <Line
          points={trajectoryPoints}
          color="#94a3b8"
          lineWidth={1}
          dashed={true}
          dashSize={0.05}
          dashScale={1}
          transparent
          opacity={0.3}
        />
        {markers.map((m, idx) => (
          <mesh key={idx} position={[m.pos.x, m.pos.y, m.pos.z]}>
            <circleGeometry args={[0.015, 16]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
    </>
  );
};

const EarthMap = () => {
  let texture = null;
  try {
    texture = useLoader(THREE.TextureLoader, '/satellite_bg.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
  } catch(e) {}

  const labels = [
    { name: "INDIA", lat: 21, lon: 78, size: "1rem", color: "#64748b", weight: 600, ls: "4px" },
    { name: "BAY OF BENGAL", lat: 13, lon: 87, size: "0.8rem", color: "#475569", weight: 500, ls: "2px" },
    { name: "Mumbai", lat: 19.07, lon: 72.87, size: "0.65rem", color: "#94a3b8", weight: 400, ls: "1px" },
    { name: "Chennai", lat: 13.08, lon: 80.27, size: "0.65rem", color: "#94a3b8", weight: 400, ls: "1px" },
    { name: "Kolkata", lat: 22.57, lon: 88.36, size: "0.65rem", color: "#94a3b8", weight: 400, ls: "1px" },
  ];

  return (
    <group>
      <mesh name="EarthSphere">
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          map={texture || undefined}
          color={texture ? "#777777" : "#080808"} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.05, 64, 64]} />
        <meshBasicMaterial 
          color="#38bdf8" 
          transparent 
          opacity={0.02} 
          blending={THREE.AdditiveBlending} 
          side={THREE.BackSide} 
        />
      </mesh>

      {labels.map((lbl, i) => {
        const pos = getSphericalPos(lbl.lat, lbl.lon, EARTH_RADIUS + 0.005);
        return (
          <Html key={i} position={[pos.x, pos.y, pos.z]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              color: lbl.color,
              fontSize: lbl.size,
              fontWeight: lbl.weight,
              letterSpacing: lbl.ls,
              fontFamily: "Inter, sans-serif",
              opacity: 0.7,
              textShadow: "0 1px 2px rgba(0,0,0,0.8)"
            }}>
              {lbl.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
};

const SceneSetup = () => {
  const { camera, mouse } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const target = getSphericalPos(17, 82, EARTH_RADIUS);
    const camPos = getSphericalPos(13, 88, EARTH_RADIUS + 3.8);
    camera.position.copy(camPos);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * 0.015;
      groupRef.current.rotation.x = -mouse.y * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-10, 5, -10]} intensity={0.4} color="#334155" />
      
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
        <color attach="background" args={['#020202']} />
        <SceneSetup />
      </Canvas>
      <div style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0, width: "40%",
        background: "linear-gradient(90deg, transparent, rgba(10,10,10,0.85) 40%, #0a0a0a 100%)",
        pointerEvents: "none"
      }} />
    </div>
  );
}
