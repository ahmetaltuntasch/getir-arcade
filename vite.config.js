import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// The Arcade portal and Canvas games are separate HTML entry points.
// Keeping them in one build lets Render publish the complete arcade from dist/.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        arcade: resolve(import.meta.dirname, 'index.html'),
        'getir-rush': resolve(import.meta.dirname, 'games/getir-rush/index.html'),
        'depo-tetris': resolve(import.meta.dirname, 'games/depo-tetris/index.html'),
        'televole-wars': resolve(import.meta.dirname, 'games/televole-wars/index.html'),
      },
    },
  },
});
