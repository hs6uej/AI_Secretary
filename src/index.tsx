// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
// ADDED: Import BrowserRouter
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ADDED: Wrap the entire App in BrowserRouter */}
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);