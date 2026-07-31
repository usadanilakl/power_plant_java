import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, from, Observable, of, switchMap } from 'rxjs';
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
  source?: string;
  lastSyncedAt?: string;
}

export interface ShiftEntry {
  name: string;
  group?: string;            // A / B / C / D / Rel / OCM
  userId?: number;
  matchConfidence?: number;
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
}

/** Result of POST /coverage-signup — the signup, PENDING until a manager approves. */
export interface CoverageSignupResult {
  id?: number;
  coverageRequestId?: number;
  date?: string;
  shift?: string;
  status?: string;
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

  /** Try hub first; on any network/5xx failure, fall back to Supabase mirror. */
  getScheduleToday(): Observable<ShiftDay | null> {
    return this.http.get<ShiftDay | null>(`${this.base}/schedule/today`).pipe(
      catchError(() => from(this.getScheduleTodayFromSupabase())),
    );
  }

  getScheduleRange(fromDate: string, toDate: string): Observable<ShiftDay[]> {
    return this.http.get<ShiftDay[]>(`${this.base}/schedule/range?from=${fromDate}&to=${toDate}`).pipe(
      catchError(() => from(this.getScheduleRangeFromSupabase(fromDate, toDate))),
    );
  }

  /** Full calendar year of ShiftDay rows — for the year-at-a-glance view. Falls back to Supabase
   *  full-year read when the hub is unreachable. */
  getScheduleYear(year: number): Observable<ShiftDay[]> {
    return this.http.get<ShiftDay[]>(`${this.base}/schedule/year/${year}`).pipe(
      catchError(() => from(this.getScheduleYearFromSupabase(year))),
    );
  }

  private async getScheduleYearFromSupabase(year: number): Promise<ShiftDay[]> {
    return this.getScheduleRangeFromSupabase(`${year}-01-01`, `${year}-12-31`);
  }

  getOnShiftNow(): Observable<ShiftEntry[]> {
    return this.http.get<ShiftEntry[]>(`${this.base}/schedule/on-shift-now`).pipe(
      catchError(() => from(this.getOnShiftNowFromSupabase())),
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

  signUpForCoverage(coverageRequestId: number, date: string): Observable<CoverageSignupResult> {
    return this.http.post<CoverageSignupResult>(
      `${this.base}/coverage-signup`, { coverageRequestId, date, via: 'PWA' });
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
    const hour = new Date().getHours();
    const isDay = hour >= 5 && hour < 17;      // matches hub's PwaScheduleController.onShiftNow
    return isDay ? (today.dayShift ?? []) : (today.nightShift ?? []);
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
