"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function AnalysisRow({ item }: { item: any }) {
  const date = item.saved_at ? new Date(item.saved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: 'short', timeStyle: 'short' }) : "—";
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{date}</td>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', fontWeight: 500 }}>{item.imd_cat || "Unknown"}</td>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', fontFamily: 'monospace' }}>{item.lat?.toFixed(2)}N, {item.lon?.toFixed(2)}E</td>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', fontFamily: 'monospace' }}>{item.pred_vmax ? `${item.pred_vmax} kt` : "—"}</td>
      <td style={{ padding: '12px 16px', fontSize: '12px', color: item.alert_info?.level?.includes('RED') ? '#dc2626' : '#6b7280', fontWeight: 500 }}>
        {item.alert_info?.level || 'STANDBY'}
      </td>
    </tr>
  );
}

function BulletinRow({ item }: { item: any }) {
  const date = item.saved_at ? new Date(item.saved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: 'short', timeStyle: 'short' }) : "—";
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{date}</td>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', fontWeight: 500 }}>{item.cyclone_name || "Unidentified"}</td>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827' }}>{item.primary_target || "—"}</td>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{item.eta || "—"}</td>
      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
        {item.level || "WATCH"}
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
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>DATA ARCHIVE</div>
          <h2 style={{ color: '#111827', margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em' }}>Data History Log</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setTab("analyses")} style={{ padding: '8px 0', border: 'none', borderBottom: `2px solid ${tab === 'analyses' ? '#2563eb' : 'transparent'}`, background: 'transparent', color: tab === 'analyses' ? '#111827' : '#6b7280', fontSize: '13px', fontWeight: tab === 'analyses' ? 600 : 400, cursor: 'pointer' }}>Analyses Log ({analyses.length})</button>
          <button onClick={() => setTab("bulletins")} style={{ padding: '8px 0', border: 'none', borderBottom: `2px solid ${tab === 'bulletins' ? '#2563eb' : 'transparent'}`, background: 'transparent', color: tab === 'bulletins' ? '#111827' : '#6b7280', fontSize: '13px', fontWeight: tab === 'bulletins' ? 600 : 400, cursor: 'pointer' }}>Bulletin Log ({bulletins.length})</button>
        </div>
      </div>

      <div style={{ width: '100%', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 0', color: '#6b7280', fontSize: '13px', textAlign: 'center' }}>Retrieving archived data...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {tab === 'analyses' ? (
                  <>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp (IST)</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coordinates</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Velocity</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp (IST)</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Name</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Impact Sector</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ETA</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tab === 'analyses' ? (
                analyses.length === 0 ? <tr><td colSpan={5} style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>No records in database.</td></tr> : analyses.map((a, i) => <AnalysisRow key={i} item={a} />)
              ) : (
                bulletins.length === 0 ? <tr><td colSpan={5} style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>No records in database.</td></tr> : bulletins.map((b, i) => <BulletinRow key={i} item={b} />)
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
