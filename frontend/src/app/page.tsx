"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main style={{
      background: '#020617', // Deep dark professional slate
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Dynamic Background Grid */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 0,
        opacity: 0.5
      }} />

      {/* Global Glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(2, 6, 23, 0) 70%)',
        zIndex: 0, filter: 'blur(40px)', pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem',
        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', minHeight: 'calc(100vh - 80px)'
      }}>

        {/* Header Text - Slide down animation */}
        <div style={{ textAlign: 'center', animation: 'slideDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <h1 style={{
            fontSize: '4.5rem', fontWeight: 800, margin: '0 0 1rem 0',
            letterSpacing: '-0.02em', lineHeight: 1.1
          }}>
            Next-Gen <span style={{ color: '#06b6d4' }}>Cyclone</span><br/>
            Intelligence <span style={{ color: '#f59e0b' }}>Engine</span>
          </h1>
          <p style={{
            fontSize: '1.1rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 3rem auto',
            lineHeight: 1.6
          }}>
            High-end data visualization and multi-spectral AI classification. 
            Real-time atmospheric tracking for the Ministry of Earth Sciences.
          </p>
          
          <Link href="/login" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
            color: 'white', fontWeight: 600, fontSize: '1.1rem',
            padding: '1rem 3rem', borderRadius: '50px',
            textDecoration: 'none',
            boxShadow: '0 10px 25px -5px rgba(6, 182, 212, 0.4)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            Get Started
          </Link>
        </div>

        {/* 3D Simulated Interactive Centerpiece */}
        <div style={{
          position: 'relative', width: '100%', height: '400px', marginTop: '5rem',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          animation: 'fadeIn 2s ease forwards 0.5s', opacity: 0
        }}>
          {/* Central Rotating Globe Simulation */}
          <div style={{
            position: 'absolute',
            width: '250px', height: '250px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            border: '2px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 0 50px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.1)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            animation: 'pulse 4s infinite alternate'
          }}>
            <div style={{
              width: '180px', height: '180px', borderRadius: '50%',
              border: '1px dashed rgba(245, 158, 11, 0.5)',
              animation: 'spin 20s linear infinite'
            }} />
          </div>

          {/* Exploded Technical View Cards */}
          <div className="tech-card" style={{
            position: 'absolute', top: '10%', left: '10%',
            animation: 'float 6s ease-in-out infinite'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, marginBottom: '5px' }}>STAGE 1: DETECTION</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Multi-Spectral CNN</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#06b6d4' }}>Recall: 98.4%</div>
            </div>
          </div>

          <div className="tech-card" style={{
            position: 'absolute', bottom: '10%', right: '10%',
            animation: 'float 7s ease-in-out infinite 1s'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, marginBottom: '5px' }}>STAGE 2: INTENSITY</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Wind Speed & Pressure</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#f59e0b' }}>MAE: 2.1 knots</div>
            </div>
          </div>
          
          <div className="tech-card" style={{
            position: 'absolute', top: '40%', left: '60%', transform: 'translateX(50px)',
            animation: 'float 5s ease-in-out infinite 0.5s', zIndex: 10
          }}>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginBottom: '5px' }}>STAGE 3: TRAJECTORY</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Landfall Estimation</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#10b981' }}>24h Error: &lt; 35km</div>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 50px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.1); }
          100% { box-shadow: 0 0 80px rgba(6, 182, 212, 0.4), inset 0 0 50px rgba(6, 182, 212, 0.2); }
        }
        .tech-card {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 12px;
          min-width: 250px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          transition: border-color 0.3s;
        }
        .tech-card:hover {
          border-color: rgba(6, 182, 212, 0.4);
        }
      `}} />
    </main>
  );
}
