"use client";
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
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
  const [success, setSuccess] = useState(false);
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
        
        setSuccess(true);
        setTimeout(() => {
          const userRole = data.user.role;
          const dest = userRole === "admin" ? "/dashboard" : userRole === "ndrf" ? "/map" : "/reports";
          window.location.href = dest;
        }, 800);

      } else if (mode === "register" && data.ok) {
        setMode("login"); setSelectedRole(""); setError("");
        alert(`Account created. You can now log in.`);
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
      
      <main className="editorial-layout" style={{ display: showLanding ? 'none' : 'flex' }}>
        
        <LoginVisualization />

        {/* Global Light Grain */}
        <div className="film-grain" />

        {/* Transparent Nav */}
        <nav className="editorial-nav">
          <div className="nav-brand">
            <img src="/stride_ai_logo.png" alt="" style={{ height: "20px", width: "20px", objectFit: "contain" }} />
            <div className="nav-brand-text">
              <span className="nav-title">STRIDE-AI</span>
              <span className="nav-subtitle">TROPICAL CYCLONE INTELLIGENCE</span>
            </div>
          </div>
          <div className="nav-actions">
            <div className="status-indicator">
              <div className="status-dot" />
              <span>SYSTEM ONLINE</span>
            </div>
            <select className="lang-select">
              <option value="en">ENGLISH</option>
              <option value="hi">HINDI</option>
            </select>
          </div>
        </nav>

        {/* Asymmetric Content */}
        <div className="content-container" style={{ opacity: mounted && !showLanding ? 1 : 0, transition: 'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s' }}>
          
          <div className="left-column">
            <h1 className="headline">Forecast the storm before it forms.</h1>
            <p className="sub-headline">AI-powered tropical cyclone intelligence for the Bay of Bengal.</p>
            
            <div className="product-label">
              REAL-TIME ATMOSPHERIC INTELLIGENCE
            </div>
          </div>

          <div className="right-column">
            <div className="login-card">
              {currentUser ? (
                <div>
                  <h3 className="card-title">Welcome back</h3>
                  <p className="card-subtitle">{currentUser.username} &mdash; {currentUser.role_label}</p>
                  
                  <div className="action-stack">
                    {currentUser.role === 'admin' && <a href="/dashboard" className="solid-btn">Go to Dashboard</a>}
                    {(currentUser.role === 'admin' || currentUser.role === 'ndrf') && <a href="/map" className="solid-btn">Interactive Map</a>}
                    <a href="/reports" className="ghost-btn">Bulletins &amp; Reports</a>
                  </div>
                  <button onClick={handleLogout} className="ghost-btn sign-out-btn">Sign Out</button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit}>
                  <h3 className="card-title">{mode === 'login' ? 'Access STRIDE-AI' : 'Create an account'}</h3>
                  <p className="card-subtitle">
                    {mode === 'login' ? 'Sign in to access the forecasting platform.' : 'Register for access.'}
                  </p>

                  {mode === 'login' ? (
                    <>
                      <div className="input-group">
                        <label className="input-label">Email or Username</label>
                        <input type="text" className="flat-input" value={username} onChange={e => setUsername(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Password</label>
                        <input type="password" className="flat-input" value={password} onChange={e => setPassword(e.target.value)} required />
                      </div>

                      <div className="form-meta">
                        <label className="remember-me">
                          <input type="checkbox" className="custom-checkbox" defaultChecked />
                          <span>Remember me</span>
                        </label>
                        <span className="muted-link">Forgot password?</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="input-group">
                        <label className="input-label">Role</label>
                        <select className="flat-input" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required>
                          <option value="" disabled>Select Role...</option>
                          <option value="admin">IMD Official</option>
                          <option value="ndrf">NDRF Responder</option>
                          <option value="civilian">Public User</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Username</label>
                        <input type="text" className="flat-input" value={username} onChange={e => setUsername(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Email (optional)</label>
                        <input type="email" className="flat-input" value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Password</label>
                        <input type="password" className="flat-input" value={password} onChange={e => setPassword(e.target.value)} required />
                      </div>
                    </>
                  )}

                  {error && <div className="error-message">{error}</div>}

                  <div className="form-actions">
                    <button type="submit" disabled={loading || success} className="solid-btn">
                      {success ? 'Authenticating...' : loading ? (
                        <div className="spinner" />
                      ) : (
                        <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} className="btn-arrow" /></>
                      )}
                    </button>
                  </div>

                  {mode === 'login' ? (
                    <button type="button" onClick={() => { setMode('register'); setError(''); setSelectedRole(''); }} className="ghost-btn mt-4">
                      Create an account
                    </button>
                  ) : (
                    <button type="button" onClick={() => setMode('login')} className="ghost-btn mt-4">
                      Back to login
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');

        :root {
          --base: #05070C;
          --surface: rgba(10, 14, 24, 0.55);
          --text: #EDEFF4;
          --muted: #8A93A6;
          --accent: #ff7a2f;
          --border: rgba(255, 255, 255, 0.08);
          --ease: cubic-bezier(0.22, 1, 0.36, 1);
        }

        .editorial-layout {
          min-height: 100vh;
          position: relative;
          background: var(--base);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          overflow: hidden;
          flex-direction: column;
        }

        .film-grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.035;
          pointer-events: none;
          z-index: 1;
        }

        .editorial-nav {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 4vw;
          pointer-events: none;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .nav-brand-text {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .nav-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text);
          letter-spacing: 0.02em;
        }
        .nav-subtitle {
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 2rem;
          pointer-events: auto;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          color: var(--muted);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .status-dot {
          width: 5px; height: 5px;
          background: #10b981;
          border-radius: 50%;
        }
        .lang-select {
          background: transparent;
          color: var(--muted);
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          cursor: pointer;
          outline: none;
        }

        .content-container {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          align-items: center;
          padding: 0 4vw;
          gap: 4vw;
        }
        .left-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          height: 100%;
        }
        .headline {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(3rem, 6vw, 5.5rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0 0 1rem 0;
          color: var(--text);
          font-weight: 400;
          max-width: 700px;
        }
        .sub-headline {
          font-size: 1.125rem;
          color: var(--muted);
          max-width: 500px;
          line-height: 1.5;
          margin: 0 0 2rem 0;
        }
        .product-label {
          font-size: 0.7rem;
          color: var(--muted);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .right-column {
          flex: 0 0 380px;
        }
        
        .login-card {
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 24px 48px rgba(0,0,0,0.4);
        }
        .card-title {
          font-size: 1.25rem;
          font-weight: 500;
          margin: 0 0 0.25rem 0;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .card-subtitle {
          font-size: 0.875rem;
          color: var(--muted);
          margin: 0 0 2rem 0;
        }

        .input-group { margin-bottom: 1.25rem; }
        .input-label {
          display: block;
          font-size: 0.75rem;
          color: var(--muted);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .flat-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: var(--text);
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s var(--ease);
          box-sizing: border-box;
        }
        .flat-input:focus {
          border-color: rgba(255,255,255,0.3);
          box-shadow: 0 0 0 3px rgba(47, 212, 255, 0.1);
        }

        .form-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .custom-checkbox {
          appearance: none;
          width: 16px; height: 16px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          position: relative;
        }
        .custom-checkbox:checked {
          background: var(--text);
        }
        .muted-link {
          cursor: pointer;
          transition: color 0.2s var(--ease);
        }
        .muted-link:hover { color: var(--text); }

        .solid-btn {
          width: 100%;
          padding: 0.875rem;
          background: var(--text);
          color: var(--base);
          border: none;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          transition: opacity 0.2s var(--ease);
        }
        .solid-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        .solid-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .btn-arrow { transition: transform 0.2s var(--ease); }
        .solid-btn:hover .btn-arrow { transform: translateX(4px); }

        .ghost-btn {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--muted);
          font-size: 0.875rem;
          cursor: pointer;
          transition: color 0.2s var(--ease);
          text-align: center;
          padding: 0.5rem;
        }
        .ghost-btn:hover { color: var(--text); }

        .error-message {
          color: #ff6b6b;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
          padding: 0.75rem;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: 8px;
        }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(0,0,0,0.2); border-top-color: var(--base);
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .action-stack { display: flex; flex-direction: column; gap: 1rem; }
        .sign-out-btn { margin-top: 1rem; }
        .mt-4 { margin-top: 1rem; }

        @media (max-width: 900px) {
          .content-container { flex-direction: column; padding: 2rem 4vw; gap: 2rem; justify-content: center; }
          .left-column { flex: none; height: auto; text-align: center; align-items: center; }
          .headline { font-size: 2.5rem; }
          .technical-footer { position: static; margin-top: 2rem; }
          .right-column { width: 100%; max-width: none; flex: none; }
          .login-card { padding: 2rem; }
        }
      `}} />
    </>
  );
}
