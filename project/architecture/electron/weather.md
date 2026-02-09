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
- [x] Configurable scrape interval (5s / 10s / 30s / 1min / 5min) via UI dropdown
- [x] Manual refresh button triggers page reload + re-scrape

# Open-Meteo Forecast API - DONE
- [x] Fetches current conditions, 7-day hourly, and 7-day daily forecast from Open-Meteo
- [x] No API key required — plain HTTP GET with query params
- [x] Uses `net.request()` from Electron main process (no BrowserWindow needed)
- [x] Polls every 15 minutes, manual refresh available
- [x] Units: Fahrenheit, mph, inches (US customary)
- [x] Location: Elwood, IL 60421 (lat 41.4039, lon -88.1115)
- [x] Broadcasts `WeatherForecast` to renderer via IPC on each update

# Weather Page - DONE
- [x] Top row: Lightning panel (left) + Current conditions panel (right), side by side
- [x] Lightning: distance (48px font), unit, alert status with colored border + pulse animation
- [x] Current: temperature (48px), weather icon (WMO code → emoji), feels-like, wind/gusts/humidity
- [x] Hourly: scrollable 24-hour strip with time, icon, temp, wind speed, precipitation
- [x] Daily: 7-day list with day name, icon, description, precipitation, wind, hi/lo temps
- [x] WMO weather codes mapped to emoji icons and text descriptions (clear/cloudy/rain/snow/thunderstorm)
- [x] Controls row: Refresh Now (both lightning + forecast), polling interval dropdown, Open WeatherBug button
- [x] Info notice: data sources (WeatherBug Spark + Open-Meteo), alert thresholds
- [x] Loading/error states for forecast panel

# Home Page Integration - DONE
- [x] Weather card on dashboard shows live lightning badge with distance + unit
- [x] Badge color matches alert level (green/yellow/red)
- [x] Label shows "All Clear" / "Lightning Watch" / "Lightning Alarm"
- [x] Current temperature + weather description shown below lightning badge (e.g. "32°F · Overcast")
- [x] Loading state shown while scraper initializes
- [x] Real-time updates via IPC subscription (no page refresh needed)

## Implementation Details

### Data Sources

**Lightning (WeatherBug Spark)**
- URL: `https://www.weatherbug.com/alerts/lightning/elwood-il-60421/`
- DOM element: `document.getElementById('sparkDistanceTxt')` → `.innerText`
- WeatherBug loads Spark data in an iframe, so all frames in subtree are searched

**Forecast (Open-Meteo)**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=41.4039&longitude=-88.1115&current=...&hourly=...&daily=...`
- No API key or registration required (free for non-commercial use)
- Current params: `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `weather_code`, `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`
- Hourly params: `temperature_2m`, `weather_code`, `wind_speed_10m`, `precipitation`
- Daily params: `temperature_2m_max`, `temperature_2m_min`, `weather_code`, `precipitation_sum`, `wind_speed_10m_max`
- Units: `temperature_unit=fahrenheit`, `wind_speed_unit=mph`, `precipitation_unit=inch`, `timezone=America/Chicago`

### Main Process
- `weather.manager.ts` - Hidden BrowserWindow scraper + Open-Meteo API client
  - `start()` - Creates window, loads URL, begins scraping loop + starts forecast polling
  - `scrapeLightningDistance()` - Executes JS in all frames via `Promise.any()`
  - `parseDistanceText()` - Extracts numeric distance + unit from raw text
  - `fetchForecast()` - HTTP GET to Open-Meteo via `net.request()`, parses JSON response
  - `getStatus()` - Returns cached `WeatherStatus`
  - `getForecast()` - Returns cached `WeatherForecast`
  - `refresh()` - Force page reload + re-scrape
  - `refreshForecast()` - Force Open-Meteo fetch
  - `setScrapeInterval(seconds)` - Change lightning scrape interval (min 5s)
  - `getIntervalSeconds()` - Get current scrape interval
  - `cleanup()` - Clears all intervals, destroys BrowserWindow

### Shared Types
```ts
interface WeatherStatus {
  lightningDistance?: string;  // e.g. "5.2"
  unit?: string;               // e.g. "mi"
  lastUpdate?: string;         // e.g. "2:30:15 PM"
  status: 'loading' | 'available' | 'unavailable';
}

interface WeatherForecast {
  current: {
    temperature: number;        // °F
    apparentTemperature: number;
    humidity: number;           // %
    windSpeed: number;          // mph
    windDirection: number;      // degrees
    windGusts: number;          // mph
    weatherCode: number;        // WMO code
  };
  hourly: {
    time: string[];             // ISO timestamps
    temperature: number[];
    weatherCode: number[];
    windSpeed: number[];
    precipitation: number[];    // inches
  };
  daily: {
    time: string[];             // YYYY-MM-DD
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
    precipitationSum: number[];
    windSpeedMax: number[];
  };
  lastUpdate: string;
  status: 'loading' | 'available' | 'error';
  error?: string;
}
```

### Electron IPC Channels
- `weather:get-status` (invoke/handle) - Get cached lightning status
- `weather:refresh` (invoke/handle) - Trigger lightning page reload + re-scrape
- `weather:set-interval` (invoke/handle) - Change lightning scrape interval, returns `{ intervalSeconds }`
- `weather:status` (send/on) - Broadcast: live lightning status updates
- `weather:get-forecast` (invoke/handle) - Get cached forecast data
- `weather:refresh-forecast` (invoke/handle) - Trigger Open-Meteo fetch
- `weather:forecast` (send/on) - Broadcast: live forecast updates every 15 min

### Preload API
- `getWeatherStatus()` - Invoke to get current cached lightning status (+ `intervalSeconds`)
- `weatherRefresh()` - Trigger lightning page reload
- `weatherSetInterval(seconds)` - Change lightning scrape interval
- `onWeatherStatusChange(callback)` - Subscribe to live lightning broadcasts
- `getWeatherForecast()` - Invoke to get current cached forecast
- `weatherRefreshForecast()` - Trigger Open-Meteo fetch
- `onWeatherForecastChange(callback)` - Subscribe to live forecast broadcasts

### Angular Components
- `weather.component.ts` - Full weather page: lightning panel, current conditions, hourly scroll, daily list, controls
- `home.component.ts` - Lightning badge + current temp snippet on dashboard card

### WMO Weather Codes
Mapped in `weather.component.ts` to emoji icons and text descriptions:
- 0: Clear sky (☀), 1-3: Partly cloudy (⛅/☁)
- 45-48: Fog (🌫), 51-55: Drizzle (🌦)
- 61-67: Rain (🌧), 71-77: Snow (🌨)
- 80-86: Showers (🌦/🌧/🌨)
- 95-99: Thunderstorm (⛈)

### Timing
- Lightning scrape interval: 10 seconds (default, configurable 5s–5min)
- Lightning page refresh: 10 minutes (reload URL for fresh data)
- Forecast poll interval: 15 minutes

## Deferred
- Configurable location (currently hardcoded to Elwood, IL 60421)
- Weather alerts/notifications (desktop notification on danger threshold)
- Historical lightning data tracking
- Humidity, pressure, UV index in forecast
