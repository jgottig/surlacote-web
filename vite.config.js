import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // En GitHub Pages el sitio vive en /surlacote-web/
  base: process.env.GITHUB_PAGES ? '/surlacote-web/' : '/',
  build: {
    rollupOptions: {
      input: {
        a: resolve(__dirname, 'index.html'),
        b: resolve(__dirname, 'b/index.html'),
      },
    },
  },
});
