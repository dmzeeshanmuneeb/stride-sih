"use client";
import React, { useState, useEffect } from "react";

export default function LoginVisualization() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div style={{ 
      position: "absolute", top: 0, left: 0, width: "100%", height: "100%", 
      zIndex: 0, background: "#080808", overflow: "hidden" 
    }}>
      
      {/* Background Map - Deeply Faded */}
      <div style={{
         position: "absolute", top: "-10%", left: "-10%", right: "-10%", bottom: "-10%",
         background: "url('/satellite_bg.jpg') no-repeat center center",
         backgroundSize: "cover", 
         opacity: 0.08, 
         pointerEvents: "none",
         filter: "grayscale(100%) contrast(150%)"
      }} />

      {/* Schematic Diagram */}
      <div style={{
         position: "absolute", top: "25%", left: "8%",
         color: "#EAEAEA", fontFamily: "'Inter', sans-serif", pointerEvents: "none",
         userSelect: "none"
      }}>
         {/* Location Label */}
         <div style={{ 
           fontSize: "0.85rem", fontWeight: 600, letterSpacing: "6px", 
           color: "#555555", marginBottom: "4rem", display: "flex", alignItems: "center", gap: "1rem" 
         }}>
            <div style={{ width: "30px", height: "1px", background: "#555555" }} />
            INDIA / BAY OF BENGAL
         </div>
         
         <div style={{ position: "relative", width: "500px", height: "400px", marginLeft: "4rem" }}>
            
            {/* The Cyclone Schematic */}
            <div style={{ 
              position: "absolute", top: 0, left: 0, 
              display: "flex", flexDirection: "column", alignItems: "center",
              animation: "float 6s ease-in-out infinite"
            }}>
               <div style={{ fontSize: "1.5rem", color: "#444", marginBottom: "0.5rem", letterSpacing: "15px" }}>
                 ☁ ☁ ☁
               </div>
               
               <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                 <div style={{ fontSize: "1.5rem", color: "#444" }}>☁</div>
                 <div style={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "4px", color: "#A3A3A3" }}>
                   CYCLONE
                 </div>
                 <div style={{ fontSize: "1.5rem", color: "#444" }}>☁</div>
               </div>
               
               <div style={{ display: "flex", alignItems: "center", gap: "2rem", margin: "0.5rem 0" }}>
                 <div style={{ fontSize: "1.5rem", color: "#444" }}>☁</div>
                 <div style={{ 
                   fontSize: "2.5rem", color: "#38bdf8", 
                   textShadow: "0 0 30px rgba(56,189,248,0.4)",
                   animation: "pulse 3s infinite"
                 }}>
                   ◉
                 </div>
                 <div style={{ fontSize: "1.5rem", color: "#444" }}>☁</div>
               </div>
               
               <div style={{ fontSize: "1.5rem", color: "#444", marginTop: "0.5rem", letterSpacing: "8px" }}>
                 ☁ ☁ ☁ ☁ ☁
               </div>
            </div>

            {/* Trajectory Arrows */}
            <div style={{ position: "absolute", top: "180px", left: "100px", fontSize: "1.5rem", color: "#333" }}>↘</div>
            <div style={{ position: "absolute", top: "220px", left: "140px", fontSize: "1.5rem", color: "#444" }}>↘</div>
            <div style={{ position: "absolute", top: "260px", left: "180px", fontSize: "1.5rem", color: "#555" }}>↘</div>
            
            {/* Destination Target */}
            <div style={{ 
              position: "absolute", top: "300px", left: "220px", 
              display: "flex", alignItems: "center", gap: "1rem" 
            }}>
               <div style={{ fontSize: "1.5rem", color: "#888" }}>→</div>
               <div style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "5px", color: "#EAEAEA" }}>
                 INDIA
               </div>
               <div style={{ 
                 width: "8px", height: "8px", background: "transparent", 
                 border: "2px solid #38bdf8", borderRadius: "50%", marginLeft: "0.5rem" 
               }} />
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
      `}} />
    </div>
  );
}
