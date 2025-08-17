import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-otx': {
        target: 'https://otx.alienvault.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-otx/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      '/api-abuseipdb': {
        target: 'https://api.abuseipdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-abuseipdb/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    }
  }
})