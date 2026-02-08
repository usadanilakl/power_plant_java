## Functionality
1. Get log from Gate Website (hidden BrowserWindow automation)
2. Get people from OnLocation (REST API)
3. Combine into list and display
4. Auto-login to both Gate Web and OnLocation via WebView windows

## Acceptance criteria
1. App can be set to automatically get data (false by default) - DONE
2. Update frequency is set from UI by user (15/30/60/120 min) - DONE
3. Last update date and time are displayed - DONE
4. Refresh button is provided - DONE
5. Buttons to login and navigate to page are provided for both: OnLocation and Gate Web - opened in separate Electron BrowserWindows with auto-login via JavaScript injection - DONE
6. Print button is provided (generates formatted HTML, opens print dialog) - DONE

## Architecture

Gate Log is consolidated INTO the Electron Angular app (not a separate JAR). All business logic runs in the Electron main process — no Spring Boot dependency.

### Data Sources

**OnLocation API** (Node.js `https` from main process):
- Base URL: `https://api.whosonlocation.com/v1`
- Auth: `Authorization: APIKEY {key}` header
- Endpoint: `GET /visitor/event` → response wrapped in `{ event: [...] }`
- Filter: only entries where `signed_out` is null (still on site)
- Fields extracted: `name`, `company`, `email`, `mobile`, `signed_in`
- Date format: ISO 8601 `yyyy-MM-dd'T'HH:mm:ssXXX` → converted to `MM/dd/yyyy HH:mm:ss`

**Gate Website** (hidden BrowserWindow scraping):
- URL: `https://10.56.80.80/` (internal, self-signed cert)
- SSL: `setCertificateVerifyProc` accepts all certs on scraper partition
- Automation flow:
  1. Navigate to gate URL
  2. Login via JS injection (`#login`, `#password`, `#login-button`)
  3. Wait for navigation
  4. Click Reports link (`#main_reports_link`)
  5. Navigate to Custom Reports
  6. Scrape HTML table via JS injection
  7. Parse entry/exit records → filter for people still on-site (entry but no exit)
  8. Close hidden window

### Manager: `gate-log.manager.ts`

Core business logic:
- `fetchOnLocationPeople()` — REST API call to WhosOnLocation
- `scrapeGateData()` — hidden BrowserWindow automation
- `refresh()` — fetches both sources via `Promise.allSettled`, merges, calculates durations, caches result
- `setAutoRefresh(enabled, intervalMinutes)` — `setInterval` in main process (runs even when component not visible)
- `loadConfig()` / `saveConfig()` — persists to `managed_apps/pid/gate-log-config.json`
- `print()` — generates formatted HTML, loads in hidden BrowserWindow, calls `webContents.print()`
- `cleanup()` — stops auto-refresh timer

### IPC Channels (8 total)

Invoke/handle:
- `gate-log:get-people` — cached people list
- `gate-log:get-status` — last update, auto-refresh state, configured flag, error
- `gate-log:refresh` — manual refresh trigger, broadcasts `people-updated`
- `gate-log:set-auto-refresh` — enable/disable + set interval
- `gate-log:get-config` / `gate-log:save-config` — config CRUD
- `gate-log:print` — print people list

Broadcast:
- `gate-log:people-updated` — sent to renderer when data changes (manual or auto-refresh)

### WebView Auto-Login (in `webview.manager.ts`)

Both targets open visible BrowserWindows for manual user interaction:

**`gate-website`** target:
- URL: `https://10.56.80.80/`
- Auto-login: fills `#login` + `#password`, clicks `#login-button`
- SSL cert bypass on session

**`onlocation`** target:
- URL: `https://us3.whosonlocation.com/login`
- Two-step auto-login: fill `#email_input` → click `#nextBtn` → wait 2s → fill `#password_input` → click `#signInBtn`

Credentials read from `managed_apps/pid/gate-log-config.json` (falls back to hardcoded defaults).

### Angular UI: `gate-log.component.ts`

Layout:
- **Header**: title + gear icon (toggle config panel)
- **Toolbar**: Refresh button, auto-refresh toggle + interval dropdown, Open Gate Web / Open OnLocation buttons, Print button
- **Summary cards**: People count, Gate/OnLocation breakdown, Last update time
- **Config panel** (collapsible): OnLocation API key + base URL + login, Gate URL + credentials
- **Data table**: Name (sortable), Source badge (Gate blue / OnLoc green), Check In (sortable), Duration (sortable), Company, Contact
- **States**: error banner, not-configured notice, empty state

### Configuration

Stored in `managed_apps/pid/gate-log-config.json`:
```json
{
  "onLocationApiKey": "wNqYlPvPlq2GvktS",
  "onLocationBaseUrl": "https://api.whosonlocation.com/v1",
  "gateWebUrl": "https://10.56.80.80/",
  "gateUsername": "dklokov",
  "gatePassword": "Jackson1",
  "onLocationEmail": "jacksonap@jpowerusa.com",
  "onLocationPassword": "Jackson1",
  "autoRefresh": false,
  "intervalMinutes": 60
}
```

Pre-populated with defaults from old app. Editable from config panel in Gate Log page.

### Previous App

Old app: `C:\Users\usada\my_projects\Entrance_Log`
- Spring Boot + JavaFX + Selenium (Edge) + OnLocation Feign client
- Consolidated into Electron main process (no Selenium, no JavaFX, no separate JAR)
