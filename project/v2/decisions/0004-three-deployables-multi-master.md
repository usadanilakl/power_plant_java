---
title: Retain three deployables; desktop requires multi-master replication
type: decision
status: current
deployable: []
domain: []
concern: [sync, networking, storage]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs: []
---

# ADR-0004: Retain three deployables; desktop requires multi-master replication

## Status

`current`

## Context

The system runs as three deployables: a central **hub**, Electron-wrapped
**desktop** instances each holding a full local database, and a **PWA** served
statically.

Desktop autonomy is the most expensive property in the system. It is what requires
bidirectional replication, and replication is 42,708 LOC — the single largest
subsystem, and the source of most production incidents to date. So it was worth
asking whether it is actually needed.

Two facts settle it, established 2026-08-21:

1. **Desktops run partitioned from the hub frequently, for long periods.** Not
   maintenance windows — real, extended disconnection.
2. **Two desktops routinely edit the same record, and the same fields, while both
   are disconnected**, and both edits matter.

Fact 2 is the decisive one. It rules out any design where one node is authoritative
and others defer.

## Decision

Keep all three deployables. The desktop keeps a complete local database and
**multi-master replication is a hard requirement**, not an optimisation.

## Alternatives considered

| Option | Why not |
|---|---|
| **Hub authoritative, thin desktop clients** | Eliminates the entire sync layer, but desktops stop working during partition. Contradicted by fact 1. |
| **Hub authoritative, desktop read-cache plus write outbox** | Survives outages with roughly a tenth of the code, because a single authority means no merge. Contradicted by fact 2 — concurrent same-record edits from multiple desktops have no correct resolution under a replay-ordered outbox. |
| **Reduce desktop count so partitions cannot overlap** | An operational change to solve an engineering problem; does not match how the plant actually works. |

## Consequences

**Accepted costs.**

- A genuine multi-master merge engine must exist, with all the correctness burden
  that implies: causal ordering, convergence, and conflict semantics.
- Every entity in the new model must declare how its fields merge. This constrains
  the data model design and is not optional — see [[0007-sync-built-in-house]].
- Same-field concurrent edits cannot both survive in one field, so a resolution
  policy is required per field, and some cases must reach a human.

**What it does *not* oblige.**

- It does not oblige the **PWA** to use the same mechanism — see
  [[0008-two-sync-mechanisms]].
- It does not oblige a 42k-line implementation. The current size is largely a
  consequence of the entity model, not of replication itself.

## Revisit if

Desktop partitions become rare and short, **or** concurrent same-record editing
across disconnected desktops stops happening. Either change alone makes the far
simpler outbox design correct, and would justify deleting most of the sync layer.
