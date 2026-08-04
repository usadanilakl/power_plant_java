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

## 5. Interaction with the reconcile paths (do not regress)
Drift "Use Hub" / accept-remote synthesize a **whole-set** directive (`buildHubChangesWithRelTypes`,
`null` oldValue) meaning "make the set exactly this." Keep that as a distinct op: it writes ADD events
(key = now/hub) for every element in the target set and REMOVE events for local-only elements, so it
still reaches exact match — but through the same event model, so it can't clobber a *newer* concurrent
edit that arrives afterward.

## 6. Migration
New `membership_event` table (DDL; `ddl-auto=update` creates it on the hub, clients on JAR update).
Seed once from the current join tables: every existing join row → an `ADD` with a baseline timestamp
older than any real edit. No data loss; whole-set replace stays as the reconcile fallback during
rollout. Feature-flagged; prove **zero drift** on a known-good hub + 2-client cluster before enabling.

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
