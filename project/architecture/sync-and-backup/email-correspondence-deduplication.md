# Email Correspondence Deduplication

Automatic deduplication of `EmailCorrespondence` INBOUND records when multiple clients independently poll the same inbox and each create a record for the same incoming email.

## The Problem

`EmailPollingService` runs on every client that has polling enabled. If two clients both poll the inbox within the same polling window, both find the same unprocessed email and independently create an INBOUND `EmailCorrespondence` record. After sync, both records exist on all clients — same `graphMessageId`, different local IDs.

This is analogous to the WorkRequest deduplication problem: two clients pull the same SharePoint item and create two WorkRequest records with the same `sharepointId`.

## The Solution

`EmailCorrespondenceMergeService` runs after every sync batch (in `FieldSyncService.afterCommit()`) alongside the other merge services:

```
After sync batch applied:
    email_correspondence table: graphMessageId="AAAA" → ID=100 (from Client A)
                                graphMessageId="AAAA" → ID=105 (from Client B)

Merge:
    Canonical = ID=100 (lowest ID — deterministic, both clients pick same one)
    Soft-delete ID=105
    FieldChangeEntityListener fires → deleted=true FieldChange created
    FieldChange syncs to all clients → duplicate removed everywhere
```

## Dedup Criteria

Only INBOUND emails with a non-null `graphMessageId` are candidates for deduplication:
- **OUTBOUND** emails are created by user action (one client only) — no duplicates possible
- **INBOUND with no graphMessageId** — theoretical edge case (not from polling) — skipped safely

## Implementation

[EmailCorrespondenceMergeService.java](../../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EmailCorrespondenceMergeService.java)

1. Query: `SELECT graphMessageId, COUNT(*) FROM EmailCorrespondence WHERE graphMessageId IS NOT NULL GROUP BY graphMessageId HAVING COUNT(*) > 1`
2. For each duplicate group: keep lowest-ID record as canonical
3. Soft-delete remaining records via JPA (`entity.setDeleted(true)` + `entityManager.merge()`) — JPA triggers `FieldChangeEntityListener` which creates FieldChange records
4. SyncContext is temporarily cleared during merge so deletions are tracked as FieldChanges and sync to other clients

No FK transfers needed — EmailCorrespondence is a leaf entity. Nothing holds a FK pointing into it.

## Repository Queries

[EmailCorrespondenceRepo.java](../../../../src/main/java/com/dk_power/power_plant_java/repository/base_repositories/EmailCorrespondenceRepo.java)

```java
// Detect duplicates
@Query("SELECT e.graphMessageId, COUNT(e) FROM EmailCorrespondence e " +
       "WHERE e.graphMessageId IS NOT NULL " +
       "GROUP BY e.graphMessageId HAVING COUNT(e) > 1")
List<Object[]> findDuplicateGraphMessageIds();

// Resolve duplicates (canonical = first element, lowest ID)
List<EmailCorrespondence> findByGraphMessageIdOrderByIdAsc(String graphMessageId);
```

## Comparison with Other Merge Services

| Service | Dedup Key | FK Transfers |
|---------|-----------|-------------|
| `CategoryValueMergeService` | name (case-insensitive) | Re-points 25 FK columns across 11 entity types |
| `WorkRequestMergeService` | `sharepointId` | DailyPermitPackage link, JHA links |
| `JhaMergeService` | `sharepointId` | None (JHA's WorkRequest FK preserved naturally) |
| `EmailCorrespondenceMergeService` | `graphMessageId` | None (leaf entity) |

## Wiring

Called in [FieldSyncService.java](../../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java) `afterCommit()` callback:

```java
try { emailCorrespondenceMergeService.mergeIfDuplicatesExist(); }
catch (Exception e) { log.error("EmailCorrespondence merge failed: {}", e.getMessage(), e); }
```

All merge service calls are independently try-caught — one failure does not prevent others from running.
