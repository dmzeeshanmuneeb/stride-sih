"use client";
import React, { useState } from "react";

const API = "http://localhost:8000";

const ROLES = [
  {
    id: "admin",
    label: "MoES / IMD Central Admin",
    icon: "🛰️",
    color: "#1e40af",
    gradient: "linear-gradient(135deg,#1e3a8a,#1d4ed8)",
    desc: "Full AI model control, satellite tensor inspection, bulletin generation.",
    badge: "RESTRICTED ACCESS",
    badgeColor: "#ef4444",
  },
  {
    id: "ndrf",
    label: "NDRF / District Field Responder",
    icon: "🚨",
    color: "#b45309",
    gradient: "linear-gradient(135deg,#78350f,#d97706)",
    desc: "Coastal vulnerability matrix, landfall ETA, district evacuation logistics.",
    badge: "FIELD OPERATIONS",
    badgeColor: "#f97316",
  },
  {
    id: "civilian",
    label: "Civilian / Public Safety View",
    icon: "🏠",
    color: "#065f46",
    gradient: "linear-gradient(135deg,#064e3b,#059669)",
    desc: "Live storm track, pincode risk checker, nearest shelter routing.",
    badge: "PUBLIC ACCESS",
    badgeColor: "#10b981",
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [mode, setMode]     = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail]   = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const activeRole = ROLES.find((r) => r.id === selectedRole);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) { setError("Please select a role first."); return; }
    setError(""); setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: any = { username, password, role: selectedRole };
      if (mode === "register") body.email = email;

      const res  = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) { setError(data.error); setLoading(false); return; }

      if (mode === "login" && data.token) {
        localStorage.setItem("stride_token", data.token);
        localStorage.setItem("stride_user",  JSON.stringify(data.user));
        // Redirect based on role
        const dest = selectedRole === "admin" ? "/dashboard"
                   : selectedRole === "ndrf"  ? "/map"
                   : "/";
        window.location.href = dest;
      } else if (mode === "register" && data.ok) {
        setMode("login");
        setError("");
        alert(`Account created! You can now log in as ${username}.`);
      }
    } catch (err) {
      setError("Cannot reach the Stride server. Is the backend running?");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#020617 0%,#0c1a3a 50%,#0f172a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "2rem", fontFamily: "'Inter',sans-serif",
    }}>
      {/* Logo + Title */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <img src="/stride_logo.png" alt="Stride AI" style={{ height: "72px", marginBottom: "1rem" }} />
        <p style={{ color: "#38bdf8", fontSize: "0.9rem", margin: 0, letterSpacing: "0.08em" }}>
          DEVELOPED FOR SIH · MINISTRY OF EARTH SCIENCES TRACK
        </p>
      </div>

      <div style={{
        width: "100%", maxWidth: "860px",
        background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px",
        padding: "2.5rem", boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
      }}>
        <h2 style={{ color: "#f1f5f9", textAlign: "center", marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
          Select Your Access Role
        </h2>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "2rem", fontSize: "0.9rem" }}>
          Choose the role that matches your designation to access the appropriate dashboard.
        </p>

        {/* Role Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              style={{
                background: selectedRole === role.id ? role.gradient : "rgba(255,255,255,0.04)",
                border: `2px solid ${selectedRole === role.id ? "transparent" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "16px", padding: "1.5rem", cursor: "pointer",
                textAlign: "left", transition: "all 0.25s ease",
                transform: selectedRole === role.id ? "scale(1.03)" : "scale(1)",
                boxShadow: selectedRole === role.id ? `0 8px 30px ${role.color}55` : "none",
              }}
            >
              <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>{role.icon}</div>
              <span style={{
                display: "inline-block", fontSize: "0.65rem", fontWeight: 700,
                letterSpacing: "0.08em", color: "white",
                background: role.badgeColor, padding: "2px 8px", borderRadius: "4px",
                marginBottom: "0.5rem",
              }}>{role.badge}</span>
              <p style={{ color: "#f1f5f9", fontWeight: 600, margin: "0 0 0.4rem", fontSize: "0.95rem" }}>
                {role.label}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", margin: 0, lineHeight: 1.5 }}>
                {role.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Login / Register form */}
        {selectedRole && (
          <form onSubmit={handleSubmit} style={{
            background: "rgba(0,0,0,0.35)", borderRadius: "16px", padding: "2rem",
            border: `1px solid ${activeRole!.color}55`,
          }}>
            <div style={{ display: "flex", gap: "0", marginBottom: "1.5rem", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              {(["login","register"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} style={{
                  flex: 1, padding: "0.65rem", border: "none", cursor: "pointer",
                  background: mode === m ? activeRole!.gradient : "transparent",
                  color: mode === m ? "white" : "#64748b",
                  fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s",
                }}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "6px" }}>Username</label>
                <input
                  value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="Enter username"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "white", fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {mode === "register" && (
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "6px" }}>Email (optional)</label>
                  <input
                    value={email} onChange={e => setEmail(e.target.value)} type="email"
                    placeholder="official@example.gov.in"
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "white", fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "6px" }}>Password</label>
                <input
                  value={password} onChange={e => setPassword(e.target.value)} required type="password"
                  placeholder="Enter password"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "white", fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: "#7f1d1d44", border: "1px solid #ef4444", borderRadius: "8px",
                padding: "0.75rem 1rem", color: "#fca5a5", fontSize: "0.85rem", marginTop: "1rem" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: "100%", marginTop: "1.5rem", padding: "0.85rem",
                background: loading ? "#334155" : activeRole!.gradient,
                border: "none", borderRadius: "12px", color: "white",
                fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s", boxShadow: `0 4px 20px ${activeRole!.color}55`,
              }}
            >
              {loading ? "Authenticating..." : mode === "login" ? `Sign in as ${activeRole!.label}` : "Create Account"}
            </button>

            {mode === "login" && (
              <p style={{ color: "#64748b", fontSize: "0.78rem", textAlign: "center", marginTop: "1rem" }}>
                Demo credentials — Admin: <code style={{ color:"#38bdf8" }}>imd_admin / Admin@1234</code> ·
                NDRF: <code style={{ color:"#f97316" }}>ndrf_user / Ndrf@1234</code> ·
                Public: <code style={{ color:"#10b981" }}>public_user / Public@1234</code>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
