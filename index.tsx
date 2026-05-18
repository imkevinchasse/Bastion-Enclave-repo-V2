
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ChaosLock } from './services/cryptoService';

// NOTE: Runtime polyfills (process, Buffer) have been moved to index.html 
// to ensure they execute before React imports.

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
    