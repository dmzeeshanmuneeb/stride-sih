"use client";
import { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import LoginVisualization from '../components/LoginVisualization';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('stride_user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch { }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !selectedRole) {
      setError("Please select a role first.");
      return;
    }
    setError(""); setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: any = { username, password };
      if (mode === "register") { body.email = email; body.role = selectedRole; }

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) { setError(data.error); setLoading(false); return; }

      if (mode === "login" && data.token) {
        localStorage.setItem("stride_token", data.token);
        localStorage.setItem("stride_user", JSON.stringify(data.user));
        
        // Premium transition before redirecting
        setIsTransitioning(true);
        setTimeout(() => {
          const userRole = data.user.role;
          const dest = userRole === "admin" ? "/dashboard" : userRole === "ndrf" ? "/map" : "/reports";
          window.location.href = dest;
        }, 1200);

      } else if (mode === "register" && data.ok) {
        setMode("login"); setSelectedRole(""); setError("");
        alert(`Account created! You can now log in as ${username}.`);
        setLoading(false);
      }
    } catch {
      setError("Cannot reach Stride server. Is the backend running?");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("stride_token");
    localStorage.removeItem("stride_user");
    setCurrentUser(null);
  };

  return (
    <>
      {showLanding && <LandingPage onEnter={() => setShowLanding(false)} />}
      
      {/* Redesigned Login Page */}
      <main style={{ 
        minHeight: '100vh', 
        position: 'relative', 
        display: showLanding ? 'none' : 'flex',
        flexDirection: 'column',
        background: '#020617',
        color: 'white',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
      }}>
        
        {/* Background 3D Visualization */}
        <LoginVisualization />

        {/* Transition Overlay */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "white",
          opacity: isTransitioning ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 1.2s ease-in-out",
          zIndex: 9999,
          mixBlendMode: "overlay"
        }} />

        {/* Minimal Navigation */}
        <nav style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem 3rem',
          pointerEvents: 'none'
        }}>
          {/* Top Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/stride_ai_logo.png" alt="STRIDE-AI" style={{ height: "40px", width: "40px", objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "2px" }}>STRIDE-AI</div>
              <div style={{ fontSize: "0.7rem", color: "#38bdf8", letterSpacing: "1px", fontWeight: 600, marginTop: "4px" }}>● AI FORECASTING SYSTEM</div>
            </div>
          </div>
          
          {/* Top Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, letterSpacing: "1px" }}>SYSTEM STATUS <span style={{ color: "white" }}>ONLINE</span></div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>Language: <span style={{ color: "white" }}>EN</span></div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 5%',
          opacity: mounted && !showLanding ? 1 : 0,
          transform: mounted && !showLanding ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 0.5s',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          
          {/* Left Side: Empty space to let 3D visualization show */}
          <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
            {/* 3D Model is here underneath */}
          </div>

          {/* Right Side: Glassmorphism Login Panel */}
          <div style={{
            flex: '1 1 40%',
            maxWidth: '480px',
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "16px",
            padding: "3rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(56, 189, 248, 0.05)",
            position: "relative",
            overflow: "hidden",
            marginLeft: "auto",
            transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease",
            transform: isTransitioning ? "scale(1.05) translateZ(50px)" : "scale(1)",
            opacity: isTransitioning ? 0 : 1,
          }}>
            {/* Top accent glow */}
            <div style={{ position: "absolute", top: 0, left: "10%", width: "80%", height: "1px", background: "linear-gradient(90deg, transparent, #38bdf8, transparent)", opacity: 0.8 }} />

            {mounted && currentUser ? (
              /* ── LOGGED IN STATE ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', margin: '1rem 0' }}>
                  {currentUser.role === 'admin' ? '🛰️' : currentUser.role === 'ndrf' ? '🚨' : '🏠'}
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: '0.25rem' }}>Welcome back!</h3>
                <p style={{ fontSize: '0.9rem', color: "#94a3b8", marginBottom: '0.25rem' }}>{currentUser.username}</p>
                <span style={{
                  display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
                  background: currentUser.role === 'admin' ? 'rgba(29, 78, 216, 0.2)' : currentUser.role === 'ndrf' ? 'rgba(194, 65, 12, 0.2)' : 'rgba(6, 95, 70, 0.2)',
                  color: currentUser.role === 'admin' ? '#60a5fa' : currentUser.role === 'ndrf' ? '#fb923c' : '#34d399',
                  border: `1px solid ${currentUser.role === 'admin' ? '#3b82f6' : currentUser.role === 'ndrf' ? '#ea580c' : '#10b981'}`,
                  padding: '4px 12px', borderRadius: '20px', marginBottom: '2rem',
                }}>
                  {currentUser.role_label}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {currentUser.role === 'admin' && (
                    <a href="/dashboard" className="glass-btn">
                      🛰️ Go to AI Dashboard
                    </a>
                  )}
                  {(currentUser.role === 'admin' || currentUser.role === 'ndrf') && (
                    <a href="/map" className="glass-btn warning-btn">
                      🗺️ Interactive Map
                    </a>
                  )}
                  <a href="/reports" className="glass-btn success-btn">
                    📋 Bulletins &amp; Reports
                  </a>
                </div>

                <button onClick={handleLogout} style={{
                  marginTop: '2rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', width: '100%',
                  fontSize: '0.85rem', fontWeight: 600, transition: "all 0.2s"
                }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  Sign Out
                </button>
              </div>
            ) : (
              /* ── NOT LOGGED IN ── */
              <>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.25rem 0" }}>
                  {mode === 'login' ? 'ACCESS STRIDE-AI' : 'INITIALIZE ACCOUNT'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: "#64748b", marginBottom: '2rem', letterSpacing: "1px" }}>
                  AI FORECASTING COMMAND CENTER
                </p>

                {mode === 'login' ? (
                  <form onSubmit={handleAuthSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Email / Username</label>
                      <input 
                        type="text" 
                        className="glass-input" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                      />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Password</label>
                      <input 
                        type="password" 
                        className="glass-input" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2rem', color: '#94a3b8' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: "#0ea5e9" }} /> Remember me
                      </label>
                      <span style={{ cursor: 'pointer', color: "#38bdf8", transition: "color 0.2s" }}>Forgot?</span>
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>⚠️ {error}</div>}

                    <button type="submit" disabled={loading} className="primary-glass-btn">
                      {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM →'}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", margin: '2rem 0', opacity: 0.3 }}>
                      <div style={{ flex: 1, height: "1px", background: "white" }} />
                      <div style={{ padding: "0 1rem", fontSize: '0.75rem', fontWeight: 600, letterSpacing: "1px" }}>OR</div>
                      <div style={{ flex: 1, height: "1px", background: "white" }} />
                    </div>

                    <button type="button" onClick={() => { setMode('register'); setError(''); setSelectedRole(''); }}
                      className="secondary-glass-btn">
                      CREATE NEW ACCOUNT
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Clearance Level / Role</label>
                      <select className="glass-input" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required>
                        <option value="" style={{ color: "black" }}>Select Role...</option>
                        <option value="admin" style={{ color: "black" }}>IMD Official</option>
                        <option value="ndrf" style={{ color: "black" }}>NDRF Responder</option>
                        <option value="civilian" style={{ color: "black" }}>Public User</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Username</label>
                      <input type="text" className="glass-input" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Email (optional)</label>
                      <input type="email" className="glass-input" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Password</label>
                      <input type="password" className="glass-input" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>⚠️ {error}</div>}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" onClick={() => setMode('login')} className="secondary-glass-btn" style={{ flex: 1, padding: "0.85rem" }}>
                        BACK
                      </button>
                      <button type="submit" disabled={loading} className="primary-glass-btn" style={{ flex: 2, padding: "0.85rem" }}>
                        {loading ? 'INITIALIZING...' : 'INITIALIZE'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom System Information */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '2rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: "0.75rem", color: "#64748b", letterSpacing: "2px", fontWeight: 600 }}>REAL-TIME ATMOSPHERIC INTELLIGENCE</div>
          <div style={{ fontSize: "0.75rem", color: "#475569", letterSpacing: "1px", marginTop: "4px" }}>STRIDE-AI FORECAST ENGINE</div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .glass-input {
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .glass-input:focus {
          border-color: rgba(56, 189, 248, 0.6);
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.15);
          background: rgba(15, 23, 42, 0.8);
        }
        .primary-glass-btn {
          width: 100%;
          padding: 1rem;
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 8px;
          color: #38bdf8;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          letterSpacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.1);
        }
        .primary-glass-btn:hover {
          background: rgba(14, 165, 233, 0.25);
          border-color: rgba(56, 189, 248, 0.8);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.25);
          transform: translateY(-2px);
          color: white;
        }
        .secondary-glass-btn {
          width: 100%;
          padding: 1rem;
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 8px;
          color: #cbd5e1;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          letterSpacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .secondary-glass-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(148, 163, 184, 0.6);
          color: white;
        }
        .glass-btn {
          padding: 0.85rem;
          border-radius: 8px;
          background: rgba(29, 78, 216, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #60a5fa;
          text-decoration: none;
          text-align: center;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .glass-btn:hover {
          background: rgba(29, 78, 216, 0.25);
          border-color: #3b82f6;
          color: white;
          transform: translateY(-2px);
        }
        .warning-btn {
          background: rgba(194, 65, 12, 0.15);
          border-color: rgba(249, 115, 22, 0.4);
          color: #fb923c;
        }
        .warning-btn:hover {
          background: rgba(194, 65, 12, 0.25);
          border-color: #f97316;
        }
        .success-btn {
          background: rgba(6, 95, 70, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: #34d399;
        }
        .success-btn:hover {
          background: rgba(6, 95, 70, 0.25);
          border-color: #10b981;
        }
      `}} />
    </>
  );
}
