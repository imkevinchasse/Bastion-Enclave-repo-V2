
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ChaosLock } from './services/cryptoService';
import { Buffer } from 'buffer';

// Polyfills
(window as any).Buffer = Buffer;
(window as any).global = window;
(window as any).process = { env: { NODE_ENV: 'production' } };

// Error Handler
window.onerror = function(msg, url, line, col, error) {
  if (msg === 'Script error.') {
    console.error("CORS Error.");
    msg = "External Script Failed (CORS).";
  }
  
  var overlay = document.getElementById('boot-error');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'boot-error';
    overlay.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;background:#7f1d1d;color:#fecaca;padding:15px;border-radius:8px;font-family:monospace;font-size:12px;z-index:99999;border:1px solid #ef4444;';
    document.body.appendChild(overlay);
  }
  overlay.innerText = "BOOT ERROR: " + msg;
};

// Trusted Types
if ((window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
  (window as any).trustedTypes.createPolicy('default', {
    createHTML: (string: string) => { 
        throw new Error('Insecure HTML string creation blocked.');
    }
  });
}

ChaosLock.initDeviceSecret();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the boot loader natively
const loader = document.getElementById('boot-loader');
if (loader) {
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 500);
}
    