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
        
        setIsTransitioning(true);
        setTimeout(() => {
          const userRole = data.user.role;
          const dest = userRole === "admin" ? "/dashboard" : userRole === "ndrf" ? "/map" : "/reports";
          window.location.href = dest;
        }, 1000);

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
        background: '#111111', // Dark solid base
        color: '#EAEAEA',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
      }}>
        
        {/* Interactive Weather Visualization */}
        <LoginVisualization />

        {/* Transition Overlay */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "#111111",
          opacity: isTransitioning ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 1s ease",
          zIndex: 9999
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
            <div style={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "1px", color: "#FFFFFF" }}>
              STRIDE-AI
            </div>
          </div>
          
          {/* Top Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', color: "#888888", fontSize: "0.8rem", fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
              <div>SYSTEM ONLINE</div>
            </div>
            <div>Language: EN</div>
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
          transform: mounted && !showLanding ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 1.5s ease 0.5s',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          
          {/* Left Side: Empty space for Map/Cyclone */}
          <div style={{ flex: '1 1 50%', minWidth: '300px', pointerEvents: 'none' }}></div>

          {/* Right Side: Restrained Professional Login Panel */}
          <div style={{
            flex: '1 1 35%',
            maxWidth: '420px',
            background: "#171717",
            border: "1px solid #2A2A2A",
            borderRadius: "6px",
            padding: "3rem 2.5rem",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            marginLeft: "auto",
            marginRight: "2rem",
            transition: "opacity 0.5s ease",
            opacity: isTransitioning ? 0 : 1,
          }}>

            {mounted && currentUser ? (
              /* ── LOGGED IN STATE ── */
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem 0", color: "#FFFFFF" }}>Welcome back</h3>
                <p style={{ fontSize: '0.85rem', color: "#888888", marginBottom: '2rem' }}>{currentUser.username} &mdash; {currentUser.role_label}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentUser.role === 'admin' && (
                    <a href="/dashboard" className="pro-btn">Go to Dashboard</a>
                  )}
                  {(currentUser.role === 'admin' || currentUser.role === 'ndrf') && (
                    <a href="/map" className="pro-btn">Interactive Map</a>
                  )}
                  <a href="/reports" className="pro-btn">Bulletins &amp; Reports</a>
                </div>

                <button onClick={handleLogout} className="pro-btn-secondary" style={{ marginTop: '2rem', width: '100%' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              /* ── NOT LOGGED IN ── */
              <>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 500, margin: "0 0 0.25rem 0", color: "#FFFFFF" }}>
                  {mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: "#888888", marginBottom: '2.5rem' }}>
                  Access the STRIDE-AI forecasting platform.
                </p>

                {mode === 'login' ? (
                  <form onSubmit={handleAuthSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#888888", marginBottom: "0.5rem" }}>Email / Username</label>
                      <input 
                        type="text" 
                        className="pro-input" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                      />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#888888", marginBottom: "0.5rem" }}>Password</label>
                      <input 
                        type="password" 
                        className="pro-input" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2.5rem', color: '#888888' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: "#444" }} /> Remember me
                      </label>
                      <span style={{ cursor: 'pointer', transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = '#888888'}>
                        Forgot password?
                      </span>
                    </div>

                    {error && <div style={{ color: '#FCA5A5', fontSize: '0.8rem', marginBottom: '1.5rem', padding: '12px', background: '#3F1D1D', border: '1px solid #7F1D1D', borderRadius: '4px' }}>{error}</div>}

                    <button type="submit" disabled={loading} className="pro-btn primary">
                      {loading ? 'Authenticating...' : 'SIGN IN →'}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", margin: '2rem 0' }}>
                      <div style={{ flex: 1, height: "1px", background: "#2A2A2A" }} />
                      <div style={{ padding: "0 1rem", fontSize: '0.7rem', color: "#555555", letterSpacing: "1px" }}>OR</div>
                      <div style={{ flex: 1, height: "1px", background: "#2A2A2A" }} />
                    </div>

                    <button type="button" onClick={() => { setMode('register'); setError(''); setSelectedRole(''); }}
                      className="pro-btn-secondary">
                      Create an account
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#888888", marginBottom: "0.5rem" }}>Role</label>
                      <select className="pro-input" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required>
                        <option value="">Select Role...</option>
                        <option value="admin">IMD Official</option>
                        <option value="ndrf">NDRF Responder</option>
                        <option value="civilian">Public User</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#888888", marginBottom: "0.5rem" }}>Username</label>
                      <input type="text" className="pro-input" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#888888", marginBottom: "0.5rem" }}>Email (optional)</label>
                      <input type="email" className="pro-input" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#888888", marginBottom: "0.5rem" }}>Password</label>
                      <input type="password" className="pro-input" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    {error && <div style={{ color: '#FCA5A5', fontSize: '0.8rem', marginBottom: '1.5rem', padding: '12px', background: '#3F1D1D', border: '1px solid #7F1D1D', borderRadius: '4px' }}>{error}</div>}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" onClick={() => setMode('login')} className="pro-btn-secondary" style={{ flex: 1 }}>
                        Back
                      </button>
                      <button type="submit" disabled={loading} className="pro-btn primary" style={{ flex: 2 }}>
                        {loading ? 'Creating...' : 'Create account'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .pro-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #111111;
          border: 1px solid #333333;
          border-radius: 4px;
          color: #EAEAEA;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .pro-input:focus {
          border-color: #666666;
        }
        
        .pro-btn {
          display: block;
          width: 100%;
          padding: 0.85rem;
          background: #222222;
          border: 1px solid #444444;
          border-radius: 4px;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s ease;
          box-sizing: border-box;
        }
        .pro-btn:hover:not(:disabled) {
          background: #2A2A2A;
        }
        .pro-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .pro-btn.primary {
          background: #EAEAEA;
          color: #111111;
          border-color: #EAEAEA;
          font-weight: 600;
        }
        .pro-btn.primary:hover:not(:disabled) {
          background: #FFFFFF;
        }

        .pro-btn-secondary {
          display: block;
          width: 100%;
          padding: 0.85rem;
          background: transparent;
          border: 1px solid #333333;
          border-radius: 4px;
          color: #A3A3A3;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .pro-btn-secondary:hover {
          color: #EAEAEA;
          border-color: #555555;
          background: #1A1A1A;
        }
      `}} />
    </>
  );
}
