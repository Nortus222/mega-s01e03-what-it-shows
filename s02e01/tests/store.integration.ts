import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { enqueueNight } from '../src/reorder/loop.ts';

test('PostgreSQL stores queued jobs across concurrent runs and reconnects', async (t) => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url, 'Set TEST_DATABASE_URL explicitly to a disposable PostgreSQL 17 test database; the app default is never used');
  const [{ default: pg }, { drizzle }, { migrate }, { createStore }] = await Promise.all([
    import('pg'), import('drizzle-orm/node-postgres'), import('drizzle-orm/node-postgres/migrator'),
    import('../src/db/store.ts'),
  ]);
  const schema = `stock5_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
  let pool: InstanceType<typeof pg.Pool> | undefined;
  try {
    const version = await admin.query('SHOW server_version_num');
    assert.equal(Math.floor(Number(version.rows[0].server_version_num) / 10000), 17, 'Integration proof requires PostgreSQL 17');
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const connect = () => new pg.Pool({ connectionString: url, options: `-c search_path=${schema}`, connectionTimeoutMillis: 5000 });
    pool = connect();
    let database = drizzle(pool);
    await migrate(database, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)), migrationsSchema: schema });
    let store = createStore(database);
    const a = { sku: 'A', night: '2026-11-03', qty: 2 };
    const b = { sku: 'B', night: '2026-11-03', qty: 3 };

    await t.test('overlapping workers insert each SKU and night once', async () => {
      const results = await Promise.all([
        enqueueNight([a, b, a], store.enqueue), enqueueNight([b, a, b], store.enqueue),
      ]);
      assert.equal(results.reduce((sum, value) => sum + value.queued, 0), 2);
      assert.equal(results.reduce((sum, value) => sum + value.skipped, 0), 4);
      const rows = await pool!.query('SELECT id, sku, night::text, qty, status FROM reorder_jobs ORDER BY sku');
      assert.equal(rows.rows.length, 2);
      assert.ok(rows.rows.every((row) => Number.isInteger(row.id)));
      assert.deepEqual(rows.rows.map(({ id, ...row }) => row), [
        { ...a, status: 'queued' }, { ...b, status: 'queued' },
      ]);
    });

    await t.test('reconnecting resumes a partially committed run and skips its prior jobs', async () => {
      await pool!.end();
      pool = connect();
      database = drizzle(pool);
      store = createStore(database);
      const c = { sku: 'C', night: '2026-11-03', qty: 4 };
      assert.deepEqual(await enqueueNight([a, b, c], store.enqueue), { queued: 1, skipped: 2 });
      assert.deepEqual(await enqueueNight([a, b, c], store.enqueue), { queued: 0, skipped: 3 });
    });

    await t.test('the same SKU can be queued on another night', async () => {
      assert.equal(await store.enqueue({ ...a, night: '2026-11-04' }), true);
      const rows = await pool!.query('SELECT count(*)::int AS count FROM reorder_jobs');
      assert.equal(rows.rows[0].count, 4);
    });

    await t.test('the database rejects a nonpositive quantity', async () => {
      await assert.rejects(store.enqueue({ ...a, sku: 'invalid', qty: 0 }));
      const rows = await pool!.query("SELECT count(*)::int AS count FROM reorder_jobs WHERE sku = 'invalid'");
      assert.equal(rows.rows[0].count, 0);
    });
  } finally {
    await pool?.end();
    try {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await admin.end();
    }
  }
});
