# stock-5 store implementation plan

> For agentic workers: use superpowers:subagent-driven-development for this single integrated task.

Goal: build the store in the course-accepted `plan.md` without changing the earlier course project.

Architecture: use Drizzle with node-postgres and an atomic insert that ignores a
conflict on `(sku, night)`. Each inserted row is the queued job itself, so there is
no separate external queue write to lose between commits. Four async workers
enqueue input jobs. A rerun after a stopped process inserts only missing jobs.

Tech stack: Node 24, TypeScript, Drizzle ORM and Kit, node-postgres,
Docker Compose with PostgreSQL 17. Spec: `plan.md`.

## Global constraints

- Work only under `s02e01/`; preserve the starter verifier and draft.
- PostgreSQL 17, `postgres:17`, published host port `5454`, Drizzle dialect `postgresql`.
- Schema `src/db/schema.ts`, table `reorder_jobs`, unique (`sku`, `night`).
- Keep four workers and persist each queued job immediately.
- Treat credentials, persistent volume and input CLI as implementation choices.
- No purchases, account changes, external publication or installs without approval.
- The student starts the store; do not substitute another database for proof.
- Do not run the full build in delegated work; controller runs it once at delivery.

## Review focus

- Concurrent overlapping inputs must produce one row per SKU and night.
- A process stopped after committed inserts must resume without losing or duplicating them.
- A different night must be able to reorder the same SKU again.
- Invalid quantities, empty SKUs and invalid calendar dates must fail before any run writes.
- A database failure must reject the run, settle in-flight workers and close connections.

## Task 1: persistent enqueue store and runnable local delivery

Files: `compose.yaml`, `drizzle.config.ts`, `tsconfig.json`,
`src/db/schema.ts`, `src/db/connection.ts`, `src/db/store.ts`,
`src/reorder/loop.ts`, `src/reorder/cli.ts`, `tests/loop.test.ts`,
`tests/store.integration.ts`, `drizzle/`, `ops/stock-5.logrotate`,
`README.md`, `package.json`, and a small input fixture.

Interfaces:
- `Job = { sku: string; night: string; qty: number }`.
- `enqueueNight(jobs: Job[], enqueue: (job: Job) => Promise<boolean>)`
  returns `{ queued: number; skipped: number }`, using four workers.
- `createStore(database)` returns `enqueue(job)` using Drizzle
  `onConflictDoNothing` against the unique key, with `returning` to distinguish skips.
- Connection module exports a local default URL on 127.0.0.1:5454 and a pool factory;
  `DATABASE_URL` overrides it consistently for the app and Drizzle configuration.
- CLI reads a JSON job array, validates before enqueuing and closes its pool in `finally`.

- [ ] Add tests for deduplication, four-worker concurrency, failure settlement,
  validation, and a restart using the actual database for integration coverage.
- [ ] Run targeted tests and confirm failure before the corresponding implementation.
- [ ] Implement the loop, store, schema, connection and CLI.
- [ ] Add local-only Compose with a persistent volume and health check;
  define local development credentials, bind only 127.0.0.1:5454.
- [ ] Generate an initial migration from the Drizzle schema after install approval.
- [ ] Document installation, database startup, migration, tests, sample nightly run,
  verifier and stop commands. Record daily/seven-log rotation as an ops template,
  not a host configuration installed by this task.
- [ ] Run targeted checks when dependencies and the live database are available.
- [ ] Controller reviews all files, runs the full build once, and submits build files
  with the preserved course receipt. Keep logs and receipts outside published files.

Self-review: the plan covers the accepted storage decisions and separates existing
scheduling from the store. No storefront, scheduler, outbound supplier delivery,
deployment, or extra database service is needed. Tests must distinguish durable
queue insertion from external order delivery, which is outside this task.
