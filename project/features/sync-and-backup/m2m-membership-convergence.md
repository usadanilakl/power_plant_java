# M2M / O2M Membership Convergence — OR-Set design

**Status:** design, not implemented. Supersedes the reverted "delta + LWW-bypass" attempt.

## 1. The defect (confirmed, class-wide)

Every owning-side `@ManyToMany` and unidirectional `@OneToMany`+`@JoinColumn` syncs as a
**whole-set snapshot**:

- **Emission** sends the full post-mutation id list as the `FieldChange.newValue`.
- **Apply** (`FieldSyncService.applyManyToManyChange`) does `DELETE-all-then-INSERT` of that set.
- **Conflict** keeps a **single LWW winner** per `(entityType, entityId, fieldName)`
  (`batchFetchLatestChanges` → `SyncOrder::max`, gated in `shouldApplyChange`).

So two nodes concurrently adding **different** members (A adds C, B adds D) → the later LWW winner's
whole set replaces the join table → the other's addition is silently dropped. A concurrent **remove**
is resurrected the same way. Verified end-to-end against `LotoStandard.lotoPoints`; the same path
carries `Equipment.lotoPoints`, `DailyPermitPackage.*`, `LotoPoint.pictures`, and (unidirectional)
`PrintableForm.formContainers`. It is safety-relevant: a lock point silently dropped from a LOTO
standard, or a container detached from a printable form.

## 2. Why the cheap "delta + LWW-bypass" shortcut is wrong (the lesson)

The reverted attempt computed `added = new−old`, `removed = old−new` and **bypassed LWW** so every
concurrent membership change would apply and merge. Adversarial review confirmed it **breaks
convergence**:

- `add(X)` and `remove(X)` of the **same element do not commute.** Once LWW is bypassed, the final
  state is decided by **delivery/apply order**, which the system does not guarantee — SSE fast-path
  and resync batches are explicitly not timestamp-ordered, and FK-deferral re-delivers an `add`
  *after* a `remove` was already applied and acked. Concrete: node adds P then removes P; a peer
  defers the add (P's row not present yet), applies+acks the remove, later re-pulls the add **alone**
  and re-inserts P → **permanent silent divergence**. That is *worse* than the status quo, which at
  least converges (all nodes reach the same lossy state).
- Keeping LWW *and* applying deltas also diverges (the discarded loser leaves different nodes with
  different different-element adds).
- Reconstructing per-element state from the `FieldChange` log is defeated by **log compaction**,
  which keeps only the latest change per field.

**Conclusion:** correct convergence needs **per-element causal metadata that survives compaction** —
i.e. a proper CRDT (LWW-Element-Set / OR-Set), not an apply-path trick.

## 3. Design: LWW-Element-Set with per-element tombstones

Model each membership as a set of elements, each carrying the `SyncOrder` key
`(timestamp, originMachineId, changeId)` of its **latest add** and **latest remove**. An element is
**present iff its latest-add ≻ its latest-remove** (strict total order; ties broken by origin then
change id — this yields deterministic add-wins).

### Storage — a `membership_event` side table
`(owner_type, owner_id, field_name, element_id, op {ADD|REMOVE}, ts, origin, change_id)`, unique on
`(owner_type, owner_id, field_name, element_id, op)` keeping only the **latest** row per op (an older
add/remove for the same element is dominated and overwritten). The join table
(`loto_standard_loto_point`, `loto_point_picture`, …) becomes a **derived projection**: present-set =
`{X : max(ADD key) ≻ max(REMOVE key)}`. Bounded size: ≤ 2 rows per element ever touched — survives
compaction, unlike the whole-set-in-`FieldChange` approach.

### Emission (wire format)
The membership `FieldChange` carries a per-element delta plus the change's `SyncOrder` key:
`{ "added": [ids], "removed": [ids] }`. The change's own `(ts, origin, changeId)` is the key for
**every** element in that delta. Backward-compat: a legacy whole-set `newValue` with `null` oldValue
is treated as a reconcile directive (see §5), not a delta.

### Apply (convergent, order-independent, idempotent)
For an incoming membership change with key K:
1. For each `added` element X: upsert `ADD(owner,field,X,K)` if K ≻ the stored ADD.
2. For each `removed` element X: upsert `REMOVE(owner,field,X,K)` if K ≻ the stored REMOVE.
3. Recompute presence for each touched X and INSERT/DELETE **only that element's** join row.

Because presence(X) = `max(ADD keys) ≻ max(REMOVE keys)` and `max` over a set is associative,
commutative and idempotent, the computed set is a pure function of the event set — **independent of
delivery order and duplication.** This is the standard LWW-Element-Set CRDT. No LWW bypass is needed:
the per-element `max` *is* the conflict resolution, applied at the right granularity.

### Compaction / GC
Keep only the latest ADD and latest REMOVE per element. A REMOVE tombstone for an element never
re-added can be GC'd after a durable safe-horizon (same watermark discipline as
`sync.hub.retention`). The drift oracle hashes the **computed present-set**, unchanged.

## 4. Convergence & the three cases (must be ITs)
- **Concurrent add/add (different elements):** both ADDs are the latest for their own element →
  both present. ✓
- **Concurrent add/remove (same element):** `max(ADD) ≻ max(REMOVE)` by SyncOrder → one deterministic
  winner regardless of arrival order. Feed the two changes in **both** orders and assert the **same**
  result. ✓
- **FK-deferral re-delivery:** add deferred, remove applied+acked, add re-pulled alone → the add's ADD
  event key vs the remove's REMOVE event key decides presence, order-independently. ✓
- **Idempotency:** apply each event twice → no change. ✓

## 5. The reconcile path — a RESET barrier (not receiver-local removes)
Drift "Use Hub" / accept-remote synthesize a **whole-set** directive (`buildHubChangesWithRelTypes`,
`null` oldValue) meaning "make the set exactly this." Deriving its removals from the receiver's local
present-set is **delivery-order-dependent and diverges** (a not-yet-arrived element isn't tombstoned).
Instead a reconcile-to-`{new}@K` records a per-`(owner,field)` **RESET barrier at key K** plus `ADD@K`
for each element of `{new}`, and presence becomes:

> **present(X) = latest ADD(X) ≻ latest REMOVE(X)  AND  latest ADD(X) ⪰ latest RESET(owner,field)**

The RESET is delivery-independent: any element whose latest ADD is older than K is suppressed
regardless of when it arrives; the `{new}` elements survive because their ADD key equals K. Stored as
an event with a sentinel `element_id = -1` (negative — no real entity id is ≤ 0, since
`DevicePrefixedIdGenerator` mints `device*1e9 + seq` with `seq ≥ 1`, so the sentinel can never collide
with an element id even when ids arrive pre-assigned from another node).

## 5b. A node must record its OWN edits too — and reconcile its OWN join
`membership_event` must reflect **every** change a node sees, including its own local edits — a node
never re-applies its own change, so if only the receive path records events, the editing node's OR-Set
lacks its own additions and diverges. `FieldChangeTracker.recordLocalMembershipEvents` (called in-tx
from both `publishOnCommit`/`publishChangesOnCommit`, guarded on an actual transaction) records the
local M2M edit's events, **keyed by the change's global id** — so the editor and every receiver record
the *identical* event; same delta/RESET semantics as the receive path.

It is **not** events-only. It delegates to the same `applyDelta`/`applyReconcile` as the receive path,
so it ALSO reconciles the join. Hibernate writes the local join row unconditionally, but a local edit
can **lose** under `SyncOrder` — a local `ADD(X)@K1` whose key is older than an already-recorded
`REMOVE(X)@K2` (clock skew), or older than a newer `RESET`. The OR-Set then computes X absent while
Hibernate left X's join row in place → the local join permanently disagrees with the converged set
(round-3 review finding). Reconciling in the local path deletes that stray row; for the common winning
edit the reconcile is a no-op (row already matches). The reconcile issues native INSERT/DELETE, hence
the actual-transaction guard — every real owning-M2M edit is in one (MANDATORY/REQUIRES_NEW); a non-tx
publish wrote no local join row, so there is nothing to reconcile.

## 6. Migration — the Phase 1b seeder  (BUILT: `MembershipSeedService`)
New `membership_event` table (DDL; `ddl-auto=update` creates it on the hub, clients on JAR update).
Without seeding, a node that predates the feature has full join tables but an EMPTY event log, so the
first reconcile can't see its existing members (`allElementIds` is empty → a reconcile-to-empty leaves
stale rows; a peer whole-set create can't reason about them). `MembershipSeedService` runs once on
`ApplicationReadyEvent` (flag-gated, hub AND clients), scans the metamodel for every owning-side
`@ManyToMany` with a `@JoinTable`, and records one baseline `ADD` per existing join row via
`MembershipCrdtService.seedBaselineAdd`:

- **Deterministic key** `(baseline ts, origin=`__seed__`, changeId=UUID.nameUUIDFromBytes(owner|field|owner|element))`
  — identical on every node, so converged nodes seed byte-identical events and stay converged.
- **Baseline ts** (`sync.membership.orset.seed-baseline`, default `2000-01-01T00:00:00Z`) predates every
  real edit, so any later real ADD/REMOVE outranks the seed and re-running is idempotent (upsert-only-if-newer).
- **Runs once**, guarded by a sentinel marker row (`owner_type='__seed_marker__'`), written in the SAME
  transaction as the seed so a mid-seed crash rolls back and re-runs next boot.

The seeder captures each node's CURRENT join state verbatim — it does **not** reconcile drift. So the
enablement runbook is: **(1)** drift tool → zero drift on the hub + client cluster, **(2)** set
`sync.membership.orset.enabled=true` and restart all nodes → each seeds its converged join state,
**(3)** drift-verify zero drift again. Whole-set replace stays as the reconcile fallback. ITs:
`MembershipSeedServiceIT` (seeds/idempotent/reconcile-removes-seeded/coexists-with-peer-add).

## 7. Phasing
- **P1 — M2M owning sides.** Schema + `{added,removed}` emission + LWW-Element-Set apply. Reconcile
  path (§5). ITs (§4). Behind a flag + the drift harness.
- **P2 — protected O2M** (`PrintableForm.formContainers`, `DailyPermitPackage.*`, `JobLog.packages`).
  FK-based: element = child, present-set = children with `FK = parent`; removal already rides the
  child's own DELETE, and concurrent different-child adds converge trivially. Subsumes the form
  agent's interim Option A (additive guard); their emission (dirty the parent) is still required.
- **P3 — compaction/GC + drift-oracle alignment.**

## 8. Risk
Schema change on a synced relationship + edits to the hottest sync-apply path. High effort, high
value, and it must ship feature-flagged and drift-verified. This is a project, not a patch — which is
precisely why the apply-path shortcut was the wrong instinct.
