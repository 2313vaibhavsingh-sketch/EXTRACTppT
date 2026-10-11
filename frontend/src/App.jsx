import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProgressTracker from './components/ProgressTracker';
import PdfPreviewCard from './components/PdfPreviewCard';

export default function App() {
  const [url, setUrl] = useState('');
  const [sampleInterval, setSampleInterval] = useState(2.0);
  const [hashThreshold, setHashThreshold] = useState(10);

  const [taskState, setTaskState] = useState('idle'); // idle | processing | completed | failed
  const [taskData, setTaskData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const pollingRef = useRef(null);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleStartConversion = async () => {
    if (!url.trim()) return;
    if (pollingRef.current) clearInterval(pollingRef.current);

    setTaskState('processing');
    setErrorMessage(null);
    setTaskData({ task_id: null, progress: 3, status: 'queued', message: 'Submitting request...', slide_count: 0 });

    try {
      const res = await api.post('/api/convert', {
        youtube_url: url.trim(),
        sample_interval_sec: sampleInterval,
        hash_threshold: hashThreshold,
      });
      const initial = res.data;
      setTaskData(initial);
      startPolling(initial.task_id);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to start processing. Check the URL and try again.';
      setTaskState('failed');
      setErrorMessage(msg);
    }
  };

  const startPolling = (taskId) => {
    let failCount = 0;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/status/${taskId}`);
        const data = res.data;
        setTaskData(data);
        failCount = 0; // reset error counter on success
        if (data.status === 'completed') {
          clearInterval(pollingRef.current);
          setTaskState('completed');
        } else if (data.status === 'failed') {
          clearInterval(pollingRef.current);
          setTaskState('failed');
          setErrorMessage(data.error || 'Processing failed.');
        }
      } catch (e) {
        failCount += 1;
        if (e.response?.status === 404 || failCount >= 3) {
          clearInterval(pollingRef.current);
          setTaskState('failed');
          setErrorMessage(
            e.response?.status === 404
              ? 'Task session expired due to server update. Please click Retry below to start conversion.'
              : 'Connection lost to conversion pipeline. Please retry.'
          );
        }
      }
    }, 1200);
  };

  const handleReset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setTaskState('idle');
    setTaskData(null);
    setErrorMessage(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0f172a' }}>
      <div>
        <Navbar />
        <HeroSection
          url={url} setUrl={setUrl}
          onConvert={handleStartConversion}
          isLoading={taskState === 'processing'}
          sampleInterval={sampleInterval} setSampleInterval={setSampleInterval}
          hashThreshold={hashThreshold} setHashThreshold={setHashThreshold}
        />

        {/* Processing */}
        {taskState === 'processing' && taskData && (
          <ProgressTracker
            progress={taskData.progress || 0}
            status={taskData.status}
            message={taskData.message}
            slideCount={taskData.slide_count || 0}
            onCancel={handleReset}
          />
        )}

        {/* Done */}
        {taskState === 'completed' && taskData && (
          <PdfPreviewCard taskData={taskData} onReset={handleReset} />
        )}

        {/* Error */}
        {taskState === 'failed' && (
          <div style={{ maxWidth: 680, margin: '0 auto 48px', padding: '0 24px' }}>
            <div style={{ background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#fca5a5' }}>Conversion Failed</h4>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#f87171', lineHeight: 1.6 }}>{errorMessage}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={handleStartConversion} style={{ background: 'rgba(127,29,29,0.4)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>↺ Retry</button>
                  <button onClick={handleReset} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif', textDecoration: 'underline' }}>Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(30,41,59,1)', padding: '20px 24px', textAlign: 'center', fontSize: 12, color: '#475569', background: 'rgba(15,23,42,0.85)' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} YouTube Lecture to PDF Converter — Built with FastAPI + React · OpenCV · yt-dlp · img2pdf</p>
      </footer>
    </div>
  );
}
