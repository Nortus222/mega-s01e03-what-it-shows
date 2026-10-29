import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Compile and request the real MDsveX routes without running the full production build.
const project = fileURLToPath(new URL('../support-kb', import.meta.url));
const previousDirectory = process.cwd();
process.chdir(project);
const server = await createServer({
  configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
  server: { host: '127.0.0.1', port: 0 },
});

try {
  await server.listen();
  const { port } = server.httpServer.address();
  const routes = [
    '/kb/',
    '/kb/incidents/4471/',
    '/kb/incidents/4471-analysis/',
    '/kb/triage/dedupe/',
    '/kb/decisions/0001-dedupe-by-subject/',
    '/kb/decisions/0002-dedupe-by-evidence/',
  ];
  const signed = new Set([routes[2], routes[3], routes[5]]);
  for (const route of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    const html = await response.text();
    assert.equal(response.status, 200, `${route}: ${html.slice(0, 500)}`);
    assert.ok(/<main\b/.test(html), `${route} uses the runbook layout`);
    assert.match(html, /<title>.+support kb<\/title>/);
    if (signed.has(route)) {
      assert.match(html, /desk ref <b[^>]*>DR-71DZ-EWZZ<\/b>/, `${route} renders its signature stamp`);
      assert.doesNotMatch(html, /no desk ref/);
    }
    if (route === '/kb/incidents/4471-analysis/') {
      const text = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      assert.match(text, /427 raw rows.+412 unique report IDs.+15 overlapping rows/);
      assert.match(text, /parser 379.+hint 33/);
      assert.match(text, /parser 374.+hint 33.+unresolved-timing 5/);
      assert.match(text, /alder\.physio de-DE booking-v3 12/);
      assert.match(text, /copper\.studio es-ES booking-v3 11/);
      assert.match(text, /pale\.harbour pt-PT booking-v3 10/);
      for (const id of ['R-41202', 'R-41209', 'R-41236', 'R-41344', 'R-41620']) assert.ok(text.includes(id));
      assert.match(html, /<svg[^>]+aria-label="reports received and merged into #4471, per week"/);
    }
    console.log(`SSR verified ${route}`);
  }

  const clientModules = [
    '/src/routes/kb/incidents/4471-analysis/+page.svx',
    '/src/routes/kb/decisions/0002-dedupe-by-evidence/+page.svx',
    '/src/routes/kb/triage/dedupe/+page.svx',
    '/src/lib/kb/InvestigationTable.svelte',
    '/src/lib/kb/DedupeExplorer.svelte',
    '/src/lib/kb/QueueTimeline.svelte',
    '/src/lib/kb/RenderStamp.svelte',
  ];
  for (const module of clientModules) {
    const response = await fetch(`http://127.0.0.1:${port}${module}`);
    assert.equal(response.status, 200, `${module} compiles for the client`);
  }
  console.log(`Client compilation verified for ${clientModules.length} page/component modules.`);
} finally {
  await server.close();
  process.chdir(previousDirectory);
}
