// ── Vite config for TelAviv2030 client ──
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4300',
        changeOrigin: true,
        headers: {
          'x-dev-user': JSON.stringify({ id: 'dev:1', name: 'Dev User', email: 'dev@example.com' })
        }
      }
    },
  },
})
