import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: 'support-kb',
  resolve: { alias: { '#lib': fileURLToPath(new URL('./support-kb/src/lib', import.meta.url)) } },
  test: { include: ['../tests/**/*.test.ts'] },
});
