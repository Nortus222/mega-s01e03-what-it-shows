# stock-5 nightly reorder store

This folder contains a PostgreSQL job store and its four-worker enqueue loop, not
a storefront. Each committed row is a queued reorder. The unique `(sku, night)`
key lets an interrupted run resume by skipping jobs already stored. It does not
send orders to suppliers or introduce a scheduler or timezone policy.

`plan.md` records the accepted decisions and their sources. `plan-draft.md` and
`scripts/verify.mjs` preserve the course handover unchanged.

## Start locally

The student starts the store. Prerequisites are Node 24 or later, npm, Docker
Compose and a running Docker engine. Port 5454 must be available. Install packages
only after approval. Run these commands from the repository root:

```sh
cd s02e01
npm ci
docker compose up -d --wait
npm run db:migrate
npm run nightly -- fixtures/nightly.json
```

The sample inserts two rows on its first run and prints
`{"queued":2,"skipped":0}`. Running it again prints
`{"queued":0,"skipped":2}`. Existing rows keep their original quantities. To queue
another night, change the dates in a copy of the input file.

Compose runs `postgres:17`, binds `127.0.0.1:5454` and stores database files in the
`stock5-data-pg17` volume. The local development connection is
`postgresql://stock5:stock5@127.0.0.1:5454/reorder_sjpt`. Set `DATABASE_URL` to override it
for the CLI, Drizzle migrations and the course verifier. The default appears in
both `src/db/connection.ts` and `drizzle.config.ts` so the unchanged verifier can
read it without executing TypeScript.

The input is a JSON array of `{ "sku": "WIDGET-A", "night": "2026-11-03", "qty": 5 }`
objects. SKUs must contain a non-whitespace character. Dates must be actual
calendar dates in `YYYY-MM-DD` form, with years 0001 through 9999. Quantities must
be integers from 1 through 2147483647. The loop validates the entire array before
any writes. On a database failure it stops taking jobs, waits for active writes,
closes the CLI pool and exits unsuccessfully. Successful writes remain available
for a later retry.

## Check and maintain

```sh
npm test
npm run build
npm run verify -- YOUR_COURSE_NONCE
```

`npm test` covers loop behavior and CLI input validation without a live database.
`npm run build` checks TypeScript without emitting files. The verifier requires
the student-started database and prints its real version, nonce hash and port.
Keep the course receipt outside published files.

For integration proof, create a separate disposable test database. The test
requires `TEST_DATABASE_URL` explicitly and never falls back to the app URL:

```sh
docker compose exec postgres createdb -U stock5 reorder_sjpt_test
TEST_DATABASE_URL=postgresql://stock5:stock5@127.0.0.1:5454/reorder_sjpt_test npm run test:integration
```

The integration test checks PostgreSQL 17, applies the committed migration in a
random isolated schema, tests overlapping workers, reconnects before replaying a
partially completed input, and checks the same SKU on another night. It drops
only that test schema afterward. Reconnecting checks committed persistence across
client restarts; it does not simulate a PostgreSQL server crash.

The initial migration was generated with `npm run db:generate`. After later
schema changes, run that command, review the new migration and apply it with
`npm run db:migrate`.

`ops/stock-5.logrotate` is a template for daily rotation with seven retained logs.
It has not been installed on a host. Adapt its log path and ownership when the
existing nightly runner is configured to write a log file. Daily/seven-log
retention follows the historical agent report rather than a separately approved
retention policy.

Stop the container while keeping committed jobs:

```sh
docker compose down
```

Keep the named volume when stopping or restarting the store.

## Check the sources before stopping

The course archive can gain sessions after plan check-in. The project Stop hook
in `../.codex/hooks.json` invokes `scripts/check-sources.py` to compare archive
contents with a private acknowledged baseline. Codex requires you to review and
trust a new or edited hook through `/hooks` before it runs. Script tests are not
proof that the current T3 session has loaded or trusted the hook.

The private state is `.superpowers/s02e01/private/evidence-state.json` at the
repository root. It holds the signed archive URL and acknowledged hashes, and
must stay ignored. The script reports new or changed filenames, blocks at most
three times per session, and permits an unchanged repeated continuation to stop.
Network failures remain marked unverified even when the guard permits stopping.
Run `npm run test:gate` for local HTTP tests.

After reading and reconciling changed sources, explicitly acknowledge them:

```sh
python3 scripts/check-sources.py --acknowledge < /dev/null
```

Check `lastCheck.status` in the private state afterward. It must say
`acknowledged`; an empty hook reply alone does not prove freshness. The normal
hook check never updates the baseline by itself.
