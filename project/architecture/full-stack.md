## Main Parts
1. power_plant_java - main SpringBoot app that handles ALL data:
    - Local H2 DB storage
    - Serves Angular UI
    - Data CRUD operation
    - Data manipulation (format conversions, import/export, desktop automation)
    - Security
2. Electron Manager (replaced JavaFX):
    - Wraps main SpringBoot app as desktop application
    - Manages start/stop/restart, health monitoring, sync, updates
    - Bundled JRE (Temurin 21) — no system Java required
    - Packaged as Windows installer (NSIS) or portable folder
    - Shared data at %PROGRAMDATA% for multi-user workstations
    - Independent features: Fire Impairment, Gate Log, Weather, PJM
3. Sync Server (SpringBoot):
    - Synchronizes main SpringBoot app instances
    - Provides full database and file backup
4. Permit Angular PWA:
    - Standalone app for permit management (submit requests, view requests and permit statuses)
    - Has limited access to main Springboot app data via server
    - As a fallback works with sharepoint instead of SpringBoot server
    - Supports Registered and Unregistered users

## Full Flow
JavaFX desktop wraps main SpringBoot app making it fully offline desktop application with its own DB, Security, File System and UI. When online, Sync Server centralizes data from all instances of main app into one. An independent instance of main app is running on public server with multiple security levels - for web access. Permit Angular PWA allows users of all kind (Employees, Contractors, Visitors, Registered, Unregistered) to interact with Permiting system regardless of server state or other apps state - it stores users in indexed db for offline access, it connects to servers to get updated statuses, it falls back to Sharepoint interactions if servers are not available. 

## Improvements/Plans

1. ~~Switch JavaFX to Electron~~ - DONE. Electron Manager with bundled JRE, NSIS installer + portable build, multi-user support
2. ~~Set up automatic update system~~ - DONE. Electron checks sync server for JAR updates, downloads with SHA-256 verification, auto-restarts Spring Boot. Electron self-update: downloads ZIP from sync server, stages it, applies via external batch script (Windows file locking requires process exit before replacement), relaunches automatically
3. Prep main SpringBoot app for web access - deploy it on server, set security separations. Run it just like any other instance of main SpringBoot app that syncs with server.
4. Set up Angular PWA to work with web instance of main SpringBoot app: 
    - PWA submits changes to public endpoint
    - Request is directed to main SpringBoot app instance that is running on server
    - Spring Security clears it
    - Changes submitted to local DB
    - Changes to Local DB are synchronized to Sync Server
    - All Desktop instances get updates
    - When Permit is processed (most likely on desktop instance) - changes are syncronized to Sync Server, Sync Server spreads it to Web Instance of main SpringBoot app.
    - Main Springboot app notifies PWA (SSE??)
    - If server is unreachable:
        - PWA submits changes to sharepoint
        - Desktop Instances periodically check SharePoint for changes
        - Download Changes to local DB (make sure all SharePoint items have the same ID across all desktop instances so duplicates re not created when synchronized)
        - When Permit is processed on desktop, it updates sharepoint and sends email to user who submitted request.
        - User sees email, opens PWA it fetches updates from SharePoint.


        Current Manager App: "C:\Users\usada\my_projects\ManagerApp"

        An attempt to create Electron Version: C:\Users\usada\JS Projects\dk-power-full-stack\apps