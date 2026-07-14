import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Early capture beforeinstallprompt event to avoid race conditions with React mounting
let deferredInstallPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if ((window as any).onBeforeInstallPromptReady) {
    (window as any).onBeforeInstallPromptReady(e);
  }
});
(window as any).getDeferredInstallPrompt = () => deferredInstallPrompt;
(window as any).clearDeferredInstallPrompt = () => {
  deferredInstallPrompt = null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for offline support and PWA installability
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[PWA] Service Worker registered successfully:', reg))
      .catch(err => console.error('[PWA] Service Worker registration failed:', err));
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}
