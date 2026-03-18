import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://housing-api-dev-e7bggnhadwa2dpdz.westeurope-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})