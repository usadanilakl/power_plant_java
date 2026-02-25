# SharePoint Field-Level Merge (LWW)

## Problem

Previous sync logic overwrote ALL local fields when pulling from SharePoint. If someone edited field A locally and field B was changed in SharePoint, the local edit to A was lost on the next sync.

## Solution

Field-level Last-Writer-Wins (LWW) merge — the same strategy used for hub-peer sync, now applied to SharePoint ↔ local entity conflicts. Each field conflict is resolved independently: the most recent change wins.

## Architecture

```
SP Item (Modified: 14:30)            Local Entity (FieldChange timestamps)
├── Title: "New Scope" (changed)     ├── workScope: "Old Scope" (changed at 14:25) → SP wins
├── Company: "ACME" (unchanged)      ├── company: "ACME" (no change) → skip
├── Status: "Active" (unchanged)     ├── status: "In Progress" (changed at 14:35) → local wins
└── Location: "Unit 1" (changed)     └── location: "Unit 2" (no change) → SP wins
```

## Key Components

### SharePointSnapshot Entity

Stores the last-seen SP field values for each entity. Used to detect which fields actually changed on the SP side between syncs.

```
Table: sharepoint_snapshot
├── entityType: "WorkRequest"
├── sharepointId: "42"
├── fieldsJson: {"Title": "Old Scope", "Company": "ACME", "Status": "Active", ...}
└── lastSyncTime: 2026-02-14T14:00:00Z
```

- **File**: `entities/sync/SharePointSnapshot.java`
- **Repo**: `repository/sync/SharePointSnapshotRepository.java`

### SharePointFieldMergeService

Core service implementing the field-level LWW algorithm.

**File**: `sevice/sharepoint/SharePointFieldMergeService.java`

#### Method: `getSpChangedFields()`

Diffs current SP values against stored snapshot. Returns set of SP column names that changed.

- First sync (no snapshot): all fields treated as "new" → all returned
- Subsequent syncs: only fields whose values differ from snapshot

#### Method: `resolveConflicts()`

For each SP-changed column, checks if local has a newer `FieldChange`. Uses the SP item's `Modified` datetime as the SP-side timestamp.

- If no local `FieldChange` for that field → SP wins
- If local `FieldChange` timestamp < SP `Modified` → SP wins
- If local `FieldChange` timestamp >= SP `Modified` → local wins, field skipped

#### Method: `updateSnapshot()`

Always stores current SP values in the snapshot, regardless of which side won each field. This ensures future diffs correctly detect new SP changes.

## Merge Flow (processRemoteItem)

```
For each SP item:
  1. Extract SP field values → Map<spColumn, value>
  2. Diff against snapshot → Set<spColumn> of changed fields
     └── If no snapshot (first sync) → treat ALL fields as changed
  3. If no fields changed → SKIP (SP unchanged since last sync)
  4. Resolve conflicts via FieldChange LWW → Set<entityField> where SP wins
     └── New entity (no local ID) → SP wins ALL fields → CREATE
  5. If SP wins nothing → SKIP (local wins everything)
  6. Apply only winning fields via applySelectiveFields()
  7. Save entity
  8. Update snapshot with current SP values (ALWAYS, regardless of who won)
```

## Field Mappings

### WorkRequest

| Entity Field | SP Column |
|-------------|-----------|
| `workScope` | `Title` |
| `dateOfWorkToBePerformed` | `DateOfWork` |
| `timeOfWorkToBePerformed` | `DateOfWork` |
| `requestedBy` | `WorkRequestedBy` |
| `company` | `Company` |
| `location` | `LocationOfWork` |
| `affectedEquipment` | `AffectedEquipment` |
| `isLotoRequired` | `IsLOTORequired` |
| `isHotWorkRequired` | `IsHotWorkRequired` |
| `isConfinedSpaceEntryRequired` | `IsConfinedSpaceEntryRequired` |
| `foreman` | `ForemanName` |
| `fireWatch` | `FireWatchName` |
| `space` | `SpaceToBeEntered` |
| `status` | `Status` |
| `submitterName` | `SubmitterName` |
| `submitterEmail` | `SubmitterEmail` |
| `submitterPhone` | `SubmitterPhone` |
| `submitterCompany` | `SubmitterCompany` |
| `timeSubmitted` | `TimeSubmitted` |
| `localUuid` | `PwaId` |

### JHA

| Entity Field | SP Column |
|-------------|-----------|
| `jobName` | `JobName` |
| `applicability` | `Applicability` |
| `analysisBy` | `AnalysisBy` |
| `reviewedBy` | `ReviewedBy` |
| `approvedBy` | `ApprovedBy` |
| `date` | `Date` |
| `ppe` | `PPE` |
| `loto` | `LOTO` |
| `confinedSpace` | `ConfinedSpace` |
| `hazCom` | `HazCom` |
| `handAndPowerTools` | `HandAndPowerTools` |
| `specialTools` | `SpecialTools` |
| `jobSteps` | `JobSteps` |
| `status` | `Status` |
| `workRequestSharepointId` | `WorkRequestSharepointId` |
| `submitterName` | `SubmitterName` |
| `submitterEmail` | `SubmitterEmail` |
| `submitterPhone` | `SubmitterPhone` |
| `submitterCompany` | `SubmitterCompany` |
| `timeSubmitted` | `TimeSubmitted` |
| `localUuid` | `PwaId` |

## SP Modified Datetime

SharePoint's `Modified` field is a system column returned in every list item response as an ISO-8601 UTC datetime (e.g., `"2026-02-14T20:30:00Z"`). Each adapter parses it to `java.time.Instant` and stores it on the DTO's `spModifiedTime` field.

- **WorkRequestSharePointAdapter**: `dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)))`
- **JhaSharePointAdapter**: same pattern
- **WorkRequestDto** / **JhaDto**: `private java.time.Instant spModifiedTime` field

## Relationship to Hub-Peer Field Sync

Both systems use the same `FieldChange` records for conflict resolution:

| Aspect | Hub-Peer Sync | SharePoint Sync |
|--------|--------------|-----------------|
| Change tracking | `FieldChangeEntityListener` on all entities | Same FieldChange records |
| Timestamp source | `FieldChange.timestamp` (local change time) | SP `Modified` datetime |
| Conflict resolution | LWW per field | LWW per field (same logic) |
| Change detection | SSE push + polling | Snapshot diff |
| Scope | All entity types (26+) | Only SP-backed types (WR, JHA, future) |

## Key Design Decision

The snapshot always stores what SP currently has, NOT what was applied locally. This ensures future diffs correctly detect new SP changes even if local overrode some fields in the current sync.

Example: SP changed field A and B. Local wins field A (newer local change). SP wins field B. Snapshot stores both A and B with SP's values. Next sync: if SP changes field A again, the diff will correctly detect it as changed.
