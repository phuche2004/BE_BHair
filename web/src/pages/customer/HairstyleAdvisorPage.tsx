import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzePhoto, tryStyle } from '../../api/hairstyle.api';
import type { AnalyzeResponse } from '../../api/hairstyle.api';

/* ────────────────────────────────────────────────────── */
/*  Inline SVG Icons                                      */
/* ────────────────────────────────────────────────────── */
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

/* ────────────────────────────────────────────────────── */
/*  Component                                              */
/* ────────────────────────────────────────────────────── */
type Step = 'input' | 'analyzing' | 'results';

export default function HairstyleAdvisorPage() {
  const [step, setStep] = useState<Step>('input');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [tryingStyle, setTryingStyle] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Attach stream to video element when camera becomes active
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  /* ── File upload handler ─────────────────────────────── */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, ...)');
      return;
    }

    setCurrentFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  /* ── Camera handlers ─────────────────────────────────── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setError('');
      setPreviewUrl('');
      setCurrentFile(null);
    } catch {
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d')!;
    // Mirror for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
      setCurrentFile(file);
      setPreviewUrl(URL.createObjectURL(blob));

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    }, 'image/jpeg', 0.92);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  /* ── Analyze ─────────────────────────────────────────── */
  const handleAnalyze = useCallback(async () => {
    if (!currentFile) return;

    setStep('analyzing');
    setError('');
    setAnalyzeProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalyzeProgress(p => {
        if (p >= 90) { clearInterval(progressInterval); return 90; }
        return p + Math.random() * 15;
      });
    }, 500);

    try {
      const data = await analyzePhoto(currentFile);
      clearInterval(progressInterval);
      setAnalyzeProgress(100);

      setTimeout(() => {
        setResult(data);
        setStep('results');
      }, 400);
    } catch (err: any) {
      clearInterval(progressInterval);
      setAnalyzeProgress(0);
      const msg = err?.response?.data?.detail || err.message || 'Lỗi không xác định';
      setError(msg);
      setStep('input');
    }
  }, [currentFile]);

  /* ── Try different style ─────────────────────────────── */
  const handleTryStyle = useCallback(async (style: string) => {
    if (!currentFile || tryingStyle) return;

    setTryingStyle(style);
    try {
      const data = await tryStyle(currentFile, style);
      if (result) {
        setResult({
          ...result,
          images: data.images,
        });
      }
    } catch {
      setError('Không thể tạo ảnh kiểu tóc này. Thử lại sau.');
    }
    setTryingStyle('');
  }, [currentFile, tryingStyle, result]);

  /* ── Reset ───────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    setStep('input');
    setResult(null);
    setError('');
    setCurrentFile(null);
    setPreviewUrl('');
    setCameraActive(false);
    setTryingStyle('');
    setAnalyzeProgress(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  /* ────────────────────────────────────────────────────── */
  /*  RENDER                                                 */
  /* ────────────────────────────────────────────────────── */
  return (
    <div className="page hairstyle-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="brand">B_Hair</div>
          <div className="brand-divider" />
          <div className="page-title">AI TƯ VẤN</div>
        </div>
        {step === 'results' && (
          <button className="btn btn-sm btn-ghost" onClick={handleReset}>
            <RefreshIcon /> Thử lại
          </button>
        )}
      </div>

      {/* ── Step 1: Input ──────────────────────────────── */}
      {step === 'input' && (
        <div className="section" style={{ paddingTop: 8 }}>
          {/* Hero */}
          <div className="ai-hero">
            <div className="ai-hero-glow" />
            <div className="ai-hero-icon">
              <SparklesIcon />
            </div>
            <h1 className="headline" style={{ fontSize: 22, marginBottom: 4 }}>
              Tư Vấn Kiểu Tóc AI
            </h1>
            <p className="text-muted" style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
              Chụp ảnh hoặc tải lên để nhận gợi ý kiểu tóc phù hợp nhất với khuôn mặt của bạn
            </p>
          </div>

          {/* Camera / Preview area */}
          <div className="capture-area">
            {cameraActive ? (
              <div className="camera-view">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', borderRadius: 'var(--radius-lg)', transform: 'scaleX(-1)' }}
                />
                <div className="camera-controls">
                  <button className="btn btn-sm btn-ghost" onClick={stopCamera}>Hủy</button>
                  <button className="capture-btn" onClick={capturePhoto}>
                    <div className="capture-btn-inner" />
                  </button>
                  <div style={{ width: 60 }} /> {/* spacer */}
                </div>
              </div>
            ) : previewUrl ? (
              <div className="preview-area">
                <img src={previewUrl} alt="Preview" className="preview-img" />
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => { setPreviewUrl(''); setCurrentFile(null); }}
                  style={{ position: 'absolute', top: 12, right: 12 }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-face-outline">
                  <svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="var(--outline)" strokeWidth="1.5" opacity="0.5">
                    <ellipse cx="40" cy="45" rx="30" ry="38" />
                    <circle cx="28" cy="38" r="3" />
                    <circle cx="52" cy="38" r="3" />
                    <path d="M32 58 Q40 65 48 58" />
                    <path d="M20 20 Q40 8 60 20" strokeDasharray="4 3" />
                  </svg>
                </div>
                <p className="text-muted" style={{ fontSize: 13, marginTop: 12 }}>
                  Chụp hoặc tải ảnh khuôn mặt
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button className="btn btn-lg btn-outline action-btn" onClick={startCamera}>
              <CameraIcon />
              <span>Chụp ảnh</span>
            </button>

            <button className="btn btn-lg btn-outline action-btn" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon />
              <span>Tải ảnh lên</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Analyze button */}
          {currentFile && (
            <button
              className="btn btn-lg btn-primary btn-full analyze-btn"
              onClick={handleAnalyze}
              style={{ marginTop: 16 }}
            >
              <SparklesIcon />
              Phân tích & Tư vấn
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="error-banner" style={{ marginTop: 16 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Hidden canvas for camera capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* ── Step 2: Analyzing ──────────────────────────── */}
      {step === 'analyzing' && (
        <div className="section analyzing-section">
          <div className="analyzing-card">
            <div className="analyzing-spinner">
              <div className="analyzing-ring" />
              <SparklesIcon />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20 }}>
              Đang phân tích...
            </h2>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              AI đang nhận diện khuôn mặt và tạo gợi ý kiểu tóc
            </p>

            {/* Progress bar */}
            <div className="progress-bar" style={{ marginTop: 24 }}>
              <div className="progress-fill" style={{ width: `${Math.min(analyzeProgress, 100)}%` }} />
            </div>
            <div className="progress-steps">
              <span className={analyzeProgress > 10 ? 'done' : ''}>Nhận diện khuôn mặt</span>
              <span className={analyzeProgress > 40 ? 'done' : ''}>Phân tích đặc điểm</span>
              <span className={analyzeProgress > 70 ? 'done' : ''}>Tạo gợi ý AI</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ────────────────────────────── */}
      {step === 'results' && result && (
        <div className="section results-section">
          {/* Face Analysis Card */}
          <div className="result-card">
            <div className="result-card-header">
              <span className="result-card-icon">🔍</span>
              <h3>Phân tích khuôn mặt</h3>
            </div>
            <div className="analysis-grid">
              <div className="analysis-item">
                <span className="analysis-label">Hình dạng</span>
                <span className="analysis-value">{result.analysis.face_shape}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Tông da</span>
                <span className="analysis-value">{result.analysis.skin_tone}</span>
              </div>
            </div>

            {/* Score bars */}
            <div className="score-bars">
              {Object.entries(result.analysis.scores)
                .sort(([, a], [, b]) => b - a)
                .map(([shape, pct]) => (
                  <div key={shape} className="score-row">
                    <span className="score-label">{shape}</span>
                    <div className="score-track">
                      <div
                        className="score-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="score-pct">{pct.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>

          {/* AI Generated Images */}
          <div className="result-card">
            <div className="result-card-header">
              <span className="result-card-icon">✨</span>
              <h3>Kiểu tóc gợi ý</h3>
            </div>

            {result.images.status === 'failed' || result.images.status === 'no_api_key' ? (
              <div className="image-fallback">
                <p className="text-muted" style={{ fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  {result.images.status === 'no_api_key'
                    ? '⚠️ Chưa cấu hình Gemini API key. Vui lòng thêm key vào file .env'
                    : '⚠️ Không thể tạo ảnh. Xem tư vấn text bên dưới.'}
                </p>
              </div>
            ) : (
              <div className="hairstyle-images">
                {/* Before / After comparison */}
                <div className="comparison-grid">
                  {result.images.original && (
                    <div className="comparison-item">
                      <span className="comparison-label">Ảnh gốc</span>
                      <img
                        src={`data:image/jpeg;base64,${result.images.original}`}
                        alt="Original"
                        className="comparison-img"
                      />
                    </div>
                  )}

                  {result.images.edited && (
                    <div className="comparison-item">
                      <span className="comparison-label">AI đề xuất</span>
                      <img
                        src={`data:image/png;base64,${result.images.edited}`}
                        alt="AI edited"
                        className="comparison-img highlight"
                      />
                    </div>
                  )}

                  {!result.images.edited && result.images.illustration && (
                    <div className="comparison-item">
                      <span className="comparison-label">Minh họa kiểu tóc</span>
                      <img
                        src={`data:image/png;base64,${result.images.illustration}`}
                        alt="Hairstyle illustration"
                        className="comparison-img highlight"
                      />
                    </div>
                  )}
                </div>

                <p className="style-name">
                  <SparklesIcon /> {result.images.style_applied}
                </p>
              </div>
            )}

            {/* Try other styles */}
            <div className="try-styles">
              <p className="try-styles-label">Thử kiểu tóc khác:</p>
              <div className="style-chips">
                {result.recommendations.styles.map((style) => (
                  <button
                    key={style}
                    className={`chip ${
                      result.images.style_applied === style ? 'active' : ''
                    } ${tryingStyle === style ? 'loading' : ''}`}
                    onClick={() => handleTryStyle(style)}
                    disabled={!!tryingStyle}
                  >
                    {tryingStyle === style ? (
                      <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    ) : null}
                    {style.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Text Advice — Chatbox Style */}
          <div className="result-card">
            <div className="result-card-header">
              <span className="result-card-icon">💬</span>
              <h3>Tư vấn từ AI</h3>
            </div>
            <div className="advice-chatbox">
              <div className="advice-avatar">AI</div>
              <div className="advice-bubble">
                <div className="advice-text" dangerouslySetInnerHTML={{
                  __html: formatAdviceText(result.advice_text)
                }} />
              </div>
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="result-card">
            <div className="result-card-header">
              <span className="result-card-icon">💡</span>
              <h3>Gợi ý nhanh</h3>
            </div>
            <div className="quick-tips">
              <div className="tip-item">
                <span className="tip-icon">💇</span>
                <div>
                  <strong>Kiểu tóc phù hợp</strong>
                  <p>{result.recommendations.description}</p>
                </div>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🎨</span>
                <div>
                  <strong>Màu tóc gợi ý</strong>
                  <p>{result.recommendations.color_tip}</p>
                </div>
              </div>
              <div className="tip-item warning">
                <span className="tip-icon">⚠️</span>
                <div>
                  <strong>Nên tránh</strong>
                  <p>{result.recommendations.avoid}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-banner" style={{ marginTop: 12 }}>
              <span>⚠️</span> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helper: Format advice text ──────────────────────── */
function formatAdviceText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
