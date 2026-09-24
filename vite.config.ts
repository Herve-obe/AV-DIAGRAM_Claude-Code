// Configuration Vite : React + PWA installable (fonctionnement hors ligne)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
      manifest: {
        name: 'AV Diagram',
        short_name: 'AV Diagram',
        description: "Synoptiques d'installations audiovisuelles professionnelles",
        lang: 'fr',
        theme_color: '#16181b',
        background_color: '#16181b',
        display: 'standalone',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: { environment: 'node' },
})
