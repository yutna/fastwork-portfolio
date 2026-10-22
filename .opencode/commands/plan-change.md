---
description: Plan a change before editing
agent: plan
---

Plan $ARGUMENTS.

Do not edit files. Read the issue and the relevant code, then return:

- the goal and acceptance criteria
- the in-scope files and why they need to change
- data, type, signature, or schema changes
- the test plan: unit, e2e, static checks, and accessibility
- risks and edge cases
- the verification commands that will prove the change works
- the FDS calibration row when JavaScript is in scope

If the requirements or acceptance criteria are undecided, stop and ask
before proposing an implementation.
