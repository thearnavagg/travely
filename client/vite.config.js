import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiUrl = process.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  plugins: [react()],
  server: {
    proxy: {
      '/chat': {
        target: apiUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chat/, '/chat')
      }
    }
  }
})
