import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

export interface PatternCell {
  dayIndex: number;
  role: string;   // LEAD | AO | RELIEF
  shift: string;  // D | N | O | R
}

export interface CrewPattern {
  id?: number;
  name: string;
  color?: string;
  patternLengthDays: number;
  cells: PatternCell[];
  isActive?: boolean;
}

export interface CrewAssignment {
  id?: number;
  userId?: number;
  userName?: string;
  crewId?: number;
  crewName?: string;
  role: string;              // LEAD | AO | RELIEF
  startDate?: string;        // ISO yyyy-MM-dd
  endDate?: string;
  patternOffsetDays?: number;
  isActive?: boolean;
}

export interface ScheduleEvent {
  id?: number;
  eventType: string;         // HOLIDAY | MEETING | PAY_PERIOD_START | OUTAGE | TRAINING_MANDATORY | LEADS_MEETING
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string;
  color?: string;
  appliesToShift?: string;   // DAY | NIGHT | BOTH
}

export interface AssignableUser {
  id: number;
  name: string;
}

/**
 * Client for the schedule v2 admin CRUD (`/ng/admin/schedule-v2/*`). Admin-gated server-side; the
 * route is also behind adminGuard. Every mutation re-materialises server-side (no-op when the
 * schedule.v2.enabled flag is off).
 */
@Injectable({ providedIn: 'root' })
export class ScheduleV2ApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/schedule-v2`;

  // Patterns
  listPatterns(): Observable<SpringApiResponse<CrewPattern[]>> {
    return this.http.get<SpringApiResponse<CrewPattern[]>>(`${this.base}/patterns`);
  }
  savePattern(p: CrewPattern): Observable<SpringApiResponse<CrewPattern>> {
    return p.id
      ? this.http.put<SpringApiResponse<CrewPattern>>(`${this.base}/patterns/${p.id}`, p)
      : this.http.post<SpringApiResponse<CrewPattern>>(`${this.base}/patterns`, p);
  }
  deletePattern(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/patterns/${id}`);
  }

  // Assignments
  listAssignments(crewId?: number): Observable<SpringApiResponse<CrewAssignment[]>> {
    let params = new HttpParams();
    if (crewId != null) params = params.set('crewId', String(crewId));
    return this.http.get<SpringApiResponse<CrewAssignment[]>>(`${this.base}/assignments`, { params });
  }
  saveAssignment(a: CrewAssignment): Observable<SpringApiResponse<CrewAssignment>> {
    return a.id
      ? this.http.put<SpringApiResponse<CrewAssignment>>(`${this.base}/assignments/${a.id}`, a)
      : this.http.post<SpringApiResponse<CrewAssignment>>(`${this.base}/assignments`, a);
  }
  deleteAssignment(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/assignments/${id}`);
  }

  // Events
  listEvents(from?: string, to?: string): Observable<SpringApiResponse<ScheduleEvent[]>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<SpringApiResponse<ScheduleEvent[]>>(`${this.base}/events`, { params });
  }
  saveEvent(e: ScheduleEvent): Observable<SpringApiResponse<ScheduleEvent>> {
    return e.id
      ? this.http.put<SpringApiResponse<ScheduleEvent>>(`${this.base}/events/${e.id}`, e)
      : this.http.post<SpringApiResponse<ScheduleEvent>>(`${this.base}/events`, e);
  }
  deleteEvent(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/events/${id}`);
  }

  // Misc
  assignableUsers(): Observable<SpringApiResponse<AssignableUser[]>> {
    return this.http.get<SpringApiResponse<AssignableUser[]>>(`${this.base}/assignable-users`);
  }
  status(): Observable<SpringApiResponse<{ active: boolean }>> {
    return this.http.get<SpringApiResponse<{ active: boolean }>>(`${this.base}/status`);
  }
  materialize(from: string, to: string): Observable<SpringApiResponse<{ rowsWritten: number }>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.post<SpringApiResponse<{ rowsWritten: number }>>(`${this.base}/materialize`, {}, { params });
  }
}
