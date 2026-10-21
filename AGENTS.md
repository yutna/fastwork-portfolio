# AGENTS.md

## Design rules

This codebase follows functional design. The `functional-design` skill
is the index; the rest of the pack carries one rule each.

- This project's own conventions win. The pack decides what they leave
  open, and a pack red flag is a place to look, not a finding.
- Before designing a new module, workflow, endpoint, or bounded
  context, read `functional-design` and follow its design loop.
- For anything smaller, use its calibration table to decide how much
  design the task warrants. For one function in a module that already
  exists, that is an honest signature and a precise name, nothing more.
- Before finishing a change that added or reshaped a type, a signature,
  or a module boundary, run the checklist in
  `functional-reviewing-functional-design`.
- Use `functional-javascript` for concrete syntax.

The pack is vendored at `vendor/functional-design-skills/` (version
3.3.0). Start at
`vendor/functional-design-skills/plugin/skills/functional-design/SKILL.md`.
The `.opencode/skills/functional-design` bridge tells OpenCode where to
find it. Do not modify the vendored pack; update it as a whole when the
upstream version changes.

## Project

This is a public portfolio for Yutthana Siphuengchai, deployed as a
GitHub Pages project site at <https://yutna.github.io/fastwork-portfolio/>.

- Home: an editorial index with its own identity (`assets/css/home.css`,
  Instrument Serif, IBM Plex Sans Thai, paper/ink/cobalt).
- `/krua-tumya/`: a Jekyll port of the ครัวตำย่าปากซอย demo. Preserve
  its markup, CSS, palette, fonts, copy, and behaviour. The only visual
  addition is the floating `← Portfolio` link. A non-visual `role="group"`
  correction on `.hero-proof` is also intentional.
- The project site uses `baseurl: /fastwork-portfolio`. Use
  `relative_url` for every internal link and asset; never hard-code a
  root-relative URL without it.
- No search indexing is wanted. Keep `robots.txt`, the `noindex` meta
  tags, and the `noindex` checks in `scripts/check-site.mjs`. This is
  best-effort on a public host.
- No analytics, trackers, cookies, or third-party runtime dependencies.
  Google Fonts on the project page are part of the original demo.

## JavaScript

- Plain ESM with JSDoc types checked by `tsc` (`checkJs`, `strict`).
- Keep pure rules in `assets/krua-tumya/js/core.mjs`. DOM, storage,
  timers, and animation belong in `shell.mjs`; lookups belong in
  `dom.mjs`. `main.mjs` only starts the shell.
- State transitions return a new frozen state. Do not mutate arguments
  or module-level shared data.
- Expected failures are values, not exceptions. Programmer errors may
  throw. Use the existing `Result` shape.
- No framework and no build step for browser code. Node scripts may use
  `node:` built-ins and the dev dependencies already in `package.json`.

## Commands

Use the pinned toolchain through mise:

```bash
mise exec -- bundle exec jekyll build   # writes _site/
mise exec -- npm test                   # typecheck, static/HTML/link checks, unit + e2e
mise exec -- npm run test:all           # build first, then the full suite
mise exec -- npm run preview            # serve _site at the production base path
mise exec -- npm run capture            # save desktop/mobile audit screenshots
```

Run `npm run test:all` before claiming a change is complete. The e2e
suite runs at 1440×1000 and 390×844, checks the project's behaviour and
local persistence, audits WCAG A/AA with axe, and verifies the noindex
and internal-link checks.

## Workflow

Follow the oss-kit workflow in `CONTRIBUTING.md`: issue first, branch as
`<type>/<issue>-<slug>`, draft PR, Conventional Commits title, milestone,
and squash merge. Do not publish a Fastwork profile from this repository.

## Known constraint

The original ครัวตำย่า palette puts six small labels at 4.42:1 against
their backgrounds (WCAG AA asks for 4.5:1). The a11y test allows only
those documented selectors and fails on any new contrast issue. Do not
change the demo's palette to silence them.
