"use client";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "20px",
      fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em",
      background: color + "22", border: `1px solid ${color}`, color,
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
      background: "#f8fafc", border: "1px solid #e2e8f0",
      borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1rem",
      transition: "border 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{date}</span>
          <h4 style={{ color: "#1e293b", margin: "4px 0 6px", fontSize: "1rem" }}>
            {item.imd_cat || "Unknown"} — {item.lat?.toFixed(2)}°N {item.lon?.toFixed(2)}°E
          </h4>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Badge color="#3b82f6">VMAX {item.pred_vmax ? `${item.pred_vmax} kt` : "—"}</Badge>
            <Badge color="#f97316">Storm Prob {item.s1_prob ? `${(item.s1_prob * 100).toFixed(1)}%` : "—"}</Badge>
            {item.heading !== undefined && <Badge color="#8b5cf6">Heading {item.heading?.toFixed(0)}°</Badge>}
            {item.speed !== undefined && <Badge color="#06b6d4">Speed {item.speed?.toFixed(1)} kt</Badge>}
          </div>
        </div>
        <Badge color={alert?.level === "RED ALERT" || alert?.level === "RED" ? "#ef4444" : alert?.level === "ORANGE ALERT" || alert?.level === "ORANGE" ? "#f97316" : "#10b981"}>
          {alert?.level || "WATCH"}
        </Badge>
      </div>

      {alert && (
        <div style={{
          marginTop: "0.75rem", padding: "0.75rem 1rem",
          background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0",
          borderLeft: `3px solid ${alert.level?.includes("RED") ? "#ef4444" : alert.level?.includes("ORANGE") ? "#f97316" : "#10b981"}`,
        }}>
          <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "0 0 4px" }}>
            🎯 <strong style={{ color: "#1e293b" }}>Target:</strong> {alert.primary_target || "—"}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "0 0 8px" }}>
            ⏱️ <strong style={{ color: "#1e293b" }}>ETA:</strong> {alert.eta || "—"}
          </p>

          {alert.impacts && alert.impacts.length > 0 && (
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: 600 }}>ALERTED CITIES / DISTRICTS (CONE OF UNCERTAINTY):</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {alert.impacts.map((imp: any, i: number) => (
                  <span key={i} style={{
                    background: imp.alert.includes("RED") ? "#fee2e2" : imp.alert.includes("ORANGE") ? "#ffedd5" : "#f1f5f9",
                    color: imp.alert.includes("RED") ? "#991b1b" : imp.alert.includes("ORANGE") ? "#9a3412" : "#334155",
                    padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", border: "1px solid",
                    borderColor: imp.alert.includes("RED") ? "#fca5a5" : imp.alert.includes("ORANGE") ? "#fdba74" : "#cbd5e1"
                  }}>
                    {imp.city}, {imp.state} ({imp.eta_hour})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {item.map_html && (
        <details style={{ marginTop: "12px", background: "#ffffff", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <summary style={{ cursor: "pointer", color: "#3b82f6", fontSize: "0.85rem", fontWeight: 600, outline: "none" }}>🗺️ View AI Forecast Map Snapshot</summary>
          <div style={{ marginTop: "10px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", height: "350px", background: "#f1f5f9" }}>
            <iframe
              srcDoc={item.map_html}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Cyclone Map Forecast Snapshot"
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
      background: "#fff1f2", border: "1px solid #fecdd3",
      borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{date}</span>
          <h4 style={{ color: "#1e293b", margin: "4px 0 6px", fontSize: "1rem" }}>
            {item.cyclone_name || "Unnamed System"}
          </h4>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 4px" }}>
            🎯 {item.primary_target || "—"} &nbsp;·&nbsp; ⏱️ {item.eta || "—"}
          </p>
          {item.action && (
            <p style={{ color: "#991b1b", fontSize: "0.8rem", margin: "0 0 8px", fontWeight: 600 }}>
              SOP: {item.action}
            </p>
          )}
        </div>
        <Badge color={item.level?.includes("RED") ? "#ef4444" : item.level?.includes("ORANGE") ? "#f97316" : "#10b981"}>
          {item.level || "WATCH"}
        </Badge>
      </div>

      {item.impacts && item.impacts.length > 0 && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #fca5a5" }}>
          <div style={{ fontSize: "0.75rem", color: "#991b1b", marginBottom: "0.5rem", fontWeight: 600 }}>VULNERABLE CITIES / DISTRICTS:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {item.impacts.map((imp: any, i: number) => (
              <span key={i} style={{
                background: imp.alert.includes("RED") ? "#ef4444" : imp.alert.includes("ORANGE") ? "#f97316" : "#e2e8f0",
                color: imp.alert.includes("RED") || imp.alert.includes("ORANGE") ? "white" : "#1e293b",
                padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem"
              }}>
                {imp.city}, {imp.state} ({imp.eta_hour})
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
      background: "#ffffff",
      padding: "2rem 5%", fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <h1 style={{ color: "#1e293b", fontSize: "1.8rem", fontWeight: 700, margin: 0 }}>
              📦 Data History
            </h1>
            {user && <Badge color="#3b82f6">{user.username} · {user.role_label}</Badge>}

            {user && user.role === 'admin' && (
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to permanently delete ALL history records?')) {
                    await fetch(`${API}/api/history/clear`, { method: 'DELETE' });
                    window.location.reload();
                  }
                }}
                style={{ marginLeft: 'auto', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                🗑️ Clear All History
              </button>
            )}
          </div>
          <p style={{ color: "#64748b", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            All analysis runs and alert bulletins saved to MongoDB. Auto-updated on each new inference.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0", width: "fit-content" }}>
          {(["analyses", "bulletins"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0.6rem 1.5rem", border: "none", cursor: "pointer",
              background: tab === t ? "#eff6ff" : "#ffffff",
              color: tab === t ? "#2563eb" : "#64748b",
              fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s",
              borderRight: t === "analyses" ? "1px solid #e2e8f0" : "none",
            }}>
              {t === "analyses" ? `🛰️ AI Analyses (${analyses.length})` : `📋 Alert Bulletins (${bulletins.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "3rem" }}>Loading from MongoDB...</div>
        ) : tab === "analyses" ? (
          analyses.length === 0 ? (
            <div style={{
              color: "#64748b", textAlign: "center", padding: "4rem",
              background: "#f8fafc", borderRadius: "14px",
              border: "1px dashed #cbd5e1"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛰️</div>
              <p style={{ color: "#1e293b", fontWeight: 600 }}>No analyses stored yet.</p>
              <p style={{ fontSize: "0.85rem" }}>Upload a numpy array on the AI Dashboard to run an inference — it will automatically be saved here.</p>
            </div>
          ) : analyses.map((a, i) => <AnalysisCard key={i} item={a} />)
        ) : (
          bulletins.length === 0 ? (
            <div style={{
              color: "#64748b", textAlign: "center", padding: "4rem",
              background: "#f8fafc", borderRadius: "14px",
              border: "1px dashed #cbd5e1"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
              <p style={{ color: "#1e293b", fontWeight: 600 }}>No alert bulletins saved yet.</p>
            </div>
          ) : bulletins.map((b, i) => <BulletinCard key={i} item={b} />)
        )}
      </div>
    </main>
  );
}
