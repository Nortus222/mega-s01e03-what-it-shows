# Delivery verification

Verified 28 October 2026, feature branch `challenge/s01e03-what-it-shows`.

- `npm test`: 6 unit tests passed. The tests cover overlapping IDs, ticket filtering, tenant/form classification, misleading intake metadata, missing tenants and the five provisional exceptions.
- `npm run test:render`: 6 actual SSR KB routes and 7 client compilation checks passed, including the original layout, timeline and signature stamps.
- `npm run build`: complete server/client production build and static prerender passed. The output contains 45 files under `rendered/`. The inherited NO_COLOR/FORCE_COLOR environment produced a color-setting warning; there were no build failures.
- Safari: the built analysis displayed styled tables, original-model totals, provisional investigation totals and the derived desk ref. Navigation to active triage worked. Changing report A's channel from form to app changed its classification from hint to parser and the explorer verdict from different to same.
- Original export comparison: all archive entries except the intentionally updated active triage and original incident pages remain byte-for-byte identical, including accepted decision 0001. The unchanged archive is committed separately.
- `git diff main...HEAD --check -- . ":(exclude)rendered/**"`: passed for authored source. The untouched generated HTML and vendor client bundle contain build-emitted trailing whitespace.

The export contains no production parser or booking-form application. No production reproduction, fix, timezone root cause or shared cause for the five timing reports is verified. The investigation split is provisional.

Written by gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.
