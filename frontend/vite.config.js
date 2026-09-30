// Vite settings for the React app. `npm run dev` serves it on http://localhost:5173
// and forwards every /api request to the Python backend on port 8000.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8000' },
  },
});
