---
title: Conventions
type: convention
status: current
deployable: []
domain: []
concern: [build, testing, security, documentation]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# Conventions

Per [[0003-conventions-require-enforcement]], a rule lives here **only if a machine
can check it**. Everything else is a guide.

If you are about to add a rule and cannot name its enforcer, you are writing a
guide. Put it in `guides/`.

## Enforcement matrix

The mechanisms, and what each is responsible for. This table is the contract; the
individual convention documents fill in the rules.

| Area | Enforcer | Runs at | Status |
|---|---|---|---|
| Java structure, layering, naming | ArchUnit (as real tests) | build | not built |
| Java formatting | Spotless | pre-commit + CI | not built |
| TypeScript lint, naming, imports | ESLint | pre-commit + CI | not built |
| TypeScript formatting | Prettier | pre-commit + CI | not built |
| Secrets never committed | gitleaks | pre-commit + CI | not built |
| Generated code not hand-edited | regenerate + diff check | CI | not built |
| Test coverage | ratcheting floor on **changed lines** | CI | not built |
| Doc frontmatter valid | frontmatter validator | CI | not built |
| Doc links and `code_refs` resolve | link checker | CI | not built |
| Dependency vulnerabilities | dependency scan | CI | not built |

Nothing above is built yet. The matrix is written first deliberately: it is the
specification for the tooling, and it prevents rules being added that have no
mechanism.

## Documents

| Document | Covers | Blocked on |
|---|---|---|
| [[naming]] | identifiers, types, files, endpoints, database objects | module layout, DB choice |
| [[filesystem]] | workspace layout, package structure, where things live | [[0005-monorepo-generated-contracts]] is decided; module split is not |
| [[secrets]] | what is a secret, where it lives, how it reaches a process | — |
| [[environments]] | the environment matrix and how configuration is selected | DB choice |
| [[testing]] | the test pyramid, what is mandatory, coverage policy | — |
| [[documentation]] | how to write docs here | — (see [[../README]] and [[../_meta/frontmatter-schema]]) |

## Two rules that apply everywhere

These are stated once here rather than repeated in each document.

**1. Generated artifacts are never hand-edited.**
Applies to `packages/contracts`, OpenAPI documents, database schema derived from
migrations, and any generated view page in this documentation. Fix the generator.
Enforced by regenerating in CI and failing on any diff.

**2. A convention with a documented exception is fine; an undocumented one is a bug.**
Exceptions go in the "Known exceptions" section of the relevant convention document,
with the reason. Suppression comments in code must reference that section.

## Why the coverage rule is what it is

A global coverage percentage is unachievable on a real codebase, so it gets lowered
until it means nothing — the current project has ~6% and tests disabled by default,
which is the end state of that path.

A floor on **changed lines** is always achievable, because you control the lines you
are changing right now. It improves monotonically and never blocks unrelated work.
That is the only coverage rule here.
