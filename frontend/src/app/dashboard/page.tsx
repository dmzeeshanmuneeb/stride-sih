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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const DataRow = ({ label, value, highlight = false }: { label: string, value: React.ReactNode, highlight?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f2530', fontSize: '13px' }}>
      <span style={{ color: '#8a94a6' }}>{label}</span>
      <span style={{ color: highlight ? '#3b82f6' : '#e2e4e9', fontWeight: highlight ? 500 : 400 }}>{value}</span>
    </div>
  );

  return (
    <>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>PREDICTION MODEL</div>
          <h2 style={{ color: '#ffffff', margin: 0, fontSize: '26px', fontWeight: 500, letterSpacing: '-0.01em' }}>Multispectral Inference System</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8a94a6', fontSize: '13px' }}>MoES Multi-Spectral Prediction & Trajectory System utilizing TCIR datasets.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select value={inputType} onChange={e => setInputType(e.target.value as any)} style={{ padding: '6px 12px', border: '1px solid #1f2530', background: '#0a1018', color: '#e2e4e9', outline: 'none', fontSize: '13px', borderRadius: '4px' }}>
            <option value="dataset">Dataset Index</option>
            <option value="upload">Upload Array</option>
          </select>

          {inputType === "dataset" ? (
            <input type="number" min={0} max={maxIdx} value={sampleIdx} onChange={e => setSampleIdx(Number(e.target.value))}
              style={{ width: '80px', padding: '6px 12px', border: '1px solid #1f2530', background: '#0a1018', color: '#e2e4e9', outline: 'none', fontSize: '13px', borderRadius: '4px' }} />
          ) : (
            <input type="file" accept=".npy" onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ width: '180px', fontSize: '13px', color: '#e2e4e9' }} />
          )}

          <button onClick={runAnalysis} disabled={loading}
            style={{ padding: '6px 16px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #1f2530', background: '#080d14', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle contour visualization */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)' }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 200 Q 200 150 400 200 T 800 200 T 1200 200" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.5"/>
              <path d="M 0 220 Q 200 170 400 220 T 800 220 T 1200 220" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3"/>
              <path d="M 0 240 Q 200 190 400 240 T 800 240 T 1200 240" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.1"/>
            </svg>
          </div>
          
          <div style={{ position: 'relative', zIndex: 10, padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 500, letterSpacing: '0.05em', marginBottom: '8px' }}>SYSTEM READY</div>
              <div style={{ color: '#8a94a6', fontSize: '13px', maxWidth: '300px', lineHeight: 1.5 }}>Multispectral inference pipeline initialized. Select a dataset index to begin analysis.</div>
            </div>
            
            <div style={{ display: 'flex', gap: '48px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>DATASET</div>
                <div style={{ fontSize: '16px', color: '#e2e4e9', fontFamily: 'monospace' }}>INDEX {sampleIdx.toString().padStart(2, '0')}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>STATUS</div>
                <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="pulsing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>
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
            
            {/* Tensors */}
            <section>
              <div style={{ fontSize: '12px', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1f2530', paddingBottom: '8px', marginBottom: '16px' }}>Input Multispectral Signatures</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {data.images?.map((img: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <img src={img} alt={`CH-${idx}`} style={{ width: '100%', border: '1px solid #1f2530', filter: 'grayscale(100%)' }} />
                    <div style={{ fontSize: '11px', color: '#5f697a', textAlign: 'center' }}>CH-{idx}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Trajectory */}
            {data.active && (
              <section>
                <div style={{ fontSize: '12px', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1f2530', paddingBottom: '8px', marginBottom: '16px' }}>Forecast Trajectory Log</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1f2530' }}>
                      <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Hour</th>
                      <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Time (UTC)</th>
                      <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Latitude</th>
                      <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Longitude</th>
                      <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.traj_points?.map((pt: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1a1e27' }}>
                        <td style={{ padding: '8px 0', color: '#e2e4e9' }}>+{pt.hour}h</td>
                        <td style={{ padding: '8px 0', color: '#8a94a6' }}>{pt.time}</td>
                        <td style={{ padding: '8px 0', color: '#e2e4e9' }}>{pt.lat?.toFixed(2)}°</td>
                        <td style={{ padding: '8px 0', color: '#e2e4e9' }}>{pt.lon?.toFixed(2)}°</td>
                        <td style={{ padding: '8px 0', color: pt.status.includes('LAND') ? '#eab308' : '#8a94a6' }}>{pt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Alert / Impact */}
            {data.active && data.alert_info && (
              <section>
                <div style={{ fontSize: '12px', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1f2530', paddingBottom: '8px', marginBottom: '16px' }}>Impact Assessment Matrix</div>
                {data.alert_info.impacts?.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1f2530' }}>
                        <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Sector/City</th>
                        <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Distance</th>
                        <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>ETA</th>
                        <th style={{ padding: '8px 0', textAlign: 'left', color: '#5f697a', fontWeight: 400 }}>Directive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.alert_info.impacts.map((imp: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1a1e27' }}>
                          <td style={{ padding: '8px 0', color: '#e2e4e9' }}>{imp.city}, {imp.state}</td>
                          <td style={{ padding: '8px 0', color: '#8a94a6' }}>{imp.dist_km} km</td>
                          <td style={{ padding: '8px 0', color: '#8a94a6' }}>{imp.eta_hour}</td>
                          <td style={{ padding: '8px 0', color: imp.alert.includes('RED') ? '#ef4444' : imp.alert.includes('ORANGE') ? '#f97316' : '#10b981' }}>{imp.alert}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: '13px', color: '#8a94a6' }}>No immediate regional impact vectors detected.</div>
                )}
              </section>
            )}

          </div>

          {/* RIGHT SIDEBAR: INFERENCE SUMMARY */}
          <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <section style={{ background: '#080d14', border: '1px solid #1f2530', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Inference Summary</div>
              
              <DataRow label="Detection Status" value={data.active ? 'ACTIVE ANOMALY' : 'NO ANOMALY'} highlight={data.active} />
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
              <section style={{ border: '1px solid #1f2530', padding: '20px', borderLeft: `2px solid ${data.alert_info.level === 'RED ALERT' ? '#ef4444' : '#f97316'}`, background: '#080d14' }}>
                <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Action Protocol</div>
                <div style={{ fontSize: '14px', color: '#e2e4e9', fontWeight: 500, marginBottom: '6px' }}>{data.alert_info.badge}</div>
                <div style={{ fontSize: '13px', color: '#8a94a6', lineHeight: 1.5 }}>{data.alert_info.action}</div>
              </section>
            )}
            
            {!data.active && (
              <div style={{ fontSize: '13px', color: '#5f697a', border: '1px dashed #1f2530', padding: '16px' }}>
                Stage 2 and Trajectory subsystems are dormant because the primary model classified input as non-cyclonic background noise.
              </div>
            )}

          </div>

        </div>
      )}
    </>
  );
}
