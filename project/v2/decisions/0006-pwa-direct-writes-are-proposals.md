---
title: PWA direct write paths are append-only proposals, never record edits
type: decision
status: current
deployable: [hub, pwa]
domain: []
concern: [sync, integration, data-integrity]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs: []
---

# ADR-0006: PWA direct write paths are append-only proposals, never record edits

## Status

`current`

## Context

The PWA can currently write through three transports: via the hub, directly to
SharePoint, and directly to Supabase. The direct paths exist so field staff can
still submit work when the hub is unreachable, which is a real operational need and
is being kept.

Three writers into one dataset is also the classic source of divergence. The
existing system has already produced a confirmed instance: two partitioned nodes
each created the same-named record, each de-duplicated to *its own* survivor with a
different id, and the two states stayed stably diverged — converged in the sense that
replication had nothing left to send, and wrong.

The requirement is "submit when the hub is down", not "maintain three authorities".
Those can be separated.

## Decision

Keep all three transports. Restrict what the direct ones are permitted to carry:

- Direct-to-SharePoint and direct-to-Supabase writes are **append-only submissions**
  — new work requests, JHAs, instrumentation readings, and similar.
- They are **proposals**, not authoritative records. The hub ingests them into the
  same op-log as every other change, assigning identity and clock stamps on ingest.
- They may **never** edit an existing record, and may never allocate an identity
  that the hub must later accept as canonical.

One authority, three transports.

## Alternatives considered

| Option | Why not |
|---|---|
| **Collapse to one write path (hub only)** | Cleanest, and eliminates the divergence class outright — but field staff genuinely need to submit during hub outages. Rejected on operational grounds. |
| **Keep all three as full peers** | This is the current design. It requires reconciling three independent authorities, which is what produced the stable-divergence defect. |
| **Direct paths write to a staging area only the hub reads** | Effectively the chosen option; "proposal" is the same idea named for its semantics rather than its storage. |

## Consequences

**Accepted costs.**

- The PWA must distinguish "create new" from "edit existing" and disable the latter
  when running on a direct transport. This is a visible product constraint, not just
  an internal rule.
- Identity assignment moves to the hub, so a submission's final id is not known at
  submit time. The PWA needs a client-side correlation id and a way to show
  "submitted, awaiting acceptance".
- Ingest must be idempotent — a submission may arrive twice via two transports.

**Follow-on work.**

- Correlation-id scheme and idempotent ingest.
- Define the accepted / pending / rejected states a submission can be in, and how the
  PWA surfaces each.

## Revisit if

Hub availability improves to the point that direct transports go unused for a
sustained period. At that point collapsing to a single path becomes free.
