'use client';
import React, { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const ROLE_COLORS: Record<string,string> = {
  admin:    '#3b82f6',
  ndrf:     '#f97316',
  civilian: '#10b981',
};
const ROLE_ICONS: Record<string,string> = {
  admin: '🛰️', ndrf: '🚨', civilian: '🏠',
};

import { usePathname } from 'next/navigation';

function NavShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('stride_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('stride_token');
    localStorage.removeItem('stride_user');
    window.location.href = '/login';
  };

  if (!mounted) return <>{children}</>;

  const isHome = pathname === '/' || pathname === '/login';

  return (
    <>
      {!isHome && (
        <>
          <header className="top-header">
            <div className="brand-section">
              <div className="logo-placeholder"></div>
              <div className="brand-text">
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STRIDE - AI</h1>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TRACK MOES SIH
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'white' }}>Language: English</span>
                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                   🔍
                </div>
              </div>
              
              {user && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{
                    background: ROLE_COLORS[user.role] + '22',
                    border: `1px solid ${ROLE_COLORS[user.role]}`,
                    color: ROLE_COLORS[user.role],
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em',
                  }}>
                    {ROLE_ICONS[user.role]} {user.username}
                  </span>
                  <button onClick={handleLogout} style={{
                    background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
                    color: '#ef4444', padding: '4px 12px', borderRadius: '8px',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </header>

          <nav className="nav-bar-global">
            <a href="/" className="nav-link">HOME</a>
            
            {user && (
              <>
                {user.role === 'admin' && (
                  <a href="/dashboard" className="nav-link">AI DASHBOARD</a>
                )}
                
                {(user.role === 'admin' || user.role === 'ndrf') && (
                  <a href="/map" className="nav-link">INTERACTIVE MAP</a>
                )}
                
                <a href="/reports" className="nav-link">BULLETINS &amp; REPORTS</a>
                
                {user.role === 'admin' && (
                  <a href="/history" className="nav-link" style={{ color: '#38bdf8' }}>📦 DATA HISTORY</a>
                )}
              </>
            )}
          </nav>
        </>
      )}

      {children}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Stride AI — SIH 2026 | MoES Cyclone Intelligence</title>
        <meta name="description" content="AI-powered cyclone trajectory prediction for the Indian Ocean. Developed for Smart India Hackathon 2026, Ministry of Earth Sciences track." />
      </head>
      <body className={inter.className}>
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
