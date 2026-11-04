import assert from 'node:assert/strict';
import test from 'node:test';
import { enqueueNight } from '../src/reorder/loop.ts';

const job = (sku: string) => ({ sku, night: '2026-11-03', qty: 2 });

test('reports queued jobs and same-night skips', async () => {
  const seen = new Set<string>();
  const result = await enqueueNight([job('A'), job('A'), job('B')], async (value) => {
    const key = `${value.sku}:${value.night}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  assert.deepEqual(result, { queued: 2, skipped: 1 });
});

test('uses four workers and waits for every job', async () => {
  let active = 0;
  let peak = 0;
  let completed = 0;
  const result = await enqueueNight(Array.from({ length: 13 }, (_, index) => job(String(index))), async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    completed++;
    return true;
  });
  assert.equal(peak, 4);
  assert.equal(active, 0);
  assert.equal(completed, 13);
  assert.deepEqual(result, { queued: 13, skipped: 0 });
});

test('stops taking jobs after a failure and settles in-flight writes before rejecting', async () => {
  const failure = new Error('database unavailable');
  const started: string[] = [];
  const finished: string[] = [];
  let rejected = false;
  const run = enqueueNight(Array.from({ length: 10 }, (_, index) => job(String(index))), async (value) => {
    started.push(value.sku);
    if (value.sku === '0') {
      await new Promise((resolve) => setTimeout(resolve, 1));
      throw failure;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
    finished.push(value.sku);
    return true;
  });
  await assert.rejects(run.catch((error) => {
    rejected = true;
    assert.deepEqual(finished.sort(), ['1', '2', '3']);
    throw error;
  }), (error) => error === failure);
  assert.equal(rejected, true);
  assert.deepEqual(started, ['0', '1', '2', '3']);
});

test('validates the entire input before writing any job', async () => {
  const invalid = [
    null, {}, 'jobs',
    [job('A'), { ...job('B'), sku: '' }],
    [job('A'), { ...job('B'), sku: '  ' }],
    [job('A'), { ...job('B'), qty: 0 }],
    [job('A'), { ...job('B'), qty: -1 }],
    [job('A'), { ...job('B'), qty: 1.5 }],
    [job('A'), { ...job('B'), qty: Number.NaN }],
    [job('A'), { ...job('B'), qty: Number.POSITIVE_INFINITY }],
    [job('A'), { ...job('B'), qty: 2147483648 }],
    [job('A'), { ...job('B'), night: '2026-02-29' }],
    [job('A'), { ...job('B'), night: '2026-04-31' }],
    [job('A'), { ...job('B'), night: '2026-1-03' }],
    [job('A'), { ...job('B'), night: '0000-01-01' }],
    [job('A'), null],
  ];
  let writes = 0;
  for (const value of invalid) {
    await assert.rejects(enqueueNight(value as Parameters<typeof enqueueNight>[0], async () => {
      writes++;
      return true;
    }), /Invalid jobs|Invalid job/);
  }
  assert.equal(writes, 0);
});

test('accepts a leap day, a positive database integer and an empty run', async () => {
  assert.deepEqual(await enqueueNight([{ sku: 'A', night: '2028-02-29', qty: 2147483647 }], async () => true), { queued: 1, skipped: 0 });
  assert.deepEqual(await enqueueNight([], async () => { throw new Error('unexpected write'); }), { queued: 0, skipped: 0 });
});
