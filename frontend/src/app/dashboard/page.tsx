"use client";
import React, { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Input states
  const [inputType, setInputType] = useState<"dataset" | "upload">("dataset");
  const [sampleIdx, setSampleIdx] = useState(0);
  const [maxIdx, setMaxIdx] = useState(10000);
  const [file, setFile] = useState<File | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedHour, setSelectedHour] = useState(24);
  const [mapHtml, setMapHtml] = useState("");

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
      setActiveTab("overview");
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

  const downloadPdf = async () => {
    const res = await fetch(`${API}/api/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MoES_Cyclone_Advisory.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedPt = data?.traj_points?.find((p: any) => p.hour === selectedHour) || data?.traj_points?.[0];

  const tabStyle = (tab: string) => ({
    padding: '12px 24px',
    cursor: 'pointer',
    fontWeight: 600,
    borderBottom: activeTab === tab ? '3px solid #0091ea' : '3px solid transparent',
    color: activeTab === tab ? '#093370' : '#64748b',
    transition: 'all 0.2s',
    background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '1rem'
  });

  return (
    <main style={{ padding: '2rem 5%', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ===== CONTROL PANEL ===== */}
      <div style={{ background: 'white', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#093370', margin: 0, fontSize: '1.5rem' }}>Multi-Stage AI Cyclone Pipeline</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>MoES Multi-Spectral Prediction & Trajectory System</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', background: '#f1f5f9', padding: '0.5rem', borderRadius: '12px' }}>

          <select value={inputType} onChange={e => setInputType(e.target.value as any)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}>
            <option value="dataset">Dataset Index</option>
            <option value="upload">Upload .npy Array</option>
          </select>

          {inputType === "dataset" ? (
            <input type="number" min={0} max={maxIdx} value={sampleIdx} onChange={e => setSampleIdx(Number(e.target.value))}
              style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          ) : (
            <input type="file" accept=".npy" onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ padding: '8px', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }} />
          )}

          <button onClick={runAnalysis} disabled={loading}
            style={{ padding: '10px 24px', background: loading ? '#94a3b8' : '#0091ea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {loading ? '⏳ Running...' : '🚀 Run Analysis'}
          </button>
        </div>
      </div>

      {/* ===== EMPTY STATE ===== */}
      {!data && !loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', padding: '4rem', maxWidth: '600px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛰️</div>
            <h2 style={{ color: '#093370', marginBottom: '1rem' }}>Ready for Inference</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>
              Select a sample from the historical TCIR dataset or upload real-world satellite multi-spectral `.npy` tensor arrays.
              The pipeline will run through Identification, Intensity Estimation, and Trajectory Forecasting.
            </p>
          </div>
        </div>
      )}

      {/* ===== RESULTS SECTION ===== */}
      {data && data.success && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* TABS NAVIGATION */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview & Inference</button>
            <button style={tabStyle('map')} onClick={() => setActiveTab('map')}>Forecast Map</button>
            <button style={tabStyle('trajectory')} onClick={() => setActiveTab('trajectory')}>Trajectory Data</button>
            <button style={tabStyle('alerts')} onClick={() => setActiveTab('alerts')}>Threat Alerts</button>
            <button style={tabStyle('tensors')} onClick={() => setActiveTab('tensors')}>Input Tensors</button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ color: '#333', fontSize: '1.15rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Stage 1: Identification Confidence</h3>

                  {/* Pie Chart for Confidence */}
                  <div style={{
                    position: 'relative', width: '120px', height: '120px', borderRadius: '50%',
                    background: `conic-gradient(${data.active ? '#22c55e' : '#ef4444'} ${(data.s1_prob * 100)}%, #e2e8f0 0)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                  }}>
                    <div style={{ width: '90px', height: '90px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#093370' }}>{(data.s1_prob * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div style={{ background: data.active ? '#dcfce7' : '#fee2e2', color: data.active ? '#166534' : '#991b1b', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', width: '100%' }}>
                    {data.active ? '✅ ACTIVE CYCLONE DETECTED' : '❌ NO CYCLONE DETECTED'}
                  </div>
                </div>

                {data.active && (
                  <>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #ef4444' }}>
                      <h3 style={{ color: '#333', fontSize: '1.15rem', marginBottom: '1.5rem' }}>Stage 2: Wind Speed & Movement</h3>

                      {/* Wind Speed Visualization */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Predicted Vmax</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{data.pred_vmax?.toFixed(1)} kts</span>
                        </div>
                        <div style={{ position: 'relative', height: '24px', background: 'linear-gradient(to right, #4ade80, #facc15, #fb923c, #ef4444, #991b1b)', borderRadius: '12px', overflow: 'hidden' }}>
                          {/* Marker for current speed (max scale ~150 kts) */}
                          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${Math.min((data.pred_vmax || 0) / 150 * 100, 100)}%`, width: '4px', background: 'black', transform: 'translateX(-50%)' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          <span>0</span>
                          <span>50</span>
                          <span>100</span>
                          <span>150+ kts</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <div><p style={{ fontSize: '0.8rem', color: '#64748b' }}>Heading</p><p style={{ fontWeight: 600 }}>{data.heading?.toFixed(1)}°</p></div>
                        <div><p style={{ fontSize: '0.8rem', color: '#64748b' }}>Speed</p><p style={{ fontWeight: 600 }}>{data.speed?.toFixed(1)} kts</p></div>
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #f59e0b', gridColumn: '1 / -1' }}>
                      <h3 style={{ color: '#333', fontSize: '1.15rem', marginBottom: '1rem' }}>Stage 3: IMD Classification (7 Tiers)</h3>
                      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        {[
                          { name: 'LPA', cat: 'LPA' },
                          { name: 'D', cat: 'D' },
                          { name: 'DD', cat: 'DD' },
                          { name: 'CS', cat: 'CS' },
                          { name: 'SCS', cat: 'SCS' },
                          { name: 'VSCS', cat: 'VSCS' },
                          { name: 'ESCS/SuCS', cat: 'ESCS' }
                        ].map((tier, index) => {
                          const isActive = (data.imd_cat || '').includes(`(${tier.cat})`) || (tier.cat === 'ESCS' && (data.imd_cat || '').includes('(SuCS)'));
                          return (
                            <div key={tier.cat} style={{
                              flex: 1,
                              padding: '0.75rem 0.25rem',
                              borderRight: index < 6 ? '1px solid #e2e8f0' : 'none',
                              background: isActive ? '#f59e0b' : 'transparent',
                              color: isActive ? 'white' : '#64748b',
                              fontWeight: isActive ? 'bold' : 500,
                              fontSize: '0.85rem',
                              textAlign: 'center',
                              transition: 'all 0.2s ease-in-out'
                            }}>
                              {tier.name}
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
                        Current IMD Scale: <strong style={{ color: '#b45309' }}>{data.imd_cat}</strong> (3-Class Tier: {data.tier_3class})
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: MAP */}
            {activeTab === 'map' && data.active && (
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, color: '#333', whiteSpace: 'nowrap' }}>⏱️ Scrub Horizon:</div>
                  <input type="range" min={6} max={72} step={6} value={selectedHour} onChange={e => onSliderChange(Number(e.target.value))} style={{ flex: 1, accentColor: '#0091ea' }} />
                  <div style={{ background: '#093370', color: 'white', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>+{selectedHour}h</div>
                </div>
                <iframe srcDoc={mapHtml} style={{ width: '100%', flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px' }} title="Map" />
              </div>
            )}

            {/* TAB 3: TRAJECTORY */}
            {activeTab === 'trajectory' && data.active && (
              <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#093370', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Hour</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Time (UTC)</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Lat</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Lon</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.traj_points?.map((pt: any, i: number) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>+{pt.hour}h</td>
                        <td style={{ padding: '10px 12px' }}>{pt.time}</td>
                        <td style={{ padding: '10px 12px' }}>{pt.lat?.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px' }}>{pt.lon?.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', color: pt.status.includes('LAND') ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{pt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: ALERTS */}
            {activeTab === 'alerts' && data.active && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '2rem', borderRadius: '16px', background: data.alert_info?.level === 'RED ALERT' ? '#fee2e2' : '#fff7ed', borderLeft: `6px solid ${data.alert_info?.level === 'RED ALERT' ? '#dc2626' : '#ea580c'}` }}>
                  <h3 style={{ color: data.alert_info?.level === 'RED ALERT' ? '#991b1b' : '#9a3412', marginBottom: '0.5rem', fontSize: '1.4rem' }}>{data.alert_info?.badge}</h3>
                  <p style={{ color: '#333' }}><strong>Mandated SOP:</strong> {data.alert_info?.action}</p>
                </div>

                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#093370', margin: 0 }}>Coastal Threat Matrix</h3>
                    <button onClick={downloadPdf} style={{ padding: '8px 16px', background: '#093370', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Download PDF</button>
                  </div>

                  {data.alert_info?.impacts?.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: '#1565c0', color: 'white' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>City</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>State/Country</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Distance</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>ETA</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Alert</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.alert_info.impacts.map((imp: any, i: number) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{imp.city}</td>
                              <td style={{ padding: '10px' }}>{imp.state}, {imp.country}</td>
                              <td style={{ padding: '10px' }}>{imp.dist_km} km</td>
                              <td style={{ padding: '10px' }}>{imp.eta_hour}</td>
                              <td style={{ padding: '10px', fontWeight: 'bold', color: imp.alert.includes('RED') ? '#dc2626' : imp.alert.includes('ORANGE') ? '#ea580c' : '#ca8a04' }}>{imp.alert}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b' }}>No immediate coastal threats. System is over deep oceanic waters.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: TENSORS */}
            {activeTab === 'tensors' && (
              <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {data.images?.map((img: string, idx: number) => (
                    <div key={idx} style={{ background: '#0f172a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
                      <img src={img} alt={`Channel ${idx}`} style={{ width: '100%', display: 'block' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Warning for inactive */}
      {data && !data.active && activeTab !== 'tensors' && activeTab !== 'overview' && (
        <div style={{ background: '#fff7ed', padding: '2rem', borderRadius: '16px', borderLeft: '6px solid #f59e0b', color: '#92400e' }}>
          ⚠️ Stage 2 and Trajectory Forecasting are disabled because Stage 1 classified this input as Non-Cyclonic Noise.
        </div>
      )}
    </main>
  );
}
