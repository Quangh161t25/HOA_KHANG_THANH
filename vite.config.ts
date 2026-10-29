import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // Tailwind v4 chạy qua plugin Vite; khai báo PostCSS rỗng để không đọc nhầm postcss.config ở thư mục cha.
  css: { postcss: {} },
  server: {
    proxy: {
      '/api/ocr4ai': {
        target: 'https://ocr.laychu.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/ocr4ai/, '/v1'),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
