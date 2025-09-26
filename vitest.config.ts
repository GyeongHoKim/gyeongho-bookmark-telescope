import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    mockReset: true,
    environment: 'happy-dom',
    setupFiles: './test/setup.ts',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}', 'test/**/*.spec.{ts,tsx}'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test/test-results.xml',
    },
    coverage: {
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        'wxt.config.ts',
        'vitest.config.ts',
      ],
    },
  },
});
