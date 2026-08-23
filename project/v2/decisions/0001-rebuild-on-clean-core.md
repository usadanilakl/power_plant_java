---
title: Rebuild on a clean core rather than refactor in place
type: decision
status: current
deployable: []
domain: []
concern: [build, documentation]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs: []
---

# ADR-0001: Rebuild on a clean core rather than refactor in place

## Status

`current`

## Context

The existing system has been in continuous development since 2024-03-29 and works.
It is also the product of requirements that changed repeatedly while it was being
built, and of heavy AI-assisted development whose output was not always understood
by its owner. Measurements taken 2026-08-21:

| Metric | Value |
|---|---|
| Java | 205,381 LOC — 141 entities, 187 controllers, 343 services |
| TypeScript | 291,887 LOC across three frontends |
| Sync subsystem | 42,708 LOC |
| Integration glue | ~32,000 LOC (SharePoint 11k, Maximo 13k, EtaPRO 5k) |
| Tests | 77 files, 12,189 LOC — **~6% ratio, skipped by default** |
| Schema migration tooling | **none** — Hibernate auto-DDL |
| Production database | 1.4 GB |
| Java files touched in last 6 months | 1,241 of 1,552 (**80%**) |

Four problems motivate change:

1. **Understanding.** Much of the code was generated rather than reasoned about.
2. **Model debt.** Entities were reshaped repeatedly; the current model is not what
   would be designed today, and downstream complexity — notably sync — is
   proportional to that.
3. **Tooling.** Choices were made before the requirements were known.
4. **Convention drift.** No conventions were set at the start, and none are enforced.

## Decision

Build a new core and grow it, using the existing system as the **specification**
rather than as a source to port. Domains move over one at a time. The old system
stays live until a domain is proven in the new one.

## Alternatives considered

| Option | Why not |
|---|---|
| **Refactor in place** | Fixes problems 2 and 4 but not 1 — reading existing code is passive and teaches what was already decided, not what is good. Also cannot fix auto-DDL or the entity model without effectively rewriting the persistence layer anyway. |
| **Port existing code into a new structure** | Carries the model debt across, which is the actual root cause. Produces a tidier version of the same problem. |
| **Add conventions only, change nothing structural** | Addresses problem 4 alone, and leaves the 42k-line sync layer sitting on the model that made it 42k lines. |

## Consequences

**Accepted costs.**

- Two systems run concurrently for the duration of the migration.
- 1.4 GB of live production data must be migrated per domain, correctly, once.
  There is no existing migration tooling to build on.
- ~32k LOC of integration glue encodes knowledge won by hitting real walls
  (SharePoint field encoding, Maximo write quirks). Regenerating it risks
  re-hitting those walls.
- 6% test coverage means there is no automated oracle for "the new one behaves like
  the old one". Characterisation tests must be written per domain **before** that
  domain is rebuilt, not after.

**Follow-on work.**

- Schema migration tooling from commit one.
- A characterisation test harness per domain, before migration of that domain.
- A cutover procedure per domain, with rollback.

## Revisit if

A domain migration costs more than rewriting that domain in place would have. If
the second domain is not meaningfully cheaper than the first, the approach is not
amortising and should be reconsidered.
