import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const API_TARGET = 'https://housing-platform.onrender.com';

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
                target: API_TARGET,
                changeOrigin: true,
                secure: false,
            },
            '/hubs': {
                target: API_TARGET,
                changeOrigin: true,
                secure: false,
                ws: true,
            },
        },
    },
});
