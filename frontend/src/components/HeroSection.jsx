import React, { useState } from 'react';

const S = {
  section: { padding: '60px 24px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: 12, fontWeight: 600, marginBottom: 24 },
  h1: { fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 800, color: 'white', lineHeight: 1.1, margin: '0 0 20px', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', letterSpacing: '-1px' },
  subtitle: { fontSize: 16, color: '#94a3b8', maxWidth: 640, margin: '0 auto 48px', lineHeight: 1.7 },
  formBox: { maxWidth: 680, margin: '0 auto 16px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 18, padding: 10, boxShadow: '0 25px 50px rgba(0,0,0,0.4)' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  inputWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', minWidth: 200 },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 15, fontWeight: 500, fontFamily: 'Inter, sans-serif', minWidth: 0 },
  btn: { background: 'linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(99,102,241,0.35)', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' },
  hintsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 10, padding: '0 4px', fontSize: 12, color: '#64748b' },
  sampleBtn: { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 6, padding: '4px 10px', color: '#cbd5e1', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  settingsBtn: { background: 'none', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' },
  settingsBox: { maxWidth: 680, margin: '0 auto 32px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '20px 24px', textAlign: 'left' },
  label: { fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 },
  range: { width: '100%', accentColor: '#6366f1', marginBottom: 4 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 40, borderTop: '1px solid rgba(30,41,59,1)', paddingTop: 40 },
  featureCard: { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' },
  featureIcon: { fontSize: 22, flexShrink: 0 },
  featureTitle: { fontSize: 11, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  featureDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.5 },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' },
};

const SAMPLES = [
  { label: '🎓 MIT CS Lecture', url: 'https://www.youtube.com/watch?v=k6U-i4gXkLM' },
];

export default function HeroSection({ url, setUrl, onConvert, isLoading, sampleInterval, setSampleInterval, hashThreshold, setHashThreshold }) {
  const [showSettings, setShowSettings] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && !isLoading) onConvert();
  };

  return (
    <section style={S.section}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input::placeholder { color: #475569; }
        .sample-btn:hover { background: rgba(99,102,241,0.15) !important; border-color: rgba(99,102,241,0.4) !important; color: #a5b4fc !important; }
        .cta-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(99,102,241,0.5) !important; }
        .cta-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .feature-card:hover { border-color: rgba(71,85,105,0.9) !important; }
      `}</style>

      {/* Badge */}
      <div style={S.badge}>
        📄 Convert Video Lectures into Clean PDF Slides in Seconds
      </div>

      {/* Hero H1 */}
      <h1 style={S.h1}>
        Turn YouTube Lectures into{' '}
        <br />
        <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Printable PDF Slide Notes
        </span>
      </h1>

      <p style={S.subtitle}>
        Paste any YouTube lecture link. Our AI frame analyzer automatically strips duplicate frames, speaker webcam shots and transition noise — then compiles a crisp PDF study guide.
      </p>

      {/* Input Card */}
      <form onSubmit={handleSubmit}>
        <div style={S.formBox}>
          <div style={S.inputRow}>
            <div style={S.inputWrap}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>▶️</span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL — youtube.com/watch, /live, /shorts, youtu.be..."
                style={S.input}
                disabled={isLoading}
                autoFocus
              />
              {url && !isLoading && (
                <button type="button" onClick={() => setUrl('')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
              )}
            </div>
            <button type="submit" disabled={!url.trim() || isLoading} style={S.btn} className="cta-btn">
              {isLoading ? (
                <><span style={S.spinner}></span> Processing...</>
              ) : (
                <>Generate PDF Notes →</>
              )}
            </button>
          </div>
        </div>

        {/* Hints Row */}
        <div style={S.hintsRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#475569' }}>Try sample:</span>
            {SAMPLES.map((s, i) => (
              <button key={i} type="button" className="sample-btn" style={S.sampleBtn} onClick={() => setUrl(s.url)}>{s.label}</button>
            ))}
          </div>
          <button type="button" style={S.settingsBtn} onClick={() => setShowSettings(v => !v)}>
            {showSettings ? '▲ Hide Options' : '⚙ Extraction Settings'}
          </button>
        </div>
      </form>

      {showSettings && (
        <div style={S.settingsBox}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366f1', marginTop: 0, marginBottom: 4 }}>⚙ Frame Extraction Options</p>
          <p style={{ fontSize: 11, color: '#475569', marginTop: 0, marginBottom: 20 }}>
            Slide sirf tabhi save hoti hai jab screen <strong style={{color:'#818cf8'}}>poori tarah stable</strong> ho jaye — animations/builds ke beech me nahi.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <label style={S.label}>
                ⏱ Slide Stability Window: <span style={{ color: '#818cf8' }}>{sampleInterval}s</span>
              </label>
              <input type="range" min="0.5" max="5" step="0.5" value={sampleInterval} onChange={e => setSampleInterval(parseFloat(e.target.value))} style={S.range} />
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
                Slide kitne seconds tak <em>still</em> rahe tab save ho. <br/>
                <span style={{color:'#10b981'}}>↑ Zyada (3-5s):</span> Sirf poori settled slides.<br/>
                <span style={{color:'#f59e0b'}}>↓ Kam (0.5-1s):</span> Fast transitions bhi capture.
              </p>
            </div>
            <div>
              <label style={S.label}>
                🎯 New Slide Sensitivity: <span style={{ color: '#818cf8' }}>{hashThreshold}</span>
              </label>
              <input type="range" min="4" max="25" step="1" value={hashThreshold} onChange={e => setHashThreshold(parseInt(e.target.value))} style={S.range} />
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
                Last saved slide se kitna alag hona chahiye.<br/>
                <span style={{color:'#10b981'}}>↑ Zyada (15-25):</span> Sirf major slide changes.<br/>
                <span style={{color:'#f59e0b'}}>↓ Kam (4-8):</span> Choti changes bhi alag slide bane.
              </p>
            </div>
          </div>
          <div style={{marginTop: 16, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, color: '#a5b4fc'}}>
            💡 <strong>Recommended for normal lectures:</strong> Stability = <strong>2.0s</strong>, Sensitivity = <strong>12</strong>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div style={S.featureGrid}>
        {[
          { icon: '🔍', title: 'Duplicate Removal', desc: 'Perceptual hashing filters redundant frames & webcam shots automatically.' },
          { icon: '⚡', title: 'Fast Stream Processing', desc: 'yt-dlp downloads optimized 360p/480p streams — no wasted bandwidth.' },
          { icon: '📄', title: 'Vector-Grade PDF', desc: 'img2pdf compiles slides into a crisp, high-resolution downloadable PDF.' },
        ].map((f, i) => (
          <div key={i} style={S.featureCard} className="feature-card">
            <span style={S.featureIcon}>{f.icon}</span>
            <div>
              <div style={S.featureTitle}>{f.title}</div>
              <div style={S.featureDesc}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
