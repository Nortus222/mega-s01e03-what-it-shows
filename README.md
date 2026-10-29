# S01E03: what the evidence shows

An evidence-backed review of support ticket #4471, using the supplied 4 October 2026 support KB snapshot.
The original tenant model groups 379 parser and 33 hint reports. The investigation holds the
five desk-noted timing reports apart, yielding 374 parser candidates, 33 hint candidates and
five unresolved timing reports. The page computes these counts from the export at render time.
The [course desk update](https://hq.mega.dev/challenges/what-it-shows) dated 5 October 2026 reports
#4471 closed: parser FIXED, `fix(dates): parse dd/mm for eu locales`; hint WON'T FIX because
booking-v3 was retired. These are desk-reported production outcomes, not our production tests.
The five timing reports remain provisional; no timezone or shared timing cause is established.

## Public tickets

- [Parser candidates: 374 reports](https://github.com/Nortus222/mega-s01e03-what-it-shows/issues/1), reported fixed, with the original model's 379 explained.
- [booking-v3 hint: 33 reports](https://github.com/Nortus222/mega-s01e03-what-it-shows/issues/2), not planned because the form was retired.
- [Unresolved timing investigation: 5 reports](https://github.com/Nortus222/mega-s01e03-what-it-shows/issues/3).

The prior delivery was merged into `main`. This source follow-up is on
`challenge/s01e03-course-signature`; its PR target is `main`.

## Run locally

Use Node.js 24 and npm. From the repository root:

```sh
npm ci
npm run test:analysis
npm test
npm run test:render
npm run dev -- --port 4173
```

Open `http://127.0.0.1:4173/kb/incidents/4471-analysis/`.
`test:analysis` checks unique IDs, tenant/form classification and provisional timing exceptions.
`npm test` runs the full unit suite. `test:render` starts an ephemeral local server, checks all KB
routes through Svelte SSR, verifies the analysis tables, course-ticket frontmatter, derived signature
stamps and incident desk outcomes, and compiles the
interactive client components. It does not run a production build or browser interaction test.

## Build the static delivery

```sh
npm run build
python3 -m http.server 4173 --directory rendered
```

Open `http://127.0.0.1:4173/kb/incidents/4471-analysis/`. The production build uses SvelteKit's
static adapter, MDsveX layouts and the original Svelte components. It writes rendered HTML,
CSS and client JavaScript to `rendered/`, including
`rendered/kb/incidents/4471-analysis/index.html`. The client bundle preserves the reactive explorer.
Serve the entire directory over HTTP to keep navigation and interactivity working. It needs no
Node.js application server after building. `npm run preview -- --port 4173` also previews the build.

`rendered/` contains the rebuilt site with the course-issued signature, derived desk refs and
reported engineering outcomes. The full production build passed. Safari displayed the new desk
update, unchanged computed counts and the new signature stamp correctly.
See [verification](docs/verification.md) for the checks and their limits.

## Source and evidence

| Path | Purpose |
| --- | --- |
| `original/kb-export.zip` | Unmodified source archive |
| `support-kb/src/lib/data/` | Raw report rows, desk notes and tenant locale/form directory |
| `support-kb/src/lib/kb/causes.ts` | Unchanged exported classifier |
| `support-kb/src/lib/kb/investigation.ts` | ID deduplication and provisional investigation grouping |
| `support-kb/src/lib/kb/InvestigationTable.svelte` | Computed totals, tenant/form evidence and timing report bodies |
| `support-kb/src/routes/kb/incidents/4471-analysis/+page.svx` | Signed analysis source with the original received/merged timeline |
| `support-kb/src/routes/kb/decisions/0001-dedupe-by-subject/+page.svx` | Accepted historical decision, preserved byte-for-byte |
| `support-kb/src/routes/kb/decisions/0002-dedupe-by-evidence/+page.svx` | Signed superseding decision |
| `support-kb/src/routes/kb/triage/dedupe/+page.svx` | Active evidence-based triage guidance |
| `docs/issues/` | Parser and hint issue records with desk outcomes, plus the provisional timing investigation |

The raw export has 427 rows and 412 unique report IDs. Browser locale and intake tags are not
authoritative. Tenant configuration determines the original model's parser/form distinction;
report bodies and desk notes expose the model's limitations. Timing exceptions do not prove a
common cause. The original CauseTable and DedupeExplorer remain evidence views with explicit
limitations on their host pages. Decision 0002 replaces subject-only merging in active guidance.

Signed pages carry the exact course ticket as frontmatter provenance and pass it to the original
`RenderStamp` component. Its desk reference comes from code. Human attribution stays separate.
Written by gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.

Build references: [SvelteKit static adapter](https://svelte.dev/docs/kit/adapter-static),
[SvelteKit Vite configuration](https://svelte.dev/docs/kit/@sveltejs-kit-vite),
[MDsveX](https://github.com/pngwn/MDsveX).
