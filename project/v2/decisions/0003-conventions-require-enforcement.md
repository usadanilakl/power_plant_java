---
title: Every convention must have a machine enforcer
type: decision
status: current
deployable: []
domain: []
concern: [build, testing, documentation]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs: []
---

# ADR-0003: Every convention must have a machine enforcer

## Status

`current`

## Context

The stated reason the existing codebase became inconsistent is that no conventions
were set at the outset. That is only half the cause. Conventions *were* written
down — in `CLAUDE.md` and elsewhere — and drifted anyway, because nothing checked
them.

Observable results in the current codebase, measured 2026-08-21:

- Two Angular applications on **identical** versions (Angular 19.2, TypeScript
  5.7.2) with **114 same-named files** and **36 byte-identical file pairs** — and no
  shared package, no workspace configuration. One duplicated component carries a
  filename typo (`chekcbox-group.component.ts`) copy-pasted into both apps.
- 8,881 commented-out Java lines.
- Zero `TODO`/`FIXME` markers anywhere in 205k lines of Java — rot exists, but is
  unmarked and therefore invisible.

## Decision

A rule enters the conventions documents **only if a machine can check it**. Each
rule names its enforcer and the stage at which it fails. Practices that cannot be
automated are written as guides, which are advisory, and are not called conventions.

Test coverage is enforced as a ratcheting floor on **changed lines**, never as a
global percentage.

## Alternatives considered

| Option | Why not |
|---|---|
| **Written conventions plus review discipline** | This is what the current project has, and it produced the measurements above. With a single developer there is no second reviewer to supply the discipline. |
| **Global coverage floor** | Unachievable on an existing codebase, so it gets disabled, and then means nothing. A changed-lines floor is always achievable and improves monotonically. |
| **Lint warnings rather than build failures** | Warnings accumulate and are ignored. A rule that does not fail the build is advisory, and belongs in a guide. |

## Consequences

**Accepted costs.**

- Genuinely good practices that cannot be automated get demoted to guides. This is
  deliberate: it keeps the conventions list short and therefore trustworthy.
- Enforcement tooling must exist before or alongside the first code, not after.
- Build times increase.
- Early friction is high while the rules are being tuned.

**Follow-on work.**

- ArchUnit (Java structure and layering), Spotless (Java formatting), ESLint and
  Prettier (TypeScript), gitleaks (secrets), frontmatter and link validation
  (documentation), ratcheting coverage.
- See [[README|Conventions index]].

## Revisit if

Enforcement produces more false positives than genuine catches. That means the rule
is wrong, not that enforcement is wrong — fix or delete the rule, keep the mechanism.
