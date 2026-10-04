'use client';
import React, { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>STRIDE-AI | MoES Operational Terminal</title>
        <meta name="description" content="Professional Meteorological Operations Software" />
      </head>
      <body className={inter.className} style={{ margin: 0, padding: 0, backgroundColor: '#f8f9fa', color: '#1f2937' }}>
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}

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
  if (isHome) return <>{children}</>;

  // Determine current module name
  let moduleName = 'Dashboard';
  if (pathname === '/dashboard') moduleName = 'Prediction Model';
  if (pathname === '/map') moduleName = 'Interactive Map';
  if (pathname === '/reports') moduleName = 'Bulletins & Reports';
  if (pathname === '/history') moduleName = 'Data History';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* HEADER - Deep Navy */}
      <header style={{
        height: '64px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* BRAND LOGO - Full color preserved */}
            <img src="/stride_ai_logo.png" alt="Logo" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#f8fafc' }}>STRIDE-AI</h1>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MOES / CYCLONE INTELLIGENCE</span>
            </div>
          </div>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>
          
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc', letterSpacing: '0.02em' }}>
            {moduleName}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em' }}>SYSTEM OPERATIONAL</span>
          </div>
          
          <div style={{ width: '1px', height: '16px', backgroundColor: '#334155' }}></div>
          
          <span style={{ color: '#94a3b8' }}>EN</span>
          
          {user && (
            <>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#334155' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#f8fafc' }}>{user.username} <span style={{ color: '#94a3b8' }}>({user.role})</span></span>
                <button onClick={handleLogout} style={{
                  background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline'
                }}>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR - Deep Navy */}
        <aside style={{
          width: '240px',
          backgroundColor: '#0f172a',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 24px', marginBottom: '12px' }}>
            Intelligence
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {user?.role === 'admin' && (
              <NavLink href="/dashboard" label="Prediction Model" isActive={pathname === '/dashboard'} />
            )}
            {(user?.role === 'admin' || user?.role === 'ndrf') && (
              <NavLink href="/map" label="Interactive Map" isActive={pathname === '/map'} />
            )}
            <NavLink href="/reports" label="Bulletins & Reports" isActive={pathname === '/reports'} />
          </nav>

          {user?.role === 'admin' && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 24px', margin: '32px 0 12px' }}>
                Data
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column' }}>
                <NavLink href="/history" label="Data History" isActive={pathname === '/history'} />
              </nav>
            </>
          )}
        </aside>

        {/* MAIN CONTENT AREA - Light Theme */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8f9fa', padding: '32px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, label, isActive }: { href: string, label: string, isActive: boolean }) {
  return (
    <a href={href} style={{
      display: 'block',
      padding: '10px 24px',
      fontSize: '13px',
      color: isActive ? '#f8fafc' : '#94a3b8',
      textDecoration: 'none',
      backgroundColor: isActive ? '#1e293b' : 'transparent',
      borderLeft: `3px solid ${isActive ? '#3b82f6' : 'transparent'}`,
      fontWeight: isActive ? 500 : 400,
      transition: 'all 0.15s ease'
    }}>
      {label}
    </a>
  );
}
