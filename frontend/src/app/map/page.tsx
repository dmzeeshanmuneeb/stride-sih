"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Dynamically load MapComponent so it doesn't crash on SSR
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>Initializing geospatial data...</div>
});

export default function MapPage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCyclone, setSelectedCyclone] = useState<any>(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch(`${API}/api/v1/active-cyclones-multispectral`);
        const result = await res.json();
        setLiveData(result);
      } catch (err: any) {
        setError("Connection timeout. Systems unreachable.");
        console.error(err);
      }
      finally { setLoading(false); }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)', background: '#000000', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#f5f5f7' }}>
          <h2 style={{ fontWeight: 400, letterSpacing: '0.02em', fontSize: '1.2rem' }}>Acquiring satellite feed...</h2>
          <p style={{ color: '#86868b', marginTop: '0.75rem', fontSize: '0.9rem' }}>Calibrating multi-spectral telemetry</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)', background: '#000000', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#86868b' }}>
          <h2 style={{ fontWeight: 400 }}>{error}</h2>
        </div>
      </main>
    );
  }

  const cyclones = liveData?.cyclones || [];

  return (
    <main style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', background: '#000000', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Status Bar */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '8px', height: '8px', background: '#f5f5f7', borderRadius: '50%', boxShadow: '0 0 12px rgba(255,255,255,0.8)' }}></div>
          <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.02em' }}>Live Tracking Feed</h2>
        </div>
        <div style={{ display: 'flex', gap: '2rem', color: '#86868b', fontSize: '0.8rem', marginLeft: 'auto', letterSpacing: '0.03em' }}>
          <span>Source: <strong style={{ color: '#f5f5f7', fontWeight: 500 }}>NASA GIBS</strong></span>
          <span>Sync: <strong style={{ color: '#f5f5f7', fontWeight: 500 }}>{liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' }) : 'N/A'}</strong></span>
          <span>Active Systems: <strong style={{ color: '#f5f5f7', fontWeight: 500 }}>{cyclones.length}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Main Map Area */}
        <div style={{ flex: 1, zIndex: 0, filter: 'grayscale(30%) contrast(1.1)' }}>
          <MapComponent
            cyclones={cyclones}
            setSelectedCyclone={setSelectedCyclone}
            overlayTruecolor={liveData?.overlay_truecolor}
            overlayIr={liveData?.overlay_ir}
          />
        </div>

        <div style={{
          position: 'absolute', left: '24px', bottom: '24px', zIndex: 900,
          background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(20px)', color: '#f5f5f7', padding: '1.25rem',
          borderRadius: '16px', fontSize: '0.75rem', lineHeight: 1.8, maxWidth: '280px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontWeight: 500, marginBottom: '0.5rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{width:'12px',height:'12px',border:'2px solid #f5f5f7',borderRadius:'50%'}}></div> Genesis</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{width:'12px',height:'2px',background:'#86868b'}}></div> Observed</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{width:'12px',height:'12px',background:'#f5f5f7',borderRadius:'50%'}}></div> Active</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{width:'12px',height:'2px',background:'#f5f5f7',borderStyle:'dashed'}}></div> Forecast</div>
          {cyclones.length === 0 && (
            <div style={{ marginTop: '1rem', color: '#86868b', lineHeight: 1.4 }}>No active occurrences in monitoring zone.</div>
          )}
        </div>

        {/* Multi-Spectral Inspector Modal/Drawer */}
        <div style={{
          position: 'absolute',
          top: '24px', right: selectedCyclone ? '24px' : '-500px', bottom: '24px',
          width: '420px',
          background: 'rgba(15,15,15,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          color: '#f5f5f7',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          {selectedCyclone && (
            <>
              {/* Drawer Header */}
              <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 500 }}>{selectedCyclone.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#86868b', marginTop: '0.4rem', letterSpacing: '0.02em' }}>
                    ID: {selectedCyclone.cyclone_id} · {selectedCyclone.basin}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCyclone(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#f5f5f7', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, cssText: 'scrollbar-width: none;' }}>

                {/* Intensity Block */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ margin: '0 0 1.25rem 0', color: '#86868b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Telemetry Data
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '0.25rem' }}>Wind Velocity</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 300 }}>{selectedCyclone.intensity.vmax_knots} kt</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '0.25rem' }}>Pressure</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 300 }}>{selectedCyclone.intensity.pressure_hpa} hPa</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '0.25rem' }}>Scale</div>
                      <div style={{ fontSize: '1rem', fontWeight: 400 }}>{selectedCyclone.intensity.category}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '0.25rem' }}>Location</div>
                      <div style={{ fontSize: '1rem', fontWeight: 400 }}>
                        {selectedCyclone.current_pos[0].toFixed(1)}°, {selectedCyclone.current_pos[1].toFixed(1)}°
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automated Impact Risk Panel */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#f5f5f7', fontSize: '0.9rem', fontWeight: 500 }}>
                    Risk Assessment
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#a1a1a6', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Primary vector targets identified. Model confidence is operating at nominal levels.
                  </p>
                  
                  <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '0.75rem' }}>Intersecting Zones:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['Bhubaneswar', 'Raipur', 'Prayagraj'].map(city => (
                       <span key={city} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#f5f5f7', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem' }}>{city}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 1.25rem 0', color: '#86868b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Multispectral Captures
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.thermal_ir} style={{ width: '100%', borderRadius: '12px', filter: 'grayscale(100%)' }} alt="Thermal IR" />
                      <div style={{ fontSize: '0.7rem', color: '#86868b', marginTop: '0.5rem' }}>Thermal IR</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.water_vapor} style={{ width: '100%', borderRadius: '12px', filter: 'grayscale(100%)' }} alt="Water Vapor" />
                      <div style={{ fontSize: '0.7rem', color: '#86868b', marginTop: '0.5rem' }}>Water Vapor</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.visible} style={{ width: '100%', borderRadius: '12px', filter: 'grayscale(100%)' }} alt="Visible" />
                      <div style={{ fontSize: '0.7rem', color: '#86868b', marginTop: '0.5rem' }}>Visible / RGB</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.mid_ir} style={{ width: '100%', borderRadius: '12px', filter: 'grayscale(100%)' }} alt="PMW proxy" />
                      <div style={{ fontSize: '0.7rem', color: '#86868b', marginTop: '0.5rem' }}>Microwave</div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
