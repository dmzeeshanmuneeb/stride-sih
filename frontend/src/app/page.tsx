"use client";
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Globe2 } from 'lucide-react';
import LandingPage from '../components/LandingPage';
import LoginVisualization from '../components/LoginVisualization';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Framer Motion Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const FloatingLabelInput = ({ label, type, value, onChange, required = false }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", marginBottom: "1.5rem" }} className="input-group">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="glass-input"
        placeholder=" "
      />
      <label className={`floating-label ${(focused || value) ? 'active' : ''}`}>
        {label}
      </label>
      <div className="input-glow" />
    </div>
  );
};

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('stride_user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch { }

    const updateCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateCursor);
    return () => window.removeEventListener('mousemove', updateCursor);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

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
        setIsTransitioning(true);
        setTimeout(() => {
          const userRole = data.user.role;
          const dest = userRole === "admin" ? "/dashboard" : userRole === "ndrf" ? "/map" : "/reports";
          window.location.href = dest;
        }, 1500);

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
      
      {/* Custom Global Cursor Glow */}
      <div className="cursor-glow" style={{ left: cursorPos.x, top: cursorPos.y }} />

      <main style={{ 
        minHeight: '100vh', 
        position: 'relative', 
        display: showLanding ? 'none' : 'flex',
        flexDirection: 'column',
        background: '#05070d',
        color: '#EAEAEA',
        fontFamily: "'Space Grotesk', sans-serif",
        overflow: 'hidden'
      }}>
        
        <LoginVisualization />

        <div className="noise-overlay" />

        {/* Transition Overlay */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "#05070d",
          opacity: isTransitioning ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 9999
        }} />

        {/* Top Navbar */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2rem 4%',
            pointerEvents: 'none'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="logo-glow">
              <Globe2 size={28} color="#2fd4ff" />
            </div>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "2px", color: "#FFFFFF", textShadow: "0 0 10px rgba(47, 212, 255, 0.5)" }}>
                STRIDE-AI
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", pointerEvents: "auto" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: "rgba(5,7,13,0.5)", padding: "8px 16px", borderRadius: "20px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="status-dot" />
              <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "1.5px", color: "#2fd4ff" }}>SYSTEM ONLINE</div>
            </div>
            <select className="lang-select">
              <option value="en">EN</option>
              <option value="hi">HI</option>
            </select>
          </div>
        </motion.nav>

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
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          
          <div style={{ flex: '1 1 50%', minWidth: '300px', pointerEvents: 'none' }} />

          <motion.div 
            initial="hidden"
            animate={mounted && !showLanding ? "show" : "hidden"}
            variants={staggerContainer}
            style={{ flex: '1 1 35%', maxWidth: '440px', marginLeft: "auto", marginRight: "2rem" }}
          >
            <motion.div 
              variants={fadeUp}
              ref={cardRef}
              className="glass-card"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div className="card-glare" />

              {currentUser ? (
                <div style={{ textAlign: 'left', position: "relative", zIndex: 2 }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#FFFFFF" }}>Welcome back</h3>
                  <p style={{ fontSize: '0.9rem', color: "#8b9bb4", marginBottom: '2rem' }}>{currentUser.username} &mdash; {currentUser.role_label}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {currentUser.role === 'admin' && <a href="/dashboard" className="btn-primary">Go to Dashboard</a>}
                    {(currentUser.role === 'admin' || currentUser.role === 'ndrf') && <a href="/map" className="btn-primary">Interactive Map</a>}
                    <a href="/reports" className="btn-secondary">Bulletins &amp; Reports</a>
                  </div>
                  <button onClick={handleLogout} className="btn-secondary" style={{ marginTop: '2rem', width: '100%' }}>Sign Out</button>
                </div>
              ) : (
                <div style={{ position: "relative", zIndex: 2 }}>
                  <motion.h3 variants={fadeUp} style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#FFFFFF", letterSpacing: "1px" }}>
                    {mode === 'login' ? 'Access Port' : 'Initialize Account'}
                  </motion.h3>
                  <motion.p variants={fadeUp} style={{ fontSize: '0.9rem', color: "#8b9bb4", marginBottom: '2.5rem' }}>
                    Secure gateway to STRIDE-AI cyclone forecasting.
                  </motion.p>

                  <form onSubmit={handleAuthSubmit}>
                    {mode === 'login' ? (
                      <>
                        <motion.div variants={fadeUp}>
                          <FloatingLabelInput label="Email or Username" type="text" value={username} onChange={(e: any) => setUsername(e.target.value)} required />
                        </motion.div>
                        <motion.div variants={fadeUp}>
                          <FloatingLabelInput label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
                        </motion.div>

                        <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2.5rem', color: '#8b9bb4' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked className="cyber-checkbox" /> Remember me
                          </label>
                          <span className="hover-cyan" style={{ cursor: 'pointer', transition: "color 0.2s" }}>
                            Forgot password?
                          </span>
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <motion.div variants={fadeUp} style={{ marginBottom: "1.5rem" }} className="input-group">
                          <select className="glass-input active" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required>
                            <option value="" disabled>Select Clearance Level...</option>
                            <option value="admin">IMD Official</option>
                            <option value="ndrf">NDRF Responder</option>
                            <option value="civilian">Public User</option>
                          </select>
                          <div className="input-glow" />
                        </motion.div>
                        <motion.div variants={fadeUp}><FloatingLabelInput label="Username" type="text" value={username} onChange={(e: any) => setUsername(e.target.value)} required /></motion.div>
                        <motion.div variants={fadeUp}><FloatingLabelInput label="Email (optional)" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} /></motion.div>
                        <motion.div variants={fadeUp}><FloatingLabelInput label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required /></motion.div>
                      </>
                    )}

                    {error && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#ff4a4a', fontSize: '0.8rem', marginBottom: '1.5rem', padding: '12px', background: 'rgba(255, 74, 74, 0.1)', border: '1px solid rgba(255, 74, 74, 0.3)', borderRadius: '6px' }}>
                        {error}
                      </motion.div>
                    )}

                    <motion.div variants={fadeUp} style={{ display: 'flex', gap: '1rem', flexDirection: mode === 'register' ? 'row' : 'column' }}>
                      {mode === 'register' && (
                        <button type="button" onClick={() => setMode('login')} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                      )}
                      
                      <button type="submit" disabled={loading || success} className="btn-primary magnetic-btn" style={{ flex: 2 }}>
                        <div className="btn-shimmer" />
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', position: 'relative', zIndex: 2 }}>
                          {success ? (
                            <><CheckCircle2 size={18} /> Access Granted</>
                          ) : loading ? (
                            <div className="spinner" />
                          ) : (
                            <>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight size={18} className="btn-arrow" /></>
                          )}
                        </span>
                      </button>
                    </motion.div>

                    {mode === 'login' && (
                      <>
                        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", margin: '2rem 0' }}>
                          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
                          <div style={{ padding: "0 1rem", fontSize: '0.7rem', color: "#8b9bb4", letterSpacing: "2px" }}>OR</div>
                          <div style={{ flex: 1, height: "1px", background: "linear-gradient(270deg, transparent, rgba(255,255,255,0.1))" }} />
                        </motion.div>

                        <motion.button variants={fadeUp} type="button" onClick={() => { setMode('register'); setError(''); setSelectedRole(''); }} className="btn-secondary">
                          Create an account
                        </motion.button>
                      </>
                    )}
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>

        <motion.footer 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ position: "absolute", bottom: "1.5rem", width: "100%", textAlign: "center", fontSize: "0.75rem", color: "#8b9bb4", letterSpacing: "1px", pointerEvents: "none", zIndex: 10 }}
        >
          POWERED BY LSTM-CNN <span style={{ color: "#ff7a2f" }}>•</span> TRAINED ON TCIR DATASET
        </motion.footer>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --cyan: #2fd4ff;
          --orange: #ff7a2f;
          --bg-dark: #05070d;
        }

        .cursor-glow {
          position: fixed;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(47, 212, 255, 0.15) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: screen;
        }

        .noise-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1;
        }

        .status-dot {
          width: 8px; height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10b981;
          animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }

        .lang-select {
          background: transparent;
          color: #8b9bb4;
          border: none;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .glass-card {
          position: relative;
          background: rgba(10, 15, 25, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 3rem 2.5rem;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: transform 0.1s ease;
          transform-style: preserve-3d;
          overflow: hidden;
        }
        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(47, 212, 255, 0.5), rgba(255, 122, 47, 0.1) 50%, rgba(255, 255, 255, 0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .card-glare {
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.05), rgba(255,255,255,0));
          transform: skewX(-20deg);
          pointer-events: none;
        }
        .glass-card:hover .card-glare {
          animation: glare 1.5s ease-in-out;
        }
        @keyframes glare { 100% { left: 200%; } }

        .input-group { position: relative; }
        .glass-input {
          width: 100%;
          padding: 1rem 1rem 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s ease;
        }
        .glass-input:focus {
          background: rgba(47, 212, 255, 0.05);
          border-color: rgba(47, 212, 255, 0.4);
        }
        .floating-label {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8b9bb4;
          font-size: 0.9rem;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .floating-label.active {
          top: 0.6rem;
          font-size: 0.65rem;
          color: var(--cyan);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .input-glow {
          position: absolute;
          bottom: -1px; left: 0; width: 0%; height: 1px;
          background: linear-gradient(90deg, var(--cyan), var(--orange));
          transition: width 0.3s ease;
        }
        .glass-input:focus ~ .input-glow { width: 100%; box-shadow: 0 0 10px var(--cyan); }
        
        .cyber-checkbox {
          appearance: none; width: 16px; height: 16px;
          border: 1px solid rgba(255,255,255,0.2); border-radius: 4px;
          background: rgba(255,255,255,0.05); cursor: pointer;
          position: relative; transition: all 0.2s;
        }
        .cyber-checkbox:checked {
          background: var(--cyan); border-color: var(--cyan);
          box-shadow: 0 0 10px rgba(47, 212, 255, 0.5);
        }
        .hover-cyan:hover { color: var(--cyan) !important; text-shadow: 0 0 8px rgba(47, 212, 255, 0.5); }

        .btn-primary {
          position: relative;
          width: 100%; padding: 1rem;
          background: linear-gradient(90deg, #1e6bff, var(--cyan));
          border: none; border-radius: 8px;
          color: #fff; font-family: inherit; font-size: 0.95rem; font-weight: 700;
          letter-spacing: 1px; cursor: pointer; overflow: hidden;
          box-shadow: 0 10px 20px rgba(30, 107, 255, 0.3);
          transition: all 0.3s ease;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(47, 212, 255, 0.4);
        }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-shimmer {
          position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
        }
        .btn-primary:hover .btn-shimmer { animation: shimmer 1s infinite; }
        @keyframes shimmer { 100% { left: 200%; } }
        
        .btn-arrow { transition: transform 0.3s ease; }
        .btn-primary:hover .btn-arrow { transform: translateX(5px); }

        .btn-secondary {
          width: 100%; padding: 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          color: #EAEAEA; font-family: inherit; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3);
        }

        .spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </>
  );
}
