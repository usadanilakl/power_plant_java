---
title: Replication spike — findings
type: guide
status: current
deployable: [hub, desktop]
domain: []
concern: [sync, data-integrity, testing, storage]
created: 2026-08-21
updated: 2026-08-21
code_refs:
  - spike/replication/src/main/java/plant/repl/engine/Replica.java
  - spike/replication/src/main/java/plant/repl/clock/HybridLogicalClock.java
  - spike/replication/src/main/java/plant/repl/engine/OrSetField.java
  - spike/replication/src/test/java/plant/repl/sim/Simulator.java
---

# Replication spike — findings

Answers open question **Q2**: how much of the current 42,708-line replication layer is
inherent to multi-master replication, and how much is entity-model complexity.

Built 2026-08-21 in `spike/replication` — a dependency-free Java 21 module, so the
line count is an honest measurement rather than a framework's.

## What was built

The order ADR-0007 requires: simulator first, engine second.

| | |
|---|---|
| **Simulator** | Partitionable network of replicas, per-node controllable clocks, delivery to a fixed point, byte-identical convergence assertion |
| **Engine** | Hybrid logical clock, append-only op-log with idempotent apply, three merge policies declared per field, concurrency detection, conflict recording |
| **Model** | A slice of the real `LotoPoint` — annotations only, no state |

15 tests. All green.

## The measurement

```
NEW  engine (src/main)                404 code lines   (726 raw), 12 files
     simulator + tests (src/test)     381 code lines   (582 raw),  5 files

OLD  sync subsystem, total         25,605 code lines  (42,708 raw), 209 files
```

Comparing the whole subsystem would be dishonest — most of it is not merge logic. By
responsibility:

| Responsibility | Files | Code lines | Shrinks with a clean model? |
|---|---:|---:|---|
| **Merge + apply (the core)** | 32 | 4,849 | **yes — this is the like-for-like comparison** |
| Controllers / admin tooling | 35 | 4,529 | some |
| SharePoint bridge | 28 | 3,989 | no — integration surface |
| Recovery / resync | 7 | 3,175 | some |
| File / binary channel | 13 | 2,585 | no — separate concern |
| Transport | 9 | 1,600 | no |
| Drift detection / reconcile | 16 | 1,062 | partly — better merge means less drift to detect |
| Delivery bookkeeping | 7 | 376 | some |

*(Categories overlap where a file matches more than one; totals are indicative.)*

**The like-for-like comparison is 404 lines against 4,849.**

## Verdict on Q2

**The hypothesis holds for the merge core, and fails for the subsystem as a whole.**

ADR-0007 targets "roughly a tenth" of 42,708 — about 4,200 lines for everything. That
now looks **too aggressive**. Roughly 8,000 lines of the current total are SharePoint
bridging, file-content sync, and transport: integration surface that does not care how
elegant the merge engine is and will not shrink.

A realistic target is **8,000–12,000 lines total, with the merge core under 1,000**.
Still a 2–3× reduction overall and a ~10× reduction in the part that has caused the
production defects — but not the 10× across the board that ADR-0007 implies.

That correction is the spike doing its job. The claim was a hypothesis and is now a
measurement.

## What the spike proves

Each of these is a passing test, and each was verified by deliberately breaking the
implementation and confirming the right test failed.

**Hybrid logical clocks fix the ordering defect.** Mutating `Hlc.compareTo` to compare
wall-clock time only — precisely what the current system does — produces:

```
expected: <after the correction> but was: <before the correction>
```

A clock correction moving time backwards causes a causally later write to lose. That
is the production defect, reproduced in a test in under a second.

**Concurrency detection needs more than an HLC.** ADR-0009 flagged this as a caveat;
the spike confirms it and shows the fix. Each `SET` carries `basedOn`, the stamp of
the value it observed. If that differs from the applying replica's current stamp, the
writes were independent. An HLC alone would have ordered them silently.

**Declared merge policy keeps the engine generic.** No per-entity code exists anywhere
in the engine. Adding an entity costs annotations. The current system's three-pass
application and relationship retry logic have no counterpart here.

**Observed-remove sets eliminate the collection defect.** Two replicas each adding a
different member while partitioned keep both. Under the current comma-separated-string
model — `equipmentIds`, `fileIds` as whole-value LWW — one set of additions is
silently discarded. Mutating `remove` to drop the element naively fails the add-wins
test with a divergence report.

**Conflicts converge.** Two replicas independently deriving a conflict from the same
operations produce identical conflict records, order-independently. If they did not,
the system would not have converged.

## The finding that changes sequencing

**The engine imposes almost nothing on the database.** It needs three things:

1. append-only insert
2. read forward from a cursor
3. a transaction spanning the data write and the op-log write

No stored procedures, no triggers, no CRDT extension, no special types. State is
scalars, tag sets, and conflict rows — ordinary relational shapes.

**Q1 (database choice) was listed as blocked on Q2. It is now unblocked**, and can be
decided on its own merits: the desktop's embedded requirement, migration tooling,
operational size, and backup story. Replication does not constrain it.

## What the spike does not cover

Named explicitly so the estimate above is not read as more than it is:

- **Persistence.** State lives in memory. Real durability, and the transaction spanning
  data and op-log, is the next thing to prove.
- **Entity lifecycle.** Only field operations exist. Creation, deletion, and the
  foreign-key ordering that produced the current three-pass applier are untested — and
  FK ordering is the most likely place the line count grows.
- **Transport, retention, compaction, dead-lettering, drift tooling.**
- **Conflict resolution.** Conflicts are recorded, never resolved. That is Q4, and it
  is a product question as much as a technical one.

## Running it

```
cd spike/replication && mvn test
```

15 tests, about a second. No dependencies beyond JUnit.
