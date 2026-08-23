---
title: Entity modelling rules for replication
type: decision
status: current
deployable: []
domain: []
concern: [sync, data-integrity, storage]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs:
  - spike/replication/src/main/java/plant/repl/model/LotoPoint.java
  - spike/replication/src/main/java/plant/repl/model/MergeRegistry.java
  - spike/replication/src/main/java/plant/repl/engine/OrSetField.java
---

# ADR-0011: Entity modelling rules for replication

## Status

`current`

## Context

[[0007-sync-built-in-house]] establishes that merge behaviour is declared per field.
That only works if fields are modelled so a policy *can* be declared for them. A field
holding several independently-owned pieces of data has no correct policy — whatever is
chosen, some editor's work is discarded.

The current model, measured 2026-08-21:

| Pattern | Count |
|---|---|
| Fields named `*Json` | **133** |
| `columnDefinition = "TEXT"` | 194 |
| `@ManyToMany` | 71, across 33 entities |
| `@ManyToOne` | 133 |
| `@OneToMany` | 37 |
| Comma-separated id fields (`*Ids`) | 9 |

The instinct going in was that many-to-many relationships are the hazard. The
measurement says otherwise: **composite values stored in single fields outnumber
many-to-many relationships by nearly two to one**, and every one of them is a
silent-loss site under whole-field last-writer-wins.

The replication spike settled the many-to-many question directly. Modelled as an
observed-remove set, concurrent additions from both sides of a partition all survive.
The historical defect was never that many-to-many is hard — it was many-to-many stored
as a *whole-collection snapshot* under LWW, which is the same mistake as the JSON
fields, applied to a collection.

Two known defects trace to modelling rather than to the engine:

- Collection fields (`equipmentIds`, `fileIds`) as comma-separated strings: concurrent
  additions on two replicas silently discard one side.
- `LotoStandard.lotoPointOrder`, a JSON map holding per-point ordering — an attribute
  *of the relationship*, stored on one end, overwritten wholesale.
- Soft-deleted rows are hidden from the applier by `@Where`, so changes addressed to
  them defer repeatedly and end in the dead-letter queue.

## Decision

Six modelling rules. Every replicated entity must satisfy all of them before it is
migrated.

### 1. Nothing independently editable may share a field

If two people can change different parts of a value without conflicting in intent,
those parts are separate fields — or a map with per-key merge. Never one JSON string,
never a delimited list.

This is the rule that matters most, because it covers 133 existing fields.

Legitimate remaining uses of a serialised blob: values that are genuinely opaque and
always replaced as a unit (a rendering cache, an imported payload kept verbatim).

### 2. Many-to-many is modelled one of two ways

- **No attributes on the link** → an OR-Set of foreign ids on the owning side.
- **The link carries data** → the link becomes a first-class entity with its own
  identity, its own operations, and its own fields.

`lotoPointOrder` is the worked example: ordering is a property of the
standard-to-point link, so the link is an entity and the order lives on it. The
JSON-map clobber then has nowhere to occur.

### 3. One owner per fact

A relationship is written from exactly one side. Bidirectional ownership produces two
operation streams describing one truth, and nothing can reconcile them afterwards.

### 4. Deletion is an operation, not the absence of a row

Deletes are tombstones carried in the op-log, ordered like any other operation, so a
delete racing a concurrent edit resolves deterministically.

A deleted entity must remain **visible to the replication engine**. The current
`@Where(clause = "deleted = false")` arrangement hides rows from the applier, which is
why changes addressed to soft-deleted entities defer until they dead-letter. Filtering
belongs in queries the user sees, never in the path replication reads.

### 5. Derived values do not replicate

Anything computable from other fields is marked local-only and recomputed on each
replica. Replicating it creates conflicts between values that were never actually in
disagreement.

### 6. Identity is assignable offline, without coordination

Every replica mints ids that cannot collide with another replica's — UUIDv7 or a
node-prefixed scheme. Scheme selection remains open question Q5; the requirement does
not.

## Enforcement

Per [[0003-conventions-require-enforcement]], each rule names its check:

| Rule | Enforced by |
|---|---|
| 1 | ArchUnit: no `String` field on a replicated entity may be named `*Json`/`*Ids` or declared `TEXT` without an explicit opaque-value annotation |
| 2 | ArchUnit: no `@ManyToMany` on a replicated entity — the mapping is an OR-Set field or a link entity |
| 3 | ArchUnit: a link may declare an owning side exactly once |
| 4 | ArchUnit: no `@Where` on a replicated entity; deletion goes through the op-log |
| 5 | Derived fields carry `@LocalOnly`; the registry rejects an operation naming one |
| 6 | Id generator contract test — two replicas generating concurrently never collide |

Rules 1, 2 and 5 are additionally caught at runtime: `MergeRegistry` throws on a field
with no declared policy rather than defaulting to LWW. Silent defaults are how the
current model acquired whole-value LWW on collections.

## Alternatives considered

| Option | Why not |
|---|---|
| **Keep JSON fields, add per-key merge for JSON** | A map CRDT over JSON is buildable, but it makes every blob a schema the engine must understand, and hides structure from the database where it cannot be queried or migrated. Splitting the fields is cheaper and permanent. |
| **Avoid many-to-many entirely**, as first suggested | Overcorrection. The spike shows OR-Set many-to-many converging correctly. Banning it would force worse models — duplicated ids, or one-to-many chains that don't reflect reality. |
| **Keep whole-collection LWW, resolve conflicts manually** | Turns routine concurrent additions into human work. OR-Set removes the conflict entirely; reserve manual resolution for cases with no correct automatic answer. |
| **Let the engine infer policy from field type** | A `String` could be LWW or opaque; a `Set` could be OR-Set or replace-wholesale. Inference guesses, and a wrong guess is silent. Declaration is explicit and checkable. |

## Consequences

**Accepted costs.**

- The 133 JSON fields must be examined individually during migration. Some are
  genuinely opaque and stay; most become real columns. This is the single largest
  piece of modelling work in the rebuild, and it cannot be automated — deciding
  whether two keys are independently editable is a domain judgement.
- Link entities increase the entity count. A model with more, smaller entities is the
  intended outcome, not a regression.
- Tombstones mean deleted data occupies space until compaction, and compaction must be
  safe against a replica that has been offline longer than the retention window.
- Rule 4 changes how every query is written: visibility filtering moves out of the
  mapping and into the query layer.

**Follow-on work.**

- An inventory of the 133 JSON fields, classified opaque or splittable.
- Tombstone retention policy, and what happens to a replica offline past it.
- `@LocalOnly` annotation and registry support.
- Q5, the identity scheme.

## Revisit if

A domain appears whose natural model genuinely needs a composite field with
independently-editable parts — a structured document being co-edited, for instance.
That is a map or text CRDT, not a JSON string, and would justify a new merge kind
rather than an exception to rule 1.
