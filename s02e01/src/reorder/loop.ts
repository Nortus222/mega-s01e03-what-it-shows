export type Job = { sku: string; night: string; qty: number };

export function validateJobs(value: unknown): asserts value is Job[] {
  if (!Array.isArray(value)) throw new Error('Invalid jobs: expected a JSON array');
  for (const [index, job] of value.entries()) {
    if (!job || typeof job.sku !== 'string' || !job.sku.trim()) {
      throw new Error(`Invalid job ${index}: sku must be a nonempty string`);
    }
    if (!Number.isInteger(job.qty) || job.qty <= 0 || job.qty > 2147483647) {
      throw new Error(`Invalid job ${index}: qty must be a positive PostgreSQL integer`);
    }
    const night = job.night;
    if (typeof night !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(night) ||
        !Number.isFinite(Date.parse(`${night}T00:00:00Z`)) ||
        new Date(`${night}T00:00:00Z`).toISOString().slice(0, 10) !== night) {
      throw new Error(`Invalid job ${index}: night must be a calendar date in YYYY-MM-DD form`);
    }
  }
}

// Each successful enqueue persists the job before a worker takes another one.
export async function enqueueNight(jobs: Job[], enqueue: (job: Job) => Promise<boolean>) {
  validateJobs(jobs);
  let queued = 0;
  let skipped = 0;
  let next = 0;
  let failed = false;
  let failure: unknown;
  async function worker() {
    while (!failed && next < jobs.length) {
      const job = jobs[next++]!;
      try {
        if (await enqueue(job)) queued++;
        else skipped++;
      } catch (error) {
        if (!failed) failure = error;
        failed = true;
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  if (failed) throw failure;
  return { queued, skipped };
}
