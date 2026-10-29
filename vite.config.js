import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import { defineConfig } from 'vite';

const path = (relative) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  root: path('./support-kb'),
  resolve: { alias: { '#lib': path('./support-kb/src/lib') } },
  plugins: [sveltekit({
    extensions: ['.svelte', '.svx'],
    preprocess: mdsvex({
      extensions: ['.svx'],
      layout: { runbook: path('./support-kb/src/lib/layouts/runbook.svelte') },
      smartypants: false,
    }),
    adapter: adapter({ pages: path('./rendered'), assets: path('./rendered') }),
  })],
});
