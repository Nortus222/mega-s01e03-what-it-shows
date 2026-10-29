# S01E03: what the evidence shows

An evidence-backed review of support ticket #4471, using the supplied support KB export.
The original tenant model groups 379 parser and 33 hint reports. The investigation holds the
five desk-noted timing reports apart, yielding 374 parser candidates, 33 hint candidates and
five unresolved timing reports. The page computes these counts from the export at render time.
No production parser, form fix or timezone cause is verified here.

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
routes through Svelte SSR, verifies the analysis tables and signature stamps, and compiles the
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

`rendered/` is intentionally trackable. In the two-stage delivery, the implementation agent runs
focused SSR checks; the controller runs the final full build once, visually verifies it in Safari
and commits the complete `rendered/` directory before publication. Generated output is pending
until that controller step.

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
| `docs/issues/` | Approved parser, hint and provisional timing issue drafts |

The raw export has 427 rows and 412 unique report IDs. Browser locale and intake tags are not
authoritative. Tenant configuration determines the original model's parser/form distinction;
report bodies and desk notes expose the model's limitations. Timing exceptions do not prove a
common cause. The original CauseTable and DedupeExplorer remain evidence views with explicit
limitations on their host pages. Decision 0002 replaces subject-only merging in active guidance.

New pages pass their frontmatter signature to the original `RenderStamp` component. Its desk
reference comes from code. Written by gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.

Build references: [SvelteKit static adapter](https://svelte.dev/docs/kit/adapter-static),
[SvelteKit Vite configuration](https://svelte.dev/docs/kit/@sveltejs-kit-vite),
[MDsveX](https://github.com/pngwn/MDsveX).
