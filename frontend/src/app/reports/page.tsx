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
    return <div style={{ padding: '40px 0', color: '#5f697a', fontSize: '13px' }}>Establishing link to GDACS...</div>;
  }

  const indianCyclones = liveData?.indian_cyclones || [];

  return (
    <>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1f2530', paddingBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>INTELLIGENCE</div>
          <h2 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 400, letterSpacing: '-0.01em' }}>Bulletins & Reports</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8a94a6', fontSize: '13px' }}>Synchronized intelligence from Global Disaster Alert and Coordination System.</p>
        </div>
        <div style={{ fontSize: '13px', color: '#8a94a6' }}>
          Last sync: <span style={{ color: '#e2e4e9' }}>{liveData?.timestamp ? new Date(liveData.timestamp + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) : '--:--'}</span>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1f2530', paddingBottom: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Monitored Regional Entities</span>
        <span style={{ color: indianCyclones.length > 0 ? '#ef4444' : '#10b981' }}>
          {indianCyclones.length} Active System(s)
        </span>
      </div>

      {indianCyclones.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {indianCyclones.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '32px' }}>
              {/* Left Details */}
              <div style={{ flex: '1 1 30%', borderRight: '1px solid #1f2530', paddingRight: '24px' }}>
                <div style={{ fontSize: '18px', color: '#e2e4e9', fontWeight: 500, marginBottom: '4px' }}>{c.name}</div>
                <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '16px' }}>{c.alert_level?.toUpperCase()} ALERT</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#5f697a' }}>Coordinates</span>
                    <span style={{ color: '#e2e4e9', fontFamily: 'monospace' }}>{c.lat?.toFixed(2)}N, {c.lon?.toFixed(2)}E</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#5f697a' }}>Severity</span>
                    <span style={{ color: '#e2e4e9' }}>{c.severity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#5f697a' }}>Sector</span>
                    <span style={{ color: '#e2e4e9' }}>{c.country}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#5f697a' }}>Issued</span>
                    <span style={{ color: '#8a94a6' }}>{c.pub_date}</span>
                  </div>
                </div>
              </div>

              {/* Right Description */}
              <div style={{ flex: '1 1 70%' }}>
                {c.description && (
                  <div style={{ fontSize: '14px', color: '#a1a1a6', lineHeight: 1.6, marginBottom: '24px' }}>
                    {c.description}
                  </div>
                )}
                
                {c.alert_info && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#5f697a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Predictive Assessment</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #1f2530' }}>
                          <td style={{ padding: '6px 0', color: '#8a94a6' }}>Target Vector</td>
                          <td style={{ padding: '6px 0', color: '#e2e4e9' }}>{c.alert_info.primary_target}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #1f2530' }}>
                          <td style={{ padding: '6px 0', color: '#8a94a6' }}>Estimated Arrival</td>
                          <td style={{ padding: '6px 0', color: '#e2e4e9' }}>{c.alert_info.eta}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ fontSize: '13px', color: '#8a94a6' }}>
                      <span style={{ color: '#5f697a' }}>Protocol:</span> {c.alert_info.action}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#5f697a' }}>Routine monitoring ongoing. No action required.</div>
      )}
    </>
  );
}
