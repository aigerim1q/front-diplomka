import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://housing-platform.onrender.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('[proxy error]', err))
          proxy.on('proxyReq', (_, req) => console.log('[proxy req]', req.method, req.url))
          proxy.on('proxyRes', (res) => console.log('[proxy res]', res.statusCode))
        },
      },
      '/hubs': {
        target: 'https://housing-platform.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
