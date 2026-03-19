
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// NOTE: Runtime polyfills (process, Buffer) have been moved to index.html 
// to ensure they execute before React imports.

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
    