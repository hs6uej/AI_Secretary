import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.38.46:5028', // <--- แก้ไขที่บรรทัดนี้
        changeOrigin: true,
      },
    },
  },
})