import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  // Pin to IPv4 loopback: some environments resolve 'localhost' to '::1'
  // only, which breaks the E2E runner's hardcoded 127.0.0.1 readiness probe.
  preview: {
    host: '127.0.0.1',
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.js'],
  },
});
