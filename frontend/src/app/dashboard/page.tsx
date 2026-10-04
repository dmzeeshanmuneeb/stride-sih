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
    fontWeight: 500,
    borderBottom: activeTab === tab ? '1px solid #f5f5f7' : '1px solid transparent',
    color: activeTab === tab ? '#f5f5f7' : '#86868b',
    transition: 'all 0.3s ease',
    background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '0.95rem'
  });

  return (
    <main style={{ padding: '3rem 5%', background: '#000000', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

      {/* ===== CONTROL PANEL ===== */}
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem 2.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Intelligence Dashboard</h2>
          <p style={{ color: '#86868b', margin: '4px 0 0', fontSize: '0.85rem' }}>Multispectral Prediction & Trajectory System</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <select value={inputType} onChange={e => setInputType(e.target.value as any)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#1c1c1e', color: '#f5f5f7', outline: 'none' }}>
            <option value="dataset">Dataset Index</option>
            <option value="upload">Upload Array</option>
          </select>

          {inputType === "dataset" ? (
            <input type="number" min={0} max={maxIdx} value={sampleIdx} onChange={e => setSampleIdx(Number(e.target.value))}
              style={{ width: '100px', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#1c1c1e', color: '#f5f5f7', outline: 'none' }} />
          ) : (
            <input type="file" accept=".npy" onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ padding: '8px', borderRadius: '10px', color: '#f5f5f7', fontSize: '0.85rem' }} />
          )}

          <button onClick={runAnalysis} disabled={loading}
            style={{ padding: '10px 24px', background: loading ? '#333336' : '#f5f5f7', color: loading ? '#86868b' : '#000000', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}>
            {loading ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* ===== EMPTY STATE ===== */}
      {!data && !loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px' }}>
            <h2 style={{ color: '#f5f5f7', marginBottom: '1rem', fontWeight: 500, letterSpacing: '-0.02em' }}>System Standby</h2>
            <p style={{ color: '#86868b', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Select a sample or upload a multispectral array to initialize the inference pipeline.
            </p>
          </div>
        </div>
      )}

      {/* ===== RESULTS SECTION ===== */}
      {data && data.success && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* TABS NAVIGATION */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', overflowX: 'auto' }}>
            <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
            <button style={tabStyle('map')} onClick={() => setActiveTab('map')}>Forecast</button>
            <button style={tabStyle('trajectory')} onClick={() => setActiveTab('trajectory')}>Trajectory</button>
            <button style={tabStyle('alerts')} onClick={() => setActiveTab('alerts')}>Threat Assessment</button>
            <button style={tabStyle('tensors')} onClick={() => setActiveTab('tensors')}>Tensors</button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ color: '#86868b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2rem', alignSelf: 'flex-start' }}>Identification Confidence</h3>

                  {/* Minimal Pie Chart */}
                  <div style={{
                    position: 'relative', width: '140px', height: '140px', borderRadius: '50%',
                    background: `conic-gradient(${data.active ? '#f5f5f7' : '#333336'} ${(data.s1_prob * 100)}%, #1c1c1e 0)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem'
                  }}>
                    <div style={{ width: '136px', height: '136px', background: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 300, color: '#f5f5f7' }}>{(data.s1_prob * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div style={{ border: `1px solid ${data.active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`, color: data.active ? '#f5f5f7' : '#86868b', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem', letterSpacing: '0.05em', width: '100%' }}>
                    {data.active ? 'ACTIVE SYSTEM DETECTED' : 'NO SYSTEM DETECTED'}
                  </div>
                </div>

                {data.active && (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '20px' }}>
                      <h3 style={{ color: '#86868b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2rem' }}>Kinematics</h3>

                      {/* Wind Speed Visualization Minimal */}
                      <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.9rem', color: '#86868b' }}>Predicted VMAX</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 300, color: '#f5f5f7' }}>{data.pred_vmax?.toFixed(1)} kts</span>
                        </div>
                        <div style={{ position: 'relative', height: '4px', background: '#333336', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${Math.min((data.pred_vmax || 0) / 150 * 100, 100)}%`, background: '#f5f5f7' }}></div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div><p style={{ fontSize: '0.8rem', color: '#86868b', marginBottom: '0.5rem' }}>Heading</p><p style={{ fontWeight: 300, fontSize: '1.2rem', color: '#f5f5f7' }}>{data.heading?.toFixed(1)}°</p></div>
                        <div><p style={{ fontSize: '0.8rem', color: '#86868b', marginBottom: '0.5rem' }}>Speed</p><p style={{ fontWeight: 300, fontSize: '1.2rem', color: '#f5f5f7' }}>{data.speed?.toFixed(1)} kts</p></div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '20px', gridColumn: '1 / -1' }}>
                      <h3 style={{ color: '#86868b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Classification</h3>
                      <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#121212' }}>
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
                              padding: '1rem 0.5rem',
                              borderRight: index < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              background: isActive ? '#f5f5f7' : 'transparent',
                              color: isActive ? '#000000' : '#86868b',
                              fontWeight: isActive ? 600 : 400,
                              fontSize: '0.85rem',
                              textAlign: 'center',
                              transition: 'all 0.3s ease'
                            }}>
                              {tier.name}
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '1rem', color: '#86868b' }}>
                        Scale Designation: <strong style={{ color: '#f5f5f7', fontWeight: 500 }}>{data.imd_cat}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: MAP */}
            {activeTab === 'map' && data.active && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#1c1c1e', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 500, color: '#86868b', fontSize: '0.85rem' }}>Timeline</div>
                  <input type="range" min={6} max={72} step={6} value={selectedHour} onChange={e => onSliderChange(Number(e.target.value))} style={{ flex: 1, accentColor: '#f5f5f7' }} />
                  <div style={{ background: '#f5f5f7', color: '#000', padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>+{selectedHour}h</div>
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <iframe srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none' }} title="Forecast" />
                </div>
              </div>
            )}

            {/* TAB 3: TRAJECTORY */}
            {activeTab === 'trajectory' && data.active && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#f5f5f7' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Forecast Hour</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Time (UTC)</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Lat</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Lon</th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.traj_points?.map((pt: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px', fontWeight: 500 }}>+{pt.hour}h</td>
                        <td style={{ padding: '16px', color: '#a1a1a6' }}>{pt.time}</td>
                        <td style={{ padding: '16px' }}>{pt.lat?.toFixed(2)}</td>
                        <td style={{ padding: '16px' }}>{pt.lon?.toFixed(2)}</td>
                        <td style={{ padding: '16px', color: pt.status.includes('LAND') ? '#ff6961' : '#32d74b' }}>{pt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: ALERTS */}
            {activeTab === 'alerts' && data.active && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ padding: '2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: '#f5f5f7', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: 500 }}>{data.alert_info?.badge}</h3>
                  <p style={{ color: '#86868b', fontSize: '0.95rem' }}><strong>Directive:</strong> {data.alert_info?.action}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ color: '#f5f5f7', margin: 0, fontWeight: 500 }}>Regional Impact</h3>
                    <button onClick={downloadPdf} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#f5f5f7', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.3s' }}>Download Report</button>
                  </div>

                  {data.alert_info?.impacts?.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#f5f5f7' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Location</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Region</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Distance</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>ETA</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.alert_info.impacts.map((imp: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '16px', fontWeight: 500 }}>{imp.city}</td>
                              <td style={{ padding: '16px', color: '#a1a1a6' }}>{imp.state}, {imp.country}</td>
                              <td style={{ padding: '16px' }}>{imp.dist_km} km</td>
                              <td style={{ padding: '16px' }}>{imp.eta_hour}</td>
                              <td style={{ padding: '16px', color: imp.alert.includes('RED') ? '#ff6961' : imp.alert.includes('ORANGE') ? '#ffd60a' : '#32d74b' }}>{imp.alert.replace(' ALERT', '')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#86868b', fontSize: '0.95rem' }}>No proximate risks detected.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: TENSORS */}
            {activeTab === 'tensors' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
                  {data.images?.map((img: string, idx: number) => (
                    <div key={idx} style={{ background: '#121212', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={img} alt={`Channel ${idx}`} style={{ width: '100%', display: 'block', filter: 'grayscale(100%)' }} />
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
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', color: '#86868b', marginTop: '2rem' }}>
          Restricted access. Target signature non-compliant with tracking parameters.
        </div>
      )}
    </main>
  );
}
