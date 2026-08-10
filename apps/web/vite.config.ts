import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // accesible desde el móvil y desde el puerto público de Codespaces
    port: 5173,
  },
});
