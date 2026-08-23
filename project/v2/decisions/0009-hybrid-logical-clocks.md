---
title: Order replicated changes with hybrid logical clocks, not wall clock
type: decision
status: current
deployable: [hub, desktop, shared]
domain: []
concern: [sync, data-integrity]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs:
  - src/main/java/com/dk_power/power_plant_java/entities/sync/FieldChange.java
---

# ADR-0009: Order replicated changes with hybrid logical clocks, not wall clock

## Status

`current`

## Context

The current replication layer orders changes by wall-clock timestamp. Measured
2026-08-21:

```
FieldChange.timestamp                     Instant   (raw wall clock)
Lamport / HLC / vector clock occurrences  0
Wall-clock call sites in sync code        222
```

Last-writer-wins therefore resolves by comparing timestamps produced by *different
machines' system clocks*. This is only correct if those clocks agree.

Desktops run partitioned for long periods — see
[[0004-three-deployables-multi-master]] — which is exactly the condition under which
clocks drift furthest. When they disagree, the wrong write wins, and it does so
**silently**: no error, no conflict record, no trace. Divergence that persists after
both nodes have exchanged everything is the expected symptom, and that symptom has
been observed in production.

## Decision

Every replicated operation carries a **hybrid logical clock** stamp: a monotonic
logical component that captures causality, combined with a physical component that
keeps values human-interpretable and roughly wall-clock aligned. Ordering
comparisons use the HLC. Wall-clock time is retained for display only and is never
used to decide a merge.

Ties at equal HLC are broken by node identifier, so resolution is deterministic on
every node.

## Alternatives considered

| Option | Why not |
|---|---|
| **Keep wall clock, add NTP discipline** | Reduces skew but cannot eliminate it, and fails exactly when it matters most — a partitioned desktop may also be unable to reach a time source. Correctness would depend on an operational property. |
| **Lamport clocks** | Capture causality correctly but carry no physical time, so records become impossible to interpret or debug by eye, and cannot be reconciled with externally-timestamped data such as SharePoint rows. |
| **Vector clocks** | Detect concurrency precisely rather than merely ordering it, which is strictly more information. But size grows with node count and they must be garbage-collected as nodes come and go. Reconsider only if HLC proves insufficient for detecting true concurrency. |

## Consequences

**Accepted costs.**

- Every node must persist and advance its clock state across restarts. A lost or
  reset clock is a correctness bug, so clock state is part of the backup contract.
- Operations from the existing system carry wall-clock stamps only, so migration
  must assign HLC values at import — see [[0001-rebuild-on-clean-core]].
- HLC orders operations but does **not** by itself prove two were concurrent.
  Where that distinction matters — surfacing a genuine conflict to a human rather
  than silently ordering it — additional causality metadata is required.

**Follow-on work.**

- HLC implementation with persistence and restart-safety.
- Clock state included in backup and restore.
- Partition simulator cases covering skewed and reset clocks specifically.

## Revisit if

Genuine concurrency detection turns out to matter more than ordering — that is the
case for vector clocks or dotted version vectors.
