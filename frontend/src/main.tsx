import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/unbounded/400.css';
import '@fontsource/unbounded/600.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/great-vibes/400.css';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Boot screen lives in index.html; fade it once the app has mounted (kept up briefly so it reads).
const boot = document.getElementById('boot');
if (boot) {
  const msgs = ['Connecting to the simulated market…', 'Loading your funded certificates…', 'Polishing the rented Lambo…'];
  let i = 0;
  const tick = setInterval(() => { const m = boot.querySelector('.msg'); if (m) m.textContent = msgs[++i % msgs.length]; }, 450);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    clearInterval(tick);
    boot.classList.add('done');
    setTimeout(() => boot.remove(), 450);
  }, Math.max(0, (reduce ? 150 : 1300) - performance.now()));
}
