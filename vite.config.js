import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: { include: ['three/addons/utils/BufferGeometryUtils.js'] },
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ['three', 'three/addons/controls/OrbitControls.js'] } },
    },
  },
});
