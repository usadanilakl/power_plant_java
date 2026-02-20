## Data Flow
Using PWA Form user submits WR ->
WR goes either to Hub ->
    - Hub saves locally > deduplicates for sharepoint > saves on sharepoint > saves sharepoint id in H2 db and returns sharepoint id to PWA >
    - In this case WR H2 ID is permanently set and synchronized to desktop clients
    - in case if sharepoint push failed PWA doesn't get sharepoint id (in this case email is referenced by PWA local Id)

Or Sharepoint ->
    - PWA uses Power Automate to send data.
    - On success saves sharepoint id
    - On failure - sends email with PWA Id (UUID)
    - In this case hub pulls data from Sharepoint and:
        - Saves Locally give is H2 DB ID
        - Syncs to desktop clients

Desktop client gets WR from Hub (already with ID)
    - Saves it locally with the same H2 DB ID (as is from hub)
(if hub is unavailable) desktop client pulls WR from Sharepoint
    - Client sets H2 ID - will be deduplicated when hub comes online.
    - Also contains Sharepoint ID and PWA ID
    - In this case when hub comes on - it needs to deduplicate all local work request copies into one merged version, save it locally and send to clients (performed in memory - get all copies, merge, save, sync)

WR updates (From PWA):
    - PWA sends updates to Hub
        - Hub saves locally
        - Updates Sharepoint
        - Syncs to desktop clients
        - in case of sharepoint push failure - saves locally, marks for re-try
    - PWA sends updates to SharePoint via PA (hub is unavailable)
        - Hub checks updates (how to make it efficient? use separate sharepoint table just for changes, that are deleted when successfully pulled??)
        - Hub saves updates locally
        - Hub syncs updates
    - When Hub is unavailable, desktop clients are pulling form sharepoint
        - poll for updates
        - save locally
        - submit to hub (hub merges)

WR updates (From Desktop):
    - desktop receives updates from UI (frontend)
    - Save changes to local H2
    - Sync to sharepoint
    - Sync to Hub (hub syncs to other clients)
    - Email is sent to clients (optional)

Email connection (Hub online)
    - frontend sends data (message, WR ids (PWA, H2, sharepoint - whichever exists))
    - backend sends email
    - on success it creates Email Object and attaches to WR
    - on failure it creates Email Objec and stages for retry
    - followes update flow (send to hub, hub merges and delivers to clients)

    - PWA submits Email
    - hub pulls new emails, creates, saves and associates (with WR) Email Object
    - hub syncs to clients

Email connection (Hub offline)
    - frontend sends data
    - backedn sends email
    - saves locally
    - associates with WR
    - stages for sync
    - when hub comes on, it receives updates and merges:
        - find all WR copies through all clients
        - merge data
        - find all emails across all WR copies
        - merge emails while keeping association
        - return back to clients merged data (Merged WR with Merged Email)

JHA submission:
    - PWA submits WR IDs and JHA data + JHA image
    - follow hub flow (including dedup and association)
    - or follow PA flow (including dedup and association)
    
Pulling data:
Hub pulls from sharepoint when online:
    - pull all WR + attachments that missing in local db
    - save them
    - pull JHA
    - save and associate with WR
    - pull Emails 
    - Save locally
    - Associate with WR
    - sync to clients
Clients pull by themselves when hub is not available: 
    - pull all WR + attachments that missing in local db
    - save them
    - pull JHA
    - save and associate with WR
    - pull Emails 
    - Save locally
    - Associate with WR
    - Submit to hub (when available)
    - Hub merges all copies (WR, Attachments, JHA and Emails - all merges preserve relationship - 3 clients pulled the same WR with an attachment, JHA and Email, each made some local changes - another Email added, some data changes - hub merges data changes using field based conflict resolution, deletes duplicated attachments, merges JHA and Emails, attaches them all back to merged WR.)



