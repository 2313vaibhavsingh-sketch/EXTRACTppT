import React from 'react';
import { getFullApiUrl } from '../api';

const S = {
  wrap: { maxWidth: 780, margin: '0 auto 48px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 18, padding: '28px 32px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  successBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6ee7b7', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '5px 12px', borderRadius: 20, marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: '1fr', gap: 24 },
  imgWrap: { position: 'relative', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#0f172a', border: '1px solid rgba(51,65,85,0.8)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  videoTitle: { fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  statRow: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statBadge: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', background: 'rgba(15,23,42,0.9)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(51,65,85,0.8)' },
  dlBtn: { width: '100%', background: 'linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 20px rgba(99,102,241,0.4)', fontFamily: 'Inter, sans-serif', marginBottom: 10, textDecoration: 'none' },
  secondaryRow: { display: 'flex', gap: 10 },
  secBtn: { flex: 1, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.8)', color: '#cbd5e1', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif', textDecoration: 'none' },
};

export default function PdfPreviewCard({ taskData, onReset }) {
  const { task_id, video_title, video_duration, slide_count, pdf_filename, download_url, preview_url } = taskData;
  const dur = video_duration ? `${Math.floor(video_duration / 60)}m ${Math.floor(video_duration % 60)}s` : null;
  const dlHref = getFullApiUrl(download_url || `/api/download/${task_id}`);
  const previewSrc = getFullApiUrl(preview_url || `/api/preview/${task_id}`);

  return (
    <div style={{ padding: '0 24px' }}>
      <style>{`.dl-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(99,102,241,0.55) !important; } .sec-btn:hover { background: rgba(51,65,85,0.8) !important; color: white !important; }`}</style>
      <div style={S.wrap}>
        <div style={S.successBadge}>✅ PDF Notes Generated Successfully!</div>

        {/* Content area: image + info stacked on mobile, side by side on bigger */}
        <div style={{ ...S.grid, gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)', gap: 28 }}>
          {/* Preview Image */}
          <div style={S.imgWrap}>
            <img src={previewSrc} alt="First Slide Preview" style={S.img}
              onError={e => { e.target.style.display = 'none'; }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '20px 12px 10px' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', background: 'rgba(15,23,42,0.9)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(51,65,85,0.8)' }}>📄 Slide #1 Preview</span>
            </div>
          </div>

          {/* Info & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={S.videoTitle}>{video_title || 'YouTube Lecture Notes'}</h3>
              <div style={S.statRow}>
                <span style={S.statBadge}>🖼 <strong style={{ color: 'white' }}>{slide_count}</strong> Unique Slides</span>
                {dur && <span style={S.statBadge}>⏱ {dur}</span>}
                {pdf_filename && <span style={S.statBadge}>📁 {pdf_filename.slice(0, 20)}...</span>}
              </div>
            </div>

            {/* Buttons */}
            <div>
              <a href={dlHref} download={pdf_filename || 'lecture_slides.pdf'} style={S.dlBtn} className="dl-btn">
                ⬇ Download PDF Notes ({slide_count} Pages)
              </a>
              <div style={S.secondaryRow}>
                <a href={dlHref} target="_blank" rel="noopener noreferrer" style={S.secBtn} className="sec-btn">🔗 Open in Browser</a>
                <button onClick={onReset} style={S.secBtn} className="sec-btn">↺ Convert Another</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
