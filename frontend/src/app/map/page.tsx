"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f697a', fontSize: '13px' }}>Loading geospatial grid...</div>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
      <span style={{ color: '#8a94a6' }}>{label}</span>
      <span style={{ color: '#e2e4e9', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #2d323b', paddingBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>INTERACTIVE MAP</div>
          <h2 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 400, letterSpacing: '-0.01em' }}>Live Satellite Telemetry</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '24px', color: '#8a94a6', fontSize: '13px', alignItems: 'flex-end' }}>
          <div>Source: <span style={{ color: '#e2e4e9' }}>NASA GIBS</span></div>
          <div>Sync: <span style={{ color: '#e2e4e9' }}>{liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' }) : '--:--'}</span></div>
          <div>Tracked Targets: <span style={{ color: '#3b82f6', fontWeight: 500 }}>{liveData?.cyclones?.length || 0}</span></div>
        </div>
      </div>

      {loading || error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2d323b', background: '#171a21' }}>
          <div style={{ fontSize: '13px', color: error ? '#ef4444' : '#8a94a6' }}>
            {error || 'Acquiring satellite feed...'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, gap: '24px', minHeight: 0 }}>
          
          {/* MAIN VISUALIZATION AREA */}
          <div style={{ flex: 1, background: '#171a21', border: '1px solid #2d323b', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <MapComponent
              cyclones={liveData?.cyclones || []}
              setSelectedCyclone={setSelectedCyclone}
              overlayTruecolor={liveData?.overlay_truecolor}
              overlayIr={liveData?.overlay_ir}
            />

            <div style={{
              position: 'absolute', bottom: '16px', left: '16px', zIndex: 900,
              background: '#171a21', border: '1px solid #2d323b', padding: '12px 16px',
              fontSize: '11px', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <div style={{ marginBottom: '8px', color: '#5f697a' }}>Legend</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{width:'8px',height:'8px',border:'1px solid #8a94a6',borderRadius:'50%'}}></div> Genesis Node</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{width:'8px',height:'2px',background:'#8a94a6'}}></div> Observed Path</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{width:'8px',height:'8px',background:'#3b82f6',borderRadius:'50%'}}></div> Active Position</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'8px',height:'1px',background:'#3b82f6',borderStyle:'dashed'}}></div> Forecast Vector</div>
            </div>
          </div>

          {/* RIGHT PANEL - INSPECTOR */}
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2d323b', paddingBottom: '8px', marginBottom: '16px' }}>Target Inspector</div>
            
            {selectedCyclone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '16px', color: '#e2e4e9', fontWeight: 500 }}>{selectedCyclone.name}</div>
                  <div style={{ fontSize: '12px', color: '#5f697a' }}>ID: {selectedCyclone.cyclone_id} | Basin: {selectedCyclone.basin}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Telemetry</div>
                  <DataRow label="Wind Velocity" value={`${selectedCyclone.intensity.vmax_knots} kt`} />
                  <DataRow label="Central Pressure" value={`${selectedCyclone.intensity.pressure_hpa} hPa`} />
                  <DataRow label="IMD Designation" value={selectedCyclone.intensity.category} />
                  <DataRow label="Coordinates" value={`${selectedCyclone.current_pos[0].toFixed(2)}N, ${selectedCyclone.current_pos[1].toFixed(2)}E`} />
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Multispectral Channels</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.thermal_ir} style={{ width: '100%', border: '1px solid #2d323b', filter: 'grayscale(100%)' }} alt="IR" />
                      <div style={{ fontSize: '10px', color: '#5f697a', marginTop: '4px', textAlign: 'center' }}>IR (Ch 31)</div>
                    </div>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.water_vapor} style={{ width: '100%', border: '1px solid #2d323b', filter: 'grayscale(100%)' }} alt="WV" />
                      <div style={{ fontSize: '10px', color: '#5f697a', marginTop: '4px', textAlign: 'center' }}>Water Vapor</div>
                    </div>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.visible} style={{ width: '100%', border: '1px solid #2d323b', filter: 'grayscale(100%)' }} alt="VIS" />
                      <div style={{ fontSize: '10px', color: '#5f697a', marginTop: '4px', textAlign: 'center' }}>Visible</div>
                    </div>
                    <div>
                      <img src={selectedCyclone.spectral_thumbnails.mid_ir} style={{ width: '100%', border: '1px solid #2d323b', filter: 'grayscale(100%)' }} alt="PMW" />
                      <div style={{ fontSize: '10px', color: '#5f697a', marginTop: '4px', textAlign: 'center' }}>Microwave</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#5f697a' }}>Select a target on the map grid to inspect numerical outputs and raw channels.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
