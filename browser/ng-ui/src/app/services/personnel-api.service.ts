import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, from, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PwaChatService } from './pwa-chat.service';

/**
 * Wire shape returned by {@code GET /api/pwa/secured/schedule/today}, {@code .../range},
 * and each element of the {@code allPersonnel} array. Mirrors the {@code ShiftDayDto}
 * on the hub — flat with shift entries grouped by category.
 */
export interface ShiftDay {
  id?: number;
  date: string;              // ISO yyyy-MM-dd
  year: number;
  dayShift?: ShiftEntry[];
  nightShift?: ShiftEntry[];
  unscheduled?: ShiftEntry[];
  pto?: ShiftEntry[];
  training?: ShiftEntry[];
  onCallManagerName?: string;
  onCallManagerUserId?: number;
  eventFlags?: { eventType?: string; title?: string; color?: string; appliesToShift?: string }[];
  source?: string;
  lastSyncedAt?: string;
}

export interface ShiftEntry {
  name: string;
  group?: string;            // A / B / C / D / Rel / OCM
  position?: string;         // Lead / Control Room Operator / Auxiliary Operator (ops); blank for others
  userId?: number;
  matchConfidence?: number;
  code?: string;             // raw shift code the bucket can't express (e.g. "L" Leads Meeting in unscheduled)
}

/** Per-day open-seat counts — the coverage chip data. GET /coverage-signup/open. */
export interface CoverageSeatSummary {
  date: string;
  dayRequired: number;
  dayOpen: number;
  nightRequired: number;
  nightOpen: number;
}

/** An open coverage request on a specific day — the sign-up target. GET /coverage-signup/day. */
export interface CoverageOpening {
  id: number;
  shift: string;              // DAY | NIGHT
  reason?: string;            // PTO_COVERAGE | OUTAGE | MANUAL
  status?: string;
  requiredCount?: number;
  approvedCount?: number;
  date?: string;
  openForDate?: number;       // seats still open on this date
  discipline?: string;        // OPS | MECHANIC | IC | MANAGER
  position?: string;          // LEAD | CRO | AO (OPS only) — labels the card
}

/** Result of POST /coverage-signup — the signup, PENDING until a manager approves. */
export interface CoverageSignupResult {
  id?: number;
  coverageRequestId?: number;
  date?: string;
  shift?: string;
  status?: string;
}

/** Per-person, per-shift OPEN-SEAT count. GET /coverage-signup/eligibility-detail — one row per
 *  (userId, date) that has ANY open seat; day/night = seats this person is off + qualified to
 *  cover on that shift (0 = none). Feeds the month-grid seat-count markers (replaces the old
 *  roster-wide boolean ＋ eligibility map). */
export interface CoverageEligibilityDetailRow {
  date: string;               // ISO yyyy-MM-dd
  userId: number;
  day: number;
  night: number;
}

/** Wire shape for GET /coverage-signup/signups — one row per signup, every status, across a
 *  date range. Feeds the month-grid coverage overlay (PENDING/APPROVED render as colored shift
 *  letters on the person's cell). */
export interface CoverageSignup {
  id: number;
  coverageRequestId: number;
  userId: number;
  userName: string;
  date: string;               // ISO yyyy-MM-dd
  shift: 'DAY' | 'NIGHT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  signedUpVia?: string;
  approvedByName?: string;
  approvedAt?: string;
}

/** Wire shape from {@code /api/pwa/secured/contacts} — flat, PWA-friendly. */
export interface PersonnelContact {
  id: number;
  name: string;
  title?: string;
  phone?: string;
  secondaryPhone?: string;
  company?: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
}

@Injectable({ providedIn: 'root' })
export class PersonnelApiService {
  private http = inject(HttpClient);
  private chat = inject(PwaChatService);       // reused for its Supabase client (schedule mirror is read-only)
  private base = `${environment.serverUrl}/api/pwa/secured`;

  /** True while the most recent read fell back to the Supabase mirror (hub unreachable). Set by
   *  each read's catchError branch, cleared on the next successful hub read — drives the "Offline
   *  — showing mirror data" banner so the page never silently renders stale/blank data. */
  usedFallback = signal(false);

  /** Fallback state specific to the LAST getScheduleToday() call. The shared usedFallback above is
   *  written by every read method, so a concurrent getOnShiftNow() success could flip it between a
   *  failed today-read and the moment the caller inspects it; this dedicated signal (only
   *  getScheduleToday writes it) makes the "don't overwrite a cached day with a null fallback" guard
   *  race-free. */
  todayUsedFallback = signal(false);

  /** Try hub first; on any network/5xx failure, fall back to Supabase mirror. */
  getScheduleToday(): Observable<ShiftDay | null> {
    return this.http.get<ShiftDay | null>(`${this.base}/schedule/today`).pipe(
      tap(() => { this.usedFallback.set(false); this.todayUsedFallback.set(false); }),
      catchError(() => {
        this.usedFallback.set(true); this.todayUsedFallback.set(true);
        return from(this.getScheduleTodayFromSupabase());
      }),
    );
  }

  getScheduleRange(fromDate: string, toDate: string): Observable<ShiftDay[]> {
    return this.http.get<ShiftDay[]>(`${this.base}/schedule/range?from=${fromDate}&to=${toDate}`).pipe(
      tap(() => this.usedFallback.set(false)),
      catchError(() => { this.usedFallback.set(true); return from(this.getScheduleRangeFromSupabase(fromDate, toDate)); }),
    );
  }

  /** Full calendar year of ShiftDay rows — for the year-at-a-glance view. Falls back to Supabase
   *  full-year read when the hub is unreachable. */
  getScheduleYear(year: number): Observable<ShiftDay[]> {
    return this.http.get<ShiftDay[]>(`${this.base}/schedule/year/${year}`).pipe(
      tap(() => this.usedFallback.set(false)),
      catchError(() => { this.usedFallback.set(true); return from(this.getScheduleYearFromSupabase(year)); }),
    );
  }

  private async getScheduleYearFromSupabase(year: number): Promise<ShiftDay[]> {
    return this.getScheduleRangeFromSupabase(`${year}-01-01`, `${year}-12-31`);
  }

  getOnShiftNow(): Observable<ShiftEntry[]> {
    return this.http.get<ShiftEntry[]>(`${this.base}/schedule/on-shift-now`).pipe(
      tap(() => this.usedFallback.set(false)),
      catchError(() => { this.usedFallback.set(true); return from(this.getOnShiftNowFromSupabase()); }),
    );
  }

  // ─── Coverage signup (hub-only, live — no Supabase fallback) ─────────
  // Open seats + per-day detail feed the "help cover a shift" section; the POST signs the
  // authenticated user up for one seat (PENDING until a manager approves). Gated PLANT/ADMIN/KIOSK.

  getOpenCoverage(fromDate: string, toDate: string): Observable<CoverageSeatSummary[]> {
    return this.http.get<CoverageSeatSummary[]>(
      `${this.base}/coverage-signup/open?from=${fromDate}&to=${toDate}`);
  }

  getCoverageForDay(date: string): Observable<CoverageOpening[]> {
    return this.http.get<CoverageOpening[]>(`${this.base}/coverage-signup/day?date=${date}`);
  }

  /** Open needs on a day the SIGNED-IN operator can actually pick up (off + qualified by the cover-up
   *  hierarchy) — the self-service list, filtered + labelled so they only see seats they can fill. */
  getMyCoverageForDay(date: string): Observable<CoverageOpening[]> {
    return this.http.get<CoverageOpening[]>(`${this.base}/coverage-signup/day-eligible?date=${date}`);
  }

  /** Dates the signed-in operator can pick up (off that day + qualified by the cover-up hierarchy). */
  getMyEligibleCoverage(fromDate: string, toDate: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/coverage-signup/my-eligible?from=${fromDate}&to=${toDate}`);
  }

  /** Roster-wide eligibility: date -> user ids off + qualified. Drives per-person "can pick up" markers. */
  getCoverageEligibility(fromDate: string, toDate: string): Observable<Record<string, number[]>> {
    return this.http.get<Record<string, number[]>>(
      `${this.base}/coverage-signup/eligibility?from=${fromDate}&to=${toDate}`);
  }

  /** Per-person, per-shift open-seat COUNTS (not just a boolean) — one row per (userId, date)
   *  with any open seat. Feeds the month-grid seat-count markers. */
  getEligibilityDetail(fromDate: string, toDate: string): Observable<CoverageEligibilityDetailRow[]> {
    return this.http.get<CoverageEligibilityDetailRow[]>(
      `${this.base}/coverage-signup/eligibility-detail?from=${fromDate}&to=${toDate}`);
  }

  signUpForCoverage(coverageRequestId: number, date: string): Observable<CoverageSignupResult> {
    return this.http.post<CoverageSignupResult>(
      `${this.base}/coverage-signup`, { coverageRequestId, date, via: 'PWA' });
  }

  /** All coverage signups (every status) across a date range — feeds the month-grid overlay that
   *  colors PENDING/APPROVED coverage onto a person's cell. */
  getCoverageSignups(fromDate: string, toDate: string): Observable<CoverageSignup[]> {
    return this.http.get<CoverageSignup[]>(
      `${this.base}/coverage-signup/signups?from=${fromDate}&to=${toDate}`);
  }

  /** One-click sign-up: server auto-picks the best open need the signed-in user can cover on
   *  that date when `shift` is omitted; pass 'DAY'/'NIGHT' to pick a specific shift (used by the
   *  seat-count marker's chooser when both shifts are open). Resolves to the PENDING signup DTO;
   *  the caller reloads signups + eligibility so the cell flips from the open-seats marker to the
   *  amber PENDING letter. */
  quickSignUp(date: string, shift?: 'DAY' | 'NIGHT'): Observable<CoverageSignupResult> {
    let url = `${this.base}/coverage-signup/quick?date=${date}&via=PWA`;
    if (shift) url += `&shift=${shift}`;
    return this.http.post<CoverageSignupResult>(url, {});
  }

  /** Withdraw the CURRENT user's own not-yet-approved (PENDING) sign-up. */
  withdrawSignup(id: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/coverage-signup/${id}/withdraw`, {});
  }

  // ─── Supabase fallback reads ─────────────────────────────────────────
  // Reused when the hub is unreachable. Table is populated by hub-side sync
  // (see ShiftDayService.mirrorToSupabase + migration 20260727120000_plant_schedule.sql).

  private async getScheduleTodayFromSupabase(): Promise<ShiftDay | null> {
    const client = await this.chat.ensureReady();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await client
      .from('plant_schedule_day')
      .select('*')
      .eq('shift_date', today)
      .maybeSingle();
    if (error || !data) return null;
    return this.mapSupabaseRow(data);
  }

  private async getScheduleRangeFromSupabase(fromDate: string, toDate: string): Promise<ShiftDay[]> {
    const client = await this.chat.ensureReady();
    const { data, error } = await client
      .from('plant_schedule_day')
      .select('*')
      .gte('shift_date', fromDate)
      .lte('shift_date', toDate)
      .order('shift_date', { ascending: true });
    if (error || !data) return [];
    return data.map(row => this.mapSupabaseRow(row));
  }

  private async getOnShiftNowFromSupabase(): Promise<ShiftEntry[]> {
    const today = await this.getScheduleTodayFromSupabase();
    if (!today) return [];
    const hour = this.plantLocalHour();
    const isDay = hour >= 5 && hour < 17;      // matches hub's PwaScheduleController.onShiftNow
    return isDay ? (today.dayShift ?? []) : (today.nightShift ?? []);
  }

  /** Current hour-of-day (0-23) in the PLANT's local timezone (America/Chicago) — NOT the
   *  device's timezone. A phone carried off-plant-tz (or just set to a different tz) must still
   *  bucket "on shift now" by the plant's actual day/night boundary, not wherever the phone thinks
   *  it is. */
  private plantLocalHour(): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', hour: 'numeric', hour12: false,
    }).formatToParts(new Date());
    const raw = parts.find(p => p.type === 'hour')?.value;
    const hour = raw != null ? parseInt(raw, 10) : new Date().getHours();
    return hour === 24 ? 0 : hour; // some engines format midnight as "24" with hour12:false
  }

  private mapSupabaseRow(row: any): ShiftDay {
    return {
      date: row.shift_date,
      year: row.shift_year,
      dayShift: row.day_shift_json ?? [],
      nightShift: row.night_shift_json ?? [],
      unscheduled: row.unscheduled_json ?? [],
      pto: row.pto_json ?? [],
      training: row.training_json ?? [],
      onCallManagerName: row.on_call_manager_name,
      onCallManagerUserId: row.on_call_manager_user_id,
      eventFlags: row.event_flags_json ?? [],
      source: row.source,
      lastSyncedAt: row.last_synced_at,
    };
  }

  getContacts(): Observable<PersonnelContact[]> {
    return this.http.get<PersonnelContact[]>(`${this.base}/contacts`);
  }

  getEmergencyContacts(): Observable<PersonnelContact[]> {
    return this.http.get<PersonnelContact[]>(`${this.base}/contacts/emergency`);
  }

  /**
   * Fetch this user's calendar-app subscription URL (contains a signed 1-year token so third-party
   * calendar apps can poll the .ics feed without Authorization headers). Backend endpoint is
   * idempotent — repeat calls return the same URL.
   */
  getIcalUrl(): Observable<{ url: string; subscribeUrl: string; instructions?: string }> {
    return this.http.get<{ url: string; subscribeUrl: string; instructions?: string }>(
      `${this.base}/schedule/ical/url`);
  }
}
