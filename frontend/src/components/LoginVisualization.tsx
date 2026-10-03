"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

const CYCLONE_FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

// Simplex noise implementation
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 x) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
  for (int i = 0; i < 5; ++i) {
    v += a * snoise(x);
    x = rot * x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= uResolution.x / uResolution.y;

  // Center off-center to the left
  vec2 center = vec2(-0.8, 0.0);
  vec2 d = p - center;
  
  float r = length(d);
  float angle = atan(d.y, d.x);
  
  // Slow rotation
  float rotation = uTime * -0.07; // 1 full turn ~90s
  
  // Spiral distortion
  float spiral = angle + r * 4.0 - rotation;
  
  // Base noise mapped along spiral
  vec2 uvSpiral = vec2(cos(spiral), sin(spiral)) * r;
  float noise = fbm(uvSpiral * 3.0 - uTime * 0.1);
  float noise2 = fbm(uvSpiral * 6.0 + uTime * 0.05);
  
  // Mix layers
  float cloud = noise * 0.7 + noise2 * 0.3;
  
  // Eye of the cyclone
  float eyeWall = smoothstep(0.1, 0.3, r) * smoothstep(1.5, 0.5, r);
  
  // Apply spiral bands structure
  float bands = sin(spiral * 3.0 + fbm(uvSpiral * 2.0) * 3.0) * 0.5 + 0.5;
  bands = smoothstep(0.3, 0.8, bands);
  
  // Final density
  float density = cloud * eyeWall * (0.4 + 0.6 * bands);
  density = clamp(density, 0.0, 1.0);
  
  // Lighting: Cold white-blue highlights from one side (top-right)
  vec3 baseColor = vec3(0.02, 0.03, 0.05); // Dark navy ocean
  vec3 shadowColor = vec3(0.1, 0.15, 0.25);
  vec3 highlightColor = vec3(0.85, 0.9, 0.95);
  
  // Directional lighting
  vec2 lightDir = normalize(vec2(1.0, 1.0));
  float light = dot(normalize(d), lightDir) * 0.5 + 0.5;
  light = mix(0.3, 1.0, light);
  
  vec3 finalColor = mix(baseColor, shadowColor, density);
  finalColor = mix(finalColor, highlightColor, density * density * light);
  
  // Stars / Dust layer (very fine)
  float starNoise = fbm(p * 50.0);
  float stars = smoothstep(0.8, 1.0, starNoise) * (1.0 - density);
  finalColor += vec3(stars * 0.3);
  
  // Vignette
  float vignette = smoothstep(2.0, 0.0, length(p));
  finalColor *= vignette;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const CYCLONE_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CycloneBackground = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uResolution.value.set(state.size.width, state.size.height);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={CYCLONE_VERTEX_SHADER}
        fragmentShader={CYCLONE_FRAGMENT_SHADER}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
};

const ForecastTrack = () => {
  const { viewport } = useThree();
  const lineRef = useRef<THREE.Line>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  const [showHtml, setShowHtml] = useState(false);

  // Pre-calculate the entire curve once
  const { points, endPoint } = useMemo(() => {
    const eyeX = -0.8 * (viewport.width / 2);
    const eyeY = 0;
    const targetX = 0.2 * (viewport.width / 2);
    const targetY = 0.4 * (viewport.width / 2);
    
    const pts = [];
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const cx = eyeX + (targetX - eyeX) * 0.5;
      const cy = eyeY + (targetY - eyeY) * 0.8;
      const x = (1-t)*(1-t)*eyeX + 2*(1-t)*t*cx + t*t*targetX;
      const y = (1-t)*(1-t)*eyeY + 2*(1-t)*t*cy + t*t*targetY;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return { points: pts, endPoint: pts[pts.length - 1] };
  }, [viewport.width]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    g.setDrawRange(0, 0); // Start hidden
    return g;
  }, [points]);

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances(); // Required for dashed lines
    }
  }, [geometry]);

  // Animate outside of React render loop
  const startTime = useRef(0);
  useFrame((state) => {
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    
    const elapsed = state.clock.elapsedTime - startTime.current;
    if (elapsed < 1.0) return; // Wait 1 second before drawing
    
    const duration = 2.5;
    const progress = Math.min(1.0, (elapsed - 1.0) / duration);
    
    if (lineRef.current) {
      const count = Math.max(1, Math.floor(points.length * progress));
      lineRef.current.geometry.setDrawRange(0, count);
    }
    
    if (dotRef.current) {
      dotRef.current.visible = progress > 0;
      const currentIdx = Math.max(0, Math.floor((points.length - 1) * progress));
      dotRef.current.position.copy(points[currentIdx]);
    }
    
    if (progress === 1.0 && !showHtml) {
      setShowHtml(true);
    }
  });

  return (
    <group>
      {/* @ts-ignore */}
      <line ref={lineRef}>
        <primitive object={geometry} attach="geometry" />
        <lineDashedMaterial 
          color="#ff7a2f" 
          dashSize={0.2} 
          gapSize={0.2} 
          transparent 
          opacity={0.6} 
          linewidth={1} 
        />
      </line>
      
      <mesh ref={dotRef} visible={false}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial color="#ff7a2f" />
        {showHtml && (
          <Html center>
            <div style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: "#ff7a2f",
              boxShadow: "0 0 10px #ff7a2f",
              animation: "pulse 2s infinite ease-out"
            }} />
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(255,122,47,0.7); }
                70% { transform: scale(2.5); opacity: 0; box-shadow: 0 0 0 10px rgba(255,122,47,0); }
                100% { transform: scale(1); opacity: 0; }
              }
            `}} />
          </Html>
        )}
      </mesh>
    </group>
  );
};

const Scene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();
  
  useFrame(() => {
    if (groupRef.current) {
      // "barely noticeable parallax on mouse move (max 10px)"
      // Mapping mouse (-1 to 1) to a tiny translation
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, mouse.x * 0.1, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, mouse.y * 0.1, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <CycloneBackground />
      <ForecastTrack />
    </group>
  );
};

export default function LoginVisualization() {
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, background: "#05070C" }}>
      <Canvas 
        orthographic 
        camera={{ position: [0, 0, 1], zoom: 1 }}
        frameloop={reduceMotion ? "demand" : "always"}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
