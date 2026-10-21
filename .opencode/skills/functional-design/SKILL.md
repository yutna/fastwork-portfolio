---
name: Functional Design
description: Use when designing or reviewing modules in this repository. Routes to the vendored functional-design-skills 3.3.0 pack, with functional-javascript for plain ESM.
license: MIT
metadata:
  pack: functional-design-skills
  version: 3.3.0
---

# Functional Design

This repository vendors the `functional-design-skills` pack at version
3.3.0. The full pack is at `vendor/functional-design-skills/`; this
bridge is the OpenCode entry point.

## Read first

From the repository root, read:

1. `vendor/functional-design-skills/plugin/skills/functional-design/SKILL.md`
   for the index and the design loop.
2. `vendor/functional-design-skills/plugin/skills/functional-design/references/calibration.md`
   to choose how much design the task warrants.
3. `vendor/functional-design-skills/plugin/skills/functional-javascript/SKILL.md`
   for the JavaScript expression of the rules.

Follow the index's links into the rest of the pack when the task needs
them. Read `vendor/functional-design-skills/plugin/skills/functional-reviewing-functional-design/SKILL.md`
before finishing a change that added or reshaped a type, a signature, or
a module boundary.

## Precedence

This project's conventions, recorded in `AGENTS.md`, win. The pack
decides only what those conventions leave open. A red flag from the pack
is a place to look, not automatically a finding.

## This project

The browser code is plain ESM with JSDoc types. Keep pure rules in
`assets/krua-tumya/js/core.mjs`; keep DOM, storage, timers, and animation
in `shell.mjs`; keep DOM lookups in `dom.mjs`; `main.mjs` only starts the
shell. State transitions return new frozen values. The project page's
visual identity is fixed and must not be redesigned.
