import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Replaces vite-tsconfig-paths, which Vite now warns is redundant.
  resolve: { tsconfigPaths: true },
  test: {
    // The default `forks` pool times out starting workers on Windows.
    pool: 'threads',
    projects: [
      {
        // Schemas, aggregation, route handlers — no DOM, so no jsdom. Booting
        // jsdom here took 90% of the run and timed the workers out.
        extends: true,
        test: {
          name: 'logic',
          environment: 'node',
          include: ['{lib,app}/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['{components,app,lib}/**/*.test.tsx'],
        },
      },
    ],
  },
});
