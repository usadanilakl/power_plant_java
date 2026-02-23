# PJM Monitoring

## Overview

The PJM module provides real-time grid pricing data and day-ahead scheduling for two generating units (U1 and U2 Jackson). It consists of three subsystems:

1. **LMP Polling** — Real-time 5-minute Locational Marginal Pricing from PJM Data Miner 2 API
2. **DA Email Polling** — Day-ahead award schedule from PJM emails via Microsoft Graph API
3. **Unit Evolution** — Next state change calculation (online/offline transitions) derived from DA awards

All three are tied to a single Start/Stop Polling toggle, disabled by default.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    PjmManager                        │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │ LMP Polling   │    │ DA Email Auto-Polling     │   │
│  │ (Data Miner)  │    │ (Graph API → cheerio)     │   │
│  │ configurable  │    │ 11:30 AM CT, every 5 min  │   │
│  │ interval      │    │ stops on next-day award   │   │
│  └──────┬───────┘    └──────────┬───────────────┘   │
│         │                       │                    │
│         ▼                       ▼                    │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │ PjmStatus     │    │ Evolution Calculation     │   │
│  │ (unit1/unit2  │◄───│ (next online/offline)     │   │
│  │  LMP prices)  │    │ → unit1/2Evolution        │   │
│  └──────┬───────┘    └──────────────────────────┘   │
│         │                                            │
│         ▼                                            │
│  PjmStatus broadcast (IPC → renderer)               │
└─────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
PJM Page   Home Page
(full UI)  (summary card)
```

---

## LMP Polling (Data Miner 2)

### API
- **Endpoint**: `https://api.pjm.com/api/v1/rt_unverified_fivemin_lmps`
- **Auth**: `Ocp-Apim-Subscription-Key` header (key in `pjm-config.json`)
- **Data**: 5-minute unverified LMP for specific pricing nodes (pnodes)

### Pnodes
- U1 Jackson: `2156111010`
- U2 Jackson: `2156111011`

### Behavior
- Polling OFF by default — user enables via "Start Polling" button
- Interval configurable: 1 / 2 / 5 / 10 / 15 / 30 minutes (persisted to config)
- Manual "Refresh" button available independent of polling state
- Each unit queried independently in parallel

### API quirks
- **`startRow: '1'`** is required — omitting causes 400 error
- **Do NOT send `fields` param** — old field names are invalid
- Parser tries `total_lmp_rt` → `itsced_lmp` fallback
- Congestion: `congestion_price_rt`; Loss: `marginal_loss_price_rt`

---

## DA Email Polling

See [sharepoint-pjm-da.md](sharepoint-pjm-da.md) for full details.

- Fetches PJM Day-Ahead award emails from Microsoft Graph API
- Parses HTML tables with cheerio
- Auto-polls starting at 11:30 AM CT, every 5 minutes
- Stops when next-day award received, restarts at 11:30 AM CT next day
- Tied to same Start/Stop button as LMP polling

---

## Unit Evolution

Calculates the next state change for each unit based on DA awards:
- **AGC** (coming online): `(HE - 2):00 CT` — unit starts at beginning of awarded hour
- **OFFLINE** (going offline): `(HE - 1):00 CT` — HE of first 0-MW hour in CT

Included in `PjmStatus` broadcast and displayed in both PJM page unit cards and Home page PJM card.

See [sharepoint-pjm-da.md](sharepoint-pjm-da.md) for full evolution logic and time conversion details.

---

## Voyager

PJM Voyager (`voyager.tnsk.com`) is a visual reference tool kept as a separate BrowserWindow:
- Renders on `<canvas>` via WASM — cannot scrape DOM or intercept network data
- Auto-login via `insertText` (Chromium input pipeline): focus → clear → `webContents.insertText()`
- Credentials loaded from `pjm-config.json` (`voyagerUsername` / `voyagerPassword`)
- "Open Voyager" button on PJM page opens the window
- Window position/size persisted via `WindowLayoutManager`

---

## UI

### PJM Page (`pjm.component.ts`)
- **Header**: Refresh, Start/Stop Polling, LMP Trend, Open Voyager buttons
- **Status bar**: Live indicator with last polled time
- **Unit panels** (side-by-side): LMP price, breakdown (energy/congestion/loss), evolution chip
- **Poll interval**: Configurable dropdown
- **DA Awards section**: Date navigator, 24-hour table (U1/U2 MW + LMP), refresh button

### Home Page PJM Card
- LMP prices for U1/U2
- Evolution status rows (dot + label + message)
- Polling state indicator

---

## Configuration (`pjm-config.json`)

```json
{
  "apiKey": "",
  "units": [
    { "pnodeId": 2156111010, "pnodeName": "U1 Jackson" },
    { "pnodeId": 2156111011, "pnodeName": "U2 Jackson" }
  ],
  "pollIntervalMinutes": 5,
  "voyagerUsername": "",
  "voyagerPassword": "",
  "daEmailAddress": ""
}
```

Stored at `getWorkingDir()/pjm-config.json`. Default provisioned from `config-defaults/pjm-config.json` by `provisionDefaultConfigs()`.

---

## IPC Events

| Event | Type | Purpose |
|-------|------|---------|
| `pjm:get-status` | invoke/handle | Get current PjmStatus + polling state |
| `pjm:status` | send/on | Broadcast status updates (includes evolutions) |
| `pjm:set-polling` | invoke/handle | Enable/disable polling (LMP + DA) |
| `pjm:refresh` | invoke/handle | Manual LMP refresh |
| `pjm:get-config` | invoke/handle | Get PJM config |
| `pjm:save-config` | invoke/handle | Save config + restart polling |
| `pjm:show-window` | invoke/handle | Open Voyager window |
| `pjm:da-fetch` | invoke/handle | Fetch DA awards (cached) |
| `pjm:da-refresh` | invoke/handle | Force-refresh DA awards |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main/managers/pjm.manager.ts` | LMP polling, DA cache, auto-polling, evolution calc |
| `src/main/managers/da-email.manager.ts` | Graph API email fetch + cheerio parse |
| `src/shared/types.ts` | All PJM types (`PjmStatus`, `PjmDaAward`, `PjmUnitEvolution`, etc.) |
| `src/main/ipc/events.ts` | IPC channel constants |
| `src/main/ipc/handlers.ts` | IPC handler registration |
| `src/renderer/.../pjm/pjm.component.ts` | PJM page UI |
| `src/renderer/.../home/home.component.ts` | Home page PJM card |
| `src/renderer/.../services/electron.service.ts` | Renderer service + mirror types |
| `config-defaults/pjm-config.json` | Default config |
