import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ['**/*.md'],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow access from all interfaces (needed for Docker)
    strictPort: true, // Exit if port is already in use
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
  },
})
