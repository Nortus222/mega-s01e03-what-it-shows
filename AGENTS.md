# S01E03 delivery

Feature PRs target `main`. Keep the integration checkout read-only; work in this T3-managed feature worktree. The course repo is `Nortus222/mega-s01e03-what-it-shows`.

Keep the original archive in `original/kb-export.zip` unchanged. Preserve accepted decision 0001 and add a superseding record. Derive displayed report counts and the page stamp from code, with tenant locale/form as evidence and the five timing exceptions clearly provisional.

Build and test commands belong in the root package.json and README. Run targeted tests during implementation and one full build at the end. Review `git diff HEAD` plus untracked files before the first feature commit, then `git diff main...HEAD` after commits exist. Commit only this task, push the feature branch and open its PR against main. The owner merges it.

From the root, use `npm ci`, `npm run test:analysis` for focused analysis tests, `npm test` for the full unit suite and `npm run test:render` for focused SSR/client compilation checks. Run `npm run build` once at final delivery and commit the complete `rendered/` output. In delegated implementation, leave that full build and Safari verification to the controller. Source pages live in `support-kb/src/routes/kb/`; serve generated output with `python3 -m http.server 4173 --directory rendered`.

GitHub comments begin with a note alert identifying `gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.` PR bodies end with `Model: gpt-6.1-sol · Harness: Codex in T3 Code`. No model Co-Authored-By trailer.
