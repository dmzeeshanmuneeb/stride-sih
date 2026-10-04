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

  const tabStyle = (tab: string) => ({
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 500,
    color: activeTab === tab ? '#f5f5f7' : '#86868b',
    background: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    transition: 'all 0.2s'
  });

  return (
    <>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Prediction Model</div>
          <h2 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Multispectral Inference System</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0A1422', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <select value={inputType} onChange={e => setInputType(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: '#07111F', color: '#f5f5f7', outline: 'none', fontSize: '0.8rem' }}>
            <option value="dataset">Dataset Index</option>
            <option value="upload">Upload Array</option>
          </select>

          {inputType === "dataset" ? (
            <input type="number" min={0} max={maxIdx} value={sampleIdx} onChange={e => setSampleIdx(Number(e.target.value))}
              style={{ width: '80px', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: '#07111F', color: '#f5f5f7', outline: 'none', fontSize: '0.8rem' }} />
          ) : (
            <input type="file" accept=".npy" onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ width: '180px', fontSize: '0.8rem', color: '#f5f5f7' }} />
          )}

          <button onClick={runAnalysis} disabled={loading}
            style={{ padding: '6px 16px', background: loading ? '#0A1422' : '#3b82f6', color: loading ? '#86868b' : '#ffffff', border: '1px solid', borderColor: loading ? 'rgba(255,255,255,0.1)' : '#3b82f6', borderRadius: '4px', fontWeight: 500, fontSize: '0.8rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {loading ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!data && !loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1422', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>System Standby</div>
            <p style={{ color: '#a1a1a6', fontSize: '0.9rem', margin: 0 }}>Select a dataset index or provide multispectral tensor array to initialize.</p>
          </div>
        </div>
      )}

      {/* RESULTS AREA */}
      {data && data.success && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
            <button style={tabStyle('map')} onClick={() => setActiveTab('map')}>Forecast Map</button>
            <button style={tabStyle('trajectory')} onClick={() => setActiveTab('trajectory')}>Trajectory</button>
            <button style={tabStyle('alerts')} onClick={() => setActiveTab('alerts')}>Threat Assessment</button>
            <button style={tabStyle('tensors')} onClick={() => setActiveTab('tensors')}>Tensors</button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
                
                {/* Confidence Card */}
                <div style={{ gridColumn: 'span 4', background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>Stage 1 Confidence</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(${data.active ? '#3b82f6' : '#475569'} ${(data.s1_prob * 100)}%, #07111F 0)` }}>
                      <div style={{ position: 'absolute', inset: '4px', background: '#0A1422', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>{(data.s1_prob * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#86868b' }}>Detection Status</div>
                      <div style={{ fontSize: '0.9rem', color: data.active ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                        {data.active ? 'ACTIVE ANOMALY' : 'NO ANOMALY'}
                      </div>
                    </div>
                  </div>
                </div>

                {data.active && (
                  <>
                    {/* Kinematics Card */}
                    <div style={{ gridColumn: 'span 8', background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Kinematics & Intensity</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '4px' }}>Predicted VMAX</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 500 }}>{data.pred_vmax?.toFixed(1)} kt</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '4px' }}>Heading</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 500 }}>{data.heading?.toFixed(1)}°</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '4px' }}>Speed</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 500 }}>{data.speed?.toFixed(1)} kt</div>
                        </div>
                      </div>
                    </div>

                    {/* IMD Classification Card */}
                    <div style={{ gridColumn: 'span 12', background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>IMD Classification Scale</div>
                      <div style={{ display: 'flex', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: '#07111F' }}>
                        {[
                          { name: 'LPA', cat: 'LPA' }, { name: 'D', cat: 'D' }, { name: 'DD', cat: 'DD' },
                          { name: 'CS', cat: 'CS' }, { name: 'SCS', cat: 'SCS' }, { name: 'VSCS', cat: 'VSCS' }, { name: 'ESCS+', cat: 'ESCS' }
                        ].map((tier, index) => {
                          const isActive = (data.imd_cat || '').includes(`(${tier.cat})`) || (tier.cat === 'ESCS' && (data.imd_cat || '').includes('(SuCS)'));
                          return (
                            <div key={tier.cat} style={{ flex: 1, padding: '10px 4px', borderRight: index < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: isActive ? '#3b82f6' : 'transparent', color: isActive ? '#fff' : '#86868b', fontWeight: isActive ? 500 : 400, fontSize: '0.8rem', textAlign: 'center' }}>
                              {tier.name}
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#a1a1a6' }}>
                        Assigned Designation: <span style={{ color: '#f5f5f7', fontWeight: 500 }}>{data.imd_cat}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: MAP */}
            {activeTab === 'map' && data.active && (
              <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '500px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#86868b', textTransform: 'uppercase' }}>Forecast Horizon</div>
                  <input type="range" min={6} max={72} step={6} value={selectedHour} onChange={e => onSliderChange(Number(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f5f5f7', minWidth: '40px', textAlign: 'right' }}>+{selectedHour}h</div>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <iframe srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none' }} title="Forecast" />
                </div>
              </div>
            )}

            {/* TAB 3: TRAJECTORY */}
            {activeTab === 'trajectory' && data.active && (
              <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#07111F' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Hour</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Time (UTC)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Coordinates</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.traj_points?.map((pt: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>+{pt.hour}h</td>
                        <td style={{ padding: '12px 16px', color: '#a1a1a6' }}>{pt.time}</td>
                        <td style={{ padding: '12px 16px' }}>{pt.lat?.toFixed(2)}°N, {pt.lon?.toFixed(2)}°E</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: pt.status.includes('LAND') ? '#ef4444' : '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>{pt.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: ALERTS */}
            {activeTab === 'alerts' && data.active && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px', borderLeft: `3px solid ${data.alert_info?.level === 'RED ALERT' ? '#ef4444' : '#f97316'}` }}>
                  <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Action Directive</div>
                  <h3 style={{ color: '#f5f5f7', margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 500 }}>{data.alert_info?.badge}</h3>
                  <p style={{ color: '#a1a1a6', fontSize: '0.85rem', margin: 0 }}>{data.alert_info?.action}</p>
                </div>

                <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Regional Impact Assessment</div>
                    <button onClick={downloadPdf} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#f5f5f7', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Export PDF</button>
                  </div>
                  
                  {data.alert_info?.impacts?.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#07111F', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Location</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Region</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>Distance</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86868b', fontWeight: 500 }}>ETA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.alert_info.impacts.map((imp: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 16px' }}>
                              {imp.city} <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: imp.alert.includes('RED') ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)', color: imp.alert.includes('RED') ? '#ef4444' : '#f97316' }}>{imp.alert.replace(' ALERT', '')}</span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#a1a1a6' }}>{imp.state}</td>
                            <td style={{ padding: '12px 16px' }}>{imp.dist_km} km</td>
                            <td style={{ padding: '12px 16px' }}>{imp.eta_hour}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '16px', color: '#86868b', fontSize: '0.85rem' }}>No proximate risks detected.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: TENSORS */}
            {activeTab === 'tensors' && (
              <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {data.images?.map((img: string, idx: number) => (
                    <div key={idx} style={{ background: '#07111F', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={img} alt={`Channel ${idx}`} style={{ width: '100%', display: 'block', filter: 'grayscale(100%) contrast(1.1)' }} />
                      <div style={{ padding: '8px', fontSize: '0.7rem', color: '#86868b', textAlign: 'center' }}>CH-{idx}</div>
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
        <div style={{ background: '#0A1422', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#86868b', fontSize: '0.85rem' }}>
          Operations restricted. Model confidence does not support trajectory tracking.
        </div>
      )}
    </>
  );
}
