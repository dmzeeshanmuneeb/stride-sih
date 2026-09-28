"use client";
import React, { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReportsPage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/live-cyclones`)
      .then(r => r.json()).then(setLiveData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <main style={{ padding: '4rem 5%', textAlign: 'center' }}><h2 style={{ color: '#093370' }}>Fetching Live India Alerts from GDACS...</h2></main>;
  }

  const indianCyclones = liveData?.indian_cyclones || [];
  const globalCyclones = liveData?.global_cyclones || [];

  return (
    <main style={{ padding: '2rem 5%', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px #ef4444', animation: 'pulse 1.5s infinite' }}></div>
        <h1 style={{ color: '#093370', margin: 0 }}>Live India Bulletins & Reports</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
        Real-time cyclone alerts from GDACS (Global Disaster Alert and Coordination System).
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>
        Last updated: {liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : 'N/A'} · Source: {liveData?.source}
      </p>

      {/* Status Banner */}
      <div style={{
        padding: '1.5rem 2rem', borderRadius: '16px', marginBottom: '2rem',
        background: indianCyclones.length > 0 ? '#fee2e2' : '#dcfce7',
        borderLeft: `6px solid ${indianCyclones.length > 0 ? '#dc2626' : '#22c55e'}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ color: indianCyclones.length > 0 ? '#991b1b' : '#166534', marginBottom: '0.25rem' }}>
          {indianCyclones.length > 0
            ? `⚠️ ${indianCyclones.length} ACTIVE TROPICAL CYCLONE${indianCyclones.length > 1 ? 'S' : ''} IN INDIAN OCEAN REGION`
            : '✅ NO ACTIVE TROPICAL CYCLONES IN INDIAN OCEAN — ALL CLEAR'}
        </h3>
        <p style={{ color: '#333', fontSize: '0.9rem' }}>
          {indianCyclones.length > 0
            ? 'MoES / NDMA operational protocols may be activated. Review details below.'
            : 'Standard routine oceanic monitoring. No emergency response required at this time.'}
        </p>
      </div>

      {/* Indian Ocean Cyclones */}
      {indianCyclones.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#093370', marginBottom: '1rem' }}>🇮🇳 Indian Ocean Active Systems</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {indianCyclones.map((c: any, i: number) => (
              <div key={i} style={{
                background: 'white', padding: '2rem', borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                borderLeft: `6px solid ${c.alert_level === 'Red' ? '#dc2626' : c.alert_level === 'Orange' ? '#f97316' : '#22c55e'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#093370', margin: 0 }}>{c.name}</h3>
                  <span style={{
                    background: c.alert_level === 'Red' ? '#dc2626' : c.alert_level === 'Orange' ? '#f97316' : '#22c55e',
                    color: 'white', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem'
                  }}>{c.alert_level?.toUpperCase()} ALERT</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Position</p>
                    <p style={{ fontWeight: 'bold' }}>{c.lat?.toFixed(2)}°N, {c.lon?.toFixed(2)}°E</p>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Severity</p>
                    <p style={{ fontWeight: 'bold' }}>{c.severity}</p>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Affected Region</p>
                    <p style={{ fontWeight: 'bold' }}>{c.country}</p>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Update</p>
                    <p style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{c.pub_date}</p>
                  </div>
                </div>
                {c.description && (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1rem', lineHeight: 1.6 }}>{c.description}</p>
                )}
                {c.alert_info && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                    <h4 style={{ color: '#093370', marginBottom: '1rem', fontSize: '1rem' }}>AI Impact & Risk Analysis</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Primary Target Sector</p>
                        <p style={{ fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e293b' }}>{c.alert_info.primary_target}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Impact ETA</p>
                        <p style={{ fontWeight: 'bold', margin: '4px 0 0 0', color: '#ef4444' }}>{c.alert_info.eta}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', background: '#f8fafc', borderLeft: `4px solid ${c.alert_level === 'Red' ? '#dc2626' : c.alert_level === 'Orange' ? '#f97316' : '#22c55e'}`, padding: '1rem', borderRadius: '4px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}><strong>SOP Action:</strong> {c.alert_info.action}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Monitoring {indianCyclones.length} active tropical cyclones in the Indian Ocean basin · Data refreshes every 5 minutes
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
      `}} />
    </main>
  );
}
