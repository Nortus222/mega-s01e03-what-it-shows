import { readFile } from 'node:fs/promises';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createPool } from '../db/connection.ts';
import { createStore } from '../db/store.ts';
import { enqueueNight, validateJobs } from './loop.ts';

async function main() {
  const [file, ...extra] = process.argv.slice(2);
  if (!file || extra.length) throw new Error('usage: npm run nightly -- <jobs.json>');
  const jobs: unknown = JSON.parse(await readFile(file, 'utf8'));
  validateJobs(jobs);
  const pool = createPool();
  try {
    const store = createStore(drizzle(pool));
    console.log(JSON.stringify(await enqueueNight(jobs, store.enqueue)));
  } finally {
    await pool.end();
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
