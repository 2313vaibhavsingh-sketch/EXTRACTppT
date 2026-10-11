import React from 'react';

export default function Navbar() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(15,23,42,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(51,65,85,0.8)',
      boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #6366f1, #8b5cf6)', padding: 2, boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
            <div style={{ width: '100%', height: '100%', background: '#0f172a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              📄
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>SlideExtract</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', padding: '2px 8px', borderRadius: 20 }}>
                ✨ AI Powered
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 500, margin: 0 }}>YouTube Lecture to PDF Notes</p>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#94a3b8', background: 'rgba(15,23,42,0.8)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(51,65,85,0.8)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
          FastAPI Backend Active
        </div>
      </div>
    </header>
  );
}
