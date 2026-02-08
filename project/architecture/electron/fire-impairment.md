## Old App
JavaFX - "C:\Users\usada\my_projects\Fire-Imparement-JavaFX"
SpringBoot - "C:\Users\usada\my_projects\fire-imparement"

## New implementation
Integrated with desktop electron app [](../../../electron-manager/)

## Acceptance Criteria

# Creating New Impairment - DONE
- [x] User selects People to be included (checkbox grid of 18 employees, 10 pre-selected)
- [x] User selects affected equipment and area (location + protection identifier dropdowns)
- [x] User submits selection - submitted data is prefilled on FM Global website (using automation)
- [x] New impairment is saved in the SpringBoot Main App Database on dialog submit
- [x] FM Global button interception: Back/Submit buttons intercepted via JS injection, form data gathered and DB record updated

# Viewing - PARTIALLY DONE
- [x] User can see preview card on home page in electron with number of active impairments
- [ ] User can see "New" tag on impairment card when new impairment syncs from Sync Server (DEFERRED)
- [x] User can view all impairments on Impairments page (Active/Closed tabs)
- [ ] Search functionality (NOT YET)

# Closing - DONE
- [x] User selects to close active permit (Close button on each active card)
- [x] A popup with instructions opens (4-step guide with copy buttons for email/message)
- [x] When popup is submitted, active permit closes (updates Main SpringBoot App via PUT /close)

## Implementation Details

### Spring Boot Backend
- Entity: `entities/fire_impairment/FireImpairment.java`
- Enums: `FireImpairmentLocation`, `ProtectionIdentifier`, `Emails`
- Controller: `/api/fire-impairment` (CRUD + `/active` `/closed` `/latest` `/locations` `/protection-types` `/emails`)
- Service: `sevice/fire_impairment/FireImpairmentService.java`

### Electron IPC Channels
- `fire-imp:list` - List active impairments
- `fire-imp:list-closed` - List closed impairments
- `fire-imp:count` - Get active count (for home page badge)
- `fire-imp:get-enums` - Fetch locations, protection types, emails
- `fire-imp:create` - Create new impairment
- `fire-imp:update` - Update existing impairment
- `fire-imp:close` - Close impairment
- `fire-imp:open-form` - Open FM Global WebView with auto-fill + button interception
- `fire-imp:form-submitted` - Broadcast: FM Global button intercepted, carries gathered form data

### Angular Components
- `fire-impairment.component.ts` - Main page with Active/Closed tabs, list, create/close dialogs
- `create-impairment-dialog.component.ts` - People selection, location/protection dropdowns
- `close-impairment-dialog.component.ts` - 4-step close instructions with clipboard copy
- Home page count badge in `home.component.ts`

### WebView Automation
- `webview.manager.ts` → BrowserWindow to `https://redetag.fmglobal.com`
- `fillFmGlobalForm()` - JS injection for form population
- `gatherFmGlobalData()` - JS extraction of form state + precautions
- `interceptFmGlobalButtons()` - Overrides `btnBack` and `btnSubmit` onclick handlers; gathers form data via console-message bridge (contextIsolation=true), then lets original handler run after 200ms delay. FM Global behavior unchanged.

## Deferred
- "New" tag on synced impairments (device-prefix ID check)
- Search/filter on impairment list

