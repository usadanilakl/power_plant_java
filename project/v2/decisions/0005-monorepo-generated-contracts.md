---
title: Single workspace with wire contracts generated from the backend
type: decision
status: current
deployable: []
domain: []
concern: [build, data-integrity, documentation]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs: []
---

# ADR-0005: Single workspace with wire contracts generated from the backend

## Status

`current`

## Context

Measured 2026-08-21:

- `frontend/` — Angular 19.2, TypeScript 5.7.2, 207,837 LOC
- `browser/ng-ui/` — Angular 19.2, TypeScript 5.7.2, 46,382 LOC
- `electron-manager/` — Electron 43, plain TypeScript, 37,668 LOC, 3 HTML files
- **No workspace or monorepo configuration anywhere**
- **114 same-named files** across the two Angular apps; **36 byte-identical pairs**
- **No springdoc / OpenAPI** in `pom.xml` — every TypeScript type describing a
  backend payload is hand-written

Two applications on identical framework and compiler versions share no code. The
duplication is copy-paste, with a filename typo replicated into both apps as
evidence.

Separately, `CLAUDE.md` names "null / empty / undefined contracts at JSON wire
boundaries" as the highest-yield bug class found by review in this project. That is
the predictable outcome of maintaining the client's view of a payload by hand,
independently of the server's.

## Decision

One workspace (npm or pnpm workspaces) containing shared packages and the
applications that consume them:

```
packages/
  contracts/    generated from the backend OpenAPI document — never hand-edited
  api-client/   typed client over contracts
  core/         auth, outbox, storage, clock
  ui/           shared Angular components
apps/
  desktop/      pwa/      electron-shell/
```

`contracts` is **generated** from the Java DTOs via springdoc plus an OpenAPI
generator, and regenerated in CI. A drift between server and client payload types
becomes a compile error rather than a runtime surprise.

## Alternatives considered

| Option | Why not |
|---|---|
| **Keep separate repositories, publish shared packages** | Version skew between publisher and consumers, and a release step for every shared change. Unjustified for a single developer. |
| **Shared code by copy** | The current arrangement, and the source of the 36 identical pairs. |
| **Hand-written TypeScript types matching the DTOs** | Also the current arrangement. Nothing checks that the two agree, which is exactly the bug class above. |
| **Generate Java from a hand-written OpenAPI spec** | Viable, and makes the contract the source of truth rather than the code. Rejected because the backend is the system of record and a second spec artifact is a second thing to drift. |

## Consequences

**Accepted costs.**

- The backend must produce a complete, accurate OpenAPI document. Incomplete
  annotations now cause client compile errors, which is the intended pressure but is
  friction early on.
- Generated code must never be hand-edited; the generator configuration is the place
  to fix output. This needs enforcing, not just stating.
- Workspace tooling adds a build layer and its own failure modes.
- `electron-shell` is plain TypeScript and consumes `contracts` and `core` but not
  `ui`. The sharing is genuine but partial — this is expected, not a defect.

**Follow-on work.**

- Add springdoc to the backend; treat the OpenAPI document as a build artifact.
- Wire generation into CI, and fail the build when generated output differs from
  what is committed.

## Revisit if

The applications diverge enough that `ui` becomes a set of components used by one
consumer each. Shared packages with a single consumer are indirection with no
benefit.
