# Remove-point siblings — collection mutations that silently don't sync

Found by codebase-wide audit (2026-08-25) for the confirmed remove-point pattern: a service op mutates a
`@ManyToMany` / owning `@OneToMany` collection but writes **no scalar** on the owning row in the same save →
Hibernate issues no UPDATE to the owner → `@PostUpdate` never fires → no `FieldChange` → the change never
syncs to the hub. Mechanism **runtime-proven** on `LotoStandard.lotoPoints` (raw remove emitted 0 changes).
Fix pattern (proven): dirty a natural scalar on the owner in the same tx (order map, a timestamp, status,
`dateModified`), OR call the explicit relationship tracker (`FieldChangeTracker.trackRelationshipUpdateInCurrentTx`,
as `NgLotoPointService.processLotoPoint:301/320` already does correctly).

## Confirmed BUG (10)

1. **LotoStandard.updateStandard — replace `lotoPoints`** — `NgLotoStandardService:547`. Non-approved branch
   `existing.setLotoPoints(newPoints)` + `flush()` only; name/description are `!Objects.equals`-guarded so a
   points-only save dirties no scalar; does NOT update `lotoPointOrder` (unlike add/remove). **HIGH — main save path.**
2. **LotoStandard.updateStandard — replace `groups`** — `NgLotoStandardService:559`. `setGroups(newGroups)`, no scalar.
3. **LotoStandard/LotoPoint mergeLotoPoints** — `NgLotoPointService:1571`. Double-broken: `getLotoPoints()` returns a
   **sorted copy** (`LotoStandard:258-263`) so the swap never persists; no `save`, no scalar, no tracker; `removePoint`
   soft-deleted after → **silent data loss** (standard loses the point, no keepPoint replacement, no sync).
4. **HeatTrace.update** PUT `/ht-api/` — `HeatTraceMapper:85-86` → `HeatTraceService.save`. `setEquipmentList`/`setPid`
   replace owning M2M; scalars re-set to identical DTO values (`if !=null`) so not dirtied.
5. **JobLog.activatePackage → attachLoto** — `NgDailyPermitPackageService:896` (`JobLog.attachLoto:61`). Mutates
   `JobLog.lotos` M2M (`job_log_lotos`), never writes a JobLog scalar after, never saves the job explicitly.
6. **DailyPermitPackage.reissuePermits** (existing target) — `NgDailyPermitPackageService:431` (`copyPermitsFromSource:593,742`).
   `target.getLotos().clear()+addAll` then `save`, no scalar on target row.
7. **DailyPermitPackage.reissuePackageToNewPackage** — `:508`. `saveAndFlush` fires CREATE with `lotos` empty (records
   `lotos=[]`); `copyPermitsFromSource:742` then adds lotos to the join with no scalar co-write → lotos never emitted.
8. **DailyPermitPackage.generateContinuation** — `:1414` (`saveAndFlush:1464`, `copyPermitsFromSource:1466`). Same
   empty-CREATE-then-join-add anti-pattern as #7.
9. **WorkArea.saveFromDto — `constantLotos`** — `NgWorkAreaService:79` (set at :89-97). Plain Lombok setter, managed
   load, no forced `dateModified`; `locationUnitFiltersJson` only changes on a filter change, not on constantLotos.
   **HIGH — the WorkArea↔LotoStandard link feature.**
10. **WorkArea.saveFromDto — `locations`** — `NgWorkAreaService:79` (set at :100-106). Plain setter; a location add
   with no unit-filter leaves every scalar unchanged. OR-Set is a **receive-side** merge policy — does not fix emission.

## Suspect NA (needs runtime confirm)
- **Equipment.mergeLotoPoints** — `NgLotoPointService:1562`. `equipment.getLotoPoints().remove/add + equipmentService.save`,
  no scalar, no tracker (contrast `processLotoPoint:301/320` which DOES call the tracker for the same join).
- **WorkArea.deleteStandard** unlink `constantLotos` — `NgLotoStandardService:621`. `getConstantLotos().removeIf + save`, no scalar.

## Status
- Static findings, HIGH confidence (same mechanism runtime-proven). The multi-node CRUD conformance suite (being built)
  will runtime-confirm each and guard against regression.
- Already fixed (reference): `NgLotoStandardService.removeLotoPointToStandard`/`addLotoPointToStandard` (touch `lotoPointOrder`).
- See [[reference_m2m_only_change_no_emission]], `project/features/sync/SYNC_CONFORMANCE_TEST_PLAN.md`.
