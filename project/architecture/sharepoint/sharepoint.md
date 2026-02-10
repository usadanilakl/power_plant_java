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

## Consumers (migrated to facade)

- `NgWorkRequestService` — work request CRUD + sync
- `SpaceService` — confined spaces
- `PowerAutomateController` — REST endpoints
- `WorkRequestController` — removed direct PowerAutomateClient dependency

## Remaining Work

- Verify field name mappings from first successful getAllWorkRequests() call
- Add more SharePoint list operations as needed (Users, Hot Works, JHA, Safe Works)
- Make Power Automate flow URLs configurable (currently hardcoded with SAS tokens)
