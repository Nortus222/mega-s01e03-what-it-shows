import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cli = fileURLToPath(new URL('../src/reorder/cli.ts', import.meta.url));
function run(args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8', env: { ...process.env, DATABASE_URL: 'not-a-database-url' },
  });
}

test('CLI requires an input file', () => {
  const result = run([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /usage: npm run nightly -- <jobs.json>/);
});

test('CLI rejects invalid input before opening the database pool', () => {
  const directory = mkdtempSync(join(tmpdir(), 'stock5-cli-'));
  try {
    const input = join(directory, 'jobs.json');
    writeFileSync(input, JSON.stringify([{ sku: 'A', night: '2026-02-30', qty: 2 }]));
    const result = run([input]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid job 0: night/);
    assert.equal(result.stdout, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
