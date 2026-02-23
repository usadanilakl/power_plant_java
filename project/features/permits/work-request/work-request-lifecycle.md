## Business Logic:
1. Submission
    - Access PWA
    - Fill Out Form
    - Submit
2. JHA Attachment
    - Access PWA
    - Choose mode: Fill Out Form OR Attach File (pre-filled JHA document)
    - Submit
3. Updating (Edit)
    - Access PWA WR table
    - Select "Edit" action (available for items with sharepointId)
    - Modify fields in the form
    - Submit → updates local DB + pushes full field update to SharePoint
4. Revoking
    - From PWA WR table or JHA submitted tab → select "Revoke" action
    - Or from desktop frontend → right-click context menu → "Revoke"
    - Sets status to "Revoked" in local DB + SharePoint
5. Processing
    - Open work Request
    - Review work request
    - Review JHA
    - Request more info (if needed)
    - Generate Permits
    - Update WR/JHA Status
    - Notify Submitter
6. Notifying

## Processing Logic
1. Submission
    - PWA sends http request via `SubmissionOrchestratorService`:
        - Try **server** (`POST /api/pwa/work-request/submit`) → server saves locally, pushes to SharePoint (cert → PA fallback)
        - Fall back to **Power Automate V2** directly from PWA
        - Fall back to **email** (mailto link with preset data)
    - If server received from PWA:
        - perform deduplication
        - it saves it locally
        - syncs to clients
        - sends to sharepoint:
            - if certificate flow available - uses it
            - if certificate auth fails - uses PA flow
            - if sharepoint submission fails - retries later
    - If sharepoint received directly from PWA:
        - server polls updates
        - deduplicates
        - saves
        - syncs
    - If WR/JHA were submitted by email:
        - link is provided to process it through server
        - if it doesn't work - process manually
2. JHA flow is the same with one additional step: attach it to existing WR. User can choose form mode (full form + image capture) or file mode (upload pre-filled document + auto-filled basic data).
3. Updating (Edit):
    - PWA: user selects "Edit" from WR table action menu → form pre-populated → submit calls `SubmissionOrchestratorService.updateWorkRequest()`:
        - Try **server** (`PUT /api/pwa/work-request/update`) → server updates local DB + pushes full update to SharePoint
        - Fall back to **PA V2** (update action)
    - Desktop: existing `PUT /work-requests-api` now also pushes to SharePoint via `NgWorkRequestService.updateAndPushToSharePoint()`
4. Revoking:
    - PWA: `SubmissionOrchestratorService.revokeWorkRequest()`:
        - Try **server** (`POST /api/pwa/work-request/revoke`) → updates local + SharePoint
        - Fall back to **PA V2** (update action with status "Revoked")
    - Desktop: `POST /work-requests-api/revoke/{id}` via context menu with confirm dialog
5. WR Table and Permit Monitor are providing way to view/sort/search WR
    - Both Table item and Permit Monitor WR item on click open WR Action Popup:
        - Generate permits []()
        - Request more details
            - Sends email to submitter via EmailFacadeService
            - Saves OUTBOUND EmailCorrespondence record (entityType="WorkRequest", entityId=id)
            - Sets WR status to "Pending More Info"
            - See: [email-correspondence.md](../../../features/email/email-correspondence.md)
        - View Correspondence (right-click context menu)
            - Opens CorrespondenceDialogComponent showing full email thread for this WR
            - Inbound replies auto-polled from operations@jpowerusa.com every 10 min
        - Attach to existing Job
        - Revoke
            - Update Local H2 status to "Revoked"
            - Update SharePoint via `WorkRequestSharePointAdapter.revoke()`
        - Cancel
            - Update Local H2
            - Update Sharepoint (use existing service [](../../../../src/main/java/com/dk_power/power_plant_java/sevice/sharepoint/SharepointAccessService.java) )