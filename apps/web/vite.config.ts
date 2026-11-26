import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@agent-rpg/game-core': path.resolve(__dirname, '../../packages/game-core/src/index.ts'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4311,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4310',
        changeOrigin: false,
      },
    },
  },
})
