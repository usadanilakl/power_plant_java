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
/** Re-verify the schedule.v2-discard signal periodically in case v2 gets rolled back to v1. */
const V2_RECHECK_COOLDOWN = 6 * 60 * 60_000;
/** Cooldown for the "backend reachable but empty" SharePoint fallback parse — see getPersonnel(). */
const EMPTY_FALLBACK_COOLDOWN = 60_000;
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
  /**
   * Ordinal position of each person within their group for this month (0-based, top-to-bottom).
   * The Excel sheet doesn't label positions explicitly, but rows are laid out top=lead, middle=CRO,
   * bottom=AO within each crew block — this ordinal is the SharePoint-parse path's stand-in for the
   * backend/ShiftDay path's posRank, so both monthOrder sources sit on the same small-integer,
   * position-rank-like basis (see convertShiftDaysToPersonnel / renderer computeDerived).
   */
  groupOrdinal: Map<string, number>;
}

export class PersonnelManager {
  private sharepoint: SharePointManager;
  private cachedPersonnel: PersonnelEntry[] | null = null;
  private cachedContacts: PersonnelContact[] | null = null;
  private cacheTime = 0;
  private contactsCacheTime = 0;
  private loading = false;

  // Coverage-eligibility cache — scoped to the current month (see getPersonnelStatus()) and cached
  // alongside the ShiftDay cache so repeated status calls within the TTL window don't re-hit the hub.
  private cachedCoverageEligibility: Record<string, number[]> | null = null;
  private coverageEligibilityCacheKey = '';
  private coverageEligibilityCacheTime = 0;
  private cachedCurrentUserId: number | null = null;
  private currentUserIdCacheTime = 0;

  // schedule.v2 discard detection — once a SharePoint push comes back with rowsWritten: 0 for a
  // non-empty payload, the v1 write stood down because schedule.v2 owns ShiftDay (see
  // ShiftDayService.importSchedule). Skip the background SharePoint round-trip until re-verified.
  private v2ActiveSuspected = false;
  private v2LastCheckedAt = 0;

  // Cooldown for the "backend reachable but empty" SharePoint fallback parse, so a burst of quick
  // retries (e.g. loadSchedule()'s backoff loop against a fresh install's still-empty H2) doesn't
  // each trigger a full xlsx download + parse + push.
  private lastEmptyFallbackAt = 0;

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
    try {
      // Option A: the local backend's ShiftDay is the source of truth, so try it first regardless of
      // SharePoint config. Only surface the "not configured" error when there's genuinely no data AND
      // SharePoint (the offline fallback) isn't set up either.
      const personnel = await this.getPersonnel();
      if (personnel.length === 0 && !this.sharepoint.isConfigured()) {
        return { status: 'error', error: 'SharePoint not configured', onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
      }
      const now = new Date();
      const hour = now.getHours();
      // Shift change at 05:00 and 17:00 CT (machines are on-site in CT)
      const isDayShift = hour >= 5 && hour < 17;
      const currentShiftCode: ShiftCode = isDayShift ? 'D' : 'N';
      const currentShiftLabel = isDayShift ? 'Day Shift' : 'Night Shift';

      const onShiftNow = personnel.filter(p => p.todayShift === currentShiftCode);

      // Coverage eligibility (off + qualified) per day — for the "can cover" markers. Best-effort.
      // Scoped to the currently-visible month (the widget/page render one month at a time, not the
      // whole year) and cached alongside the ShiftDay cache so repeated status calls within the TTL
      // window don't re-hit the hub.
      let coverageEligibility: Record<string, number[]> | undefined;
      try {
        const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const cacheKey = `${from}..${to}`;
        if (this.cachedCoverageEligibility && this.coverageEligibilityCacheKey === cacheKey
            && Date.now() - this.coverageEligibilityCacheTime < CACHE_TTL) {
          coverageEligibility = this.cachedCoverageEligibility;
        } else {
          const body: any = await backendGet(`/ng/schedule/coverage-eligibility?from=${from}&to=${to}`, 8000);
          coverageEligibility = (body?.responseData ?? body) as Record<string, number[]>;
          this.cachedCoverageEligibility = coverageEligibility;
          this.coverageEligibilityCacheKey = cacheKey;
          this.coverageEligibilityCacheTime = Date.now();
        }
      } catch { /* no coverage / backend down — markers simply won't show */ }

      // The signed-in OS user's id (cached) — lets the renderer route "my seat" vs "someone else's".
      // On a transient /api/auth/me failure KEEP the last known-good value (don't wipe it to null),
      // so the self-vs-PIN routing stays correct instead of falling back to "unknown" for 30 min.
      if (this.cachedCurrentUserId == null || Date.now() - this.currentUserIdCacheTime > CACHE_TTL) {
        const id = await this.getCurrentUserId();
        if (id != null) {
          this.cachedCurrentUserId = id;
          this.currentUserIdCacheTime = Date.now();
        }
      }

      return {
        status: 'available',
        lastUpdate: new Date(this.cacheTime).toISOString(),
        onShiftNow,
        allPersonnel: personnel,
        currentShiftLabel,
        coverageEligibility,
        currentUserId: this.cachedCurrentUserId ?? undefined,
      };
    } catch (err: any) {
      console.error('[Personnel] Error:', err.message);
      return { status: 'error', error: err.message, onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
    }
  }

  /**
   * Open coverage requests on a specific day, each with remaining open seats + discipline/position for
   * labelling. Each is also tagged `selfEligible`: whether the signed-in OS user (DesktopAutoAuth) is
   * off + qualified to cover it, so the renderer can show "Sign up (me)" only where it's valid while
   * still listing every need for the PIN ("someone else") path.
   */
  public async getCoverageForDay(date: string): Promise<any[]> {
    const q = `date=${encodeURIComponent(date)}`;
    const allBody: any = await backendGet(`/api/pwa/secured/coverage-signup/day?${q}`, 8000);
    const all: any[] = Array.isArray(allBody) ? allBody : (allBody?.responseData ?? allBody ?? []);
    // Which of these the OS user can personally cover (best-effort; empty if not a rostered operator).
    let mineIds = new Set<number>();
    try {
      const mineBody: any = await backendGet(`/api/pwa/secured/coverage-signup/day-eligible?${q}`, 8000);
      const mine: any[] = Array.isArray(mineBody) ? mineBody : (mineBody?.responseData ?? mineBody ?? []);
      mineIds = new Set(mine.map(m => m?.id).filter((id: any) => id != null));
    } catch { /* eligibility unavailable — leave "Sign up (me)" off; PIN path still works */ }
    return all
      .filter(o => (o?.openForDate ?? 0) > 0)
      .map(o => ({ ...o, selfEligible: o?.id != null && mineIds.has(o.id) }));
  }

  /**
   * Sign up for a coverage seat. Without a step-up token the signed-in OS user (DesktopAutoAuthFilter)
   * is attributed; with one, the signup is attributed to the PIN-verified operator via X-Sign-As-Token
   * (StepUpAuthFilter swaps the security context for that single request).
   */
  public async coverageSignup(coverageRequestId: number, date: string, signAsToken?: string): Promise<any> {
    const headers = signAsToken ? { 'X-Sign-As-Token': signAsToken } : undefined;
    return backendPost('/api/pwa/secured/coverage-signup',
      { coverageRequestId, date, via: 'ELECTRON' }, 10_000, headers);
  }

  /**
   * Coverage signups (any status) across a date range — feeds the month-grid overlay that
   * re-colours a person's cell to mark PENDING/APPROVED coverage (see CoverageSignupDto).
   */
  public async getCoverageSignups(from: string, to: string): Promise<any[]> {
    const q = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const body: any = await backendGet(`/api/pwa/secured/coverage-signup/signups?${q}`, 8000);
    return Array.isArray(body) ? body : (body?.responseData ?? body ?? []);
  }

  /**
   * Roster-wide coverage eligibility (date -> userIds off + qualified) for an explicit range — drives
   * the green ＋ marker. Scoped to the month the renderer is actually viewing (the cached blob on
   * PersonnelStatus only ever covers the current calendar month), so ＋ works on every month.
   */
  public async getCoverageEligibility(from: string, to: string): Promise<Record<string, number[]>> {
    const q = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const body: any = await backendGet(`/ng/schedule/coverage-eligibility?${q}`, 8000);
    return (body?.responseData ?? body ?? {}) as Record<string, number[]>;
  }

  /**
   * One-click sign-up: without a step-up token the signed-in OS user (DesktopAutoAuthFilter) is
   * signed up; with one, a DIFFERENT operator (who entered their initials+PIN) is signed up via the
   * X-Sign-As-Token swap. `shift` picks DAY/NIGHT explicitly when the person has both open (see
   * seat-count marker); omitted, the backend auto-picks the best need that person is off + qualified for.
   */
  public async quickSignUp(date: string, shift?: 'DAY' | 'NIGHT', signAsToken?: string): Promise<any> {
    let q = `date=${encodeURIComponent(date)}&via=ELECTRON`;
    if (shift) q += `&shift=${encodeURIComponent(shift)}`;
    const headers = signAsToken ? { 'X-Sign-As-Token': signAsToken } : undefined;
    return backendPost(`/api/pwa/secured/coverage-signup/quick?${q}`, undefined, 10_000, headers);
  }

  /**
   * Withdraw a not-yet-approved coverage sign-up. Without a step-up token this withdraws the
   * signed-in OS user's OWN sign-up; with one, a DIFFERENT operator's sign-up (PIN step-up gate —
   * the backend still enforces that the token's identity owns the signup and it isn't APPROVED yet).
   */
  public async withdrawSignup(signupId: number, signAsToken?: string): Promise<any> {
    const headers = signAsToken ? { 'X-Sign-As-Token': signAsToken } : undefined;
    return backendPost(`/api/pwa/secured/coverage-signup/${signupId}/withdraw`, undefined, 10_000, headers);
  }

  /**
   * Per-person, per-shift OPEN SEAT COUNTS for a date range — one row per (date, userId) with
   * day/night = number of open seats that person is off + qualified to cover on that shift (0 = none).
   * Drives the seat-count marker on the month grid (replaces the old plain ＋ "can cover" marker).
   */
  public async getEligibilityDetail(from: string, to: string): Promise<{ date: string; userId: number; day: number; night: number }[]> {
    const q = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const body: any = await backendGet(`/api/pwa/secured/coverage-signup/eligibility-detail?${q}`, 8000);
    return Array.isArray(body) ? body : (body?.responseData ?? body ?? []);
  }

  /** The signed-in OS user's id (DesktopAutoAuthFilter), so the renderer can tell "my ＋" (sign up
   *  directly) from "someone else's ＋" (require their PIN). Null if not resolvable. */
  public async getCurrentUserId(): Promise<number | null> {
    try {
      const body: any = await backendGet('/api/auth/me', 6000);
      const id = body?.id;
      return typeof id === 'number' ? id : (id != null ? Number(id) : null);
    } catch {
      return null;
    }
  }

  /** Exchange an operator's initials+PIN for a single-use step-up token so they can sign up here. */
  public async stepUpAuthorize(code: string): Promise<{ token: string; expiresAt?: string }> {
    return backendPost('/api/auth/step-up', { code }, 8000);
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
          // Keep ShiftDay fresh from SharePoint in the background — but only when v1 is actually the
          // owner. Under schedule.v2 the backend discards this push (ShiftDayService.importSchedule
          // reports rowsWritten: 0), so once pushToBackend() has confirmed that, skip the round-trip
          // (xlsx download + parse + POST) entirely. Re-verified periodically in case v2 rolls back.
          const dueForRecheck = Date.now() - this.v2LastCheckedAt > V2_RECHECK_COOLDOWN;
          if (!this.v2ActiveSuspected || dueForRecheck) {
            void this.refreshFromSharePoint();
          } else {
            console.log('[Personnel] Skipping SharePoint background refresh — schedule.v2 owns ShiftDay (push is discarded)');
          }
          return fromBackend;
        }
        console.log('[Personnel] Backend ShiftDay empty — falling back to the SharePoint parse');
      } catch (err: any) {
        console.warn('[Personnel] Backend ShiftDay unavailable (H2 down?) — SharePoint fallback:', err?.message ?? err);
      }

      // Fallback: parse SharePoint directly (backend/H2 unavailable, or no rows yet). Cooldown-gated
      // so a burst of quick retries (unreachable backend, or reachable-but-empty on a fresh install)
      // doesn't each trigger a full xlsx download + parse + push — only the first one in the window does.
      const now = Date.now();
      if (this.lastEmptyFallbackAt && now - this.lastEmptyFallbackAt < EMPTY_FALLBACK_COOLDOWN) {
        console.log('[Personnel] Skipping repeat SharePoint fallback parse (cooldown)');
        this.cachedPersonnel = this.cachedPersonnel || [];
        this.cacheTime = now;
        return this.cachedPersonnel;
      }
      this.lastEmptyFallbackAt = now;
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
    const byPerson = new Map<string, { name: string; group: string; userId?: number; position: string; schedule: { date: string; shift: ShiftCode }[] }>();
    const keyOf = (e: any) => (e && e.userId != null) ? 'u' + e.userId : 'n' + String(e?.name ?? '').toLowerCase().trim();
    const put = (key: string, name: string, group: string, userId: number | undefined, position: string, date: string, shift: ShiftCode) => {
      let p = byPerson.get(key);
      if (!p) { p = { name, group: group || '', userId, position: position || '', schedule: [] }; byPerson.set(key, p); }
      if (!p.group && group) p.group = group;
      if (p.userId == null && userId != null) p.userId = userId;
      if (!p.position && position) p.position = position;
      p.schedule.push({ date, shift });
    };
    const sorted = (days || []).filter(d => d && d.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));

    // Pass 1: real shift buckets → per-person rows.
    for (const d of sorted) {
      const date: string = d.date;
      (d.dayShift || []).forEach((e: any) => put(keyOf(e), e.name, e.group, e.userId, e.position, date, 'D'));
      (d.nightShift || []).forEach((e: any) => put(keyOf(e), e.name, e.group, e.userId, e.position, date, 'N'));
      (d.unscheduled || []).forEach((e: any) => put(keyOf(e), e.name, e.group, e.userId, e.position, date, 'U'));
      (d.pto || []).forEach((e: any) => put(keyOf(e), e.name, e.group, e.userId, e.position, date, 'P'));
      (d.training || []).forEach((e: any) => put(keyOf(e), e.name, e.group, e.userId, e.position, date, 'T'));
    }

    // Pass 2: overlay the On-Call Manager onto that manager's OWN row (they're day staff who are also
    // on call this week). Emitting a separate 'ocm:' person would collide with their real row in the
    // name-keyed renderer and hide their working schedule — so overlay instead, and only fall back to a
    // standalone OCM row when the manager isn't otherwise on the roster.
    for (const d of sorted) {
      if (!d.onCallManagerName) continue;
      const date: string = d.date;
      const id = d.onCallManagerUserId;
      const nm = String(d.onCallManagerName).toLowerCase().trim();
      let target = (id != null && byPerson.has('u' + id)) ? byPerson.get('u' + id) : undefined;
      if (!target) {
        for (const p of byPerson.values()) { if (p.name.toLowerCase().trim() === nm) { target = p; break; } }
      }
      if (target) {
        const cell = target.schedule.find(s => s.date === date);
        if (cell) cell.shift = 'OCM'; else target.schedule.push({ date, shift: 'OCM' });
      } else {
        put('ocm:' + nm, d.onCallManagerName, 'OCM', id, 'Manager', date, 'OCM');
      }
    }
    const posRank = (pos: string): number => {
      const p = (pos || '').toLowerCase();
      if (p.includes('lead')) return 0;
      if (p.includes('control room') || p === 'cro') return 1;
      if (p.includes('auxiliary') || p === 'ao') return 2;
      return 9;   // non-ops sort after operators
    };
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
      const monthOrder: Record<string, number> = {};
      for (const s of p.schedule) {
        const m = String(new Date(s.date + 'T12:00:00').getMonth());
        if (p.group) groupByMonth[m] = p.group;
        monthOrder[m] = posRank(p.position);   // Lead→CRO→AO within the group (non-ops after)
      }
      out.push({
        name: p.name,
        group: p.group,
        userId: p.userId,
        todayShift: (placed.get(todayIso) ?? '') as ShiftCode,
        schedule,
        groupByMonth,
        monthOrder,
      });
    }

    // Collapse duplicate people that share a display name (e.g. a stale row or a second user record).
    // The renderer keys grid rows by name, so two rows with one name fight over a single row and one
    // vanishes — merge them: keep a userId, fill blank shifts from the duplicate, union the month maps.
    const merged = new Map<string, PersonnelEntry>();
    for (const e of out) {
      const key = e.name.toLowerCase().trim();
      const ex = merged.get(key);
      if (!ex) { merged.set(key, e); continue; }
      if (ex.userId == null && e.userId != null) ex.userId = e.userId;
      const byDate = new Map(ex.schedule.map(s => [s.date, s]));
      for (const s of e.schedule) {
        const cur = byDate.get(s.date);
        if (!cur) { ex.schedule.push(s); byDate.set(s.date, s); }
        else if (!cur.shift && s.shift) cur.shift = s.shift;
      }
      if (!ex.todayShift && e.todayShift) ex.todayShift = e.todayShift;
      ex.groupByMonth = { ...(e.groupByMonth || {}), ...(ex.groupByMonth || {}) };
      ex.monthOrder = { ...(e.monthOrder || {}), ...(ex.monthOrder || {}) };
    }
    return Array.from(merged.values());
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
      const res: any = await backendPost('/ng/schedule/sync', { year, source: 'electron', persons });
      console.log(`[Personnel] Pushed ${persons.length} person schedules to backend`);
      // Under schedule.v2, ShiftDayService.importSchedule short-circuits and writes nothing — the
      // response reports rowsWritten: 0 even though we sent a non-empty payload. That's the signal
      // getPersonnel() uses to skip future background SharePoint round-trips (see there).
      const rowsWritten = res?.responseData?.rowsWritten;
      this.v2ActiveSuspected = persons.length > 0 && rowsWritten === 0;
      this.v2LastCheckedAt = Date.now();
    } catch (err: any) {
      console.warn('[Personnel] Backend schedule push failed:', err?.message ?? err);
    }
  }

  public async refresh(): Promise<PersonnelStatus> {
    this.cachedPersonnel = null;
    this.cacheTime = 0;
    this.cachedCoverageEligibility = null;
    this.coverageEligibilityCacheTime = 0;
    // Note: v2ActiveSuspected/lastEmptyFallbackAt are intentionally NOT reset here — refresh() is
    // called both by the user's Refresh button and by loadSchedule()'s retry loop, and clearing
    // them on every call would re-open the SharePoint-storm window this cache exists to close.
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
          const ord = mMap.groupOrdinal.get(name);
          if (ord !== undefined) monthOrder[String(mIdx)] = ord;
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

    // Group-relative ordinal (0-based, top-to-bottom within each crew block) — see MonthMaps.groupOrdinal.
    const groupOrdinal = new Map<string, number>();
    const counters = new Map<string, number>();
    for (const name of namesInOrder) {
      const grp = rowToGroup.get(nameToRow.get(name)!) || '';
      const c = counters.get(grp) ?? 0;
      groupOrdinal.set(name, c);
      counters.set(grp, c + 1);
    }

    return { nameToRow, rowToGroup, namesInOrder, personRows, groupOrdinal };
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
