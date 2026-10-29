# Delivery verification

## Source follow-up

28 October 2026, branch `challenge/s01e03-course-signature`.

- `npm test`: all 6 unit tests passed.
- `npm run test:render`: all 6 SSR routes and 7 client compilation checks passed. Before the
  corrections, this check failed first on the missing incident snapshot/update text, then on
  author text in the analysis page's signature frontmatter.

The controller owns the fresh full production build, complete
`rendered/` output and Safari verification; the previous generated delivery remains unchanged here.

The signed analysis, triage and decision 0002 pages use the course ticket as frontmatter provenance.
Their human attribution remains separate. The render check validates ticket-shaped frontmatter
without the ignored proof file, derives expected stamps through the real `deskRef` helper and
checks the incident's rendered desk outcomes.

The [course desk update](https://hq.mega.dev/challenges/what-it-shows) dated 5 October 2026 reports
#4471 closed: parser FIXED, `fix(dates): parse dd/mm for eu locales`; hint WON'T FIX because
booking-v3 was retired. The controller supplied this fresh course-page observation in the task
brief. This is desk-reported production status, not independent production verification.
The 4 October snapshot and the five provisional timing exceptions retain their original limits.

## Prior merged delivery

Verified 28 October 2026 on `challenge/s01e03-what-it-shows`, before the source follow-up.

- `npm test`: 6 unit tests passed. The tests cover overlapping IDs, ticket filtering, tenant/form classification, misleading intake metadata, missing tenants and the five provisional exceptions.
- `npm run test:render`: 6 actual SSR KB routes and 7 client compilation checks passed, including the original layout, timeline and signature stamps.
- `npm run build`: complete server/client production build and static prerender passed. The output contains 45 files under `rendered/`. The inherited NO_COLOR/FORCE_COLOR environment produced a color-setting warning; there were no build failures.
- Safari: the built analysis displayed styled tables, original-model totals, provisional investigation totals and the derived desk ref. Navigation to active triage worked. Changing report A's channel from form to app changed its classification from hint to parser and the explorer verdict from different to same.
- Original export comparison: all archive entries except the intentionally updated active triage and original incident pages remain byte-for-byte identical, including accepted decision 0001. The unchanged archive is committed separately.
- `git diff main...HEAD --check -- . ":(exclude)rendered/**"`: passed for authored source. The untouched generated HTML and vendor client bundle contain build-emitted trailing whitespace.

The export contains no production parser or booking-form application. We have not independently
tested the desk-reported parser fix or form retirement. No timezone root cause or shared cause for
the five timing reports is verified. The investigation split is provisional.

Written by gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.
