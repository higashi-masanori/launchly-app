@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Base Reset ─────────────────────────────────────────── */
html, body {
  margin: 0;
  padding: 0;
  background-color: #0d1117;
  color: #e6edf3;
  font-family: 'DM Sans', sans-serif;
}

/* ── Scrollbar Styling ──────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #161b22; }
::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #58a6ff55; }

/* ── Code Textarea ──────────────────────────────────────── */
.code-area {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  resize: vertical;
  min-height: 260px;
}

/* ── Scan-line effect on header ─────────────────────────── */
.scanline {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(63, 185, 80, 0.03) 2px,
    rgba(63, 185, 80, 0.03) 4px
  );
}

/* ── Glowing border animation ───────────────────────────── */
@keyframes borderPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(63, 185, 80, 0); }
  50%       { box-shadow: 0 0 0 3px rgba(63, 185, 80, 0.15); }
}

.glow-success {
  animation: borderPulse 2s ease-in-out infinite;
  border-color: #3fb950 !important;
}

/* ── Button shine sweep ─────────────────────────────────── */
@keyframes shine {
  from { transform: translateX(-100%) skewX(-15deg); }
  to   { transform: translateX(300%) skewX(-15deg); }
}

.btn-shine::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  animation: shine 2.5s ease-in-out infinite;
}

/* ── Fade-in for success banner ─────────────────────────── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fade-slide-up {
  animation: fadeSlideUp 0.4s ease-out forwards;
}

/* ── Spinner ────────────────────────────────────────────── */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
