import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The page asks /api, and Vite passes it to the backend. No address is written in the code.
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
