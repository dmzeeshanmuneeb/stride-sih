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
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: '0.85rem' }}>Establishing connection to GDACS...</div>;
  }

  const indianCyclones = liveData?.indian_cyclones || [];

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Intelligence</div>
          <h2 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Bulletins & Reports</h2>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#86868b' }}>
          Sync: {liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
        </div>
      </div>

      <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: indianCyclones.length > 0 ? '#ef4444' : '#10b981' }}></div>
        <div style={{ fontSize: '0.85rem', color: '#f5f5f7' }}>
          {indianCyclones.length > 0 ? `${indianCyclones.length} Active System(s) Detected in Region` : 'System Nominal. No Active Anomalies.'}
        </div>
      </div>

      {indianCyclones.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {indianCyclones.map((c: any, i: number) => (
            <div key={i} style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>{c.name}</h3>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {c.alert_level?.toUpperCase()}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#86868b', marginBottom: '4px' }}>Coordinates</div>
                  <div style={{ fontSize: '0.85rem' }}>{c.lat?.toFixed(2)}°, {c.lon?.toFixed(2)}°</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#86868b', marginBottom: '4px' }}>Severity</div>
                  <div style={{ fontSize: '0.85rem' }}>{c.severity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#86868b', marginBottom: '4px' }}>Sector</div>
                  <div style={{ fontSize: '0.85rem' }}>{c.country}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#86868b', marginBottom: '4px' }}>Issued</div>
                  <div style={{ fontSize: '0.85rem' }}>{c.pub_date}</div>
                </div>
              </div>
              
              {c.description && (
                <div style={{ fontSize: '0.85rem', color: '#a1a1a6', lineHeight: 1.5, background: '#07111F', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {c.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
