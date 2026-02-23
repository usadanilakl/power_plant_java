# PJM Day-Ahead Awards via Microsoft Graph Email Polling

## Overview
PJM sends a "DA Schedule Notice" email daily (~noon ET / 11 AM CT) containing a table of 24 hourly MW awards and LMP prices for each generating unit. The Electron app polls Microsoft Graph API directly to read these emails, parses the HTML table with cheerio, and caches the results locally.

The system also calculates **unit evolution** — the next state change (online→offline or offline→online) — and displays it on the PJM page unit cards and the Home page PJM card.

---

## Azure Prerequisites

The app reuses the **same Azure AD app registration** (PFX certificate) already configured for SharePoint access.

1. **Add permission**: In Azure Portal → App registrations → API permissions → Add → Microsoft Graph → Application → `Mail.Read`
2. **Grant admin consent**: Click "Grant admin consent for [tenant]"
3. **No new app or certificate needed** — same `sharepoint-config.json` credentials (clientId, tenantId, pfxPath, pfxPassword)

The `DaEmailManager` requests a token with scope `https://graph.microsoft.com/.default` (vs SharePoint's `https://jpowerusa.sharepoint.com/.default`).

**Certificate format**: `@azure/identity` v4 requires **PEM** format. The PEM is pre-converted at build time and deployed by `ensureCertificate()` in `paths.ts`. The manager prefers PEM, falling back to PFX.

---

## Data Flow

```
PJM Email (daily ~11 AM CT)
    ↓
Microsoft Graph API  ←── DaEmailManager polls
    ↓                    (GET /users/{email}/messages?$filter=...)
HTML email body
    ↓
cheerio HTML parser  ←── Extracts 24-row table
    ↓
PjmDaAward[]         ←── Cached in PjmManager (15-min TTL)
    ↓
Evolution calc       ←── Determines next online/offline transition
    ↓
PjmStatus broadcast  ←── unit1Evolution / unit2Evolution
    ↓
UI                   ←── PJM page unit cards + Home page PJM card
```

---

## Configuration

### `pjm-config.json` — email address field
```json
{
  "daEmailAddress": "user@jpowerusa.com"
}
```
This is the mailbox UPN (user principal name) that receives PJM DA emails. Can be a shared mailbox.

### `sharepoint-config.json` — Azure credentials (reused)
```json
{
  "clientId": "...",
  "tenantId": "...",
  "pfxPath": "data/certificate.pfx",
  "pfxPassword": "..."
}
```

---

## Email Format

**From**: `TenaskaComm@tnsk.com` (case-sensitive in Graph API)
**Subject**: `DA Schedule Notice - Jackson - MM/DD/YYYY [X.X MWs Awarded Gen] [X.X MWs Awarded Load]`

**Body** contains an HTML table with caption "Day Ahead Awarded Energy Volumes":
```html
<table>
  <caption>Day Ahead Awarded Energy Volumes - MM/DD/YYYY</caption>
  <tr>
    <th>HE (EPT)</th>
    <td class="ColumnHeaders">MW</td>
    <td class="ColumnHeaders">LMP</td>
    <td class="ColumnHeaders">MW</td>
    <td class="ColumnHeaders">LMP</td>
  </tr>
  <tr class="IntervalColumn">
    <td>01</td>
    <td class="NoAwards">0.0</td>
    <td class="NoAwards">$23.45</td>
    <td class="HasAwards">560.0</td>
    <td class="HasAwards">$22.10</td>
  </tr>
  ... (24 rows, hours 01-24) ...
</table>
```

### Important format notes (discovered during implementation)
- Hour cells contain just `01`..`24` (NOT `HE 01` — the `HE (EPT)` text is only in the `<th>` header)
- CSS classes are `NoAwards` / `HasAwards` (no `x_` prefix)
- Table is identified by `<caption>` containing "Day Ahead Awarded Energy Volumes"
- DST transitions may produce 23 or 25 rows — parser accepts >= 23

### Parser logic (cheerio)
1. Find table by `<caption>` containing "Day Ahead Awarded Energy Volumes"
2. Fallback: find table where first `<th>` or `<td>` contains "Hour" or "HE"
3. For each `<tr>` with 5+ `<td>` cells: parse first cell as integer (1-24)
4. Extract: HE, U1 MW, U1 LMP (strip `$,`), U2 MW, U2 LMP (strip `$,`)
5. Summary rows (non-numeric first cell) are automatically skipped
6. Require >= 23 rows for a valid parse (DST support)

---

## Graph API Query

**Endpoint**: `GET /v1.0/users/{emailAddress}/messages`

**Parameters** (constructed manually — `URLSearchParams` encodes `$` as `%24` which Graph rejects):
- `$filter=receivedDateTime ge {30_days_ago} and startsWith(subject,'DA Schedule Notice - Jackson')`
- `$select=subject,body,receivedDateTime,from`
- `$orderby=receivedDateTime desc`
- `$top=30`

### Filter design decisions
- **Subject-only filter**: The `from/emailAddress/address eq` filter does not work reliably in Graph API (returns 0 results even with correct case). Using `startsWith(subject,...)` alone is specific enough.
- **Sender case**: Graph API `eq` is case-sensitive — `TenaskaComm` ≠ `Tenaskacomm`.
- **URL encoding**: OData `$` params must be literal in the path (`?$filter=...`). Only the parameter VALUES are `encodeURIComponent()`-encoded.

**Authentication**: Bearer token from `ClientCertificateCredential.getToken('https://graph.microsoft.com/.default')`

---

## DA Email Auto-Polling

DA email polling has its own schedule, **tied to the LMP polling enable/disable button** (both start/stop together), but with independent timing:

| Aspect | LMP Polling | DA Email Polling |
|--------|------------|-----------------|
| Start/Stop | User toggle button | Same button |
| Interval | Configurable (1-30 min) | Fixed 5 min |
| Schedule | Immediate on enable | Starts at 11:30 AM CT |
| Stop condition | User disables | Next-day award received OR user disables |
| Daily reset | N/A | Restarts at 11:30 AM CT next day |

### Polling lifecycle
1. User clicks "Start Polling" → `PjmManager.start()` starts LMP polling AND calls `scheduleDaPolling()`
2. If current time >= 11:30 AM CT → DA polling begins immediately
3. If current time < 11:30 AM CT → `setTimeout` schedules DA polling to start at 11:30 AM CT
4. DA polling runs every 5 minutes, fetching emails via Graph API
5. When an award for the **next EPT operating day** is found → DA polling pauses
6. A `setTimeout` reschedules DA polling to restart at 11:30 AM CT the next day
7. User clicks "Stop Polling" → both LMP and DA polling stop (all timers cleared)

### Why 11:30 AM CT?
PJM typically publishes Day-Ahead awards around noon ET (11 AM CT). Starting at 11:30 AM CT catches the award shortly after publication without wasting API calls earlier in the day.

---

## Unit Evolution Calculation

The system calculates a "next evolution" for each unit — the next time the unit's state changes from online to offline (or vice versa).

### Current state detection
- Get current Hour Ending (HE) in EPT: `currentHE = (CT_hour + 1) + 1` (CT→EPT + hour-ending offset)
- Look up today's DA award at `currentHE`: if MW > 0, unit is **online**; if MW = 0, unit is **offline**

### Next transition scan
1. Scan today's remaining hours (currentHE+1 through HE 24) for a state change
2. If no transition today, scan tomorrow's award (HE 1 through 24)
3. Return the first transition found

### Time conversion (EPT hour-ending → CT clock time)
Two conversions are applied:
1. **EPT → CT**: subtract 1 hour (Eastern Prevailing → Central)
2. **Hour-ending → start-of-hour**: subtract 1 hour (HE 15 covers 14:00-15:00)

| Event | Formula | Example (HE 15) |
|-------|---------|-----------------|
| **AGC** (coming online) | `(HE - 2):00 CT` | HE 15 → 13:00 CT (1:00 PM) |
| **OFFLINE** (going offline) | `(HE - 1):00 CT` | HE 15 → 14:00 CT (2:00 PM) |

- **AGC**: both conversions applied — unit must start at the **beginning** of the awarded hour
- **OFFLINE**: only EPT→CT applied — the HE number represents when the unit is off

### Evolution messages
| Current State | Condition | Message |
|---------------|-----------|---------|
| Online | Stays online through tomorrow | `Staying online for MM/DD` |
| Online | Goes offline today | `OFFLINE by H:MM AM/PM CT` |
| Online | Goes offline tomorrow | `OFFLINE by MM/DD H:MM AM/PM CT` |
| Offline | Comes online today | `AGC by H:MM AM/PM CT` |
| Offline | Comes online tomorrow | `AGC by MM/DD H:MM AM/PM CT` |
| Offline | Not scheduled tomorrow | `Offline for MM/DD` |
| Either | No DA data available | `Awaiting DA schedule` |

### Broadcast
Evolutions are included in the `PjmStatus` broadcast (`unit1Evolution`, `unit2Evolution`) and recalculated on every LMP poll cycle so they stay current as hours pass.

---

## Parsed Data Model

```typescript
interface PjmDaHourEntry {
  he: number;   // Hour ending 1-24 (EPT)
  mw: number;   // Awarded MW
  lmp: number;  // LMP $/MWh
}

interface PjmDaAward {
  date: string;                   // YYYY-MM-DD (EPT operating date)
  unit1Hours: PjmDaHourEntry[];   // 23-25 entries (DST)
  unit2Hours: PjmDaHourEntry[];
  unit1TotalAwardedHours: number; // count of hours with MW > 0
  unit2TotalAwardedHours: number;
  unit1AvgLMP: number;            // average LMP across all hours
  unit2AvgLMP: number;
  processedAt?: string;           // email receivedDateTime
}

interface PjmUnitEvolution {
  status: 'online' | 'offline' | 'unknown';
  message: string;    // e.g. "AGC by 1:00 PM CT"
  date?: string;      // YYYY-MM-DD of the award this is based on
}
```

---

## UI Display

### PJM Page — Unit Cards
Each unit panel shows a "Next Evolution" chip below the LMP breakdown:
- **Green badge** (`Online`) + message when unit is currently online
- **Red badge** (`Offline`) + message when unit is currently offline
- **Gray badge** (`No schedule`) when no DA data available

### Home Page — PJM Card
Below the U1/U2 LMP price rows, evolution rows appear with:
- Colored dot (green=online, red=offline, gray=unknown)
- Unit label (U1/U2)
- Evolution message

Both views update automatically via the `PjmStatus` broadcast (same subscription as LMP prices).

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main/managers/da-email.manager.ts` | Graph API email fetch + cheerio HTML parse |
| `src/main/managers/pjm.manager.ts` | DA cache, auto-polling schedule, evolution calculation |
| `src/shared/types.ts` | `PjmDaAward`, `PjmDaHourEntry`, `PjmUnitEvolution`, `PjmStatus` |
| `src/renderer/.../pjm/pjm.component.ts` | Evolution display in unit cards, hourly table |
| `src/renderer/.../home/home.component.ts` | Evolution rows in PJM card |
| `src/renderer/.../services/electron.service.ts` | Mirror types for renderer |
| `config-defaults/pjm-config.json` | Default config with `daEmailAddress` field |
| `config-defaults/sharepoint-config.json` | Azure credentials (reused for Graph scope) |

---

## Lessons Learned

- `URLSearchParams` encodes `$` as `%24` — Graph API requires literal `$filter`, `$select`, etc. Build query strings manually.
- Graph API `from/emailAddress/address eq` filter is unreliable — use `startsWith(subject,...)` instead.
- Graph API `eq` filter is case-sensitive — `TenaskaComm` ≠ `Tenaskacomm`.
- PJM email hour cells contain just `01`..`24`, not `HE 01` — parse with `parseInt()` + range check, not `startsWith('HE')`.
- `@azure/identity` v4 requires PEM format — PFX alone causes silent failures.
- DST transitions produce 23 or 25 hours — accept >= 23 rows.
