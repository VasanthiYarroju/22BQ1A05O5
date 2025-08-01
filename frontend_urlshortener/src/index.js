import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import logger from './utils/logger';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  logger.error('Root element with ID "root" not found in the DOM. Cannot render application.');
}