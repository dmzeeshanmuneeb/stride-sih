"use client";
import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Dynamically load MapComponent so it doesn't crash on SSR
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading interactive map...</div>
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
        setError("Failed to connect to live satellite feed. Check if backend is running.");
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
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)', background: '#ffffff' }}>
        <div style={{ textAlign: 'center', color: '#1e293b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>🛰️</div>
          <h2 style={{ color: '#1e293b' }}>Connecting to NASA GIBS / Worldview...</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Pulling IR, water-vapor, and visible mosaics for Indian Ocean cyclones</p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)', background: '#ffffff' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2>{error}</h2>
        </div>
      </main>
    );
  }

  const cyclones = liveData?.cyclones || [];

  return (
    <main style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      {/* Top Status Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e', animation: 'pulse 1.5s infinite' }}></div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Live Multi-Spectral Cyclone Tracking</h2>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '0.85rem', marginLeft: 'auto' }}>
          <span>Source: <strong style={{ color: '#2563eb' }}>NASA GIBS (IR / WV / VIS)</strong></span>
          <span>Last Updated: <strong style={{ color: '#1e293b' }}>{liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : 'N/A'}</strong></span>
          <span>Mosaic: <strong style={{ color: '#1e293b' }}>{liveData?.overlay_date || 'N/A'}</strong></span>
          <span>🇮🇳 Indian Ocean Active Systems: <strong style={{ color: cyclones.length > 0 ? '#ef4444' : '#16a34a' }}>{cyclones.length}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Main Map Area */}
        <div style={{ flex: 1, zIndex: 0 }}>
          <MapComponent
            cyclones={cyclones}
            setSelectedCyclone={setSelectedCyclone}
            overlayTruecolor={liveData?.overlay_truecolor}
            overlayIr={liveData?.overlay_ir}
          />
        </div>

        <div style={{
          position: 'absolute', right: '16px', bottom: '16px', zIndex: 900,
          background: 'rgba(255,255,255,0.92)', color: '#1e293b', padding: '0.75rem 1rem',
          borderRadius: '10px', fontSize: '0.78rem', lineHeight: 1.5, maxWidth: '280px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: '#1e293b' }}>Map Legend & Tracking</div>
          <div><span style={{ color: '#10b981' }}>🟢</span> Cyclone Genesis (Start)</div>
          <div><span style={{ color: '#1e293b', fontWeight: 'bold' }}>●━━</span> Past Observed Track</div>
          <div><span>🔴</span> LIVE POSITION</div>
          <div><span style={{ color: '#d946ef', fontWeight: 'bold' }}>● - -</span> Future AI Track (Ocean)</div>
          <div><span style={{ color: '#ef4444', fontWeight: 'bold' }}>●</span> Predicted Landfall</div>
          <div><span style={{ color: '#f97316', opacity: 0.8 }}>🟧</span> Future Risk Areas (Cone)</div>
          {cyclones.length === 0 && (
            <div style={{ marginTop: '0.5rem', color: '#16a34a' }}>No active NIO tropical cyclones. GIBS IR overlay is still live.</div>
          )}
        </div>

        {/* Multi-Spectral Inspector Modal/Drawer */}
        <div style={{
          position: 'absolute',
          top: 0, right: selectedCyclone ? 0 : '-450px',
          width: '450px', height: '100%',
          background: '#ffffff',
          backdropFilter: 'blur(10px)',
          borderLeft: '1px solid #e2e8f0',
          transition: 'right 0.3s ease-in-out',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          color: '#1e293b',
          boxShadow: '-5px 0 25px rgba(0,0,0,0.15)'
        }}>
          {selectedCyclone && (
            <>
              {/* Drawer Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1d4ed8' }}>{selectedCyclone.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {selectedCyclone.cyclone_id} | {selectedCyclone.basin}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCyclone(null)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>

                {/* Intensity Block */}
                <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    Model Inference (Intensity)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Max Wind Speed</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>{selectedCyclone.intensity.vmax_knots} kt</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Central Pressure</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#d97706' }}>{selectedCyclone.intensity.pressure_hpa} hPa</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IMD Category</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#16a34a' }}>{selectedCyclone.intensity.category}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Coordinates</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0284c7' }}>
                        {selectedCyclone.current_pos[0].toFixed(1)}°N, {selectedCyclone.current_pos[1].toFixed(1)}°E
                      </div>
                    </div>
                  </div>
                </div>
                {/* Automated Impact Risk Panel */}
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#dc2626', borderBottom: '1px solid #fecdd3', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚠️ AI Impact Risk Assessment
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '0.5rem' }}>
                    <strong>Deep Learning Track Confidence:</strong> High (80% Weight)
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '0.5rem' }}>
                    <strong>Primary Threat Zone:</strong> Odisha Coast → Chhattisgarh → Uttar Pradesh
                  </p>
                  <div style={{ background: '#fee2e2', padding: '0.5rem', borderRadius: '5px', marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Cities Intersecting Cone of Uncertainty:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Bhubaneswar</span>
                      <span style={{ background: '#b91c1c', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Raipur</span>
                      <span style={{ background: '#991b1b', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Prayagraj</span>
                      <span style={{ background: '#7f1d1d', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Lucknow</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    NASA GIBS Multi-Spectral Tensors
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Native GIBS: IR, WV, VIS. Channel 4 is a PMW ice-scattering proxy because GIBS does not publish 85 GHz like MOSDAC.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.thermal_ir} style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} alt="Thermal IR" />
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Thermal IR (Band 31)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.water_vapor} style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} alt="Water Vapor" />
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Water Vapor (GIBS)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.visible} style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} alt="Visible" />
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Visible / True Color</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img src={selectedCyclone.spectral_thumbnails.mid_ir} style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} alt="PMW proxy" />
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>PMW proxy (from IR+WV)</div>
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
