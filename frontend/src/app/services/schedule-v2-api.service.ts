import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

export interface SchedulePosition {
  id?: number;
  name: string;
  abbreviation?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface RotationCell {
  dayIndex: number;
  shift: string;   // D | N | O
}

export interface CrewRotation {
  id?: number;
  name: string;
  color?: string;
  patternLengthDays: number;
  anchorDate?: string;    // date that = dayIndex 0 (rotation start); phases the whole schedule
  cells: RotationCell[];
  isActive?: boolean;
}

export interface Crew {
  id?: number;
  name: string;
  rotationId?: number;
  rotationName?: string;
  offsetDays?: number;
  color?: string;
  isActive?: boolean;
}

export interface CrewAssignment {
  id?: number;
  userId?: number;
  userName?: string;
  crewId?: number;
  crewName?: string;
  position?: string;
  assignmentType?: string;   // ROTATING | FIXED | RELIEF
  fixedShift?: string;       // D | N (FIXED only)
  fixedDaysOfWeek?: string;  // CSV MON,TUE,… (FIXED only; empty = every day)
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface ScheduleEvent {
  id?: number;
  eventType: string;
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string;
  color?: string;
  appliesToShift?: string;
}

export interface AssignableUser { id: number; name: string; }

export interface OnCallRotation {
  id?: number;
  name?: string;
  daysPerTurn?: number;
  anchorDate?: string;
  memberUserIds?: number[];
  memberNames?: string[];
  isActive?: boolean;
}

export interface ReliefRotation {
  id?: number;
  name?: string;
  position?: string;            // placed position label (Lead / Auxiliary Operator)
  periodMonths?: number;        // months per relief turn (3 = quarterly)
  anchorDate?: string;
  lineOrder?: number[];         // succession order (user ids)
  lineNames?: string[];         // read-only display
  initialSlots?: { [slot: string]: number };  // REL/A/B/C/D -> user id at anchor
  reliefDaysOfWeek?: string;
  isActive?: boolean;
}

export interface CoverageRequest {
  id?: number;
  startDate?: string;
  endDate?: string;
  shift: string;          // DAY | NIGHT
  discipline?: string;    // OPS | MECHANIC | IC | MANAGER
  position?: string;      // LEAD | CRO | AO (OPS only)
  requiredCount?: number;
  reason?: string;
  status?: string;
  approvedCount?: number;
  ptoRequestId?: number;
  date?: string;
  openForDate?: number;
}

export interface CoverageSignup {
  id?: number;
  coverageRequestId?: number;
  userId?: number;
  userName?: string;
  date?: string;
  shift?: string;
  status?: string;
  signedUpVia?: string;
  approvedByUserId?: number;
  approvedByName?: string;
  approvedAt?: string;
}

/** Per-person, per-shift OPEN-SEAT count for a day — from the coverage eligibility-detail endpoint.
 *  day/night = number of open seats this person is off + qualified to cover that shift (0 = none). */
export interface EligibilityDetail {
  date?: string;
  userId?: number;
  day?: number;
  night?: number;
}

export interface ScheduleDayOverride {
  id?: number;
  date?: string;
  userId?: number;
  userName?: string;
  shift?: string;          // D | N | OCM | P | T | L | OFF
  reason?: string;
}

/** A temporary per-crew shift pin for an outage window (overrides the rotation). */
export interface CrewShiftOverride {
  id?: number;
  label?: string;       // outage / campaign name (groups the per-crew rows)
  startDate?: string;
  endDate?: string;
  crewId?: number;
  crewName?: string;
  shift?: string;       // D | N | OFF
  isActive?: boolean;
}

export interface PtoRequest {
  id?: number;
  userId?: number;
  userName?: string;
  rawName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;            // PENDING | APPROVED | REJECTED | PENDING_MANUAL_REVIEW
  submittedVia?: string;      // EMAIL | APP
  sourceRequestId?: string;
  emailMessageId?: string;
  coverageEmailSentAt?: string;
}

export interface ShiftEntryView {
  name?: string;
  group?: string;
  position?: string;
  userId?: number;
}

export interface ShiftDayView {
  date?: string;
  dayShift?: ShiftEntryView[];
  nightShift?: ShiftEntryView[];
  unscheduled?: ShiftEntryView[];
  pto?: ShiftEntryView[];
  training?: ShiftEntryView[];
  onCallManagerName?: string;
  eventFlags?: { eventType?: string; title?: string; color?: string; appliesToShift?: string }[];
}

/** Client for the schedule v2 admin CRUD (`/ng/admin/schedule-v2/*`). Admin-gated. */
@Injectable({ providedIn: 'root' })
export class ScheduleV2ApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/schedule-v2`;

  // Positions
  listPositions(): Observable<SpringApiResponse<SchedulePosition[]>> {
    return this.http.get<SpringApiResponse<SchedulePosition[]>>(`${this.base}/positions`);
  }
  savePosition(p: SchedulePosition): Observable<SpringApiResponse<SchedulePosition>> {
    return p.id
      ? this.http.put<SpringApiResponse<SchedulePosition>>(`${this.base}/positions/${p.id}`, p)
      : this.http.post<SpringApiResponse<SchedulePosition>>(`${this.base}/positions`, p);
  }
  deletePosition(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/positions/${id}`);
  }

  // Rotations
  listRotations(): Observable<SpringApiResponse<CrewRotation[]>> {
    return this.http.get<SpringApiResponse<CrewRotation[]>>(`${this.base}/rotations`);
  }
  saveRotation(r: CrewRotation): Observable<SpringApiResponse<CrewRotation>> {
    return r.id
      ? this.http.put<SpringApiResponse<CrewRotation>>(`${this.base}/rotations/${r.id}`, r)
      : this.http.post<SpringApiResponse<CrewRotation>>(`${this.base}/rotations`, r);
  }
  deleteRotation(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/rotations/${id}`);
  }

  // Crews
  listCrews(): Observable<SpringApiResponse<Crew[]>> {
    return this.http.get<SpringApiResponse<Crew[]>>(`${this.base}/crews`);
  }
  saveCrew(c: Crew): Observable<SpringApiResponse<Crew>> {
    return c.id
      ? this.http.put<SpringApiResponse<Crew>>(`${this.base}/crews/${c.id}`, c)
      : this.http.post<SpringApiResponse<Crew>>(`${this.base}/crews`, c);
  }
  deleteCrew(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/crews/${id}`);
  }

  // Staffing
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

  // Day overrides (per-day manual adjustments)
  listOverrides(from: string, to: string): Observable<SpringApiResponse<ScheduleDayOverride[]>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SpringApiResponse<ScheduleDayOverride[]>>(`${this.base}/overrides`, { params });
  }
  saveOverride(o: ScheduleDayOverride): Observable<SpringApiResponse<ScheduleDayOverride>> {
    return this.http.post<SpringApiResponse<ScheduleDayOverride>>(`${this.base}/overrides`, o);
  }
  deleteOverride(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/overrides/${id}`);
  }

  // Crew shift overrides (outage / campaign pins)
  listCrewShiftOverrides(from?: string, to?: string): Observable<SpringApiResponse<CrewShiftOverride[]>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<SpringApiResponse<CrewShiftOverride[]>>(`${this.base}/crew-shift-overrides`, { params });
  }
  saveCrewShiftOverride(o: CrewShiftOverride): Observable<SpringApiResponse<CrewShiftOverride>> {
    return this.http.post<SpringApiResponse<CrewShiftOverride>>(`${this.base}/crew-shift-overrides`, o);
  }
  deleteCrewShiftOverride(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/crew-shift-overrides/${id}`);
  }

  // On-call rotation
  listOnCall(): Observable<SpringApiResponse<OnCallRotation[]>> {
    return this.http.get<SpringApiResponse<OnCallRotation[]>>(`${this.base}/on-call`);
  }
  saveOnCall(r: OnCallRotation): Observable<SpringApiResponse<OnCallRotation>> {
    return r.id
      ? this.http.put<SpringApiResponse<OnCallRotation>>(`${this.base}/on-call/${r.id}`, r)
      : this.http.post<SpringApiResponse<OnCallRotation>>(`${this.base}/on-call`, r);
  }

  // Relief-swap rotation
  listRelief(): Observable<SpringApiResponse<ReliefRotation[]>> {
    return this.http.get<SpringApiResponse<ReliefRotation[]>>(`${this.base}/relief`);
  }
  saveRelief(r: ReliefRotation): Observable<SpringApiResponse<ReliefRotation>> {
    return r.id
      ? this.http.put<SpringApiResponse<ReliefRotation>>(`${this.base}/relief/${r.id}`, r)
      : this.http.post<SpringApiResponse<ReliefRotation>>(`${this.base}/relief`, r);
  }
  deleteRelief(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/relief/${id}`);
  }

  // Misc
  assignableUsers(): Observable<SpringApiResponse<AssignableUser[]>> {
    return this.http.get<SpringApiResponse<AssignableUser[]>>(`${this.base}/assignable-users`);
  }
  status(): Observable<SpringApiResponse<{ active: boolean; earliestEditable?: string }>> {
    return this.http.get<SpringApiResponse<{ active: boolean; earliestEditable?: string }>>(`${this.base}/status`);
  }
  materialize(from: string, to: string): Observable<SpringApiResponse<{ rowsWritten: number }>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.post<SpringApiResponse<{ rowsWritten: number }>>(`${this.base}/materialize`, {}, { params });
  }
  seedInitial(): Observable<SpringApiResponse<{ created: number; skipped: number; notes: string[] }>> {
    return this.http.post<SpringApiResponse<{ created: number; skipped: number; notes: string[] }>>(`${this.base}/seed-initial`, {});
  }
  schedulePreview(from: string, to: string): Observable<SpringApiResponse<ShiftDayView[]>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SpringApiResponse<ShiftDayView[]>>(`${this.base}/preview`, { params });
  }

  // Coverage
  listCoverage(from?: string, to?: string): Observable<SpringApiResponse<CoverageRequest[]>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<SpringApiResponse<CoverageRequest[]>>(`${this.base}/coverage`, { params });
  }
  createCoverage(c: CoverageRequest): Observable<SpringApiResponse<CoverageRequest>> {
    return this.http.post<SpringApiResponse<CoverageRequest>>(`${this.base}/coverage`, c);
  }
  /** Inline per-day coverage need: (date, discipline, position, shift) → count (0 clears). */
  coverageDayNeed(date: string, discipline: string, position: string | null, shift: string, count: number): Observable<SpringApiResponse<CoverageRequest>> {
    let params = new HttpParams().set('date', date).set('discipline', discipline).set('shift', shift).set('count', String(count));
    if (position) params = params.set('position', position);
    return this.http.post<SpringApiResponse<CoverageRequest>>(`${this.base}/coverage/day-need`, {}, { params });
  }
  cancelCoverage(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.delete<SpringApiResponse<boolean>>(`${this.base}/coverage/${id}`);
  }
  listSignups(requestId: number): Observable<SpringApiResponse<CoverageSignup[]>> {
    return this.http.get<SpringApiResponse<CoverageSignup[]>>(`${this.base}/coverage/${requestId}/signups`);
  }
  /** All signups over a range (any status) — the grid "Sign-ups" overlay. */
  listSignupsRange(from: string, to: string): Observable<SpringApiResponse<CoverageSignup[]>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SpringApiResponse<CoverageSignup[]>>(`${this.base}/coverage/signups`, { params });
  }
  approveSignup(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.post<SpringApiResponse<boolean>>(`${this.base}/coverage/signups/${id}/approve`, {});
  }
  rejectSignup(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.post<SpringApiResponse<boolean>>(`${this.base}/coverage/signups/${id}/reject`, {});
  }
  /** Per-person/per-shift open-seat counts over a range — the roster grid's OPEN-SEATS marker. */
  listEligibilityDetail(from: string, to: string): Observable<SpringApiResponse<EligibilityDetail[]>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SpringApiResponse<EligibilityDetail[]>>(`${this.base}/coverage/eligibility-detail`, { params });
  }

  // PTO intake (Phase 4)
  listPto(status?: string): Observable<SpringApiResponse<PtoRequest[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<SpringApiResponse<PtoRequest[]>>(`${this.base}/pto`, { params });
  }
  assignPto(id: number, userId: number): Observable<SpringApiResponse<PtoRequest>> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.post<SpringApiResponse<PtoRequest>>(`${this.base}/pto/${id}/assign`, {}, { params });
  }
  approvePto(id: number): Observable<SpringApiResponse<PtoRequest>> {
    return this.http.post<SpringApiResponse<PtoRequest>>(`${this.base}/pto/${id}/approve`, {});
  }
  rejectPto(id: number): Observable<SpringApiResponse<PtoRequest>> {
    return this.http.post<SpringApiResponse<PtoRequest>>(`${this.base}/pto/${id}/reject`, {});
  }
}
