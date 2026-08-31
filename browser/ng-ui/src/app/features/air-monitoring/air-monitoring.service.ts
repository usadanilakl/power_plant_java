import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { UserSetupService } from '../../services/user-setup.service';

export interface AirTestDto {
  id?: number | null;
  /**
   * Generated on this device before the first send. Turns a retry after a lost response into an
   * update of the reading the server already has, instead of a second row for the same test — and
   * gives the outbox a stable handle so a concurrent flush cannot lose an entry.
   */
  clientUuid?: string;
  monitoredAreaId: number;
  /** ISO instant — the moment of the READING, never of the upload. */
  testedAt?: string | null;
  testedBy?: string | null;
  meterModel?: string | null;
  meterSerial?: string | null;
  oxygen?: string | null;
  lel?: string | null;
  hydrogenSulfide?: string | null;
  carbonMonoxide?: string | null;
  ammonia?: string | null;
  result?: string | null;
  notes?: string | null;
}

export interface MonitoredAreaDto {
  id: number;
  name: string;
  sourceType?: string | null;
  spaceName?: string | null;
  workAreaName?: string | null;
  testIntervalHours?: number | null;
  lastTest?: AirTestDto | null;
  overdue?: boolean | null;
  hoursSinceLastTest?: number | null;
}

const AREAS_CACHE = 'pwa_monitored_areas';
const OUTBOX = 'pwa_air_test_outbox';

/** Mirrors the server default. Only used when an area does not carry its own interval. */
const DEFAULT_INTERVAL_HOURS = 12;

/**
 * Air monitoring in the field.
 *
 * <h2>Reading the list</h2>
 *
 * Hub first, then the Supabase snapshot, then whatever was cached last. Deliberately NOT
 * SharePoint: a SharePoint-backed list needs a provisioned column set and hand-edited Power
 * Automate flows for every field, and this list has no SharePoint reporting requirement to pay for
 * that. The snapshot path already exists and costs nothing per field.
 *
 * <h2>Recording a test</h2>
 *
 * A phone with no signal cannot write to any remote store, so "offline support" here means a local
 * outbox and a retry — not a second system of record. The hub stays the only authority. Queued
 * tests keep the timestamp they were TAKEN at, so a reading from a basement at 06:00 that uploads
 * at 14:00 still says 06:00; anything else would misrepresent when the atmosphere was safe.
 */
@Injectable({ providedIn: 'root' })
export class PwaAirMonitoringService {
  private http = inject(HttpClient);
  private supabase = inject(SupabaseDataService);
  private userSetup = inject(UserSetupService);

  private base = `${environment.serverUrl}/api/pwa/secured/air-monitoring`;

  areas = signal<MonitoredAreaDto[]>([]);
  /** Tests taken but not yet accepted by the hub. Surfaced so nobody thinks they are lost. */
  pending = signal<AirTestDto[]>([]);
  loading = signal(false);
  source = signal<'hub' | 'snapshot' | 'cache' | 'none'>('none');

  constructor() {
    this.areas.set(this.readCache());
    this.pending.set(this.readOutbox());
  }

  // ---------------------------------------------------------------- reading

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.base}/areas`));
      if (res?.success && Array.isArray(res.areas)) {
        this.accept(res.areas, 'hub');
        this.flush();
        return;
      }
    } catch {
      // Hub unreachable — fall through to the offline sources.
    }

    // snapshotOrElse treats an EMPTY dataset as "unavailable" and calls the fallback. For a list
    // that legitimately empties out — the last permit closed — that would drop us back onto a stale
    // cache and keep prompting people to test areas that are finished. Ask directly instead, so an
    // empty answer is an answer.
    try {
      const rows = await firstValueFrom(this.supabase.getSnapshot('monitored_areas'));
      if (Array.isArray(rows)) {
        this.accept(rows as MonitoredAreaDto[], 'snapshot');
        return;
      }
    } catch {
      // No snapshot either — fall through to whatever this device saw last.
    }

    const cached = this.readCache();
    this.areas.set(this.withFreshOverdue(cached));
    this.source.set(cached.length ? 'cache' : 'none');
    this.loading.set(false);
  }

  private accept(rows: MonitoredAreaDto[], source: 'hub' | 'snapshot'): void {
    this.areas.set(this.withFreshOverdue(rows ?? []));
    this.source.set(source);
    this.loading.set(false);
    try { localStorage.setItem(AREAS_CACHE, JSON.stringify(rows ?? [])); } catch { /* quota */ }
  }

  /**
   * Recompute "overdue" and "hours since" from the reading's own timestamp.
   *
   * <p>The server computes them too, but the snapshot FREEZES that answer at publish time — and the
   * passage of time is not a change, so nothing republishes it. An area snapshotted at 11 hours
   * would sit there saying "11h ago, fine" for the rest of the week. Time is the one input the
   * device always has, even with no signal, so the device is the right place to apply it.
   */
  private withFreshOverdue(rows: MonitoredAreaDto[]): MonitoredAreaDto[] {
    const now = Date.now();
    return rows.map(area => {
      const takenAt = area.lastTest?.testedAt ? Date.parse(area.lastTest.testedAt) : NaN;
      if (!Number.isFinite(takenAt)) {
        // Never tested is the most overdue thing on the list, not the safest.
        return { ...area, hoursSinceLastTest: null, overdue: true };
      }
      const hours = Math.floor((now - takenAt) / 3_600_000);
      const interval = area.testIntervalHours && area.testIntervalHours > 0
        ? area.testIntervalHours : DEFAULT_INTERVAL_HOURS;
      return { ...area, hoursSinceLastTest: hours, overdue: hours >= interval };
    });
  }

  private readCache(): MonitoredAreaDto[] {
    try { return JSON.parse(localStorage.getItem(AREAS_CACHE) ?? '[]'); } catch { return []; }
  }

  // ---------------------------------------------------------------- writing

  /**
   * Record a test. Queued locally FIRST, then sent — never the other way round.
   *
   * <p>Writing to the outbox before attempting the network is what makes a reading survive the app
   * being closed, the tab being killed, or the request dying halfway. A test that only exists in an
   * in-flight HTTP call is a test that can vanish without anyone knowing it did.
   */
  async record(test: AirTestDto): Promise<'sent' | 'queued'> {
    const user = this.userSetup.getUserData();
    const payload: AirTestDto = {
      ...test,
      clientUuid: test.clientUuid || newUuid(),
      testedAt: test.testedAt || new Date().toISOString(),
      testedBy: test.testedBy || user?.name || '',
    };

    this.enqueue(payload);
    const sent = await this.trySend(payload);
    if (sent) {
      this.dequeue(payload.clientUuid!);
      return 'sent';
    }
    return 'queued';
  }

  /**
   * Push anything the outbox is still holding.
   *
   * <p>Each entry is removed by its OWN id the moment it lands, rather than the whole outbox being
   * replaced at the end. Replacing it wholesale means a reading recorded while this loop was
   * awaiting a response gets overwritten by the stale snapshot the loop started with — the reading
   * reports as queued and is silently gone.
   */
  async flush(): Promise<void> {
    for (const test of this.readOutbox()) {
      if (await this.trySend(test)) this.dequeue(test.clientUuid!);
    }
  }

  /** Always read-modify-write against the CURRENT outbox, never a captured copy. */
  private enqueue(test: AirTestDto): void {
    const current = this.readOutbox().filter(t => t.clientUuid !== test.clientUuid);
    this.writeOutbox([...current, test]);
  }

  private dequeue(clientUuid: string): void {
    this.writeOutbox(this.readOutbox().filter(t => t.clientUuid !== clientUuid));
  }

  private async trySend(test: AirTestDto): Promise<boolean> {
    try {
      const res: any = await firstValueFrom(this.http.post(`${this.base}/tests`, test));
      return !!res?.success;
    } catch {
      return false;
    }
  }

  private readOutbox(): AirTestDto[] {
    try { return JSON.parse(localStorage.getItem(OUTBOX) ?? '[]'); } catch { return []; }
  }

  private writeOutbox(tests: AirTestDto[]): void {
    try { localStorage.setItem(OUTBOX, JSON.stringify(tests)); } catch { /* quota */ }
    this.pending.set(tests);
  }
}

/** crypto.randomUUID is not present on every browser this PWA has to run on. */
function newUuid(): string {
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
