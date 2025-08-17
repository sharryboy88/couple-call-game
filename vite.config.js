import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/couple-call-game/', // exakt dein Repo-Name + führender/abschließender Slash
})
