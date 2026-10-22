# JavaScript instructions

These instructions apply to `assets/krua-tumya/js/`. They add runtime
rules to the repository-wide FDS rule in the root `AGENTS.md`; they do
not narrow that scope. All tracked JavaScript — runtime, Node scripts,
tests, and Playwright config — follows FDS.

## Full FDS pass

For every change in this directory:

1. Read `vendor/functional-design-skills/plugin/skills/functional-design/SKILL.md`
   and name the calibration row. A row that skips a rule binds nothing.
2. Run the "Is the problem decided?" check. If the rules are not settled,
   stop and ask before modelling.
3. Apply every rule the chosen row binds. Use
   `vendor/functional-design-skills/plugin/skills/functional-javascript/SKILL.md`
   for syntax.
4. Run the checklist in
   `vendor/functional-design-skills/plugin/skills/functional-reviewing-functional-design/SKILL.md`
   before finishing.

"Full" means the complete applicable pass for the chosen row. It does
not mean using the heaviest row for a local helper; the pack treats
over-application as a design failure.

## Module map

- `core.mjs` — pure rules, state transitions, and the `Result` shape.
  No DOM, storage, timers, or animation.
- `dom.mjs` — DOM lookups and lookup assertions only.
- `shell.mjs` — DOM, storage, timers, and animation. It calls the core;
  business rules do not live here.
- `main.mjs` — starts the shell only.

## Invariants

- Plain ESM with JSDoc types checked by `tsc` (`checkJs`, `strict`).
- State transitions return a new frozen state. Do not mutate arguments
  or module-level shared data.
- Expected failures are values, not exceptions. Programmer errors may
  throw. Use the existing `Result` shape.
- If you introduce a tagged union, use one `tag` key consistently and
  test every case.
- The demo's markup, CSS, palette, fonts, copy, and behaviour are fixed.
  Do not redesign them.

## Checks

Run targeted checks while iterating, then the full suite before done:

```bash
mise exec -- npm run lint:js
mise exec -- npm run test:unit
mise exec -- npm run test:e2e -- tests/e2e/project.spec.mjs
mise exec -- npm run test:all
```

For test changes, read
`vendor/functional-design-skills/plugin/skills/functional-testing-functional-code/SKILL.md`.
