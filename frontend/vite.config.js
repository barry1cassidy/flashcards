import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeLibrarySitemap } from './scripts/librarySitemap.mjs'

function librarySitemap() {
  let root = process.cwd()
  return {
    name: 'library-sitemap',
    configResolved(config) {
      root = config.root
    },
    async buildStart() {
      const result = await writeLibrarySitemap({ root })
      if (result.skipped) {
        this.info('library sitemap: catalog not in this build; keeping public/sitemap.xml')
        return
      }
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
