---
title: Build the replication engine in-house
type: decision
status: current
deployable: [hub, desktop, shared]
domain: []
concern: [sync, data-integrity, storage]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs:
  - src/main/java/com/dk_power/power_plant_java/entities/sync/FieldChange.java
---

# ADR-0007: Build the replication engine in-house

## Status

`current`

## Context

[[0004-three-deployables-multi-master]] establishes that true multi-master
replication is required. The next question is whether to adopt an existing engine
or build one.

The existing implementation is 42,708 LOC and works, but has produced repeated
production incidents. A survey of off-the-shelf options against the constraint
"Java on both ends, relational data, true multi-master merge" found no fit:

| Candidate | Verdict |
|---|---|
| **PowerSync** | No Java SDK. More importantly it is not multi-master — the server is authoritative and the merge logic is still yours to write. |
| **ElectricSQL** | Now primarily a read-path sync engine; writes go through your own API. Same gap. |
| **cr-sqlite** | Closest structural fit — column-level CRDTs inside SQLite. But it is a native extension with uncertain maintenance, and it sits *below* the ORM, so the desktop would give up JPA. |
| **Automerge / Yjs** | Excellent merge semantics, but document CRDTs. Poor fit for relational data that must be queried. |
| **Couchbase Lite** | Has a Java SDK and battle-tested replication, but is a document store — not the data model. |

The ecosystem is overwhelmingly JavaScript- and mobile-first. Everything with a
Java story is either not multi-master or not relational.

## Decision

Build the replication engine, targeting roughly a tenth of the current size, and
implement published algorithms rather than inventing merge semantics.

## Rationale

**The current 42k lines are not the cost of CRDT — they are the cost of the entity
model.** 141 entities with bespoke merge handling, three-pass application, and
relationship retry logic. A clean model with *declared* merge rules needs a fraction
of that, and [[0001-rebuild-on-clean-core]] is already fixing the model.

**This subsystem cannot be a black box.** Replication has already caused production
incidents in this system. A dependency whose failure modes are unreadable is worse
here than code that is understood.

**It is the primary learning objective.** Distributed state convergence is the most
substantial engineering problem in the system; adopting a library removes it.

## Design constraints this decision imposes

These are the changes that produce the size reduction and the correctness
improvement. Each is a requirement on the new engine, not a suggestion.

1. **An explicit append-only op-log, written in the same transaction as the data.**
   Not inferred from JPA lifecycle callbacks. The current emission-loss class —
   changes silently dropped during a mid-commit flush — exists precisely because
   changes are derived from `@PostUpdate` rather than written deliberately.

2. **Causal ordering via hybrid logical clocks**, not wall clock. See
   [[0009-hybrid-logical-clocks]].

3. **Merge semantics declared per field, not coded per entity.** An annotation such
   as `@Merge(LWW)` / `@Merge(ORSet)` / `@Merge(MANUAL)` read by one engine. No
   entity gets special-case code. This is where most of the savings live.

4. **Same-field collisions surfaced, not silently resolved.** Two values cannot both
   win one field. Given that concurrent same-field editing happens routinely, a
   human decides — silent LWW loses real work.

5. **A partition simulator built first.** Two nodes, scripted divergence, asserted
   convergence. Built *before* the engine, so every change afterwards is verified
   rather than hoped about.

## Consequences

**Accepted costs.**

- No upstream community fixes bugs. This burden already exists with the current
  implementation and does not increase.
- Correctness is entirely self-verified, which makes constraint 5 non-negotiable.
- Building the simulator before the engine delays the first working sync.

## Revisit if

A multi-master, relational, JVM-capable sync engine reaches production maturity.
The evaluation above is dated 2026-08-21 and this space moves.
