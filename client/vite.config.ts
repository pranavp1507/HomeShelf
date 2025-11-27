import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Tailwind CSS v4 - must be before react()
    react(),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0', // Listen on all interfaces for Docker
  },
})
