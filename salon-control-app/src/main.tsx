// src/main.tsx - Punto de entrada principal para Vite
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Configuración de errores globales
const handleGlobalError = (event: ErrorEvent) => {
  console.error('Error global:', event.error);
  
  if (import.meta.env.DEV) {
    console.group('🔴 Error Details');
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Line:', event.lineno);
    console.error('Column:', event.colno);
    console.error('Stack:', event.error?.stack);
    console.groupEnd();
  }
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Promise rejection no manejada:', event.reason);
  
  if (import.meta.env.DEV) {
    console.group('🟡 Unhandled Promise Rejection');
    console.error('Reason:', event.reason);
    console.error('Promise:', event.promise);
    console.groupEnd();
  }
};

// Registrar manejadores de errores
window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Configuración de desarrollo
if (import.meta.env.DEV) {
  console.group('🚀 Beauty Salon Total Control - Development Mode');
  console.log('Version:', '2.0.0');
  console.log('Build Date:', new Date().toISOString());
  console.log('Environment:', import.meta.env.MODE);
  console.log('Vite Version:', import.meta.env.VITE_VERSION || 'Unknown');
  console.groupEnd();

  // Herramientas de debugging
  (window as any).__BEAUTY_SALON_APP__ = {
    version: '2.0.0',
    env: import.meta.env,
    clearStorage: () => {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => 
        key.startsWith('emailTemplates') || 
        key.startsWith('emailCampaigns') || 
        key.startsWith('emailAutomations') ||
        key.startsWith('emailJSConfig') ||
        key.startsWith('clientes') ||
        key.startsWith('servicios') ||
        key.startsWith('citas') ||
        key.startsWith('ventas') ||
        key.startsWith('inventario')
      );
      
      appKeys.forEach(key => localStorage.removeItem(key));
      console.log('🧹 Storage cleared:', appKeys);
      window.location.reload();
    },
    exportData: () => {
      const data = {
        clientes: JSON.parse(localStorage.getItem('clientes') || '[]'),
        servicios: JSON.parse(localStorage.getItem('servicios') || '[]'),
        citas: JSON.parse(localStorage.getItem('citas') || '[]'),
        ventas: JSON.parse(localStorage.getItem('ventas') || '[]'),
        inventario: JSON.parse(localStorage.getItem('inventario') || '[]'),
        emailTemplates: JSON.parse(localStorage.getItem('emailTemplates') || '[]'),
        emailCampaigns: JSON.parse(localStorage.getItem('emailCampaigns') || '[]'),
        emailAutomations: JSON.parse(localStorage.getItem('emailAutomations') || '[]'),
        emailConfig: JSON.parse(localStorage.getItem('emailJSConfig') || '{}'),
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beauty-salon-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📦 Data exported');
    }
  };

  console.log('🛠️ Debug tools available in window.__BEAUTY_SALON_APP__');
}

// Función de inicialización
const initializeApp = () => {
  const container = document.getElementById('root');
  
  if (!container) {
    throw new Error('No se pudo encontrar el elemento root en el DOM');
  }

  // Crear root de React 18
  const root = ReactDOM.createRoot(container);

  // Renderizar la aplicación
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Ocultar loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }, 100);
};

// Inicializar la aplicación
initializeApp();