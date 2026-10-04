"use client";
import React, { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<"dataset" | "upload">("dataset");
  const [sampleIdx, setSampleIdx] = useState(0);
  const [maxIdx, setMaxIdx] = useState(10000);
  const [file, setFile] = useState<File | null>(null);
  const [mapHtml, setMapHtml] = useState("");
  const [selectedHour, setSelectedHour] = useState(24);
  const [activeView, setActiveView] = useState<"tensors" | "map" | "log" | "impact">("tensors");

  useEffect(() => {
    fetch(`${API}/api/dataset-info`).then(r => r.json()).then(d => {
      if (d.max_idx) setMaxIdx(d.max_idx);
    }).catch(() => { });
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("lat", "15.50");
      fd.append("lon", "88.20");

      if (inputType === "dataset") {
        fd.append("sample_idx", String(sampleIdx));
      } else if (inputType === "upload" && file) {
        fd.append("file", file);
      } else {
        alert("Please select a file to upload.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/api/predict`, { method: "POST", body: fd });
      const result = await res.json();
      if (result.error) {
        alert("Error: " + result.error);
        setLoading(false);
        return;
      }
      setData(result);
      if (result.map_html) setMapHtml(result.map_html);
      setSelectedHour(24);
      setActiveView("tensors");
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const onSliderChange = async (hour: number) => {
    setSelectedHour(hour);
    try {
      const res = await fetch(`${API}/api/map?selected_hour=${hour}`);
      const result = await res.json();
      if (result.map_html) setMapHtml(result.map_html);
    } catch (err) { console.error(err); }
  };

  const DataRow = ({ label, value, highlight = false, color }: { label: string, value: React.ReactNode, highlight?: boolean, color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb', fontSize: '13px' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: color || (highlight ? '#2563eb' : '#1f2937'), fontWeight: highlight ? 600 : 500 }}>{value}</span>
    </div>
  );

  return (
    <>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>PREDICTION MODEL</div>
          <h2 style={{ color: '#111827', margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em' }}>Multispectral Inference System</h2>
          <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '13px' }}>MoES Multi-Spectral Prediction & Trajectory System utilizing TCIR datasets.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select value={inputType} onChange={e => setInputType(e.target.value as any)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', background: '#ffffff', color: '#111827', outline: 'none', fontSize: '13px', borderRadius: '4px' }}>
            <option value="dataset">Dataset Index</option>
            <option value="upload">Upload Array</option>
          </select>

          {inputType === "dataset" ? (
            <input type="number" min={0} max={maxIdx} value={sampleIdx} onChange={e => setSampleIdx(Number(e.target.value))}
              style={{ width: '80px', padding: '6px 12px', border: '1px solid #d1d5db', background: '#ffffff', color: '#111827', outline: 'none', fontSize: '13px', borderRadius: '4px' }} />
          ) : (
            <input type="file" accept=".npy" onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ width: '180px', fontSize: '13px', color: '#111827' }} />
          )}

          <button onClick={runAnalysis} disabled={loading}
            style={{ padding: '6px 20px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '360px', border: '1px solid #e5e7eb', background: '#ffffff', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>SYSTEM READY</div>
              <div style={{ color: '#4b5563', fontSize: '13px', maxWidth: '350px', lineHeight: 1.5 }}>Multispectral inference pipeline initialized.<br/>Select a dataset index to begin analysis.</div>
            </div>
            
            <div style={{ display: 'flex', gap: '48px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', fontWeight: 600 }}>DATASET</div>
                <div style={{ fontSize: '16px', color: '#111827', fontFamily: 'monospace' }}>INDEX {sampleIdx.toString().padStart(2, '0')}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', fontWeight: 600 }}>STATUS</div>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#2563eb', borderRadius: '50%' }}></div>
                  AWAITING INPUT
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPEN WORKSPACE LAYOUT */}
      {data && data.success && (
        <div style={{ display: 'flex', gap: '32px' }}>
          
          {/* MAIN VISUALIZATION WORKSPACE */}
          <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* IN-PAGE TABS */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <button onClick={() => setActiveView("tensors")} style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeView === 'tensors' ? '#2563eb' : 'transparent'}`, color: activeView === 'tensors' ? '#111827' : '#6b7280', fontSize: '13px', fontWeight: activeView === 'tensors' ? 600 : 500, cursor: 'pointer' }}>Multispectral Input</button>
              {data.active && mapHtml && (
                <button onClick={() => setActiveView("map")} style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeView === 'map' ? '#2563eb' : 'transparent'}`, color: activeView === 'map' ? '#111827' : '#6b7280', fontSize: '13px', fontWeight: activeView === 'map' ? 600 : 500, cursor: 'pointer' }}>Forecast Map</button>
              )}
              {data.active && (
                <button onClick={() => setActiveView("log")} style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeView === 'log' ? '#2563eb' : 'transparent'}`, color: activeView === 'log' ? '#111827' : '#6b7280', fontSize: '13px', fontWeight: activeView === 'log' ? 600 : 500, cursor: 'pointer' }}>Trajectory Log</button>
              )}
              {data.active && data.alert_info && (
                <button onClick={() => setActiveView("impact")} style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeView === 'impact' ? '#2563eb' : 'transparent'}`, color: activeView === 'impact' ? '#111827' : '#6b7280', fontSize: '13px', fontWeight: activeView === 'impact' ? 600 : 500, cursor: 'pointer' }}>Impact Matrix</button>
              )}
            </div>

            {/* Tensors */}
            {activeView === 'tensors' && (
              <section style={{ background: '#ffffff', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', fontWeight: 600 }}>Input Multispectral Signatures</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {data.images?.map((img: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <img src={img} alt={`CH-${idx}`} style={{ width: '100%', border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
                      <div style={{ fontSize: '11px', color: '#4b5563', textAlign: 'center', fontWeight: 500 }}>CH-{idx}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Forecast Map */}
            {activeView === 'map' && data.active && mapHtml && (
              <section style={{ background: '#ffffff', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '4px', display: 'flex', flexDirection: 'column', minHeight: '650px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Geospatial Forecast Plot</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Forecast Horizon</div>
                    <input type="range" min={6} max={72} step={6} value={selectedHour} onChange={e => onSliderChange(Number(e.target.value))} style={{ width: '120px', accentColor: '#2563eb' }} />
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', minWidth: '40px', textAlign: 'right' }}>+{selectedHour}h</div>
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <iframe srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }} title="Forecast" />
                </div>
              </section>
            )}

            {/* Trajectory */}
            {activeView === 'log' && data.active && (
              <section style={{ background: '#ffffff', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', fontWeight: 600 }}>Forecast Trajectory Log</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Hour</th>
                      <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Time (UTC)</th>
                      <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Latitude</th>
                      <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Longitude</th>
                      <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.traj_points?.map((pt: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 0', color: '#111827', fontWeight: 500 }}>+{pt.hour}h</td>
                        <td style={{ padding: '10px 0', color: '#6b7280' }}>{pt.time}</td>
                        <td style={{ padding: '10px 0', color: '#111827', fontFamily: 'monospace' }}>{pt.lat?.toFixed(2)}°</td>
                        <td style={{ padding: '10px 0', color: '#111827', fontFamily: 'monospace' }}>{pt.lon?.toFixed(2)}°</td>
                        <td style={{ padding: '10px 0', color: pt.status.includes('LAND') ? '#d97706' : '#6b7280', fontWeight: 500 }}>{pt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Alert / Impact */}
            {activeView === 'impact' && data.active && data.alert_info && (
              <section style={{ background: '#ffffff', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', fontWeight: 600 }}>Impact Assessment Matrix</div>
                {data.alert_info.impacts?.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Sector/City</th>
                        <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Distance</th>
                        <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>ETA</th>
                        <th style={{ padding: '10px 0', textAlign: 'left', color: '#4b5563', fontWeight: 600 }}>Directive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.alert_info.impacts.map((imp: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 0', color: '#111827', fontWeight: 500 }}>{imp.city}, {imp.state}</td>
                          <td style={{ padding: '10px 0', color: '#6b7280' }}>{imp.dist_km} km</td>
                          <td style={{ padding: '10px 0', color: '#6b7280' }}>{imp.eta_hour}</td>
                          <td style={{ padding: '10px 0', color: imp.alert.includes('RED') ? '#dc2626' : imp.alert.includes('ORANGE') ? '#ea580c' : '#16a34a', fontWeight: 600 }}>{imp.alert}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>No immediate regional impact vectors detected.</div>
                )}
              </section>
            )}

          </div>

          {/* RIGHT SIDEBAR: INFERENCE SUMMARY */}
          <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <section style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 600 }}>Inference Summary</div>
              
              <DataRow label="Detection Status" value={data.active ? 'ACTIVE ANOMALY' : 'NO ANOMALY'} highlight={data.active} color={data.active ? '#16a34a' : undefined} />
              <DataRow label="Model Confidence" value={`${(data.s1_prob * 100).toFixed(1)}%`} />
              
              {data.active && (
                <>
                  <DataRow label="Max Wind Velocity" value={`${data.pred_vmax?.toFixed(1)} kt`} />
                  <DataRow label="Translational Speed" value={`${data.speed?.toFixed(1)} kt`} />
                  <DataRow label="Heading Vector" value={`${data.heading?.toFixed(1)}°`} />
                  <DataRow label="IMD Designation" value={data.imd_cat} highlight />
                </>
              )}
            </section>

            {data.active && data.alert_info && (
              <section style={{ border: '1px solid #e5e7eb', padding: '24px', borderRadius: '4px', borderLeft: `3px solid ${data.alert_info.level === 'RED ALERT' ? '#dc2626' : '#ea580c'}`, background: '#ffffff' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>Action Protocol</div>
                <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginBottom: '6px' }}>{data.alert_info.badge}</div>
                <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>{data.alert_info.action}</div>
              </section>
            )}
            
            {!data.active && (
              <div style={{ fontSize: '13px', color: '#6b7280', border: '1px dashed #d1d5db', padding: '16px', borderRadius: '4px' }}>
                Stage 2 and Trajectory subsystems are dormant because the primary model classified input as non-cyclonic background noise.
              </div>
            )}

          </div>

        </div>
      )}
    </>
  );
}
