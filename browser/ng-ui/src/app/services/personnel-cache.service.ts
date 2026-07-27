import { Injectable } from '@angular/core';
import { ShiftDay, PersonnelContact } from './personnel-api.service';

/**
 * Simple localStorage-backed cache for the PWA Personnel section. Schedule and contacts
 * change rarely, so 15-minute stale-cache is fine — we fetch fresh in the background but
 * render the cached copy immediately on tab switch / cold load.
 *
 * Keys are namespaced by feature; there is no per-user scoping because the data is
 * organisation-wide (schedule for everyone, contact directory for everyone). Cleared
 * on logout via the auth service's storage-clear.
 */
@Injectable({ providedIn: 'root' })
export class PersonnelCacheService {

  private readonly FRESH_MS = 15 * 60 * 1000;

  writeScheduleToday(dto: ShiftDay | null): void {
    this.write('pers.schedule.today', dto);
  }
  readScheduleToday(): { data: ShiftDay | null; stale: boolean } | null {
    return this.read('pers.schedule.today');
  }

  writeScheduleRange(from: string, to: string, rows: ShiftDay[]): void {
    this.write(`pers.schedule.range.${from}.${to}`, rows);
  }
  readScheduleRange(from: string, to: string): { data: ShiftDay[]; stale: boolean } | null {
    return this.read(`pers.schedule.range.${from}.${to}`);
  }

  writeContacts(rows: PersonnelContact[]): void {
    this.write('pers.contacts', rows);
  }
  readContacts(): { data: PersonnelContact[]; stale: boolean } | null {
    return this.read('pers.contacts');
  }

  /** Full wipe — call from logout handler. */
  clear(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pers.')) localStorage.removeItem(key);
    }
  }

  private write<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      // localStorage may be full or unavailable — silently drop the cache write.
    }
  }

  private read<T>(key: string): { data: T; stale: boolean } | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        data: parsed.data as T,
        stale: (Date.now() - parsed.ts) > this.FRESH_MS,
      };
    } catch {
      return null;
    }
  }
}
