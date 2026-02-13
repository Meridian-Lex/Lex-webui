import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: process.env.VITE_STRATAVORE_API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
