# AGENTS.md

## Design rules

Functional design (FDS) governs every tracked JavaScript file in this
repository. Jekyll/Liquid, HTML, CSS, docs, CI YAML, Ruby, JSON, and
non-JavaScript configuration are outside its scope.

In scope:

- `assets/**/*.{js,mjs}` — currently `assets/krua-tumya/js/*.mjs`
- `scripts/**/*.{js,mjs}`
- `tests/**/*.{js,mjs}`
- `playwright.config.mjs`

All in-scope files use plain ESM with JSDoc types checked by `tsc`
(`checkJs`, `strict`). Browser code also follows the `AGENTS.md` in its
demo's JavaScript directory (`assets/krua-tumya/js/AGENTS.md`).

For every in-scope change:

- Read the `functional-design` skill index and name the calibration row.
  A row that skips a rule binds nothing.
- Run the "Is the problem decided?" check. If the rules are not settled,
  stop and ask before modelling.
- Apply every rule the chosen row binds, then use
  `functional-javascript` for syntax. For tests, also read
  `functional-testing-functional-code`.
- Run the checklist in `functional-reviewing-functional-design` before
  finishing any in-scope change.
- This project's conventions win over the pack. Calibration decides how
  much design a file needs: config and tooling usually take the lightest
  row, and over-modelling is itself a design failure.

The pack is vendored at `vendor/functional-design-skills/` (version
3.3.0). Start at
`vendor/functional-design-skills/plugin/skills/functional-design/SKILL.md`.
The `.opencode/skills/functional-design` bridge is the OpenCode entry
point. Do not modify the vendored pack; update it as a whole when the
upstream version changes.

## Project

This is a public portfolio for Yutthana Siphuengchai, deployed as a
GitHub Pages project site at <https://yutna.github.io/fastwork-portfolio/>.

- Home: an editorial index with its own identity (`assets/css/home.css`,
  Instrument Serif, IBM Plex Sans Thai, paper/ink/cobalt).
- `/krua-tumya/`: a Jekyll port of the ครัวตำย่าปากซอย demo. Preserve
  its markup, CSS, palette, fonts, copy, and behaviour. The only visual
  addition is the floating `← Portfolio` link. A non-visual `role="group"`
  correction on `.hero-proof` is also intentional. Four approved Thai
  copy corrections are documented in `CONTRIBUTING.md`; do not change
  other copy.
- The project site uses `baseurl: /fastwork-portfolio`. Use
  `relative_url` for every internal link and asset; never hard-code a
  root-relative URL without it.
- No search indexing is wanted. Keep `robots.txt`, the `noindex` meta
  tags, and the `noindex` checks in `scripts/check-site.mjs`. This is
  best-effort on a public host.
- No analytics, trackers, cookies, or third-party runtime dependencies.
  Google Fonts on the preserved ครัวตำย่า demo are part of the original
  design.

## Context map

| Path | Why it matters |
| --- | --- |
| `assets/krua-tumya/js/` | Preserved browser runtime; read its `AGENTS.md` first |
| `scripts/` | Node checks, screenshots, and preview server; use `node:` built-ins |
| `tests/` | Unit tests and Playwright specs; assert behaviour, not implementation |
| `playwright.config.mjs` | E2E config; use the lightest FDS row |
| `_config.yml`, `_layouts/`, `_includes/`, `index.html`, `krua-tumya/`, `404.html` | Jekyll pages and shared markup |
| `assets/css/` | Home styles |
| `.github/workflows/` | CI, PR checks, Pages, and release |
| `README.md`, `CONTRIBUTING.md` | Public overview and contributor workflow |

## Workflow

1. Read the issue, then restate the goal and acceptance criteria. Stop
   and ask if they are undecided.
2. Search before reading. Use `rg` and globs, then read only the
   relevant files and line ranges.
3. Decide whether FDS applies, and plan the files, data or signature
   changes, tests, risks, and verification. Use `/plan-change` for a
   plan-only pass.
4. Implement the smallest complete change. Keep unrelated files alone.
5. Run targeted checks while iterating. Read the failure, fix the
   cause, and rerun the smallest check that proves it.
6. Run the full quality gate, review the diff, run the FDS review for
   JavaScript, and report the changed files, verification, and blockers.

Fewer revision loops come from better inspection, not from skipping
verification. Do not stop after one edit while a check is failing.

## Quality gate

Aim for a correct first implementation: inspect enough that avoidable
mistakes do not happen. If a check or review finds a problem, fix it and
rerun until the gate is green.

### Definition of done

- [ ] The issue is linked from the pull request.
- [ ] Acceptance criteria are met and checked off.
- [ ] `mise exec -- npm run test:all` passes.
- [ ] JavaScript changes used the FDS pass and review.
- [ ] Docs and templates match the behaviour.
- [ ] The diff is scoped, reviewed, and free of secrets.

## Token discipline

- Search first; read targeted ranges instead of whole files.
- Do not re-read a file after editing; use `git diff`.
- Batch related edits. Run targeted checks between batches, not after
  every line.
- Load only the skills the task needs. Non-JavaScript work does not
  need FDS.
- Keep reports to changed files, verification, and blockers.
- Never trade correctness for fewer tokens or a faster-looking result.

## Commands

Use the pinned toolchain through mise:

```bash
mise exec -- bundle exec jekyll build   # writes _site/
mise exec -- npm run lint:js            # tsc --noEmit
mise exec -- npm run test:unit          # node:test
mise exec -- npm run test:e2e -- tests/e2e/project.spec.mjs
mise exec -- npm test                   # typecheck, static/HTML/link checks, unit + e2e
mise exec -- npm run test:all           # build first, then the full suite
mise exec -- npm run preview            # serve _site at the production base path
mise exec -- npm run capture            # save desktop/mobile audit screenshots
```

Run `npm run test:all` before claiming a change is complete. The e2e
suite runs at 1440×1000 and 390×844, checks the demo's behaviour, local
persistence, reduced motion, audits WCAG A/AA with axe, and verifies the
noindex and internal-link checks.

## Git workflow

Follow the oss-kit workflow in `CONTRIBUTING.md`: issue first, branch as
`<type>/<issue>-<slug>`, draft PR, Conventional Commits title, milestone,
and squash merge. Keep the PR in draft until the quality gate is green.
Do not publish a Fastwork profile from this repository.

## Known constraint

The original ครัวตำย่า palette puts six small labels at 4.42:1 against
their backgrounds (WCAG AA asks for 4.5:1). The a11y test allows only
those documented selectors on the preserved page and fails on any new
contrast issue. Do not change the preserved demo's palette to silence
them.
