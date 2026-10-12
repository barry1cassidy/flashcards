import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeLibrarySitemap } from './scripts/librarySitemap.mjs'

function librarySitemap() {
  return {
    name: 'library-sitemap',
    async buildStart() {
      const result = await writeLibrarySitemap()
      this.info(`library sitemap: ${result.urls} urls`)
    },
  }
}

export default defineConfig({
  plugins: [react(), librarySitemap()],
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
