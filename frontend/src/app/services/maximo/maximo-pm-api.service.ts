import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import {
  PmAssignRequest,
  PmPendingAssignment,
  RecurrenceCadence,
  RecurringPm,
  ShiftDay,
  ShiftPreference
} from '../../models/maximo/pm.models';

@Injectable({ providedIn: 'root' })
export class MaximoPmApiService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/maximo/pm`;
  private scheduleBase = `${environment.baseApiUrl}/ng/schedule`;

  // ── Catalog ─────────────────────────────────────────────────────────────
  getCatalog(): Observable<RecurringPm[]> {
    return this.http.get<SpringApiResponse<RecurringPm[]>>(`${this.base}/catalog`)
      .pipe(map(r => r.responseData ?? []));
  }

  refreshCatalog(): Observable<Record<string, number>> {
    return this.http.post<SpringApiResponse<Record<string, number>>>(`${this.base}/catalog/refresh`, {})
      .pipe(map(r => r.responseData ?? {}));
  }

  classify(id: number, shift: ShiftPreference, cadence: RecurrenceCadence | null,
           dayOfWeek: number | null): Observable<RecurringPm> {
    return this.http.put<SpringApiResponse<RecurringPm>>(
      `${this.base}/catalog/${id}`, { shift, cadence, dayOfWeek })
      .pipe(map(r => r.responseData));
  }

  // ── Assignments ─────────────────────────────────────────────────────────
  getPending(): Observable<PmPendingAssignment[]> {
    return this.http.get<SpringApiResponse<PmPendingAssignment[]>>(`${this.base}/pending-assignments`)
      .pipe(map(r => r.responseData ?? []));
  }

  assign(req: PmAssignRequest): Observable<{ approved: number; errors: { href: string; error: string }[] }> {
    return this.http.post<SpringApiResponse<{ approved: number; errors: { href: string; error: string }[] }>>(
      `${this.base}/assign`, req).pipe(map(r => r.responseData));
  }

  // ── Schedule (ShiftDay) ─────────────────────────────────────────────────
  getScheduleRange(from: string, to: string): Observable<ShiftDay[]> {
    const p = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SpringApiResponse<ShiftDay[]>>(`${this.scheduleBase}/range`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  /** Roster names in the range that did NOT resolve to a User — candidates for a `scheduleName` alias. */
  getUnresolved(from: string, to: string): Observable<string[]> {
    const p = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SpringApiResponse<string[]>>(`${this.scheduleBase}/unresolved`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }
}
