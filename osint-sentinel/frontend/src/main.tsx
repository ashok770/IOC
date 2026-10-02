import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/overview.css';
import './styles/assets.css';
import './styles/exposure.css';
import './styles/technology.css';
import './styles/evidence.css';
import './styles/relationships.css';
import './styles/risk.css';
import './styles/reports.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
