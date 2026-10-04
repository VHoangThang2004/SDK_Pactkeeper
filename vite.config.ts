import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://srpg-backend.duckdns.org:5276',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://srpg-backend.duckdns.org:5276',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
