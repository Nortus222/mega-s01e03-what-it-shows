import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Job } from '../reorder/loop.ts';
import { reorderJobs } from './schema.ts';

// A committed row is the queued job; a conflict leaves the original row intact.
export function createStore(database: NodePgDatabase) {
  return {
    async enqueue(job: Job): Promise<boolean> {
      const inserted = await database.insert(reorderJobs)
        .values({ sku: job.sku, night: job.night, qty: job.qty })
        .onConflictDoNothing({ target: [reorderJobs.sku, reorderJobs.night] })
        .returning({ id: reorderJobs.id });
      return inserted.length === 1;
    },
  };
}
