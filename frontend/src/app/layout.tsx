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
        <title>STRIDE-AI | MoES Intelligence</title>
        <meta name="description" content="Professional Meteorological Operations Software" />
      </head>
      <body className={inter.className} style={{ margin: 0, padding: 0, backgroundColor: '#07111F', color: '#f5f5f7' }}>
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

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <header style={{
        height: '72px',
        backgroundColor: '#0A1422',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/stride_ai_logo.png" alt="Logo" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.05em', color: '#f5f5f7' }}>STRIDE-AI</h1>
            <span style={{ fontSize: '0.7rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MoES SIH Operations</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86868b', fontSize: '0.85rem' }}>
            <span>EN</span>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ cursor: 'pointer' }}>Search...</span>
          </div>
          
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user.username}</span>
                <span style={{ fontSize: '0.7rem', color: '#3b82f6', textTransform: 'uppercase' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f5f5f7',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <aside style={{
          width: '240px',
          backgroundColor: '#07111F',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.65rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 24px', marginBottom: '12px' }}>
            Intelligence
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
              <div style={{ fontSize: '0.65rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 24px', margin: '24px 0 12px' }}>
                Data & Archives
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <NavLink href="/history" label="Data History" isActive={pathname === '/history'} />
              </nav>
            </>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0D1826', padding: '32px' }}>
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
      padding: '8px 24px',
      fontSize: '0.85rem',
      color: isActive ? '#f5f5f7' : '#86868b',
      textDecoration: 'none',
      backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
      borderLeft: `3px solid ${isActive ? '#3b82f6' : 'transparent'}`,
      fontWeight: isActive ? 500 : 400,
      transition: 'all 0.2s'
    }}>
      {label}
    </a>
  );
}
