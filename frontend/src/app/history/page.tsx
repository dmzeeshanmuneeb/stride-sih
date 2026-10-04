"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: "8px",
      fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.03em",
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f5f7",
    }}>
      {children}
    </span>
  );
}

function AnalysisCard({ item }: { item: any }) {
  const date = item.saved_at ? new Date(item.saved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";
  const alert = item.alert_info;
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: "16px", padding: "2rem", marginBottom: "1.5rem",
      transition: "background 0.3s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#86868b" }}>{date}</span>
          <h4 style={{ color: "#f5f5f7", margin: "8px 0 16px", fontSize: "1.1rem", fontWeight: 500 }}>
            {item.imd_cat || "Unknown Signature"} — {item.lat?.toFixed(2)}° {item.lon?.toFixed(2)}°
          </h4>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Badge>VMAX {item.pred_vmax ? `${item.pred_vmax} kt` : "—"}</Badge>
            <Badge>Prob {item.s1_prob ? `${(item.s1_prob * 100).toFixed(0)}%` : "—"}</Badge>
            {item.heading !== undefined && <Badge>Heading {item.heading?.toFixed(0)}°</Badge>}
            {item.speed !== undefined && <Badge>Speed {item.speed?.toFixed(1)} kt</Badge>}
          </div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', color: '#f5f5f7' }}>
          {alert?.level || "STANDBY"}
        </div>
      </div>

      {alert && (
        <div style={{
          marginTop: "1.5rem", padding: "1.25rem",
          background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)",
        }}>
          <p style={{ color: "#a1a1a6", fontSize: "0.85rem", margin: "0 0 8px" }}>
            <strong style={{ color: "#f5f5f7", fontWeight: 500 }}>Vector:</strong> {alert.primary_target || "—"}
          </p>
          <p style={{ color: "#a1a1a6", fontSize: "0.85rem", margin: "0 0 12px" }}>
            <strong style={{ color: "#f5f5f7", fontWeight: 500 }}>ETA:</strong> {alert.eta || "—"}
          </p>

          {alert.impacts && alert.impacts.length > 0 && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: "0.7rem", color: "#86868b", marginBottom: "0.75rem", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Affected Sectors:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {alert.impacts.map((imp: any, i: number) => (
                  <span key={i} style={{
                    background: "transparent",
                    color: "#f5f5f7",
                    padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", border: "1px solid rgba(255,255,255,0.15)",
                  }}>
                    {imp.city}, {imp.state}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {item.map_html && (
        <details style={{ marginTop: "1.5rem", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
          <summary style={{ cursor: "pointer", color: "#f5f5f7", fontSize: "0.85rem", fontWeight: 400, outline: "none", userSelect: "none" }}>View Forecast Map Snapshot</summary>
          <div style={{ marginTop: "1rem", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", height: "350px", background: "#0a0a0a" }}>
            <iframe
              srcDoc={item.map_html}
              style={{ width: "100%", height: "100%", border: "none", filter: 'invert(90%) hue-rotate(180deg)' }}
              title="Forecast Snapshot"
            />
          </div>
        </details>
      )}
    </div>
  );
}

function BulletinCard({ item }: { item: any }) {
  const date = item.saved_at ? new Date(item.saved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: "16px", padding: "2rem", marginBottom: "1.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#86868b" }}>{date}</span>
          <h4 style={{ color: "#f5f5f7", margin: "8px 0 12px", fontSize: "1.1rem", fontWeight: 500 }}>
            {item.cyclone_name || "Unidentified System"}
          </h4>
          <p style={{ color: "#a1a1a6", fontSize: "0.85rem", margin: "0 0 8px" }}>
            Sector: {item.primary_target || "—"} &nbsp;·&nbsp; ETA: {item.eta || "—"}
          </p>
          {item.action && (
            <p style={{ color: "#f5f5f7", fontSize: "0.85rem", margin: "0 0 12px", background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>
              Directive: {item.action}
            </p>
          )}
        </div>
        <div style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', color: '#f5f5f7', height: 'fit-content' }}>
          {item.level || "STANDBY"}
        </div>
      </div>

      {item.impacts && item.impacts.length > 0 && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "0.7rem", color: "#86868b", marginBottom: "0.75rem", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monitored Sectors:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {item.impacts.map((imp: any, i: number) => (
              <span key={i} style={{
                background: "transparent",
                color: "#f5f5f7",
                padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", border: "1px solid rgba(255,255,255,0.15)"
              }}>
                {imp.city}, {imp.state}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [tab, setTab] = useState<"analyses" | "bulletins">("analyses");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stride_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { }

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
    <main style={{
      minHeight: "100vh",
      background: "#000000",
      padding: "4rem 5%", fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <h1 style={{ color: "#f5f5f7", fontSize: "1.6rem", fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>
              Archive & Telemetry
            </h1>
            {user && <span style={{ fontSize: '0.75rem', color: '#86868b', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '10px' }}>{user.username}</span>}

            {user && user.role === 'admin' && (
              <button
                onClick={async () => {
                  if (window.confirm('Erase all telemetry?')) {
                    await fetch(`${API}/api/history/clear`, { method: 'DELETE' });
                    window.location.reload();
                  }
                }}
                style={{ marginLeft: 'auto', background: 'transparent', color: '#86868b', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', transition: 'color 0.2s' }}
              >
                Purge Records
              </button>
            )}
          </div>
          <p style={{ color: "#86868b", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Historical inference logs and synchronized bulletins.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: '1rem', marginBottom: "2.5rem" }}>
          {(["analyses", "bulletins"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 0", border: "none", cursor: "pointer",
              background: "transparent",
              color: tab === t ? "#f5f5f7" : "#86868b",
              fontWeight: 400, fontSize: "0.95rem", transition: "color 0.3s",
              borderBottom: tab === t ? '1px solid #f5f5f7' : '1px solid transparent'
            }}>
              {t === "analyses" ? `Analyses (${analyses.length})` : `Bulletins (${bulletins.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ color: "#86868b", textAlign: "center", padding: "4rem" }}>Syncing records...</div>
        ) : tab === "analyses" ? (
          analyses.length === 0 ? (
            <div style={{
              color: "#86868b", textAlign: "center", padding: "5rem",
              background: "rgba(255,255,255,0.01)", borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.03)"
            }}>
              <p style={{ color: "#f5f5f7", fontWeight: 400, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No data records found.</p>
              <p style={{ fontSize: "0.85rem" }}>Run an inference to populate the archive.</p>
            </div>
          ) : analyses.map((a, i) => <AnalysisCard key={i} item={a} />)
        ) : (
          bulletins.length === 0 ? (
            <div style={{
              color: "#86868b", textAlign: "center", padding: "5rem",
              background: "rgba(255,255,255,0.01)", borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.03)"
            }}>
              <p style={{ color: "#f5f5f7", fontWeight: 400, fontSize: '1.1rem' }}>No active bulletins.</p>
            </div>
          ) : bulletins.map((b, i) => <BulletinCard key={i} item={b} />)
        )}
      </div>
    </main>
  );
}
