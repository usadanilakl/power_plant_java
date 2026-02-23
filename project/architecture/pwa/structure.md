
# PWA resides on github pages [](../../../browser/ng-ui)
# 2 acess types: Authenticated and Non-authenticated
    ## Any User
    - First use:
        - Save in indexed DB Name, Company, phone number, email
    - On Data submission (contact info attached with every submission request):
        - Save in indexed db with, get id and attach to outgoing data
        - try server (power_plant_java instance). Server's flow:    
            - tries certificate upload to SharePoint
            - if fails, tries Power Automate upload
            - if successfull: save data (with sharepoint id) in server's h2 db and let it sync with Sync Server
            - if sharepoint failed - save data (without sharepoint id) and let it sync.
        - try power automate
        - if any method worked, save draft into
        - send email (manual prompt with text and links)
    - On Data updates (if user needs to update submitted data)
        - From WR table, select "Edit" → form pre-populated → submit calls `SubmissionOrchestratorService.updateWorkRequest()` (server-first → PA V2 fallback)
        - Updates push full field changes to SharePoint
    - On Revoke:
        - From WR table or JHA submitted tab → select "Revoke" action
        - Calls `SubmissionOrchestratorService.revokeWorkRequest()` / `revokeJha()` (server-first → PA V2 fallback)
        - Sets status to "Revoked" in local IndexedDB + SharePoint
    - On Data updates (data was processed)
        - user gets an email
        - user can manually request status check (the same flow: try server -> try PA -> send email)

    ## Authenticated
    - Users reach to power_plant_java instance that runs on public server with authentication flow
    - If successfull, user gets access from PWA to power_plant_java web instance for:
        - tracking permit statuses
        - submitting updates
        - receiving updates

# Functionalities (PWA only)
    - Work Request [](../../features/permits/work-request/)
        - Submit (new WR via form)
        - Edit (modify existing WR fields → pushes to SharePoint)
        - Revoke (sets status "Revoked" in local + SharePoint)
        - Resubmit
        - Submit via Email (fallback)
        - Delete (local only)
    - JHA [](../../features/permits/work-request/jha.md)
        - Submit via Form (full form + image capture)
        - Submit via File (upload pre-filled document, basic data auto-filled)
        - Revoke (sets status "Revoked" in local + SharePoint)
        - Reuse as Template (populate form from previously submitted JHA)
    - Confined Space
        - Check Status
    - Instrumentation Log
        - Submit
        - Change
        - Revoke
        - Resubmit
        - Check Status

# Key Services
    - `SubmissionOrchestratorService` — central orchestration: server-first → PA V2 fallback → email fallback
        - `submitWorkRequest()`, `submitJha()` — submission
        - `revokeWorkRequest()`, `revokeJha()` — revocation
        - `updateWorkRequest()` — edit/update
    - `ServerApiService` — HTTP calls to power_plant_java hub (`/api/pwa/*`)
    - `PowerAutomateService` — direct PA V2 calls from PWA

# Implementation
