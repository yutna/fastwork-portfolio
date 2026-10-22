---
description: Review JavaScript changes against FDS and tests
agent: plan
---

Review the current diff for JavaScript changes. JavaScript covers
`assets/`, `scripts/`, `tests/`, and `playwright.config.mjs`.

Load the `functional-design` skill. Read the applicable calibration row
and `functional-javascript`; for test changes also read
`functional-testing-functional-code`.

Check:

- correctness and edge cases
- `Result` handling and other expected failures
- frozen state and argument mutation
- core, DOM, and shell boundaries
- test coverage of behaviour, not implementation
- JSDoc types and `tsc`
- config or tooling code that has been over-modelled

Report findings first. For each finding, give `file:line`, the smallest
fix, and the rule it violates. If there are no findings, say so and list
the checks that were run. Do not edit files.
