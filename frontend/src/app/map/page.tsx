"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: '0.85rem' }}>Initializing geospatial data...</div>
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
      }
      finally { setLoading(false); }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1422', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '0.85rem', color: error ? '#ef4444' : '#86868b' }}>
          {error || 'Acquiring satellite feed...'}
        </div>
      </div>
    );
  }

  const cyclones = liveData?.cyclones || [];

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Interactive Map</div>
          <h2 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Live Tracking Feed</h2>
        </div>
        <div style={{ display: 'flex', gap: '24px', color: '#a1a1a6', fontSize: '0.75rem' }}>
          <div>Source: <span style={{ color: '#f5f5f7' }}>NASA GIBS</span></div>
          <div>Sync: <span style={{ color: '#f5f5f7' }}>{liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' }) : 'N/A'}</span></div>
          <div>Active Systems: <span style={{ color: '#f5f5f7' }}>{cyclones.length}</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '24px', minHeight: '600px' }}>
        
        {/* MAIN VISUALIZATION AREA */}
        <div style={{ flex: 1, background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          <MapComponent
            cyclones={cyclones}
            setSelectedCyclone={setSelectedCyclone}
            overlayTruecolor={liveData?.overlay_truecolor}
            overlayIr={liveData?.overlay_ir}
          />

          <div style={{
            position: 'absolute', bottom: '16px', left: '16px', zIndex: 900,
            background: 'rgba(7, 17, 31, 0.8)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px',
            fontSize: '0.7rem', color: '#a1a1a6'
          }}>
            <div style={{ color: '#f5f5f7', marginBottom: '8px', fontWeight: 500 }}>LEGEND</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><div style={{width:'8px',height:'8px',border:'1px solid #a1a1a6',borderRadius:'50%'}}></div> Genesis</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><div style={{width:'8px',height:'2px',background:'#a1a1a6'}}></div> Observed</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><div style={{width:'8px',height:'8px',background:'#f5f5f7',borderRadius:'50%'}}></div> Active</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'8px',height:'1px',background:'#3b82f6',borderStyle:'dashed'}}></div> Forecast</div>
          </div>
        </div>

        {/* SIDE INSPECTOR PANEL */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedCyclone ? (
            <>
              <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Selected System</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#f5f5f7', marginBottom: '4px' }}>{selectedCyclone.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#a1a1a6' }}>ID: {selectedCyclone.cyclone_id} · {selectedCyclone.basin}</div>
              </div>

              <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Telemetry</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#86868b' }}>Velocity</div>
                    <div style={{ fontSize: '1rem', color: '#f5f5f7' }}>{selectedCyclone.intensity.vmax_knots} kt</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#86868b' }}>Pressure</div>
                    <div style={{ fontSize: '1rem', color: '#f5f5f7' }}>{selectedCyclone.intensity.pressure_hpa} hPa</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#86868b' }}>Category</div>
                    <div style={{ fontSize: '0.9rem', color: '#f5f5f7' }}>{selectedCyclone.intensity.category}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#86868b' }}>Location</div>
                    <div style={{ fontSize: '0.9rem', color: '#f5f5f7' }}>{selectedCyclone.current_pos[0].toFixed(1)}°, {selectedCyclone.current_pos[1].toFixed(1)}°</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Multispectral Views</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <img src={selectedCyclone.spectral_thumbnails.thermal_ir} style={{ width: '100%', borderRadius: '4px', filter: 'grayscale(100%)' }} alt="IR" title="Thermal IR" />
                  <img src={selectedCyclone.spectral_thumbnails.water_vapor} style={{ width: '100%', borderRadius: '4px', filter: 'grayscale(100%)' }} alt="WV" title="Water Vapor" />
                  <img src={selectedCyclone.spectral_thumbnails.visible} style={{ width: '100%', borderRadius: '4px', filter: 'grayscale(100%)' }} alt="VIS" title="Visible" />
                  <img src={selectedCyclone.spectral_thumbnails.mid_ir} style={{ width: '100%', borderRadius: '4px', filter: 'grayscale(100%)' }} alt="PMW" title="Microwave Proxy" />
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, background: '#0A1422', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#86868b' }}>Select an active system on the map to inspect details.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
