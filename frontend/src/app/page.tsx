"use client";
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

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
        const userRole = data.user.role;
        const dest = userRole === "admin" ? "/dashboard" : userRole === "ndrf" ? "/map" : "/reports";
        window.location.href = dest;
      } else if (mode === "register" && data.ok) {
        setMode("login"); setSelectedRole(""); setError("");
        alert(`Account created! You can now log in as ${username}.`);
      }
    } catch {
      setError("Cannot reach Stride server. Is the backend running?");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("stride_token");
    localStorage.removeItem("stride_user");
    setCurrentUser(null);
  };

  return (
    <main className="animated-bg" style={{ minHeight: '100vh', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rotateEarth {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: url(/satellite_bg.jpg) no-repeat center center;
          background-size: cover;
          transform: scale(1.2);
          animation: rotateEarth 30s ease-in-out infinite;
          z-index: -1;
        }
        .hero-overlay {
           position: fixed !important;
           background: linear-gradient(135deg, rgba(2,6,23,0.8) 0%, rgba(15,23,42,0.2) 100%) !important;
           pointer-events: none;
        }
        .login-card {
           box-shadow: 0 30px 80px rgba(0,0,0,0.7);
           border: 1px solid rgba(255,255,255,0.15) !important;
        }
      `}} />
      <section className="hero-section" style={{ background: 'transparent' }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h2>Better Forecasts<br />for a Safer<br />Tomorrow</h2>
          <p>Advanced Artificial Intelligence for Next-Generation Tropical Cyclone Identification, Intensity Estimation, and Trajectory Forecasting.</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          {mounted && currentUser ? (
            /* ── LOGGED IN STATE ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', margin: '1rem 0' }}>
                {currentUser.role === 'admin' ? '🛰️' : currentUser.role === 'ndrf' ? '🚨' : '🏠'}
              </div>
              <h3 style={{ marginBottom: '0.25rem' }}>Welcome back!</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.25rem' }}>{currentUser.username}</p>
              <span style={{
                display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
                background: currentUser.role === 'admin' ? '#1d4ed8' : currentUser.role === 'ndrf' ? '#c2410c' : '#065f46',
                color: 'white', padding: '3px 12px', borderRadius: '20px', marginBottom: '1.5rem',
              }}>
                {currentUser.role_label}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentUser.role === 'admin' && (
                  <a href="/dashboard" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                    🛰️ Go to AI Dashboard
                  </a>
                )}
                {(currentUser.role === 'admin' || currentUser.role === 'ndrf') && (
                  <a href="/map" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block', background: '#fb923c', border: '1px solid #fb923c', color: 'white' }}>
                    🗺️ Interactive Map
                  </a>
                )}
                <a href="/reports" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block', background: '#34d399', border: '1px solid #34d399', color: 'white' }}>
                  📋 Bulletins &amp; Reports
                </a>
              </div>

              <button onClick={handleLogout} style={{
                marginTop: '1.5rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.5)',
                color: '#ef4444', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', width: '100%',
                fontSize: '0.85rem',
              }}>
                Sign Out
              </button>
            </div>
          ) : (
            /* ── NOT LOGGED IN ── */
            <>
              <h3>Login to Stride AI</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                Access your dashboard for advanced weather and climate intelligence.
              </p>

              {mode === 'login' ? (
                <form onSubmit={handleAuthSubmit}>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <input type="text" className="input-field" placeholder="Username / Email ID" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <input type="password" className="input-field" placeholder="🔒 Password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>

                  <div className="login-options" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '1.5rem', color: '#cbd5e1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" defaultChecked /> Remember me
                    </label>
                    <span style={{ cursor: 'pointer' }}>Forgot Password?</span>
                  </div>

                  {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>{error}</div>}

                  <button type="submit" disabled={loading} className="login-btn" style={{ width: '100%', background: '#0ea5e9' }}>
                    {loading ? 'Authenticating...' : 'Login →'}
                  </button>

                  <div style={{ textAlign: 'center', margin: '1rem 0', opacity: 0.5, fontSize: '0.85rem' }}>OR</div>

                  <button type="button" onClick={() => { setMode('register'); setError(''); setSelectedRole(''); }}
                    className="login-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', width: '100%' }}>
                    + Create New Account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAuthSubmit}>
                  <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <select className="input-field" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <option value="">Select Role...</option>
                      <option value="admin">IMD Official</option>
                      <option value="ndrf">NDRF Responder</option>
                      <option value="civilian">Public User</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <input type="text" className="input-field" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <input type="email" className="input-field" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <input type="password" className="input-field" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>

                  {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>{error}</div>}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setMode('login')} className="login-btn" style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)' }}>
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="login-btn" style={{ flex: 2 }}>
                      {loading ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </section>

      {/* Government Portals */}
      <section className="services-section" style={{
        padding: '4rem 5%', flex: 1
      }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '3rem', fontSize: '1.8rem', fontWeight: 600 }}>Explore Government Portals</h2>
        <div className="services-grid">
          <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer" className="service-card card-blue" style={{ background: 'rgba(33,150,243,0.85)', backdropFilter: 'blur(5px)' }}>
            <div>
              <h4>India Meteorological Dept (IMD)</h4>
              <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '10px' }}>Official weather forecasts, cyclone warnings, and climate data for India.</p>
            </div>
            <div className="read-more">Visit Portal →</div>
          </a>
          <a href="https://moes.gov.in" target="_blank" rel="noopener noreferrer" className="service-card card-yellow" style={{ background: 'rgba(251,192,45,0.9)', backdropFilter: 'blur(5px)' }}>
            <div>
              <h4>Ministry of Earth Sciences</h4>
              <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>Central policies and guidelines for atmospheric and oceanic research.</p>
            </div>
            <div className="read-more">Visit Portal →</div>
          </a>
          <a href="https://ndma.gov.in" target="_blank" rel="noopener noreferrer" className="service-card card-green" style={{ background: 'rgba(76,175,80,0.85)', backdropFilter: 'blur(5px)' }}>
            <div>
              <h4>National Disaster Mgmt</h4>
              <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>Disaster response, NDRF coordination, and national safety guidelines.</p>
            </div>
            <div className="read-more">Visit Portal →</div>
          </a>
        </div>
      </section>
    </main>
  );
}
