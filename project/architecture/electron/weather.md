## Old App
Electron Desktop - `C:\Users\usada\JS Projects\dk-power-full-stack\apps\desktop\src\app\weather-view.manager.ts`
Angular PWA - `C:\Users\usada\JS Projects\dk-power-full-stack\apps\pwa\src\app\features\weather`

## New Implementation
Integrated with desktop electron app [](../../../electron-manager/)

## Acceptance Criteria

# Lightning Scraping - DONE
- [x] Hidden BrowserWindow loads WeatherBug Spark lightning page
- [x] Scrapes `#sparkDistanceTxt` from all frames every 10 seconds via `Promise.any()`
- [x] Page auto-refreshes every 10 minutes for fresh data
- [x] Parses distance text to extract numeric value and unit (e.g. "5.2 mi")
- [x] Broadcasts `WeatherStatus` to renderer via IPC on each update

# Weather Page - DONE
- [x] Lightning distance displayed prominently (56px font) with unit
- [x] Three-level alert system with colored border: danger (<=8 mi), caution (8-20 mi), safe (>20 mi)
- [x] Danger level triggers pulsing red border animation
- [x] Status cards: Status (Alarm/Watch/Clear), Last Update (timestamp), Source (WeatherBug)
- [x] "Open WeatherBug Lightning Page" button opens actual site in new Electron window
- [x] Info notice explaining alert thresholds

# Home Page Integration - DONE
- [x] Weather card on dashboard shows live lightning badge with distance + unit
- [x] Badge color matches alert level (green/yellow/red)
- [x] Label shows "All Clear" / "Lightning Watch" / "Lightning Alarm"
- [x] Loading state shown while scraper initializes
- [x] Real-time updates via IPC subscription (no page refresh needed)

## Implementation Details

### Data Source
- URL: `https://www.weatherbug.com/alerts/lightning/elwood-il-60421/`
- DOM element: `document.getElementById('sparkDistanceTxt')` -> `.innerText`
- WeatherBug loads Spark data in an iframe, so all frames in subtree are searched

### Main Process
- `weather.manager.ts` - Hidden BrowserWindow scraper
  - `start()` - Creates window, loads URL, begins scraping loop
  - `scrapeLightningDistance()` - Executes JS in all frames via `Promise.any()`
  - `parseDistanceText()` - Extracts numeric distance + unit from raw text
  - `getStatus()` - Returns cached `WeatherStatus`
  - `cleanup()` - Clears intervals, destroys BrowserWindow

### Shared Types
```ts
interface WeatherStatus {
  lightningDistance?: string;  // e.g. "5.2"
  unit?: string;               // e.g. "mi"
  lastUpdate?: string;         // e.g. "2:30:15 PM"
  status: 'loading' | 'available' | 'unavailable';
}
```

### Electron IPC Channels
- `weather:get-status` (invoke/handle) - Get cached weather status on demand
- `weather:status` (send/on) - Broadcast: live status updates every 10 seconds

### Preload API
- `getWeatherStatus()` - Invoke to get current cached status
- `onWeatherStatusChange(callback)` - Subscribe to live status broadcasts

### Angular Components
- `weather.component.ts` - Full weather page with panel, status cards, open button
- `home.component.ts` - Lightning badge snippet on dashboard card

### Timing
- Scrape interval: 10 seconds
- Page refresh interval: 10 minutes (reload URL for fresh data)

## Deferred
- Configurable location (currently hardcoded to Elwood, IL 60421)
- Weather alerts/notifications (desktop notification on danger threshold)
- Historical lightning data tracking
