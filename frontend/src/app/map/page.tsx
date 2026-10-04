"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '13px' }}>Loading geospatial grid...</div>
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
        setError("Connection timeout. Upstream systems unreachable.");
      }
      finally { setLoading(false); }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const DataRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 500 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)' }}>
      
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>INTERACTIVE MAP</div>
          <h2 style={{ color: '#111827', margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em' }}>Live Satellite Telemetry</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '24px', color: '#6b7280', fontSize: '13px', alignItems: 'flex-end' }}>
          <div>Source: <span style={{ color: '#111827', fontWeight: 500 }}>NASA GIBS</span></div>
          <div>Sync: <span style={{ color: '#111827', fontWeight: 500 }}>{liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' }) : '--:--'}</span></div>
          <div>Tracked Targets: <span style={{ color: '#2563eb', fontWeight: 600 }}>{liveData?.cyclones?.length || 0}</span></div>
        </div>
      </div>

      {loading || error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', background: '#ffffff', borderRadius: '4px' }}>
          <div style={{ fontSize: '13px', color: error ? '#dc2626' : '#6b7280' }}>
            {error || 'Acquiring satellite feed...'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, gap: '24px', minHeight: 0 }}>
          
          {/* MAIN VISUALIZATION AREA */}
          <div style={{ flex: 1, background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <MapComponent
              cyclones={liveData?.cyclones || []}
              setSelectedCyclone={setSelectedCyclone}
              overlayTruecolor={liveData?.overlay_truecolor}
              overlayIr={liveData?.overlay_ir}
            />

            <div style={{
              position: 'absolute', bottom: '16px', left: '16px', zIndex: 900,
              background: '#ffffff', border: '1px solid #e5e7eb', padding: '12px 16px', borderRadius: '4px',
              fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ marginBottom: '8px', color: '#111827', fontWeight: 600 }}>Legend</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{width:'8px',height:'8px',border:'1px solid #6b7280',borderRadius:'50%'}}></div> Genesis Node</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{width:'8px',height:'2px',background:'#6b7280'}}></div> Observed Path</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{width:'8px',height:'8px',background:'#2563eb',borderRadius:'50%'}}></div> Active Position</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'8px',height:'1px',background:'#2563eb',borderStyle:'dashed'}}></div> Forecast Vector</div>
            </div>
          </div>

          {/* RIGHT PANEL - INSPECTOR */}
          <div style={{ width: '340px', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '24px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '20px', fontWeight: 600 }}>Target Inspector</div>
            
            {selectedCyclone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '18px', color: '#111827', fontWeight: 600 }}>{selectedCyclone.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {selectedCyclone.cyclone_id} | Basin: {selectedCyclone.basin}</div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>Telemetry</div>
                  <DataRow label="Wind Velocity" value={`${selectedCyclone.intensity.vmax_knots} kt`} />
                  <DataRow label="Central Pressure" value={`${selectedCyclone.intensity.pressure_hpa} hPa`} />
                  <DataRow label="IMD Designation" value={selectedCyclone.intensity.category} />
                  <DataRow label="Coordinates" value={`${selectedCyclone.current_pos[0].toFixed(2)}N, ${selectedCyclone.current_pos[1].toFixed(2)}E`} />
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>Multispectral Channels</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.thermal_ir} style={{ width: '100%', border: '1px solid #e5e7eb', background: '#f3f4f6' }} alt="IR" />
                      <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>IR (Ch 31)</div>
                    </div>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.water_vapor} style={{ width: '100%', border: '1px solid #e5e7eb', background: '#f3f4f6' }} alt="WV" />
                      <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>Water Vapor</div>
                    </div>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.visible} style={{ width: '100%', border: '1px solid #e5e7eb', background: '#f3f4f6' }} alt="VIS" />
                      <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>Visible</div>
                    </div>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.mid_ir} style={{ width: '100%', border: '1px solid #e5e7eb', background: '#f3f4f6' }} alt="PMW" />
                      <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>Microwave</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Select a target on the map grid to inspect numerical outputs and raw channels.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
