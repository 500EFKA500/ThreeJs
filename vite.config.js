import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  build: {
    outDir: join(root, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 750,
  },
});
