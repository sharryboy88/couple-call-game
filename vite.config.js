import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Wichtig: base = '/<Repo-Name>/'
export default defineConfig({
  base: '/couple-call-game/',
  plugins: [react()],
  build: {
    outDir: 'dist', // Standard (Vite)
    emptyOutDir: true
  }
})
