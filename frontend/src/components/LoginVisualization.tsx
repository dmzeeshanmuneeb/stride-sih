"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

const EARTH_RADIUS = 10;
// Roughly India / Bay of Bengal
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

// Generates a soft, realistic cloud puff texture
const createCloudPuff = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
};

// Shader for the cyclone to give it natural, wispy spiral rendering
const CycloneClouds = () => {
  const count = 1500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cloudTex = useMemo(() => createCloudPuff(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Create spiral bands
      const arms = 5;
      const armIndex = i % arms;
      const t = Math.random(); // Distance along the arm
      
      // Radius from center (leave an eye)
      const r = 0.05 + t * 0.8;
      
      // Angle follows a spiral
      const baseAngle = (armIndex / arms) * Math.PI * 2;
      const spiralTwist = r * 8; // How tightly it winds
      const angleVariance = (Math.random() - 0.5) * 0.8 * (1 - t * 0.5); // Thicker near center
      
      const angle = baseAngle - spiralTwist + angleVariance;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      // Depth layered
      const z = (Math.random() - 0.5) * 0.05 + 0.02; // very flat but slight depth
      
      // Scale gets larger outwards to form massive clouds
      const scale = 0.08 + t * 0.2 + Math.random() * 0.05;

      dummy.position.set(x, y, z);
      // Random rotation for the cloud puff
      dummy.rotation.z = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color based on density/radius
      // Eyewall is dense white, outer is wispy light grey
      const intensity = 1 - t * 0.4 - Math.random() * 0.2;
      color.setRGB(intensity, intensity, intensity + 0.02);
      color.toArray(colors, i * 3);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute("color", new THREE.InstancedBufferAttribute(colors, 3));
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Slow majestic rotation
      meshRef.current.rotation.z = -clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={cloudTex} 
        vertexColors 
        transparent 
        opacity={0.35}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </instancedMesh>
  );
};

const InteractiveCycloneSystem = () => {
  const [latLon, setLatLon] = useState({ lat: INITIAL_LAT, lon: INITIAL_LON });
  const [isDragging, setIsDragging] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  const { camera, raycaster, pointer, scene } = useThree();
  const earthMesh = scene.getObjectByName("EarthSphere");

  // Idle movement (simulation)
  useFrame(() => {
    if (!isDragging) {
      // Extremely slow movement north-west
      setLatLon(prev => ({
        lat: prev.lat + 0.001,
        lon: prev.lon - 0.001
      }));
    }
    
    if (groupRef.current) {
      const pos = getSphericalPos(latLon.lat, latLon.lon, EARTH_RADIUS + 0.02);
      groupRef.current.position.copy(pos);
      // Align to surface normal
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
    document.body.style.cursor = 'auto';
  };

  const onPointerMove = (e: any) => {
    if (isDragging && earthMesh) {
      e.stopPropagation();
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(earthMesh);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const newLatLon = getLatLonFromPos(point, EARTH_RADIUS);
        // Smooth interpolation
        setLatLon(prev => ({
          lat: prev.lat + (newLatLon.lat - prev.lat) * 0.2,
          lon: prev.lon + (newLatLon.lon - prev.lon) * 0.2
        }));
      }
    } else if (!isDragging) {
      document.body.style.cursor = 'grab';
    }
  };

  // Forecast path based on current position
  const trajectoryPoints: [number, number, number][] = [];
  const markers = [];
  for (let i = 0; i <= 5; i++) {
    // Project path NW
    const pLat = latLon.lat + i * 2;
    const pLon = latLon.lon - i * 1.5;
    const p = getSphericalPos(pLat, pLon, EARTH_RADIUS + 0.01);
    trajectoryPoints.push([p.x, p.y, p.z]);
    if (i > 0) {
      markers.push({ pos: p, label: `+${i * 12}H` });
    }
  }

  return (
    <>
      <group 
        ref={groupRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerOut={() => { if (!isDragging) document.body.style.cursor = 'auto'; }}
      >
        {/* Invisible hit area for dragging */}
        <mesh visible={false}>
          <circleGeometry args={[1, 16]} />
          <meshBasicMaterial />
        </mesh>
        
        {/* The Volumetric Cloud Layer */}
        <CycloneClouds />
      </group>

      {/* Trajectory */}
      <group>
        <Line
          points={trajectoryPoints}
          color="#a3a3a3"
          lineWidth={1.5}
          dashed={true}
          dashSize={0.05}
          dashScale={1}
          transparent
          opacity={0.6}
        />
        {markers.map((m, idx) => (
          <group key={idx} position={[m.pos.x, m.pos.y, m.pos.z]}>
            <mesh>
              <circleGeometry args={[0.02, 16]} />
              <meshBasicMaterial color="#d4d4d4" />
            </mesh>
            <Html position={[0.05, 0.05, 0]} center>
              <div style={{ color: "#a3a3a3", fontSize: "0.6rem", fontWeight: 500, fontFamily: "Inter", whiteSpace: "nowrap" }}>
                {m.label}
              </div>
            </Html>
          </group>
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

  return (
    <group>
      {/* Dark satellite earth */}
      <mesh name="EarthSphere">
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          map={texture || undefined}
          color={texture ? "#aaaaaa" : "#0a0a0a"} // Darken the map
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Subtle atmospheric haze */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.1, 64, 64]} />
        <meshBasicMaterial 
          color="#38bdf8" 
          transparent 
          opacity={0.04} 
          blending={THREE.AdditiveBlending} 
          side={THREE.BackSide} 
        />
      </mesh>
    </group>
  );
};

const SceneSetup = () => {
  const { camera, mouse } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Position camera looking directly at India/Bay of Bengal
    // Lat 18, Lon 82 is central eastern India
    const target = getSphericalPos(18, 82, EARTH_RADIUS);
    // Camera is elevated and pulled back
    const camPos = getSphericalPos(12, 88, EARTH_RADIUS + 4.5);
    camera.position.copy(camPos);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    if (groupRef.current) {
      // Subtle cinematic parallax
      groupRef.current.rotation.y = mouse.x * 0.02;
      groupRef.current.rotation.x = -mouse.y * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, 5, -10]} intensity={0.5} color="#475569" />
      
      <EarthMap />
      <InteractiveCycloneSystem />
    </group>
  );
};

export default function LoginVisualization() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: mounted ? 1 : 0, transition: "opacity 2s ease" }}>
      <Canvas>
        <color attach="background" args={['#030303']} />
        <SceneSetup />
      </Canvas>
      <div style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0, width: "40%",
        background: "linear-gradient(90deg, transparent, rgba(17,17,17,0.8) 40%, #111111 100%)",
        pointerEvents: "none"
      }} />
    </div>
  );
}
