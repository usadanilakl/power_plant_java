import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { ElectronService, WeatherForecast, WeatherStatus, PerryWeatherStatus } from './electron.service';

/**
 * Derives operational weather work-advisories (heat, cold, wind, rain, ice, lightning)
 * from the weather data the app already pulls (Open-Meteo forecast + WeatherBug/Perry lightning).
 *
 * All math is client-side and mirrors the existing lightning-getter pattern used in the
 * weather widget/page. No new IPC or main-process manager is required.
 *
 * Formulas: NWS Heat Index (Rothfusz regression) + OSHA worker heat bands; NWS Wind Chill (2001).
 * Thresholds are named constants below so they can be tuned without touching logic.
 */

// ---- Tunable thresholds -----------------------------------------------------

// Heat Index (°F) — OSHA "Using the Heat Index to Protect Workers" risk bands
const HEAT_CAUTION_F = 91;   // moderate risk
const HEAT_WARNING_F = 103;  // high risk
const HEAT_DANGER_F = 115;   // very high risk

// Wind Chill (°F) — NWS frostbite guidance
const COLD_INFO_F = 32;
const COLD_CAUTION_F = 15;
const COLD_WARNING_F = -1;   // frostbite within ~30 min
const COLD_DANGER_F = -19;   // frostbite within ~10 min
const EXTREME_COLD_TEMP_F = 0; // raw air temp at/below this is treated as danger regardless of wind

// Wind (mph) — sustained / gust
const WIND_CAUTION_SUSTAINED = 20;
const WIND_CAUTION_GUST = 30;
const WIND_WARNING_SUSTAINED = 30;
const WIND_WARNING_GUST = 45;

// Rain (inches per hour) + forecast lookahead
const RAIN_LIGHT_IN = 0.1;   // flag upcoming rain at/above this hourly amount
const RAIN_HEAVY_IN = 0.3;   // heavy rain (per hour)
const RAIN_LOOKAHEAD_HOURS = 6;

// ---- Public advisory shape --------------------------------------------------

export type AdvisorySeverity = 'info' | 'caution' | 'warning' | 'danger';
export type AdvisoryKind = 'heat' | 'cold' | 'wind' | 'rain' | 'ice' | 'lightning';

export interface Advisory {
  id: string;               // stable per kind (e.g. 'heat')
  kind: AdvisoryKind;
  severity: AdvisorySeverity;
  icon: string;             // material-icons name
  title: string;            // short label
  detail: string;           // guidance / specifics
}

export const SEVERITY_RANK: Record<AdvisorySeverity, number> = { info: 1, caution: 2, warning: 3, danger: 4 };

/** Structured lightning standdown state for the prominent banner. */
export interface LightningState {
  level: 'alarm' | 'watch';
  timer?: string;     // Perry all-clear countdown "MM:SS" (alarm only, when available)
  distance?: string;  // e.g. "0-10 mi" (Perry) or "5.2 mi" (WeatherBug)
  source: 'perry' | 'weatherbug';
}

// ---- WMO weather-code groups (Open-Meteo) -----------------------------------

const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]); // wet, non-freezing
const THUNDER_CODES = new Set([95, 96, 99]);
const FREEZING_CODES = new Set([56, 57, 66, 67]); // freezing drizzle / freezing rain → ice
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

function wmoShort(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 55) return 'Drizzle';
  if (code <= 57) return 'Freezing drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 67) return 'Freezing rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

// ---- Pure advisory calculators ----------------------------------------------

/** NWS Heat Index (Rothfusz regression) in °F. Below 80°F returns the Steadman simple value. */
export function heatIndexF(t: number, rh: number): number {
  const simple = 0.5 * (t + 61.0 + (t - 68.0) * 1.2 + rh * 0.094);
  if (simple < 80) return simple;
  let hi =
    -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh -
    6.83783e-3 * t * t - 5.481717e-2 * rh * rh + 1.22874e-3 * t * t * rh +
    8.5282e-4 * t * rh * rh - 1.99e-6 * t * t * rh * rh;
  if (rh < 13 && t >= 80 && t <= 112) {
    hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  } else if (rh > 85 && t >= 80 && t <= 87) {
    hi += ((rh - 85) / 10) * ((87 - t) / 5);
  }
  return hi;
}

/** NWS Wind Chill (2001) in °F. Valid for T ≤ 50°F and wind > 3 mph; otherwise returns T. */
export function windChillF(t: number, mph: number): number {
  if (t > 50 || mph <= 3) return t;
  const v = Math.pow(mph, 0.16);
  return 35.74 + 0.6215 * t - 35.75 * v + 0.4275 * t * v;
}

function heatAdvisory(c: WeatherForecast['current']): Advisory | null {
  const hi = Math.round(heatIndexF(c.temperature, c.humidity));
  if (hi < HEAT_CAUTION_F) return null;
  let severity: AdvisorySeverity, detail: string;
  if (hi >= HEAT_DANGER_F) {
    severity = 'danger';
    detail = 'Very high risk. Reschedule non-essential heavy work; buddy system; frequent monitoring.';
  } else if (hi >= HEAT_WARNING_F) {
    severity = 'warning';
    detail = 'High risk. Active rest breaks, water every 15 min, shade; acclimatize new workers.';
  } else {
    severity = 'caution';
    detail = 'Moderate risk. Encourage hydration; watch for fatigue and heat cramps.';
  }
  return { id: 'heat', kind: 'heat', severity, icon: 'device_thermostat', title: `Heat index ${hi}°F`, detail };
}

function coldAdvisory(c: WeatherForecast['current']): Advisory | null {
  const wc = Math.round(windChillF(c.temperature, c.windSpeed));
  const extreme = c.temperature <= EXTREME_COLD_TEMP_F;
  if (wc > COLD_INFO_F && !extreme) return null;
  let severity: AdvisorySeverity, detail: string;
  if (wc <= COLD_DANGER_F || extreme) {
    severity = 'danger';
    detail = 'Frostbite within ~10 min. Minimize outdoor work; warming breaks; buddy system.';
  } else if (wc <= COLD_WARNING_F) {
    severity = 'warning';
    detail = 'Frostbite possible within ~30 min. Limit exposure; scheduled warming breaks.';
  } else if (wc <= COLD_CAUTION_F) {
    severity = 'caution';
    detail = 'Wind-chill caution. Cover exposed skin; watch for numbness.';
  } else {
    severity = 'info';
    detail = 'Cold. Dress in layers; cover exposed skin.';
  }
  const feels = wc !== Math.round(c.temperature) ? ` (feels ${wc}°F)` : '';
  return { id: 'cold', kind: 'cold', severity, icon: 'ac_unit', title: `Cold ${Math.round(c.temperature)}°F${feels}`, detail };
}

function windAdvisory(c: WeatherForecast['current']): Advisory | null {
  const sustained = Math.round(c.windSpeed);
  const gust = Math.round(c.windGusts);
  let severity: AdvisorySeverity, detail: string;
  if (sustained >= WIND_WARNING_SUSTAINED || gust >= WIND_WARNING_GUST) {
    severity = 'warning';
    detail = 'Suspend crane, aerial-lift, roof, and elevated work; secure the area.';
  } else if (sustained >= WIND_CAUTION_SUSTAINED || gust >= WIND_CAUTION_GUST) {
    severity = 'caution';
    detail = 'Secure loose materials; use caution with aerial lifts, cranes, and elevated work.';
  } else {
    return null;
  }
  return { id: 'wind', kind: 'wind', severity, icon: 'air', title: `Wind ${sustained} mph, gusts ${gust}`, detail };
}

/** Index of the hourly entry covering "now" (local time), or -1. */
function currentHourIndex(times: string[]): number {
  const now = Date.now();
  let best = -1;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    if (isNaN(t)) continue;
    if (t <= now) best = i;         // last entry not in the future = the current hour bucket
    else break;
  }
  return best;
}

function shortTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h} ${ampm}`;
}

function rainAdvisory(f: WeatherForecast): Advisory | null {
  const c = f.current;
  const h = f.hourly;
  const idx = currentHourIndex(h.time);
  const nowPrecip = idx >= 0 ? (h.precipitation[idx] ?? 0) : 0;
  const rainingNow = RAIN_CODES.has(c.weatherCode) || nowPrecip > 0;

  if (rainingNow) {
    const thunder = THUNDER_CODES.has(c.weatherCode);
    const heavy = nowPrecip >= RAIN_HEAVY_IN;
    const severity: AdvisorySeverity = thunder || heavy ? 'warning' : 'caution';
    const title = thunder ? 'Thunderstorm' : heavy ? 'Heavy rain' : 'Rain';
    const detail = thunder || heavy
      ? 'Heavy rain/storms — suspend outdoor and elevated work; watch drainage.'
      : 'Wet conditions — slips and reduced visibility.';
    return { id: 'rain', kind: 'rain', severity, icon: 'water_drop', title, detail };
  }

  // Look ahead for incoming rain
  if (idx >= 0) {
    for (let i = idx + 1; i <= idx + RAIN_LOOKAHEAD_HOURS && i < h.time.length; i++) {
      const p = h.precipitation[i] ?? 0;
      const thunder = THUNDER_CODES.has(h.weatherCode[i]);
      if (p >= RAIN_LIGHT_IN || thunder) {
        const severity: AdvisorySeverity = thunder || p >= RAIN_HEAVY_IN ? 'caution' : 'info';
        const when = shortTime(h.time[i]);
        return {
          id: 'rain', kind: 'rain', severity, icon: 'water_drop',
          title: thunder ? `Storms expected ~${when}` : `Rain expected ~${when}`,
          detail: `${p > 0 ? p.toFixed(2) + ' in expected. ' : ''}Plan weather-sensitive work.`,
        };
      }
    }
  }
  return null;
}

function iceAdvisory(f: WeatherForecast): Advisory | null {
  const c = f.current;
  const h = f.hourly;
  const idx = currentHourIndex(h.time);
  const nowPrecip = idx >= 0 ? (h.precipitation[idx] ?? 0) : 0;

  // Freezing rain / drizzle now
  if (FREEZING_CODES.has(c.weatherCode)) {
    return {
      id: 'ice', kind: 'ice', severity: 'warning', icon: 'severe_cold', title: 'Freezing rain',
      detail: 'Ice accretion on surfaces and equipment. Icy walking/driving — use caution.',
    };
  }

  // Freezing precip incoming
  if (idx >= 0) {
    for (let i = idx + 1; i <= idx + RAIN_LOOKAHEAD_HOURS && i < h.time.length; i++) {
      if (FREEZING_CODES.has(h.weatherCode[i])) {
        return {
          id: 'ice', kind: 'ice', severity: 'warning', icon: 'severe_cold',
          title: `Freezing rain ~${shortTime(h.time[i])}`,
          detail: 'Freezing precipitation expected — prepare for ice on surfaces and roads.',
        };
      }
    }
  }

  // At/below freezing with wet conditions now or soon → ice/black-ice formation
  if (c.temperature <= 32) {
    let wetSoon = nowPrecip > 0;
    if (!wetSoon && idx >= 0) {
      for (let i = idx + 1; i <= idx + RAIN_LOOKAHEAD_HOURS && i < h.time.length; i++) {
        if ((h.precipitation[i] ?? 0) > 0) { wetSoon = true; break; }
      }
    }
    if (wetSoon) {
      return {
        id: 'ice', kind: 'ice', severity: 'caution', icon: 'severe_cold', title: 'Ice formation likely',
        detail: 'At/below freezing with moisture — possible ice/black-ice. Watch footing and roads.',
      };
    }
  }

  // Snow (informational)
  if (SNOW_CODES.has(c.weatherCode)) {
    return {
      id: 'ice', kind: 'ice', severity: 'info', icon: 'severe_cold', title: 'Snow',
      detail: 'Reduced traction and visibility.',
    };
  }
  return null;
}

/** Lightning standdown — reuses the existing 8/20 mi thresholds; prefers Perry text when available. */
function lightningAdvisory(bug: WeatherStatus | null, perry: PerryWeatherStatus | null): Advisory | null {
  // Perry reports a textual status directly
  if (perry && perry.status === 'available' && perry.lightningStatus) {
    const s = perry.lightningStatus;
    const timer = perry.lightningTimer ? ` — all-clear timer ${perry.lightningTimer}` : '';
    if (s === 'Lightning Alarm') {
      return { id: 'lightning', kind: 'lightning', severity: 'danger', icon: 'bolt', title: 'Lightning Alarm',
        detail: `Lightning within 8 mi — suspend outdoor work; seek shelter${timer}.` };
    }
    if (s === 'Lightning Watch') {
      return { id: 'lightning', kind: 'lightning', severity: 'caution', icon: 'bolt', title: 'Lightning Watch',
        detail: `Lightning 8–20 mi — monitor; prepare to suspend outdoor work${timer}.` };
    }
    // 'All Clear' → no advisory
    return null;
  }

  // WeatherBug distance fallback
  if (bug && bug.status === 'available' && bug.lightningDistance != null) {
    const d = parseFloat(bug.lightningDistance);
    const unit = bug.unit || 'mi';
    if (!isNaN(d)) {
      if (d <= 8) {
        return { id: 'lightning', kind: 'lightning', severity: 'danger', icon: 'bolt', title: 'Lightning Alarm',
          detail: `Strike ${d} ${unit} away — suspend outdoor work; seek shelter.` };
      }
      if (d <= 20) {
        return { id: 'lightning', kind: 'lightning', severity: 'caution', icon: 'bolt', title: 'Lightning Watch',
          detail: `Lightning ${d} ${unit} away — monitor; prepare to suspend outdoor work.` };
      }
    }
  }
  return null;
}

// ---- Demo / preview frames --------------------------------------------------

interface DemoFrame {
  forecast: WeatherForecast;
  lightning?: WeatherStatus | null;
  perry?: PerryWeatherStatus | null;
  ms?: number;
}

/** Build a synthetic "available" forecast from a partial `current` (empty hourly/daily is fine). */
function demoForecast(current: Partial<WeatherForecast['current']>): WeatherForecast {
  return {
    current: {
      temperature: 75, apparentTemperature: 75, humidity: 40,
      windSpeed: 5, windDirection: 0, windGusts: 8, weatherCode: 0,
      ...current,
    },
    hourly: { time: [], temperature: [], weatherCode: [], windSpeed: [], precipitation: [] },
    daily: { time: [], temperatureMax: [], temperatureMin: [], weatherCode: [], precipitationSum: [], windSpeedMax: [] },
    lastUpdate: 'demo', status: 'available',
  };
}

/** Scripted tour of every color state, fed through the real calculators. */
const DEMO_FRAMES: DemoFrame[] = [
  { forecast: demoForecast({ temperature: 75, weatherCode: 0 }) },                                   // GREEN — clear
  { forecast: demoForecast({ temperature: 90, humidity: 55, apparentTemperature: 97 }) },            // YELLOW — heat caution
  { forecast: demoForecast({ temperature: 96, humidity: 58 }) },                                     // RED — heat warning
  { forecast: demoForecast({ temperature: 100, humidity: 70 }) },                                    // RED — heat danger
  { forecast: demoForecast({ temperature: 22, windSpeed: 10 }) },                                    // YELLOW — cold caution
  { forecast: demoForecast({ temperature: -5, windSpeed: 20 }) },                                    // RED — extreme cold
  { forecast: demoForecast({ temperature: 60, windSpeed: 32, windGusts: 48 }) },                     // RED — high wind
  { forecast: demoForecast({ temperature: 60, weatherCode: 63 }) },                                  // YELLOW — rain
  { forecast: demoForecast({ temperature: 70, weatherCode: 95 }) },                                  // RED — thunderstorm
  { forecast: demoForecast({ temperature: 30, weatherCode: 67 }) },                                  // RED — freezing rain / ice
  { forecast: demoForecast({ temperature: 72 }), ms: 2600,                                           // YELLOW — lightning watch
    perry: { status: 'available', lightningStatus: 'Lightning Watch', lightningDistance: '10-20 mi' } },
  { forecast: demoForecast({ temperature: 72 }), ms: 5000,                                           // FLASHING RED — lightning standdown
    perry: { status: 'available', lightningStatus: 'Lightning Alarm', lightningDistance: '0-10 mi', lightningTimer: '28:21' } },
  { forecast: demoForecast({ temperature: 75, weatherCode: 0 }) },                                   // GREEN — back to clear
];

// ---- Service ----------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class AdvisoryService implements OnDestroy {
  private readonly forecast = signal<WeatherForecast | null>(null);
  private readonly lightning = signal<WeatherStatus | null>(null);
  private readonly perry = signal<PerryWeatherStatus | null>(null);
  private readonly unsubs: Array<() => void> = [];

  /** While a demo is running, live pushes are ignored so they don't clobber the scripted frames. */
  private demoActive = false;
  /** True while runDemo() is cycling — bind to disable the trigger UI. */
  readonly demoRunning = signal(false);

  /** Active advisories, most-severe first. */
  readonly advisories = computed<Advisory[]>(() => this.build());
  /** Highest active severity, or null when all-clear. */
  readonly maxSeverity = computed<AdvisorySeverity | null>(() => this.advisories()[0]?.severity ?? null);
  /** Current conditions snapshot for the always-present summary strip. */
  readonly current = computed(() => this.forecast()?.current ?? null);
  readonly conditionLabel = computed(() => {
    const c = this.forecast()?.current;
    return c ? wmoShort(c.weatherCode) : '';
  });
  /** Lightning standdown state (alarm/watch) for the prominent banner, or null when all-clear. */
  readonly lightningState = computed<LightningState | null>(() => {
    const p = this.perry();
    if (p && p.status === 'available' && p.lightningStatus) {
      if (p.lightningStatus === 'Lightning Alarm') {
        return { level: 'alarm', timer: p.lightningTimer || undefined, distance: p.lightningDistance || undefined, source: 'perry' };
      }
      if (p.lightningStatus === 'Lightning Watch') {
        return { level: 'watch', timer: p.lightningTimer || undefined, distance: p.lightningDistance || undefined, source: 'perry' };
      }
      return null; // All Clear
    }
    const b = this.lightning();
    if (b && b.status === 'available' && b.lightningDistance != null) {
      const d = parseFloat(b.lightningDistance);
      const unit = b.unit || 'mi';
      if (!isNaN(d)) {
        if (d <= 8) return { level: 'alarm', distance: `${d} ${unit}`, source: 'weatherbug' };
        if (d <= 20) return { level: 'watch', distance: `${d} ${unit}`, source: 'weatherbug' };
      }
    }
    return null;
  });

  constructor(private electron: ElectronService) {
    this.seed();
    this.unsubs.push(this.electron.onWeatherForecastChange(f => { if (!this.demoActive) this.forecast.set(f); }));
    this.unsubs.push(this.electron.onWeatherStatusChange(s => { if (!this.demoActive) this.lightning.set(s); }));
    this.unsubs.push(this.electron.onPerryStatusChange(s => { if (!this.demoActive) this.perry.set(s); }));
  }

  /**
   * Test/preview: cycle the header pill through every color state by feeding synthetic weather
   * through the REAL calculators, then restore the live values. Live pushes are suspended during
   * the run. Safe to trigger from a UI button.
   */
  async runDemo(): Promise<void> {
    if (this.demoActive) return;
    const savedF = this.forecast(), savedL = this.lightning(), savedP = this.perry();
    this.demoActive = true;
    this.demoRunning.set(true);
    const hold = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
    try {
      for (const frame of DEMO_FRAMES) {
        this.forecast.set(frame.forecast);
        this.lightning.set(frame.lightning ?? null);
        this.perry.set(frame.perry ?? null);
        await hold(frame.ms ?? 1300);
      }
    } finally {
      this.forecast.set(savedF);
      this.lightning.set(savedL);
      this.perry.set(savedP);
      this.demoActive = false;
      this.demoRunning.set(false);
    }
  }

  ngOnDestroy(): void {
    this.unsubs.forEach(u => { try { u(); } catch { /* ignore */ } });
  }

  private async seed(): Promise<void> {
    try {
      const [f, l, p] = await Promise.all([
        this.electron.getWeatherForecast(),
        this.electron.getWeatherStatus(),
        this.electron.getPerryStatus(),
      ]);
      if (f.success && f.data) this.forecast.set(f.data);
      if (l.success && l.data) this.lightning.set(l.data);
      if (p.success && p.data) this.perry.set(p.data);
    } catch { /* getters guard non-Electron; nothing to seed */ }
  }

  private build(): Advisory[] {
    const out: Advisory[] = [];
    const f = this.forecast();
    if (f && f.status === 'available' && f.current) {
      const c = f.current;
      const push = (a: Advisory | null) => { if (a) out.push(a); };
      push(heatAdvisory(c));
      push(coldAdvisory(c));
      push(windAdvisory(c));
      push(rainAdvisory(f));
      push(iceAdvisory(f));
    }
    const lightning = lightningAdvisory(this.lightning(), this.perry());
    if (lightning) out.push(lightning);

    return out.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  }
}
