// Configuration Vite pour l'application bureau (Tauri) : le front est servi en local,
// sans service web ni hébergement.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // Tauri affiche ses propres messages : on garde la console lisible
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: {
    // Webviews des systèmes : WebView2 (Windows), WebKit (macOS, Linux)
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
    chunkSizeWarningLimit: 1500,
  },
  test: { environment: 'node' },
})
