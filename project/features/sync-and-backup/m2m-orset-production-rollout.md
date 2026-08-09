# M2M OR-Set — Production Rollout Runbook

Enabling the owning-`@ManyToMany` membership OR-Set (`sync.membership.orset.enabled`) on the live
cluster (central hub + all desktop clients). This supersedes the whole-set LWW membership apply that
silently clobbered concurrent edits.

Companion design: [`m2m-membership-convergence.md`](m2m-membership-convergence.md).

---

## What ships in the build (already committed, no per-node action)

- **Convergence fix** — the OR-Set LWW-bypass now applies at **all four** whole-field-LWW chokepoints:
  `FieldSyncService.shouldApplyChange` (apply), `HubSyncService.shouldAcceptChange` (hub accept-gate) +
  `compactChanges` (incoming compaction), and `FieldChangeCompactor` (nightly log/retention compaction).
  Before this, only the apply path bypassed LWW, so the hub dropped older concurrent membership adds.
- **Create-rollback fix** — the node's own membership bookkeeping runs *after* commit in its own tx, so a
  create/update can never be rolled back by best-effort OR-Set bookkeeping (was a reentrant-flush crash).
- **Schema self-heal** — `MembershipEventCheckConstraintFixer` drops the stale `membership_event.op`
  CHECK constraint (`ADD/REMOVE`-only) left by pre-`RESET` builds, so the first `RESET` write can't crash
  a node. Automatic, idempotent, no-op on fresh nodes. **This removes the only manual DB step.**

## Live-validated (2-node dev: hub + 1 client)

Concurrent ADD (Equipment.lotoPoints + LotoPoint.pictures) → both survive; concurrent **add-vs-remove**
of the same collection → converges per-element on both nodes; `accept-remote`/"Use Hub" reconcile (RESET
barrier) → no crash, stays converged. Sync/hub regression suite green (63 tests).

## NOT exercisable on 2-node dev — stage, don't assume

- **3+ node convergence** (prod is hub + many desktops).
- **Offline-catch-up** (a node offline past retention, then catching up — the path the compaction fix
  protects). Mitigate by rolling out during a window when nodes are online, and drift-verifying laggards
  as they return.

---

## The one hard prerequisite: CONVERGE FIRST

The seed captures **each node's *current* join-table state verbatim** — it does **not** fix drift. Any
M2M membership drift present when a node seeds is baked into its baseline as "agreed" → **permanent
silent divergence**. So the owning-M2M join tables must be at **zero drift before the OR-Set seeds.**

Per-type drift scan + reconcile (the full `detectAll()` is too heavy for one HTTP call on real data):

```
# For each owning-M2M type (Equipment, LotoStandard, LotoPoint, HeatTrace, … — 26 total):
POST /ng/sync/drift/scan/{entityType}      # scan that type against the hub
# review flagged rows in the Drift Center; reconcile with:
POST /ng/sync/resolve/accept-remote/{type}/{id}   # "Use Hub"  (adopt hub's version)
POST /ng/sync/resolve/accept-local/{type}/{id}     # force local onto hub
# re-scan until stillDrifting = 0 for every M2M type
```

Scalar-field and SharePoint-channel drift do **not** affect the OR-Set seed (it only reads join tables);
converge those on their own schedule.

---

## Rollout decision: flag default

The flag is currently `sync.membership.orset.enabled=true` in committed `application-prod.properties`, so
**deploying the build auto-enables + seeds on a node's first boot.** Two rollout shapes:

| | Sequence | Trade-off |
|---|---|---|
| **A. keep flag on** | Converge prod on the *current* build → deploy the OR-Set build to all nodes | Simpler; but drift introduced between the converge-check and the deploy gets baked in |
| **B. flag off, enable deliberately** *(recommended for a fleet)* | Set committed default `false` → deploy everywhere (code lands, seed dormant) → converge-verify → flip flag + restart all | Decouples "code deployed" from "OR-Set active"; safest |

**Decision needed before rollout.** For a many-desktop fleet, B is safer.

---

## Rollout sequence (Option B)

1. **Converge** every owning-M2M type to zero drift (above). Record the clean scan.
2. **Deploy** the build to the hub and all desktops (flag off). Nothing changes behaviorally yet;
   `membership_event` tables get created/repaired by the fixer.
3. **Verify** the cluster is still converged (re-scan the M2M types).
4. **Enable**: set `sync.membership.orset.enabled=true` and restart the hub, then the desktops. Each node
   seeds on first boot with the flag on (hub ~25k rows, seeded via bulk insert; marker-guarded, one-time).
   Watch each node's log for `membership.seed complete`.
5. **Post-cutover**: re-scan the M2M types → `stillDrifting = 0`. Spot-check a concurrent edit
   (two nodes add different members to the same entity) converges on both.

During a staggered restart there's a temporary **mixed-mode window** (seeded nodes on the OR-Set, others
on whole-set LWW) — it degrades to the *old* clobber behavior on lagging nodes, not to corruption.

## Rollback

Set `sync.membership.orset.enabled=false` + rebuild/restart. The join tables are untouched by the flag
flip (the OR-Set derives from them; it does not replace them). `membership_event` rows are local and can
be left in place or cleared; re-enabling re-seeds (marker-guarded). No data migration to undo.

## Sign-off checklist

- [ ] All owning-M2M types scanned → `stillDrifting = 0` (pre-deploy)
- [ ] Build deployed to hub + every desktop
- [ ] Flag-default decision made (A or B)
- [ ] Flag enabled; every node logged `membership.seed complete`
- [ ] Post-cutover re-scan → `0` M2M drift; one live concurrent-edit convergence spot-check
- [ ] Laggard/returning desktops drift-verified as they come online
