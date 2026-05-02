import './widget-polyfill';  // Polyfill para process
import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

declare global {
  interface Window {
    initYokoWidget: (config: any) => void;
  }
}

// Leer configuración de atributos data-*
function getConfigFromScript(): any {
  const script = document.currentScript as HTMLScriptElement;
  return {
    organizationSlug: script?.getAttribute('data-org-slug') || '',
    primaryColor: script?.getAttribute('data-primary-color') || '#B3CFE5',
    backgroundColor: script?.getAttribute('data-bg-color') || '#ffffff',
    textColor: script?.getAttribute('data-text-color') || '#333333',
    greeting: script?.getAttribute('data-greeting') || '¡Hola! ¿En qué puedo ayudarte?',
    apiUrl: script?.getAttribute('data-api-url') || 'http://localhost:8080/api'
  };
}

// Exponer función global
window.initYokoWidget = (userConfig: any) => {
  const config = { ...getConfigFromScript(), ...userConfig };
  
  const container = document.createElement('div');
  container.id = 'yoko-widget-root';
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(React.createElement(ChatWidget, config));
};

// Auto-inicializar si hay atributos data-*
if (document.currentScript) {
  const config = getConfigFromScript();
  if (config.organizationSlug) {
    window.initYokoWidget(config);
  }
}

// Default export for iife format
export default ChatWidget;
