## Functionality

Provides access to SharePoint data (read/write) with 2 access points - API Call using Certificate (Main) and PowerAutomate (Fallback).

Main [](./sharepoint-certificate-access.md)
Fallback [](./power-automate-access.md)

## Implementation - DONE

`SharepointAccessService` (facade) provides public methods for other classes to interact with SharePoint. It uses `executeWithFallback()` to automatically switch between access methods:

1. Tries `SharePointCertificateAccess` (primary) first
2. If unavailable or fails, falls back to `PowerAutomateAccess`
3. Per-call failover — each operation independently tries certificate first

## Files

- `sevice/sharepoint/SharePointAccess.java` — interface (getAllWorkRequests, archiveWorkRequest, changeWorkRequestStatus, getAllSpaces)
- `sevice/sharepoint/SharepointAccessService.java` — facade with failover logic
- `sevice/sharepoint/SharePointCertificateAccess.java` — primary (SharePoint REST API + certificate)
- `sevice/sharepoint/PowerAutomateAccess.java` — fallback (wraps existing PowerAutomateClient)
- `config/SharePointConfig.java` — Spring beans (ClientCertificateCredential + RestTemplate)

## Entity-Specific Adapters

SharePoint operations are now handled by entity-specific adapters that wrap the generic `SharePointCertificateAccess` + `PowerAutomateV2Client`. Each adapter uses `SharepointAccessService.executeWithFallback()` for cert/PA failover.

### WorkRequestSharePointAdapter
- `getAll()` — fetch all work requests from SharePoint list
- `create(dto)` — create new list item
- `update(sharepointId, dto)` — push full field update (cert: MERGE request, PA: update action)
- `changeStatus(sharepointId, status)` — update Status column only
- `revoke(sharepointId)` — convenience → `changeStatus(sharepointId, "Revoked")`
- `addAttachment(sharepointId, attachmentDto)` — attach file to list item

### JhaSharePointAdapter
- `getAll()` — fetch all JHAs from SharePoint list
- `create(dto)` — create new list item
- `update(sharepointId, dto)` — push field update
- `changeStatus(sharepointId, status)` — update Status column only
- `revoke(sharepointId)` — convenience → `changeStatus(sharepointId, "Revoked")`
- `addAttachment(sharepointId, attachmentDto)` — attach file to list item

## Consumers (migrated to facade)

- `NgWorkRequestService` — work request CRUD + revoke + update-with-SharePoint-push
- `NgJhaService` — JHA CRUD + revoke + status changes pushed to SharePoint
- `PwaWorkRequestService` — PWA submission, revoke, update
- `PwaJhaService` — PWA JHA submission, revoke
- `WorkRequestSyncService` / `JhaSyncService` — scheduled sync from SharePoint
- `SpaceService` — confined spaces
- `PowerAutomateController` — REST endpoints

## List Provisioning

Auto-creates SharePoint lists with correct columns for all 9 permit types. See [](./sharepoint-list-provisioning.md)

## Remaining Work

- Verify field name mappings from first successful getAllWorkRequests() call
- Make Power Automate flow URLs configurable (currently hardcoded with SAS tokens)
