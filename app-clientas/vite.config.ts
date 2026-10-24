import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// La app de clientas comparte con CB Control las reglas del Club y los datos del salón
// (alias @salon → ../salon-control-app/src): así hay una sola fuente de verdad.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3002,
    host: true,
    fs: { allow: ['..'] },
    // En desarrollo la API corre aparte con «npx wrangler pages dev» (puerto 8788)
    proxy: { '/api': 'http://127.0.0.1:8788' }
  },
  build: { outDir: 'dist', sourcemap: false },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@salon': path.resolve(__dirname, '../salon-control-app/src')
    }
  }
})
