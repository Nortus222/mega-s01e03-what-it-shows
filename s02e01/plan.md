# stock-5 nightly reorder store

This plan reconciles the recorded decisions. All source times are UTC from the
message records, not filenames. The October 30 approval supersedes SQLite in
`plan-draft.md`. The later delegated CI fix changes the image to Postgres 17 and
the host port to 5454, with a stated intent to use the same settings locally. Neither replaces the previously
approved ORM or job identity. The delegated change is reported implementation,
not a new explicit human approval.

| Area | Choice | Source (session id + time) |
|------|--------|----------------------------|
| Job store | Postgres. | `019a35d2-7c41-7e08-a3f1-5b9e2d6c4a10`, proposed `2026-10-30T14:48:12.884Z`, approved by "do it." at `2026-10-30T14:50:03.115Z`. |
| Database version | PostgreSQL 17, image `postgres:17`. Delegated CI configuration; agent states local parity as intended. | Session `c41e7b02-93d5-4f6a-8e21-7a0b5d3f9c64`, subagent `a5c0e3d19b72f4e60`, `2026-11-03T23:54:51.000Z`; `.claude/projects/-srv-ops-stock-5/c41e7b02-93d5-4f6a-8e21-7a0b5d3f9c64/subagents/agent-a5c0e3d19b72f4e60.jsonl`, line 5. |
| Database runtime | Docker Compose, defined in `compose.yaml`. | `019a35d2-7c41-7e08-a3f1-5b9e2d6c4a10`, Docker proposed `2026-10-30T14:48:12.884Z`, approved `2026-10-30T14:50:03.115Z`; Compose write at `2026-10-30T14:50:43.732Z`. |
| Database port | Host port `5454`, container port `5432`. Delegated CI configuration; agent states local parity as intended. | Session `c41e7b02-93d5-4f6a-8e21-7a0b5d3f9c64`, subagent `a5c0e3d19b72f4e60`, `2026-11-03T23:54:51.000Z`; `.claude/projects/-srv-ops-stock-5/c41e7b02-93d5-4f6a-8e21-7a0b5d3f9c64/subagents/agent-a5c0e3d19b72f4e60.jsonl`, line 5. |
| ORM | Drizzle ORM, `drizzle-orm` and `drizzle-kit`. | `7f3c2a91-4e5b-4d1a-9b8e-2c6d0f1a3b57`, proposed `2026-10-29T09:41:36.207Z`, approved by "go with that." at `2026-10-29T09:44:51.660Z`. |
| Database name | `reorder_sjpt`, used by `POSTGRES_DB` and the database connection URL. | `5d8a1f37-0c62-4b9e-b7a4-e13f6c290d85`, proposed `2026-11-04T00:39:44.000Z`, approved by "ok, do that." at `2026-11-04T00:40:22.000Z`. |
| Database dialect | Set the Drizzle database configuration dialect to `postgresql`. | `019a35d2-7c41-7e08-a3f1-5b9e2d6c4a10`, proposed `2026-10-30T14:48:12.884Z`, approved `2026-10-30T14:50:03.115Z`. |
| Schema location | Define the job schema in `src/db/schema.ts`. | `7f3c2a91-4e5b-4d1a-9b8e-2c6d0f1a3b57`, proposed `2026-10-29T09:41:36.207Z`, approved `2026-10-29T09:44:51.660Z`. |
| Job identity | Table `reorder_jobs`, unique on (`sku`, `night`), so rerunning one night cannot queue a SKU twice. | `7f3c2a91-4e5b-4d1a-9b8e-2c6d0f1a3b57`, proposed `2026-10-29T09:41:36.207Z`, approved `2026-10-29T09:44:51.660Z`. |
| Crash recovery | Persist each job when queued; resume by skipping jobs already stored. Retire the end-of-run `src/reorder/state.json` rewrite. | `7f3c2a91-4e5b-4d1a-9b8e-2c6d0f1a3b57`, crash problem and replacement proposed `2026-10-29T09:41:36.207Z`, approved `2026-10-29T09:44:51.660Z`; per-job writes and JSON retirement reported at `2026-10-29T10:42:56.472Z`. |
| Workers | Preserve four workers in the nightly reorder loop. | `019a35d2-7c41-7e08-a3f1-5b9e2d6c4a10`, established by human at `2026-10-30T14:31:40.761Z`, retained in reported outcome at `2026-10-30T15:08:16.431Z`. |
| Log rotation | Rotate daily and keep seven logs. This is the later agent's reported implementation, not a separately approved retention policy. | `11e58d3b-f53e-400b-a860-133371967557`, human requests rotation at `2026-10-31T09:15:31.531Z`, agent reports daily rotation and seven retained at `2026-10-31T09:44:38.035Z`. |

## Evidence limits

The draft says nightly at 02:00. Session
`25e645ab-8a84-4a82-a463-ac9edd2d31c0`, at
`2026-10-28T10:31:50.898Z`, contains logs showing 02:00 at offset +01:00.
That is observed behavior, not a sourced decision about a scheduler or timezone.
This store change does not introduce a new scheduling policy.

The SQLite WAL claim appears in a compaction summary at
`2026-10-29T10:20:23.424Z`, not the original approval. The independent
`shelf-labels` sessions concern another project; their Postgres 15, port 5435,
and Prisma choices do not apply here. Routine heartbeat logs are not decisions.

Connection credentials, a persistent Docker volume, migrations, and tests are
implementation details to settle when building. They are not historical team
decisions. The scope is the job store and its loop, not a storefront website.
