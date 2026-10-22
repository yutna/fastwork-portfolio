---
name: Functional Design
description: Use when writing or reviewing JavaScript in this repository: site runtime, Node scripts, tests, or Playwright config. Routes to the vendored functional-design-skills 3.3.0 pack, with functional-javascript for syntax and functional-testing-functional-code for tests.
license: MIT
metadata:
  pack: functional-design-skills
  version: 3.3.0
---

# Functional Design

This repository vendors the `functional-design-skills` pack at version
3.3.0. The full pack is at `vendor/functional-design-skills/`; this
bridge is the OpenCode entry point.

## Scope

FDS applies to every tracked JavaScript file outside `vendor/`,
`node_modules/`, and `_site/`:

- `assets/**/*.{js,mjs}` — currently `assets/krua-tumya/js/*.mjs`
- `scripts/**/*.{js,mjs}`
- `tests/**/*.{js,mjs}`
- `playwright.config.mjs`

It does not apply to Jekyll/Liquid, HTML, CSS, docs, CI YAML, Ruby,
JSON, or non-JavaScript configuration.

## Read first

From the repository root, read:

1. `vendor/functional-design-skills/plugin/skills/functional-design/SKILL.md`
   for the index and the design loop.
2. `vendor/functional-design-skills/plugin/skills/functional-design/references/calibration.md`
   to choose how much design the task warrants.
3. `vendor/functional-design-skills/plugin/skills/functional-javascript/SKILL.md`
   for the JavaScript expression of the rules.
4. `vendor/functional-design-skills/plugin/skills/functional-testing-functional-code/SKILL.md`
   when the change touches tests.
5. `vendor/functional-design-skills/plugin/skills/functional-reviewing-functional-design/SKILL.md`
   before finishing any in-scope change.

Follow the index's links into the rest of the pack when the task needs
them. Do not read the whole pack when the index and the selected skills
are enough.

## Full pass

For every in-scope change:

1. Run the "Is the problem decided?" check. If the rules are not
   settled, stop and ask before modelling.
2. Name the calibration row. A row that skips a rule binds nothing.
3. Apply every rule the chosen row binds, then use the JavaScript
   language pack for syntax.
4. Run the review checklist before declaring the change done.

"Full" means the complete applicable pass for the chosen row, not the
heaviest row for every task. Over-applying is itself a design failure.

## Precedence

This project's conventions, recorded in `AGENTS.md`, win. The pack
decides only what those conventions leave open. A red flag from the pack
is a place to look, not automatically a finding.

The project deliberately applies FDS to Node scripts, tests, and the
Playwright config as well as runtime code. The pack's note that it is
not for build and tooling problems is overridden by that convention;
calibration still decides how much design each file needs.

## This project

- Browser runtime: `assets/krua-tumya/js/AGENTS.md` maps `core.mjs`,
  `dom.mjs`, `shell.mjs`, and `main.mjs`, and records the runtime
  invariants.
- Node scripts: use `node:` built-ins and the existing dev dependencies.
  Keep effects at the edges.
- Tests: use `node:test` and Playwright. Assert on returned values and
  stored state, not implementation details.
- `playwright.config.mjs` is configuration. Give it the lightest
  calibration row and do not add wrapper types.
