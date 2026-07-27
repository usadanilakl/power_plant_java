import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private base = `${environment.serverUrl}/api/pwa/secured`;

  getScheduleToday(): Observable<ShiftDay | null> {
    return this.http.get<ShiftDay | null>(`${this.base}/schedule/today`);
  }

  getScheduleRange(from: string, to: string): Observable<ShiftDay[]> {
    return this.http.get<ShiftDay[]>(`${this.base}/schedule/range?from=${from}&to=${to}`);
  }

  getOnShiftNow(): Observable<ShiftEntry[]> {
    return this.http.get<ShiftEntry[]>(`${this.base}/schedule/on-shift-now`);
  }

  getContacts(): Observable<PersonnelContact[]> {
    return this.http.get<PersonnelContact[]>(`${this.base}/contacts`);
  }

  getEmergencyContacts(): Observable<PersonnelContact[]> {
    return this.http.get<PersonnelContact[]>(`${this.base}/contacts/emergency`);
  }
}
