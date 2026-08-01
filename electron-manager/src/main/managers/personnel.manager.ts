/**
 * PersonnelManager - Downloads and parses the OPS Schedule Excel from SharePoint.
 *
 * Excel structure (per month block):
 *   Row 0: Month name (merged across day columns)
 *   Row 1: Day-of-week headers (Wed, Thu, Fri, ...)
 *   Row 2: Day numbers (1, 2, 3, ...)
 *   Then personnel rows in pairs:
 *     - Row with name (col B) + shift codes across day columns
 *     - Second row (sometimes has override codes like P, U)
 *   Group labels (A, B, C, D, Relief, On Call Manager) appear in the group column,
 *   normalized to A/B/C/D/Rel/OCM. People rotate groups across months — each month's
 *   block has its own name->row layout, so shifts must be looked up per-month.
 *
 * Caches parsed data for 30 minutes.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { SharePointManager } from './sharepoint.manager';
import { backendGet, backendPost } from '../clients/backend-client';
import { getWorkingDir } from '../paths';
import { DEFAULT_PERSONNEL_CONFIG } from '../constants';
import type { PersonnelEntry, PersonnelStatus, PersonnelContact, ShiftCode, PersonnelConfig, PersonnelStatusMeta } from '../../shared/types';

function getSchedulePath(): string {
  const year = new Date().getFullYear();
  return `/sites/JG/External/60 - Operations/60.05 Ops schedule/${year}/OPS Schedule ${year}.xlsx`;
}
const CONTACTS_PATH = '/sites/JG/External/10 - Administration/PERSONNEL/EMERGENCY CONTACT LIST - EDITED 11_2024.xlsx';

const CACHE_TTL = 30 * 60_000;
/**
 * Shift codes recognised in the Ops Schedule Excel:
 *   D = Day, N = Night, U = Unscheduled, P = PTO, T = Training, OCM = On Call Manager,
 *   L = Leads Meeting (05:00-06:00 window), OFF = Explicit off (blank cell also means off,
 *   but the schedule sometimes writes "Off" for clarity — the parser was silently discarding it).
 */
const VALID_SHIFTS: Set<string> = new Set(['D', 'N', 'U', 'P', 'T', 'OCM', 'L', 'OFF']);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function normalizeGroupLabel(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[A-D]$/i.test(s)) return s.toUpperCase();
  if (/^rel(ief)?$/i.test(s)) return 'Rel';
  if (/^on\s*call\s*manager$/i.test(s) || /^ocm$/i.test(s)) return 'OCM';
  return null;
}

/**
 * Find a group label in a row. First tries the expected primaryCol (handles
 * A/B/C/D/Rel/OCM). If empty there, falls back to scanning the whole row but
 * ONLY for the multi-word labels "Relief" and "On Call Manager" — these never
 * appear in day-shift cells (unlike single-char "D" or short "OCM" which
 * collide with shift codes). Some months have the Relief/OCM header cell
 * drift to a column offset that doesn't line up with groupCol.
 */
function findGroupLabelInRow(row: any[], primaryCol: number): string | null {
  if (primaryCol >= 0) {
    const direct = normalizeGroupLabel(String(row[primaryCol] || ''));
    if (direct) return direct;
  }
  for (let c = 0; c < row.length; c++) {
    if (c === primaryCol) continue;
    const s = String(row[c] || '').trim();
    if (/^relief$/i.test(s)) return 'Rel';
    if (/^on\s*call\s*manager$/i.test(s)) return 'OCM';
  }
  return null;
}

interface MonthMaps {
  nameToRow: Map<string, number>;
  rowToGroup: Map<number, string>;
  namesInOrder: string[];
  /** All row indices that hold a person. Used to tell an override row
   *  (followed-by no person) from the next person's row. */
  personRows: Set<number>;
}

export class PersonnelManager {
  private sharepoint: SharePointManager;
  private cachedPersonnel: PersonnelEntry[] | null = null;
  private cachedContacts: PersonnelContact[] | null = null;
  private cacheTime = 0;
  private contactsCacheTime = 0;
  private loading = false;

  // ── Auto-refresh + config ──────────────────────────────────────────────
  private config: PersonnelConfig;
  private configPath: string;
  private autoRefreshTimer: NodeJS.Timeout | null = null;
  private isAutoRefreshing = false;
  private lastRefreshError: string | undefined;
  private triggerServer: http.Server | null = null;

  constructor(sharepoint: SharePointManager) {
    this.sharepoint = sharepoint;
    this.configPath = path.join(getWorkingDir(), 'personnel-config.json');
    this.config = this.loadConfig();

    if (this.config.autoRefresh) {
      this.startAutoRefreshTimer();
    }

    // Start the HTTP listener that Spring Boot POSTs to when the hub SSE fires
    // schedule.refresh.requested. This lets hub kick a refresh even if this
    // client's own auto-refresh is off, so at least one online desktop covers
    // the plant when the designated refresher is down.
    this.startTriggerServer();
  }

  // ─── Configuration ────────────────────────────────────────────────────

  public loadConfig(): PersonnelConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return { ...DEFAULT_PERSONNEL_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[Personnel] Failed to load personnel-config.json, using defaults:', err);
    }
    return { ...DEFAULT_PERSONNEL_CONFIG };
  }

  public getConfig(): PersonnelConfig {
    return { ...this.config };
  }

  public saveConfig(config: PersonnelConfig): void {
    // Sanitize inputs — reject nonsense values before writing.
    const clean: PersonnelConfig = {
      autoRefresh: !!config.autoRefresh,
      intervalMinutes: Math.max(5, Math.min(1440, Math.floor(Number(config.intervalMinutes) || 30))),
      refreshTriggerPort: Math.max(1024, Math.min(65535, Math.floor(Number(config.refreshTriggerPort) || 8083))),
    };

    const portChanged = clean.refreshTriggerPort !== this.config.refreshTriggerPort;
    this.config = clean;

    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.configPath, JSON.stringify(clean, null, 2), 'utf-8');
    console.log('[Personnel] Config saved:', clean);

    // Restart timer + trigger server to reflect new settings.
    this.stopAutoRefreshTimer();
    if (clean.autoRefresh) this.startAutoRefreshTimer();
    if (portChanged) this.restartTriggerServer();
  }

  public getMeta(): PersonnelStatusMeta {
    return {
      autoRefreshEnabled: this.config.autoRefresh,
      refreshIntervalMinutes: this.config.intervalMinutes,
      isRefreshing: this.isAutoRefreshing,
      lastRefreshError: this.lastRefreshError,
    };
  }

  // ─── Auto-refresh timer ────────────────────────────────────────────────

  private startAutoRefreshTimer(): void {
    this.stopAutoRefreshTimer();
    const ms = this.config.intervalMinutes * 60 * 1000;
    console.log(`[Personnel] Auto-refresh started: every ${this.config.intervalMinutes} min`);
    this.autoRefreshTimer = setInterval(() => { void this.tickAutoRefresh('timer'); }, ms);
  }

  private stopAutoRefreshTimer(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
      console.log('[Personnel] Auto-refresh stopped');
    }
  }

  /** Run a refresh cycle; guards against overlap and records the last error. */
  private async tickAutoRefresh(reason: 'timer' | 'trigger'): Promise<void> {
    if (this.isAutoRefreshing) {
      console.log(`[Personnel] Skipping ${reason} refresh — already in progress`);
      return;
    }
    this.isAutoRefreshing = true;
    try {
      // Freshness gate: if the local H2 already has schedule data younger than the configured
      // interval, another desktop already refreshed and CRDT sync brought it here — skip the
      // SharePoint round-trip. Manual "Refresh" (which calls PersonnelManager.refresh() directly)
      // bypasses this gate because the user is explicitly asking for a pull.
      if (await this.localIsFresh(reason)) {
        this.lastRefreshError = undefined;
        return;
      }
      console.log(`[Personnel] Auto-refresh tick (${reason})`);
      await this.refresh();
      this.lastRefreshError = undefined;
    } catch (err: any) {
      this.lastRefreshError = err?.message ?? String(err);
      console.warn(`[Personnel] Auto-refresh (${reason}) failed:`, this.lastRefreshError);
    } finally {
      this.isAutoRefreshing = false;
    }
  }

  /**
   * Ask local Spring Boot when SharePoint was last verified by ANY desktop (heartbeat) or when
   * the data actually last changed (dateModified). Prefers heartbeat because it fires even when
   * the schedule is stable — otherwise every desktop would still pull every interval whenever
   * the roster is stable, defeating the whole point of coordination.
   *
   * Fail-open: if the backend is down or the endpoint errors, treat as stale so we still attempt
   * to refresh (better to over-refresh than to silently go stale).
   */
  private async localIsFresh(reason: 'timer' | 'trigger'): Promise<boolean> {
    try {
      const res: any = await backendGet('/ng/schedule/freshness', 5000);
      const data = res?.data ?? {};
      // Prefer the coordination heartbeat; fall back to the min of (heartbeat, dataAge).
      const age = typeof data.ageSeconds === 'number' ? data.ageSeconds : null;
      if (age == null) return false;

      // For hub-triggered refreshes the hub already believes we're stale; still guard against
      // races (another desktop refreshed between hub's decision and the SSE arriving here) by
      // using a small buffer — anything younger than 5 min counts as fresh for triggers.
      const thresholdSec = reason === 'trigger'
        ? 5 * 60
        : this.config.intervalMinutes * 60;

      if (age < thresholdSec) {
        const label = typeof data.heartbeatAgeSeconds === 'number' && data.heartbeatAgeSeconds === age
          ? `heartbeat ${age}s old`
          : `data ${age}s old`;
        console.log(`[Personnel] ${reason} refresh skipped — ${label} (< ${thresholdSec}s threshold, source=${data.heartbeatSource ?? '?'})`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[Personnel] Freshness check failed (fail-open, will refresh):', err?.message ?? err);
      return false;
    }
  }

  // ─── Hub-initiated trigger HTTP listener ───────────────────────────────
  //
  // Small localhost HTTP server so desktop Spring Boot's SSE receiver can push
  // a refresh request into Electron's main process. See
  // SchedulePresenceCoordinator (hub) and ServerSseClient (desktop) for the
  // upstream chain. Only listens on 127.0.0.1 — never exposed to LAN.

  private startTriggerServer(): void {
    if (this.triggerServer) return;
    const port = this.config.refreshTriggerPort;
    this.triggerServer = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/trigger/personnel-refresh') {
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ accepted: true }));
        void this.tickAutoRefresh('trigger');
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
    });
    this.triggerServer.on('error', (err: any) => {
      console.warn(`[Personnel] Trigger server error on port ${port}:`, err.message);
      this.triggerServer = null;
    });
    this.triggerServer.listen(port, '127.0.0.1', () => {
      console.log(`[Personnel] Trigger listener on 127.0.0.1:${port}/trigger/personnel-refresh`);
    });
  }

  private restartTriggerServer(): void {
    if (this.triggerServer) {
      try { this.triggerServer.close(); } catch { /* ignore */ }
      this.triggerServer = null;
    }
    this.startTriggerServer();
  }

  public stop(): void {
    this.stopAutoRefreshTimer();
    if (this.triggerServer) {
      try { this.triggerServer.close(); } catch { /* ignore */ }
      this.triggerServer = null;
    }
  }

  public async getPersonnelStatus(): Promise<PersonnelStatus> {
    if (!this.sharepoint.isConfigured()) {
      return { status: 'error', error: 'SharePoint not configured', onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
    }

    try {
      const personnel = await this.getPersonnel();
      const now = new Date();
      const hour = now.getHours();
      // Shift change at 05:00 and 17:00 CT (machines are on-site in CT)
      const isDayShift = hour >= 5 && hour < 17;
      const currentShiftCode: ShiftCode = isDayShift ? 'D' : 'N';
      const currentShiftLabel = isDayShift ? 'Day Shift' : 'Night Shift';

      const onShiftNow = personnel.filter(p => p.todayShift === currentShiftCode);

      return {
        status: 'available',
        lastUpdate: new Date(this.cacheTime).toISOString(),
        onShiftNow,
        allPersonnel: personnel,
        currentShiftLabel,
      };
    } catch (err: any) {
      console.error('[Personnel] Error:', err.message);
      return { status: 'error', error: err.message, onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
    }
  }

  public async getContacts(): Promise<PersonnelContact[]> {
    if (this.cachedContacts && Date.now() - this.contactsCacheTime < CACHE_TTL) {
      return this.cachedContacts;
    }
    try {
      console.log(`[Personnel] Downloading contacts from SharePoint: ${CONTACTS_PATH}`);
      const buffer = await this.sharepoint.downloadFile(CONTACTS_PATH);
      console.log(`[Personnel] Contacts downloaded: ${buffer.length} bytes`);
      this.cachedContacts = this.parseContacts(buffer);
      this.contactsCacheTime = Date.now();
      console.log(`[Personnel] Parsed ${this.cachedContacts.length} contacts`);
      return this.cachedContacts;
    } catch (err: any) {
      console.error('[Personnel] Failed to load contacts:', err.message);
      return this.cachedContacts || [];
    }
  }

  private async getPersonnel(): Promise<PersonnelEntry[]> {
    if (this.cachedPersonnel && Date.now() - this.cacheTime < CACHE_TTL) {
      return this.cachedPersonnel;
    }
    if (this.loading) return this.cachedPersonnel || [];

    this.loading = true;
    try {
      // Source of truth = the local backend's ShiftDay. When schedule.v2.enabled the materialiser
      // owns those rows; when it's off, the v1 SharePoint push owns them. Reading ShiftDay makes the
      // Electron widget follow the same flag automatically (no v2 awareness needed here). Fast + local.
      try {
        const year = new Date().getFullYear();
        const body: any = await backendGet(`/ng/schedule/year/${year}`, 8000);
        const days: any[] = Array.isArray(body) ? body : (body?.responseData ?? []);
        const fromBackend = this.convertShiftDaysToPersonnel(days);
        if (fromBackend.length) {
          this.cachedPersonnel = fromBackend;
          this.cacheTime = Date.now();
          console.log(`[Personnel] Loaded ${fromBackend.length} entries from backend ShiftDay`);
          // Keep ShiftDay fresh from SharePoint in the background (matters only when v2 is off; the
          // backend discards the push when v2 is on). Non-blocking — display already came from ShiftDay.
          void this.refreshFromSharePoint();
          return fromBackend;
        }
        console.log('[Personnel] Backend ShiftDay empty — falling back to the SharePoint parse');
      } catch (err: any) {
        console.warn('[Personnel] Backend ShiftDay unavailable (H2 down?) — SharePoint fallback:', err?.message ?? err);
      }

      // Fallback: parse SharePoint directly (backend/H2 unavailable, or no rows yet).
      const parsed = await this.refreshFromSharePoint();
      this.cachedPersonnel = (parsed && parsed.length) ? parsed : (this.cachedPersonnel || []);
      this.cacheTime = Date.now();
      return this.cachedPersonnel;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Download + parse the SharePoint OPS Schedule and mirror it into the backend ShiftDay. Returns the
   * parsed entries (the offline fallback + the v1 source when schedule.v2 is off), or null if
   * SharePoint is unavailable.
   */
  private async refreshFromSharePoint(): Promise<PersonnelEntry[] | null> {
    try {
      const schedulePath = getSchedulePath();
      const buffer = await this.sharepoint.downloadFile(schedulePath);
      const parsed = this.parseSchedule(buffer);
      void this.pushToBackend(parsed);
      return parsed;
    } catch (err: any) {
      console.warn('[Personnel] SharePoint schedule parse failed:', err?.message ?? err);
      return null;
    }
  }

  /**
   * Reshape backend ShiftDay rows (one per day, people grouped by shift bucket) into per-person
   * {@link PersonnelEntry} rows for the widget — the inverse of {@link parseSchedule}.
   */
  private convertShiftDaysToPersonnel(days: any[]): PersonnelEntry[] {
    const byPerson = new Map<string, { name: string; group: string; schedule: { date: string; shift: ShiftCode }[] }>();
    const keyOf = (e: any) => (e && e.userId != null) ? 'u' + e.userId : 'n' + String(e?.name ?? '').toLowerCase().trim();
    const put = (key: string, name: string, group: string, date: string, shift: ShiftCode) => {
      let p = byPerson.get(key);
      if (!p) { p = { name, group: group || '', schedule: [] }; byPerson.set(key, p); }
      if (!p.group && group) p.group = group;
      p.schedule.push({ date, shift });
    };
    const sorted = (days || []).filter(d => d && d.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    for (const d of sorted) {
      const date: string = d.date;
      (d.dayShift || []).forEach((e: any) => put(keyOf(e), e.name, e.group, date, 'D'));
      (d.nightShift || []).forEach((e: any) => put(keyOf(e), e.name, e.group, date, 'N'));
      (d.unscheduled || []).forEach((e: any) => put(keyOf(e), e.name, e.group, date, 'U'));
      (d.pto || []).forEach((e: any) => put(keyOf(e), e.name, e.group, date, 'P'));
      (d.training || []).forEach((e: any) => put(keyOf(e), e.name, e.group, date, 'T'));
      if (d.onCallManagerName) {
        put('ocm:' + String(d.onCallManagerName).toLowerCase(), d.onCallManagerName, 'OCM', date, 'OCM');
      }
    }
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const allDates = sorted.map(d => d.date as string);
    const out: PersonnelEntry[] = [];
    for (const p of byPerson.values()) {
      const placed = new Map(p.schedule.map(s => [s.date, s.shift]));
      // The renderer derives the month's day columns from allPersonnel[0].schedule, so EVERY person
      // needs an entry for EVERY materialised date (blank shift = off) — a sparse schedule blanks the grid.
      const schedule = allDates.map(date => ({ date, shift: (placed.get(date) ?? '') as ShiftCode }));
      const groupByMonth: Record<string, string> = {};
      for (const s of p.schedule) {
        if (p.group) groupByMonth[String(new Date(s.date + 'T12:00:00').getMonth())] = p.group;
      }
      out.push({
        name: p.name,
        group: p.group,
        todayShift: (placed.get(todayIso) ?? '') as ShiftCode,
        schedule,
        groupByMonth,
      });
    }
    return out;
  }

  /**
   * Push the parsed schedule to the Spring backend's POST /ng/schedule/sync, which pivots the
   * person-rows into per-day ShiftDay rows (resolving names to Users) and replicates via sync.
   * The PersonnelEntry shape already matches the backend's ScheduleImportRequest.
   */
  private async pushToBackend(personnel: PersonnelEntry[]): Promise<void> {
    try {
      const year = new Date().getFullYear();
      const persons = personnel.map(p => ({
        name: p.name,
        group: p.group,
        schedule: (p.schedule || []).map(s => ({ date: s.date, shift: s.shift })),
      }));
      await backendPost('/ng/schedule/sync', { year, source: 'electron', persons });
      console.log(`[Personnel] Pushed ${persons.length} person schedules to backend`);
    } catch (err: any) {
      console.warn('[Personnel] Backend schedule push failed:', err?.message ?? err);
    }
  }

  public async refresh(): Promise<PersonnelStatus> {
    this.cachedPersonnel = null;
    this.cacheTime = 0;
    return this.getPersonnelStatus();
  }

  // ── Schedule Parsing ────────────────────────────────────────────────────

  private parseSchedule(buffer: Buffer): PersonnelEntry[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    console.log(`[Personnel] Workbook sheets: ${workbook.SheetNames.join(', ')}`);

    // Pick the correct sheet based on whether the current year is a leap year
    const year = new Date().getFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const targetSheetName = isLeapYear ? 'Leap' : 'Non Leap';
    const sheet = workbook.Sheets[targetSheetName] || workbook.Sheets[workbook.SheetNames[0]];
    console.log(`[Personnel] Using sheet: "${targetSheetName}" (${year}, leap=${isLeapYear})`);
    if (!sheet) throw new Error('Schedule workbook has no sheets');

    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`[Personnel] Sheet has ${data.length} rows, ${data[0]?.length || 0} cols`);
    if (data.length < 5) throw new Error('Schedule sheet has too few rows');

    const now = new Date();
    const hour = now.getHours();
    // Between midnight and 5 AM, the active shift started yesterday at 17:00
    const shiftDate = (hour < 5) ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
    const currentMonth = shiftDate.getMonth();
    const currentDay = shiftDate.getDate();

    const monthRange = this.findMonthColumns(data, currentMonth);
    if (!monthRange) {
      console.warn(`[Personnel] Could not find month ${MONTH_NAMES[currentMonth]} in schedule`);
      return [];
    }

    const todayCol = this.findDayColumn(data[monthRange.dayNumberRow], monthRange.startCol, monthRange.endCol, currentDay);

    // Resolve the column ranges for ALL 12 months so the page can browse any month
    type MonthRange = NonNullable<ReturnType<typeof this.findMonthColumns>>;
    const monthRanges = new Map<number, MonthRange>();
    monthRanges.set(currentMonth, monthRange);
    for (let m = 0; m < 12; m++) {
      if (m === currentMonth) continue;
      const r = this.findMonthColumns(data, m);
      if (r) monthRanges.set(m, r);
    }

    // Build schedule days for the entire calendar year (Jan 1 → Dec 31).
    // Skip months whose layout couldn't be resolved (instead of bailing out).
    const scheduleDays: { col: number; date: string; month: number }[] = [];
    const startDate = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = Math.round((endOfYear.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    for (let d = 0; d < totalDays; d++) {
      const targetDate = new Date(year, 0, 1 + d);
      const targetMonth = targetDate.getMonth();
      const range = monthRanges.get(targetMonth);
      if (!range) continue;

      const col = this.findDayColumn(data[range.dayNumberRow], range.startCol, range.endCol, targetDate.getDate());
      if (col >= 0) {
        const y = targetDate.getFullYear();
        const mm = String(targetMonth + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        scheduleDays.push({ col, date: `${y}-${mm}-${dd}`, month: targetMonth });
      }
    }

    // For each month present (current + all schedule months), build a name->row + row->group map.
    // Names rotate between groups across months, so each month has its own row layout.
    const monthMaps = new Map<number, MonthMaps>();
    for (const [mIdx, range] of monthRanges.entries()) {
      const m = this.buildMonthMaps(data, range);
      monthMaps.set(mIdx, m);

      // Diagnostic: log the group breakdown for each month so we can spot months where
      // a known group (e.g. Rel) wasn't detected and people were misbucketed.
      const groupCounts: Record<string, number> = {};
      for (const grp of m.rowToGroup.values()) {
        groupCounts[grp || '(empty)'] = (groupCounts[grp || '(empty)'] || 0) + 1;
      }
      console.log(`[Personnel] ${MONTH_NAMES[mIdx]} group breakdown:`, groupCounts);
    }

    const currentMaps = monthMaps.get(currentMonth);
    if (!currentMaps) return [];

    // Iterate canonical roster from current month (preserves current-month order)
    const entries: PersonnelEntry[] = [];
    for (const name of currentMaps.namesInOrder) {
      const currentRow = currentMaps.nameToRow.get(name)!;
      const currentGroup = currentMaps.rowToGroup.get(currentRow) || '';

      const todayShift = this.getBestShift(data, currentRow, todayCol, currentMaps.personRows);

      // For each scheduled day, look up the person's row in THAT day's month
      const schedule = scheduleDays.map(sd => {
        const mMap = monthMaps.get(sd.month);
        const useOtherMonth = !!mMap && sd.month !== currentMonth;
        const row = useOtherMonth
          ? (mMap!.nameToRow.get(name) ?? currentRow)
          : currentRow;
        const personRows = useOtherMonth ? mMap!.personRows : currentMaps.personRows;
        return { date: sd.date, shift: this.getBestShift(data, row, sd.col, personRows) };
      });

      // Track group per month for visual indication of rotation,
      // and per-month row index so the page can preserve spreadsheet order
      // (top=lead, middle=CRO, bottom=AO) for each month independently.
      const groupByMonth: Record<string, string> = {};
      const monthOrder: Record<string, number> = {};
      for (const [mIdx, mMap] of monthMaps.entries()) {
        const mRow = mMap.nameToRow.get(name);
        if (mRow !== undefined) {
          const grp = mMap.rowToGroup.get(mRow);
          if (grp) groupByMonth[String(mIdx)] = grp;
          const idx = mMap.namesInOrder.indexOf(name);
          if (idx >= 0) monthOrder[String(mIdx)] = idx;
        }
      }

      entries.push({ name, group: currentGroup, todayShift, schedule, groupByMonth, monthOrder });
    }

    return entries;
  }

  /**
   * Build name→row and row→group maps for a single month's data block.
   * Crew members (A/B/C/D/Rel) occupy 2 rows (main shift + override row);
   * On Call Managers occupy a single row each. We do NOT skip a fixed number
   * of rows per person — instead every row with a name is treated as a person,
   * and override rows (no name) are skipped naturally. `personRows` records
   * which rows are people so the shift reader can tell an override row from
   * the next person's row.
   */
  private buildMonthMaps(
    data: any[][],
    range: { groupCol: number; nameCol: number; dataStartRow: number }
  ): MonthMaps {
    const nameToRow = new Map<string, number>();
    const rowToGroup = new Map<number, string>();
    const namesInOrder: string[] = [];
    const personRows = new Set<number>();
    let currentGroup = '';

    for (let r = range.dataStartRow; r < data.length; r++) {
      const normalized = findGroupLabelInRow(data[r], range.groupCol);
      if (normalized) currentGroup = normalized;

      const nameCell = String(data[r][range.nameCol] || '').trim();
      if (!nameCell) continue;
      if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|January|February|March|April|May|June|July|August|September|October|November|December|Outage)/i.test(nameCell)) continue;
      if (/^\d+$/.test(nameCell)) continue;

      nameToRow.set(nameCell, r);
      rowToGroup.set(r, currentGroup);
      namesInOrder.push(nameCell);
      personRows.add(r);
    }

    return { nameToRow, rowToGroup, namesInOrder, personRows };
  }

  /**
   * Get the effective shift for a person at a given column.
   * Checks the main row first, then the row below — but only if that row is an
   * actual override row, not the next person's row. `personRows` distinguishes
   * the two: crew members have an override row below them, On Call Managers do
   * not (the row below is the next OCM person).
   */
  private getBestShift(data: any[][], row: number, col: number, personRows: Set<number>): ShiftCode {
    if (col < 0) return '';
    const main = String(data[row]?.[col] || '').trim().toUpperCase();

    // The row below is an override row only when it isn't itself a person row.
    if (!personRows.has(row + 1)) {
      const override = String(data[row + 1]?.[col] || '').trim().toUpperCase();
      if (VALID_SHIFTS.has(override)) return override as ShiftCode;
    }
    if (VALID_SHIFTS.has(main)) return main as ShiftCode;
    return '';
  }

  private findMonthColumns(data: any[][], month: number): {
    startCol: number; endCol: number; nameCol: number; groupCol: number;
    dayNumberRow: number; dataStartRow: number;
  } | null {
    const monthName = MONTH_NAMES[month];

    // Scan first ~5 rows looking for the month name
    for (let r = 0; r < Math.min(data.length, 5); r++) {
      for (let c = 0; c < data[r].length; c++) {
        const cell = String(data[r][c] || '').trim();
        if (cell.toLowerCase() === monthName.toLowerCase()) {
          // Structure:
          //   Row r:   month name (merged)
          //   Row r+1: day-of-week headers
          //   Row r+2: day numbers (1, 2, 3, ...)
          //   Row r+3+: person data

          const dayNumberRow = r + 2;
          if (dayNumberRow >= data.length) return null;

          // Find first and last day columns — start scanning near the month header column
          let firstDayCol = -1;
          let lastDayCol = -1;

          // Start from the month header column (c) — day numbers are within this month's block
          // April has 30 days, months have 28-31 days. Stop when day numbers reset to 1.
          for (let dc = c; dc < data[dayNumberRow].length; dc++) {
            const val = Number(data[dayNumberRow][dc]);
            if (!isNaN(val) && val >= 1 && val <= 31) {
              if (firstDayCol < 0) {
                firstDayCol = dc;
              } else if (val === 1 && lastDayCol >= 0) {
                // Day numbers reset to 1 — we've entered the next month
                break;
              }
              lastDayCol = dc;
            }
          }

          if (firstDayCol < 0) return null;

          // Group column and name column are to the left of the day columns
          // From the screenshot: group is 2 cols before first day, name is 1 col before
          // But this varies — find them by looking at the data rows
          let groupCol = firstDayCol - 2;
          let nameCol = firstDayCol - 1;
          if (groupCol < 0) groupCol = 0;
          if (nameCol < 0) nameCol = 0;

          // Verify by checking if the expected name column has text in data rows
          // Look at a few rows below dayNumberRow to confirm
          let nameFound = false;
          for (let testR = dayNumberRow + 1; testR < Math.min(dayNumberRow + 10, data.length); testR++) {
            const testName = String(data[testR][nameCol] || '').trim();
            if (testName && !/^\d+$/.test(testName) && !VALID_SHIFTS.has(testName.toUpperCase())) {
              nameFound = true;
              break;
            }
          }

          // If name wasn't found at nameCol, try scanning columns left of firstDayCol
          if (!nameFound) {
            for (let nc = firstDayCol - 1; nc >= Math.max(0, firstDayCol - 5); nc--) {
              for (let testR = dayNumberRow + 1; testR < Math.min(dayNumberRow + 10, data.length); testR++) {
                const testName = String(data[testR][nc] || '').trim();
                if (testName && testName.length > 1 && !/^\d+$/.test(testName) && !VALID_SHIFTS.has(testName.toUpperCase())) {
                  nameCol = nc;
                  groupCol = nc > 0 ? nc - 1 : 0;
                  nameFound = true;
                  break;
                }
              }
              if (nameFound) break;
            }
          }


          return {
            startCol: firstDayCol,
            endCol: lastDayCol,
            nameCol,
            groupCol,
            dayNumberRow,
            dataStartRow: dayNumberRow + 1,
          };
        }
      }
    }
    return null;
  }

  private findDayColumn(dayRow: any[], startCol: number, endCol: number, targetDay: number): number {
    for (let c = startCol; c <= endCol; c++) {
      const val = Number(dayRow[c]);
      if (val === targetDay) return c;
    }
    return -1;
  }

  // ── Contacts Parsing ────────────────────────────────────────────────────

  private parseContacts(buffer: Buffer): PersonnelContact[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return [];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    // Column headers may contain newlines (e.g., "Primary Phone\nNumber")
    // Normalize keys by replacing newlines with spaces
    const normalized = rows.map(row => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        clean[k.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()] = v;
      }
      return clean;
    });

    return normalized
      .filter(row => row['Employee'])
      .map(row => ({
        name: String(row['Employee'] || '').trim(),
        title: String(row['Title'] || '').trim(),
        phone: String(row['Primary Phone Number'] || '').trim(),
        secondaryPhone: String(row['Secondary Number'] || '').trim(),
        emergencyContact: String(row['Emergency Contact'] || '').trim(),
        emergencyPhone: String(row['Emergency Contact Phone'] || '').trim(),
        emergencyRelation: String(row["Contact's Relation"] || '').trim(),
      }))
      .filter(c => c.name);
  }
}
