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
    return <main style={{ padding: '5rem 5%', textAlign: 'center', background: '#000000', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}><h2 style={{ color: '#86868b', fontWeight: 400, fontSize: '1.1rem' }}>Establishing secure connection to GDACS...</h2></main>;
  }

  const indianCyclones = liveData?.indian_cyclones || [];

  return (
    <main style={{ padding: '4rem 5%', backgroundColor: '#000000', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <h1 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.6rem', fontWeight: 500, letterSpacing: '-0.02em' }}>Global Reports & Intelligence</h1>
        </div>
        <p style={{ color: '#86868b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Synchronized alerts from Global Disaster Alert and Coordination System.
        </p>
        <p style={{ color: '#55555a', fontSize: '0.8rem', marginBottom: '3rem' }}>
          Last sync: {liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'} · Source: {liveData?.source}
        </p>

        {/* Status Banner */}
        <div style={{
          padding: '2rem', borderRadius: '16px', marginBottom: '3rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <h3 style={{ color: '#f5f5f7', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
            {indianCyclones.length > 0
              ? `${indianCyclones.length} ACTIVE SYSTEM${indianCyclones.length > 1 ? 'S' : ''} IN REGION`
              : 'SYSTEM NOMINAL. NO ACTIVE ANOMALIES.'}
          </h3>
          <p style={{ color: '#86868b', fontSize: '0.9rem', margin: 0 }}>
            {indianCyclones.length > 0
              ? 'Protocols active. Review parameters below.'
              : 'Routine monitoring ongoing. No action required.'}
          </p>
        </div>

        {/* Indian Ocean Cyclones */}
        {indianCyclones.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: '#f5f5f7', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 500 }}>Monitored Entities</h2>
            <div style={{ display: 'grid', gap: '2rem' }}>
              {indianCyclones.map((c: any, i: number) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.4rem', fontWeight: 400 }}>{c.name}</h3>
                    <span style={{
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                      color: '#f5f5f7', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem'
                    }}>{c.alert_level?.toUpperCase()}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#86868b', margin: '0 0 0.5rem 0' }}>Coordinates</p>
                      <p style={{ fontWeight: 400, color: '#f5f5f7', margin: 0 }}>{c.lat?.toFixed(2)}°, {c.lon?.toFixed(2)}°</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#86868b', margin: '0 0 0.5rem 0' }}>Classification</p>
                      <p style={{ fontWeight: 400, color: '#f5f5f7', margin: 0 }}>{c.severity}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#86868b', margin: '0 0 0.5rem 0' }}>Sector</p>
                      <p style={{ fontWeight: 400, color: '#f5f5f7', margin: 0 }}>{c.country}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#86868b', margin: '0 0 0.5rem 0' }}>Issued</p>
                      <p style={{ fontWeight: 400, color: '#f5f5f7', margin: 0, fontSize: '0.85rem' }}>{c.pub_date}</p>
                    </div>
                  </div>
                  
                  {c.description && (
                    <p style={{ color: '#a1a1a6', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{c.description}</p>
                  )}
                  
                  {c.alert_info && (
                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                      <h4 style={{ color: '#f5f5f7', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 500 }}>Predictive Analysis</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#86868b', margin: '0 0 0.5rem 0' }}>Target Vector</p>
                          <p style={{ fontWeight: 400, margin: 0, color: '#f5f5f7' }}>{c.alert_info.primary_target}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#86868b', margin: '0 0 0.5rem 0' }}>Estimated Arrival</p>
                          <p style={{ fontWeight: 400, margin: 0, color: '#f5f5f7' }}>{c.alert_info.eta}</p>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: '#a1a1a6', margin: 0 }}><strong>Protocol:</strong> {c.alert_info.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
