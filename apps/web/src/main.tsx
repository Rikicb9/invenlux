import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './estilos.css';
import { InventarioProvider } from './estado/InventarioProvider';

createRoot(document.getElementById('raiz')!).render(
  <React.StrictMode>
    <InventarioProvider>
      <App />
    </InventarioProvider>
  </React.StrictMode>,
);
