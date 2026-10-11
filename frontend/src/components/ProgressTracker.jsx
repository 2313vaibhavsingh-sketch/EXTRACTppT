import React from 'react';

const S = {
  wrap: { maxWidth: 680, margin: '0 auto 48px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 18, padding: '28px 32px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  badge: { display: 'inline-block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(99,102,241,0.3)', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 700, color: 'white', margin: 0 },
  pct: { fontSize: 34, fontWeight: 800, color: '#818cf8', letterSpacing: '-1px' },
  barOuter: { width: '100%', height: 10, background: 'rgba(15,23,42,0.9)', borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(51,65,85,0.6)', marginBottom: 24 },
  stagesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 },
  logBox: { background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(51,65,85,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 12 },
  spinner: { width: 14, height: 14, border: '2px solid rgba(129,140,248,0.3)', borderTop: '2px solid #818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 },
};

const STAGES = [
  { id: 'downloading', label: 'Video Stream', icon: '📥' },
  { id: 'extracting', label: 'Frame Analysis', icon: '🔍' },
  { id: 'compiling', label: 'PDF Compile', icon: '📄' },
];

function getStageState(stageId, status) {
  if (status === 'completed') return 'done';
  if (stageId === 'downloading') {
    if (status === 'fetching_info' || status === 'downloading') return 'active';
    if (status === 'extracting' || status === 'compiling') return 'done';
  }
  if (stageId === 'extracting') {
    if (status === 'extracting') return 'active';
    if (status === 'compiling') return 'done';
  }
  if (stageId === 'compiling') {
    if (status === 'compiling') return 'active';
  }
  return 'pending';
}

export default function ProgressTracker({ progress, status, message, slideCount, onCancel }) {
  return (
    <div style={{ padding: '0 24px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <span style={S.badge}>⚡ Pipeline Active</span>
            <h3 style={S.title}>Extracting Lecture Presentation...</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={S.pct}>{Math.round(progress)}%</span>
            {onCancel && (
              <button
                onClick={onCancel}
                title="Cancel & restart"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={S.barOuter}>
          <div style={{ height: '100%', width: `${Math.max(5, progress)}%`, background: 'linear-gradient(90deg, #4f46e5, #8b5cf6, #ec4899)', borderRadius: 99, transition: 'width 0.5s ease', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.15)', animation: 'pulse 2s infinite' }}></div>
          </div>
        </div>

        {/* Stage Pills */}
        <div style={S.stagesGrid}>
          {STAGES.map(stage => {
            const state = getStageState(stage.id, status);
            const isActive = state === 'active';
            const isDone = state === 'done';
            return (
              <div key={stage.id} style={{
                padding: '10px 12px', borderRadius: 10, border: `1px solid ${isActive ? '#6366f1' : isDone ? 'rgba(16,185,129,0.4)' : 'rgba(51,65,85,0.6)'}`,
                background: isActive ? 'rgba(99,102,241,0.15)' : isDone ? 'rgba(16,185,129,0.05)' : 'rgba(15,23,42,0.5)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{stage.icon}</span>
                  {isActive && <span style={S.spinner}></span>}
                  {isDone && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', alignSelf: 'center' }}></span>}
                </div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: isActive ? '#a5b4fc' : isDone ? '#6ee7b7' : '#475569' }}>{stage.label}</p>
              </div>
            );
          })}
        </div>

        {/* Log Line */}
        <div style={S.logBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <span style={S.spinner}></span>
            <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message || 'Processing...'}</span>
          </div>
          {slideCount > 0 && (
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, background: 'rgba(51,65,85,0.8)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6, marginLeft: 10 }}>{slideCount} slides</span>
          )}
        </div>
      </div>
    </div>
  );
}
