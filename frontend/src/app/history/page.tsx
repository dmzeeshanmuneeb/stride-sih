"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function AnalysisRow({ item }: { item: any }) {
  const date = item.saved_at ? new Date(item.saved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: 'short', timeStyle: 'short' }) : "—";
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#a1a1a6' }}>{date}</td>
      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.imd_cat || "Unknown"}</td>
      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.lat?.toFixed(2)}°, {item.lon?.toFixed(2)}°</td>
      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.pred_vmax ? `${item.pred_vmax} kt` : "—"}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: item.alert_info?.level?.includes('RED') ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: item.alert_info?.level?.includes('RED') ? '#ef4444' : '#f5f5f7' }}>
          {item.alert_info?.level || 'STANDBY'}
        </span>
      </td>
    </tr>
  );
}

function BulletinRow({ item }: { item: any }) {
  const date = item.saved_at ? new Date(item.saved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: 'short', timeStyle: 'short' }) : "—";
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#a1a1a6' }}>{date}</td>
      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.cyclone_name || "Unidentified"}</td>
      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.primary_target || "—"}</td>
      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#a1a1a6' }}>{item.eta || "—"}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
          {item.level || "WATCH"}
        </span>
      </td>
    </tr>
  );
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [tab, setTab] = useState<"analyses" | "bulletins">("analyses");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/history/analyses`).then(r => r.json()),
      fetch(`${API}/api/history/bulletins`).then(r => r.json()),
    ]).then(([a, b]) => {
      setAnalyses(a.analyses || []);
      setBulletins(b.bulletins || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Data & Archives</div>
          <h2 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Data History</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setTab("analyses")} style={{ padding: '6px 12px', background: tab === 'analyses' ? 'rgba(255,255,255,0.05)' : 'transparent', color: tab === 'analyses' ? '#f5f5f7' : '#86868b', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Analyses ({analyses.length})</button>
          <button onClick={() => setTab("bulletins")} style={{ padding: '6px 12px', background: tab === 'bulletins' ? 'rgba(255,255,255,0.05)' : 'transparent', color: tab === 'bulletins' ? '#f5f5f7' : '#86868b', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Bulletins ({bulletins.length})</button>
        </div>
      </div>

      <div style={{ background: '#0A1422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#86868b', fontSize: '0.85rem' }}>Syncing records...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#07111F', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {tab === 'analyses' ? (
                  <>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>Category</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>Coordinates</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>VMAX</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>Alert Status</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>System Name</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>Target Sector</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>ETA</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#86868b', fontWeight: 500 }}>Level</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tab === 'analyses' ? (
                analyses.length === 0 ? <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#86868b', fontSize: '0.85rem' }}>No records found.</td></tr> : analyses.map((a, i) => <AnalysisRow key={i} item={a} />)
              ) : (
                bulletins.length === 0 ? <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#86868b', fontSize: '0.85rem' }}>No records found.</td></tr> : bulletins.map((b, i) => <BulletinRow key={i} item={b} />)
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
