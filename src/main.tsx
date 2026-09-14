import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Trata notificações benignas do ResizeObserver e avisos de contexto WebGL
if (typeof window !== 'undefined') {
  const isBenignError = (msg: unknown) => {
    const text =
      typeof msg === 'string'
        ? msg
        : (msg as ErrorEvent)?.message || (msg as Error)?.message || '';
    return (
      text.includes('ResizeObserver') ||
      text.includes('ResizeObserver loop completed with undelivered notifications') ||
      text.includes('ResizeObserver loop limit exceeded') ||
      text.includes('THREE.WebGLRenderer') ||
      text.includes('WebGL context') ||
      text.includes('Web page caused context loss')
    );
  };

  const prevOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (isBenignError(message) || isBenignError(error)) {
      return true;
    }
    if (prevOnError) {
      return prevOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  window.addEventListener(
    'error',
    (e) => {
      if (isBenignError(e)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (e) => {
      if (isBenignError(e?.reason)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
