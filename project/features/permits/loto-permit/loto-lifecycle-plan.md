# LOTO Lifecycle Tracking — Implementation Plan

## Context

The LOTO permit form is missing the operator/timestamp fields the paper form captures (Hung by + date, Verified + date, Activated by + date, Requestor Transfer / Accepted / Released, Control Authority Released, Locks Removed, LOTO Closed). We already have a `LotoSnapshot` entity that creates a new row on each status transition / point change — extending that is the right place to record these events instead of adding a brand-new audit entity.

LOTO workflow per current implementation: **Building → Active → Test ↔ Active → Closed**. A snapshot row already records `requestorName`, `workAuthority`, `requestTime`, `workAuthorityTime`, `status`, `workScope`, `boxNumber`, `personnelSnapshot`, and a free-text `snapshotReason`. We extend it with explicit per-event operator+timestamp fields so each transition is a tracked, reviewable record rather than a free-text note.

## Backend changes

### 1. Extend [LotoSnapshot.java](src/main/java/com/dk_power/power_plant_java/entities/loto/LotoSnapshot.java)

Add these columns. Each is nullable — only the snapshot that recorded the event has the value populated.

```java
private String hungBy;
private LocalDateTime hungAt;

private String verifiedBy;
private LocalDateTime verifiedAt;

private String activatedBy;
private LocalDateTime activatedAt;

private String testStartedBy;
private LocalDateTime testStartedAt;

private String reactivatedBy;
private LocalDateTime reactivatedAt;

private String transferredFrom;
private String transferredTo;
private LocalDateTime transferredAt;

private String acceptedBy;
private LocalDateTime acceptedAt;

private String requestorReleasedBy;
private LocalDateTime requestorReleasedAt;

private String controlAuthorityReleasedBy;
private LocalDateTime controlAuthorityReleasedAt;

private String locksRemovedBy;
private LocalDateTime locksRemovedAt;

private String closedBy;
private LocalDateTime closedAt;
```

Hibernate `ddl-auto=update` adds them as nullable columns. No data migration needed — existing snapshots keep their data, new transitions populate the new fields.

### 2. Helper methods on [Loto.java](src/main/java/com/dk_power/power_plant_java/entities/loto/Loto.java)

One method per lifecycle event. Each either updates the latest snapshot (when the LOTO is mutable / Building) or duplicates it first (when status has progressed past Active and we need to preserve the prior snapshot). All return the affected snapshot for the caller to persist.

```java
public LotoSnapshot recordHung(String user)               { … }
public LotoSnapshot recordVerified(String user)           { … }
public LotoSnapshot recordActivated(String user)          { … }
public LotoSnapshot recordTestStarted(String user)        { … }
public LotoSnapshot recordReactivated(String user)        { … }
public LotoSnapshot recordTransferred(String fromUser, String toUser) { … }
public LotoSnapshot recordAccepted(String user)           { … }
public LotoSnapshot recordRequestorReleased(String user)  { … }
public LotoSnapshot recordControlAuthorityReleased(String user) { … }
public LotoSnapshot recordLocksRemoved(String user)       { … }
public LotoSnapshot recordClosed(String user)             { … }
```

Each follows the existing `addLotoPoint` pattern: pick `getLatestSnapshot()` if mutable, else `duplicateLatestSnapshot()`, set the user + `LocalDateTime.now()`, return.

### 3. Update [NgLotoService.changeStatus](src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgLotoService.java)

The current `changeStatus` already creates / updates snapshots and writes `snapshotReason`. Augment each branch to also call the matching `record*` helper with the current user (`SecurityContextHolder.getContext().getAuthentication().getName()`):

- `Active` → `recordActivated(currentUser)` (or `recordReactivated` when transitioning from Test)
- `Test`   → `recordTestStarted(currentUser)`
- `Closed` → `recordRequestorReleased`/`recordControlAuthorityReleased`/`recordLocksRemoved`/`recordClosed` as separate buttons (see frontend section) — `Closed` itself just calls `recordClosed`.

### 4. New service methods on `NgLotoService`

For lifecycle events that aren't tied to a status transition (Hung, Verified, Transfer, Accept, Requestor Released, CA Released, Locks Removed):

```java
public LotoDto markHung(Long lotoId, String user)        { … }
public LotoDto markVerified(Long lotoId, String user)    { … }
public LotoDto transferRequestor(Long lotoId, String fromUser, String toUser) { … }
public LotoDto acceptRequestor(Long lotoId, String user) { … }
public LotoDto releaseByRequestor(Long lotoId, String user) { … }
public LotoDto releaseByControlAuthority(Long lotoId, String user) { … }
public LotoDto removeLocks(Long lotoId, String user)     { … }
```

Each: load Loto → call matching `record*` helper → save → save snapshot → return DTO.

### 5. New REST endpoints on [NgLotoController.java](src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoController.java)

```
PUT  /ng/lotos/{id}/lifecycle/hung
PUT  /ng/lotos/{id}/lifecycle/verified
PUT  /ng/lotos/{id}/lifecycle/transfer        body { fromUser, toUser }
PUT  /ng/lotos/{id}/lifecycle/accept
PUT  /ng/lotos/{id}/lifecycle/release-requestor
PUT  /ng/lotos/{id}/lifecycle/release-ca
PUT  /ng/lotos/{id}/lifecycle/remove-locks
```

Each takes optional `?user=<name>` (falls back to authenticated user). Returns the updated `LotoDto`. Existing `/{id}/status` keeps doing the status-change writes.

### 6. DTO + Mapper

- [LotoSnapshotDto.java](src/main/java/com/dk_power/power_plant_java/dto/permits/LotoSnapshotDto.java): mirror the new fields.
- [LotoSnapshotMapper.java](src/main/java/com/dk_power/power_plant_java/mappers/permits/LotoSnapshotMapper.java): copy the new fields in both directions.
- `LotoDto` already exposes `snapshots: List<LotoSnapshotDto>`, so the frontend gets the full history "for free" once the snapshot DTO carries the fields.

## Frontend changes

### 1. Mirror new fields on [loto-snapshot.model.ts](frontend/src/app/models/loto/loto-snapshot.model.ts)

Add the same field names, plus `fromJson` parsing for the timestamps (use ISO strings, no `Date` conversion needed for display).

### 2. Lifecycle service in [loto.service.ts](frontend/src/app/services/loto/loto.service.ts)

```ts
markHung(lotoId, user?)        : Observable<...>
markVerified(lotoId, user?)    : Observable<...>
transferRequestor(lotoId, fromUser, toUser): Observable<...>
acceptRequestor(lotoId, user?) : Observable<...>
releaseByRequestor(lotoId, user?) : Observable<...>
releaseByControlAuthority(lotoId, user?) : Observable<...>
removeLocks(lotoId, user?)     : Observable<...>
```

### 3. New "Lifecycle" panel in [rf-loto-form.component.ts](frontend/src/app/features/permit-builder/loto/rf-loto-form.component.ts)

Below the existing form, add a panel that mirrors the paper form's sign-off section. Each row has:

- A label (e.g. "Hung By")
- Read-only display of `latestSnapshot.hungBy` + `latestSnapshot.hungAt` if set
- A button (e.g. "Sign as Hung") that fires the matching service call with the current user

Layout (rendered as a 2-column table for compactness):

```
Hung By:                Bob, 2026-05-06 08:00      [Sign]
Verified By:            Sue, 2026-05-06 08:15      [Sign]
Activated By:           Bob, 2026-05-06 08:30      (auto, on Activate)
Test Started By:        ...                         (auto, on Test)
Re-Activated By:        ...                         (auto, on Re-Activate)
Requestor Transferred:  Bob → Alice, 2026-05-06 09:00   [Transfer…]
Requestor Accepted By:  Alice, 2026-05-06 09:01    [Accept]
Requestor Released By:  Alice, 2026-05-06 12:00    [Release]
CA Released By:         Sue, 2026-05-06 12:05      [Release CA]
Locks Removed By:       Bob, 2026-05-06 12:10      [Remove Locks]
Closed By:              Bob, 2026-05-06 12:15      (auto, on Close)
```

Disabled / hidden states by status:
- Building: only `Hung`, `Verified` enabled
- Active: `Transfer`, `Release Requestor`, `CA Release` enabled
- Test: same as Active
- Closed: all read-only

### 4. Snapshot history table

Below the lifecycle panel, render a chronological table of `entity.snapshots` showing: `dateCreated`, `snapshotReason`, the lifecycle events captured in that row. Lets the operator audit the full history — already-stored snapshots from prior status changes show up immediately.

### 5. Display "current" lifecycle on the parent Loto

Add convenience getters on the frontend `LotoDto` that pluck the most-recent non-null lifecycle field across `dto.snapshots` (e.g. `currentHungBy`, `currentHungAt`). The form panel uses these for the read-only display; nothing new to compute server-side.

## Critical files

Backend:
- [LotoSnapshot.java](src/main/java/com/dk_power/power_plant_java/entities/loto/LotoSnapshot.java) — add 22 fields
- [Loto.java](src/main/java/com/dk_power/power_plant_java/entities/loto/Loto.java) — add 11 helper methods (~80 lines)
- [NgLotoService.java](src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgLotoService.java) — augment `changeStatus`, add 7 lifecycle methods
- [NgLotoController.java](src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoController.java) — 7 new PUT endpoints
- [LotoSnapshotDto.java](src/main/java/com/dk_power/power_plant_java/dto/permits/LotoSnapshotDto.java) + [LotoSnapshotMapper.java](src/main/java/com/dk_power/power_plant_java/mappers/permits/LotoSnapshotMapper.java)

Frontend:
- [loto-snapshot.model.ts](frontend/src/app/models/loto/loto-snapshot.model.ts) — mirror fields
- [loto.service.ts](frontend/src/app/services/loto/loto.service.ts) — 7 lifecycle methods
- [rf-loto-form.component.ts](frontend/src/app/features/permit-builder/loto/rf-loto-form.component.ts) — Lifecycle panel + Snapshot history table

## Reused (don't duplicate)

- `Loto.duplicateLatestSnapshot()` — already correctly clones snapshots when LOTO is no longer mutable
- `Loto.getLatestSnapshot()` / `createNewSnapshot()` — already manages snapshot lifecycle
- `personnelSnapshot` JSON column — already captures the per-snapshot personnel roster
- `LotoSnapshotMapper.convertToDto` — extend, don't replace

## Verification

1. **Building → Hung**: select a Building LOTO, click `Sign` next to Hung By → latest snapshot has `hungBy`, `hungAt` filled. Refresh the page; values persist.
2. **Building → Verified**: same flow with Verified.
3. **Activate**: click Activate. Latest snapshot has `reason="Activated"`, `activatedBy`, `activatedAt`. The Hung/Verified values from the previous snapshot are still on the previous snapshot row (snapshot history table shows both rows).
4. **Test**: click Test. **New** snapshot row created via `duplicateLatestSnapshot`, `testStartedBy`/`testStartedAt` set. Two snapshots in history (Active + Test).
5. **Transfer Requestor**: prompt or pick from a dropdown for `toUser`. After save, latest snapshot has `transferredFrom`, `transferredTo`, `transferredAt`.
6. **Accept**: enabled only when most recent transfer is unaccepted.
7. **Close**: click Close. Latest snapshot has `closedBy`/`closedAt`/`reason="Closed"`. All lifecycle buttons disable.
8. **Snapshot history**: after a full Building → Active → Test → Active → Closed cycle with intermediate Hung/Verified/Transfer/Accept/Release/RemoveLocks events, the snapshot history table lists every step in order.
9. **Run tests**: `mvn -DskipTests=false test` (the LotoMapper / NgLotoService have existing tests — make sure none break).
10. **Compile + build**: `mvn compile`, `cd frontend && ng build --configuration production`.

## Open design questions

1. **Auto-fill the `*By` user from authentication or take it from a free-text input?** Authenticated user is more auditable but requires the operator to be logged in correctly. Free text matches the paper form. Recommend: default to authenticated user; allow override via input field on each button (e.g. for cases where one operator records on behalf of another).
2. **Where do `transferredFrom` / `transferredTo` come from?** The simplest UX is a "Transfer Requestor" dialog that pre-fills `from` with the current `lotoRequestor` and asks for `to` from a user dropdown.
3. **Should we keep `snapshotReason` (free text) or replace it?** Keep it — useful for ad-hoc notes ("re-activated after MOC review") that don't map to a specific event type.
