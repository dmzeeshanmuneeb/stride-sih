"use client";
import React, { useState, useEffect, useRef } from "react";

interface Vector2 {
  x: number;
  y: number;
}

interface Mountain {
  id: number;
  x: number;
  y: number;
}

export default function LoginVisualization() {
  const [mounted, setMounted] = useState(false);
  
  // Cyclone state
  const [cyclonePos, setCyclonePos] = useState<Vector2>({ x: 80, y: 50 }); // percentages
  const [isDragging, setIsDragging] = useState(false);
  const cycloneRef = useRef<HTMLDivElement>(null);
  
  // Mountains state
  const [mountains, setMountains] = useState<Mountain[]>([]);
  
  // Animation loop references
  const requestRef = useRef<number>(0);
  const posRef = useRef(cyclonePos);
  const dragRef = useRef(isDragging);
  const mountainsRef = useRef(mountains);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    posRef.current = cyclonePos;
    dragRef.current = isDragging;
    mountainsRef.current = mountains;
  }, [cyclonePos, isDragging, mountains]);

  // Main game loop
  const update = () => {
    if (!dragRef.current) {
      let { x, y } = posRef.current;
      
      // Target is central India (~40% x, 50% y)
      const targetX = 40;
      const targetY = 50;
      
      // Calculate direction
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        let moveX = (dx / dist) * 0.05; // speed
        let moveY = (dy / dist) * 0.05;

        // Collision detection with mountains
        let hit = false;
        for (const m of mountainsRef.current) {
          const mdx = m.x - x;
          const mdy = m.y - y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 5) { // Collision radius (5%)
            hit = true;
            // Bounce back
            moveX = -moveX * 10;
            moveY = -moveY * 10;
            break;
          }
        }

        // Apply movement
        setCyclonePos({ x: x + moveX, y: y + moveY });
      }
    }
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      // Calculate percentage based on window size
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setCyclonePos({ x, y });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Don't place mountain if just finishing a drag
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setMountains([...mountains, { id: Date.now(), x, y }]);
  };

  if (!mounted) return null;

  return (
    <div 
      style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0,
        background: "url('/satellite_bg.jpg') no-repeat center center",
        backgroundSize: "cover",
        overflow: "hidden",
        cursor: "crosshair" // Indicates you can click to place something
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleBackgroundClick}
    >
      {/* Dark overlay for better text readability on login panel */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", pointerEvents: "none" }} />
      
      {/* Instructions */}
      <div style={{
        position: "absolute", top: "2rem", left: "2rem", 
        color: "white", fontFamily: "monospace", 
        background: "rgba(0,0,0,0.6)", padding: "1rem", borderRadius: "8px",
        pointerEvents: "none"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "#38bdf8" }}>🌀 Fun Cyclone Simulator!</h3>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
          <li>Drag the cyclone to move it back.</li>
          <li>Click anywhere to place a mountain ⛰️</li>
          <li>Mountains will obstruct and bounce the cyclone!</li>
        </ul>
      </div>

      {/* Mountains */}
      {mountains.map(m => (
        <div key={m.id} style={{
          position: "absolute",
          left: `${m.x}%`,
          top: `${m.y}%`,
          transform: "translate(-50%, -50%)",
          fontSize: "4rem", // Big mountain
          pointerEvents: "none",
          textShadow: "0 10px 20px rgba(0,0,0,0.5)"
        }}>
          ⛰️
        </div>
      ))}

      {/* Cyclone */}
      <div 
        ref={cycloneRef}
        onPointerDown={handlePointerDown}
        style={{
          position: "absolute",
          left: `${cyclonePos.x}%`,
          top: `${cyclonePos.y}%`,
          transform: "translate(-50%, -50%)",
          width: "120px", height: "120px",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none" // Prevents scrolling on touch
        }}
      >
        <div style={{
          width: "100%", height: "100%",
          background: "radial-gradient(circle, rgba(255,255,255,0.9) 10%, rgba(100,200,255,0.6) 40%, rgba(255,255,255,0) 70%)",
          borderRadius: "50%",
          animation: "spin 2s linear infinite",
          boxShadow: "0 0 40px rgba(255,255,255,0.4)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          {/* Swirls to make spinning obvious */}
          <div style={{
            position: "absolute", width: "100%", height: "100%",
            border: "8px dashed rgba(255,255,255,0.8)",
            borderRadius: "50%",
            boxSizing: "border-box"
          }} />
          <div style={{ fontSize: "2rem" }}>🌀</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          100% { transform: rotate(-360deg); }
        }
      `}} />
    </div>
  );
}
