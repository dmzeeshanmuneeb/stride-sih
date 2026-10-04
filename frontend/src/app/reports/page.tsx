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
    return <div style={{ padding: '40px 0', color: '#6b7280', fontSize: '13px' }}>Establishing link to GDACS...</div>;
  }

  const indianCyclones = liveData?.indian_cyclones || [];

  return (
    <>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>INTELLIGENCE</div>
          <h2 style={{ color: '#111827', margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em' }}>Bulletins & Reports</h2>
          <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '13px' }}>Synchronized intelligence from Global Disaster Alert and Coordination System.</p>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Last sync: <span style={{ color: '#111827', fontWeight: 500 }}>{liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) : '--:--'}</span>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
        <span>Monitored Regional Entities</span>
        <span style={{ color: indianCyclones.length > 0 ? '#dc2626' : '#16a34a' }}>
          {indianCyclones.length} Active System(s)
        </span>
      </div>

      {indianCyclones.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {indianCyclones.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '32px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '32px' }}>
              {/* Left Details */}
              <div style={{ flex: '1 1 30%', borderRight: '1px solid #e5e7eb', paddingRight: '24px' }}>
                <div style={{ fontSize: '20px', color: '#111827', fontWeight: 600, marginBottom: '6px' }}>{c.name}</div>
                <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '20px', fontWeight: 600 }}>{c.alert_level?.toUpperCase()} ALERT</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Coordinates</span>
                    <span style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 500 }}>{c.lat?.toFixed(2)}N, {c.lon?.toFixed(2)}E</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Severity</span>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{c.severity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Sector</span>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{c.country}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Issued</span>
                    <span style={{ color: '#4b5563' }}>{c.pub_date}</span>
                  </div>
                </div>
              </div>

              {/* Right Description */}
              <div style={{ flex: '1 1 70%' }}>
                {c.description && (
                  <div 
                    style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, marginBottom: '32px' }} 
                    dangerouslySetInnerHTML={{ __html: c.description }}
                  />
                )}
                
                {c.alert_info && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 600 }}>Predictive Assessment</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 0', color: '#6b7280' }}>Target Vector</td>
                          <td style={{ padding: '8px 0', color: '#111827', fontWeight: 500 }}>{c.alert_info.primary_target}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 0', color: '#6b7280' }}>Estimated Arrival</td>
                          <td style={{ padding: '8px 0', color: '#111827', fontWeight: 500 }}>{c.alert_info.eta}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>
                      <span style={{ color: '#111827', fontWeight: 600 }}>Protocol:</span> {c.alert_info.action}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#6b7280' }}>Routine monitoring ongoing. No action required.</div>
      )}
    </>
  );
}
