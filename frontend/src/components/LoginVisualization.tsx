"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

// Generate a soft volumetric cloud texture for particles
const createCloudTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
};

const CycloneModel = ({ position, setPosition }: { position: THREE.Vector3, setPosition: (p: THREE.Vector3) => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudTex = useMemo(() => createCloudTexture(), []);
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const { camera, size, raycaster, pointer } = useThree();
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  // Volumetric cloud points
  const count = 4000;
  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() < 0.05 ? Math.random() * 0.15 : 0.2 + Math.pow(Math.random(), 1.5) * 4;
      const spiral = angle + r * 1.5; // Spiral twist
      
      const x = Math.cos(spiral) * r;
      const y = Math.sin(spiral) * r;
      
      // Depth / Volume
      const z = (Math.random() - 0.5) * Math.max(0.2, 1.5 - r * 0.3) + 0.3;
      
      pos[i*3] = x;
      pos[i*3+1] = y;
      pos[i*3+2] = z;
      
      // Sizes larger on the outside, smaller near center
      sz[i] = Math.max(1, r * 1.5 + Math.random() * 2);

      // Colors: white/light grey clouds, darker near bottom/outer
      if (r < 0.2) {
        c.set("#ffffff"); // clear bright eye wall
      } else {
        const shade = 0.6 + Math.random() * 0.4 - (r * 0.05);
        c.setRGB(shade, shade, shade + 0.05); // slight cool tint
      }
      c.toArray(col, i * 3);
    }
    return [pos, col, sz];
  }, []);

  // Idle movement
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = -clock.getElapsedTime() * 0.15; // slow rotation
      
      // Simulated trajectory if not dragging
      if (!isDragging) {
        const speed = 0.001; // extremely slow cinematic movement
        const newX = position.x - speed; // Moving slowly West/North-West
        const newY = position.y + speed * 0.5;
        setPosition(new THREE.Vector3(newX, newY, position.z));
      }
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
    if (isDragging) {
      e.stopPropagation();
      raycaster.setFromCamera(pointer, camera);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlaneRef.current, target);
      if (target) {
        // Add subtle inertia / smoothing
        const newPos = position.clone().lerp(target.setZ(position.z), 0.2);
        setPosition(newPos);
      }
    } else {
      document.body.style.cursor = 'grab';
    }
  };

  return (
    <group 
      position={position} 
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerOut={() => {
        if (!isDragging) document.body.style.cursor = 'auto';
      }}
    >
      {/* Invisible interaction mesh */}
      <mesh visible={false}>
        <circleGeometry args={[4, 16]} />
        <meshBasicMaterial />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial 
          map={cloudTex} 
          vertexColors 
          transparent 
          opacity={0.8} 
          depthWrite={false}
          sizeAttenuation={true}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
};

const Trajectory = ({ origin }: { origin: THREE.Vector3 }) => {
  const points: [number, number, number][] = [];
  const markers = [];
  
  // Forecast moves roughly North-West
  for (let i = 0; i <= 5; i++) {
    const px = origin.x - i * 1.5;
    const py = origin.y + i * 0.8;
    points.push([px, py, origin.z]);
    if (i > 0) {
      markers.push({ x: px, y: py, z: origin.z, label: `+${i * 12}H` });
    }
  }

  return (
    <group>
      <Line
        points={points}
        color="#a3a3a3"
        lineWidth={1.5}
        dashed={true}
        dashSize={0.2}
        dashScale={1}
        transparent
        opacity={0.5}
      />
      
      {/* Uncertainty Cone (Subtle polygon) */}
      <mesh position={[0,0,-0.1]}>
         <shapeGeometry args={[(() => {
           const shape = new THREE.Shape();
           shape.moveTo(origin.x, origin.y);
           // curve expanding outward
           shape.lineTo(origin.x - 7.5, origin.y + 4 + 2);
           shape.lineTo(origin.x - 7.5, origin.y + 4 - 2);
           shape.lineTo(origin.x, origin.y);
           return shape;
         })()]} />
         <meshBasicMaterial color="#ffffff" transparent opacity={0.03} />
      </mesh>

      {markers.map((m, idx) => (
        <group key={idx} position={[m.x, m.y, m.z]}>
          <mesh>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color="#d4d4d4" />
          </mesh>
          <Html position={[0.2, 0.2, 0]} center>
            <div style={{ color: "#a3a3a3", fontSize: "0.6rem", fontWeight: 500, fontFamily: "Inter", whiteSpace: "nowrap" }}>
              {m.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
};

const MapBackground = () => {
  const { mouse, camera } = useThree();
  const mapGroup = useRef<THREE.Group>(null);
  
  let texture = null;
  try {
    texture = useLoader(THREE.TextureLoader, '/satellite_bg.jpg');
  } catch(e) {}

  // Initial camera setup for cinematic angle
  useEffect(() => {
    camera.position.set(0, -8, 12);
    camera.lookAt(0, 2, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    if (mapGroup.current) {
      // Very subtle parallax based on mouse
      const targetX = mouse.x * 0.5;
      const targetY = mouse.y * 0.5;
      mapGroup.current.position.x += (targetX - mapGroup.current.position.x) * 0.05;
      mapGroup.current.position.y += (targetY - mapGroup.current.position.y) * 0.05;
    }
  });

  return (
    <group ref={mapGroup}>
      {/* Main Map Plane */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[40, 30]} />
        <meshBasicMaterial 
          map={texture || undefined} 
          color={texture ? "#ffffff" : "#0a0a0a"} 
        />
      </mesh>
      
      {/* Cinematic Dark Vignette Overlay */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[40, 30]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.4} 
        />
      </mesh>
    </group>
  );
};

export default function LoginVisualization() {
  const [mounted, setMounted] = useState(false);
  const [cyclonePos, setCyclonePos] = useState(new THREE.Vector3(4, -2, 0.5)); // Start over Bay of Bengal roughly

  useEffect(() => setMounted(true), []);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: mounted ? 1 : 0, transition: "opacity 2.5s ease" }}>
      <Canvas>
        <color attach="background" args={['#050505']} />
        <MapBackground />
        <Trajectory origin={cyclonePos} />
        <CycloneModel position={cyclonePos} setPosition={setCyclonePos} />
      </Canvas>
      
      {/* Soft gradient to ensure text readability on the right */}
      <div style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0, width: "40%",
        background: "linear-gradient(90deg, transparent, rgba(17,17,17,0.7) 40%, #111111 100%)",
        pointerEvents: "none"
      }} />
    </div>
  );
}
