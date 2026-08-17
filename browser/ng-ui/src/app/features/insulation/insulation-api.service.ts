import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PowerAutomateService } from '../../services/power-automate.service';

/**
 * Compact projection returned by GET /api/pwa/secured/insulation/active. Mirrors the
 * PwaInsulationItemDto on the hub — only fields the contractor needs.
 */
export interface InsulationItem {
  id: number;
  title: string;
  notes: string | null;
  specificLocation: string | null;
  locationName: string | null;
  equipmentTag: string | null;
  submitterName: string | null;
  dateObserved: string | null;
  timeObserved: string | null;
  maximoWonum: string | null;
  maximoStatus: string | null;
  /** ONLY set in offline (SP) mode — the SharePoint row id used to PATCH on complete. */
  sharepointId?: string | null;
  /** ONLY set in offline (SP) mode — indicates this item came from PA fallback, not hub. */
  fromSharePoint?: boolean;
  /**
   * ONLY set in offline mode — the raw SharePoint row we imported from. Kept so
   * markCompleteViaSp can send a FULL-item update (any field not in the payload is
   * silently wiped by the PA flow's Update item action, so partial updates would blank
   * Title/Notes/Location/etc.). Not populated in hub mode (uses hub API which handles
   * merge server-side).
   */
  spRaw?: Record<string, any>;
}

/**
 * Compact per-row drift signal from /api/pwa/secured/field-list-drift/status. Booleans only —
 * PWA renders a badge and tooltip, does not resolve drift (that lives in JG Portal admin).
 */
export interface PwaFieldListDriftStatus {
  hubDrift: boolean;
  spDrift: boolean;
  maximoPending: boolean;
  maximoClosedLocalOpen: boolean;
  localClosedMaximoOpen: boolean;
}

interface NgApiResponse<T> { responseData: T; message: string; timestamp: string; }

/**
 * How the contractor page reached the current data:
 *  - 'hub'      — hub was reachable, everything's live and closes go directly through Maximo bridge
 *  - 'sharepoint' — hub unreachable; falling back to Power Automate → SharePoint; closes queued for
 *                   the hub to pick up via its SP-import poll when it comes back online
 *  - 'error'    — both paths failed; show error UI
 */
export type InsulationSourceMode = 'hub' | 'sharepoint' | 'error';

/**
 * Local queue entry for an offline "Mark Complete" that succeeded via PA but should also
 * be attempted through the hub if it comes back online in the same session (so the
 * contractor sees the row disappear immediately vs waiting for the 30s SP-import cycle).
 * localStorage-persisted so a browser refresh doesn't lose in-flight closes.
 */
export interface OfflineCompletionEntry {
  fieldListItemId?: number;   // hub id, when known
  sharepointId: string;
  wonum: string | null;
  contractor: string;
  completedAt: string;
  spPatchAcked: boolean;      // PA update returned success
  hubAcked: boolean;          // hub later confirmed the SP-import triggered COMP
}

const HUB_HEALTH_TIMEOUT_MS = 3000;
const OFFLINE_QUEUE_KEY = 'insulation.offline.completions.v1';

@Injectable({ providedIn: 'root' })
export class InsulationApiService {
  private http = inject(HttpClient);
  private pa = inject(PowerAutomateService);
  private base = `${environment.serverUrl}/api/pwa/secured/insulation`;

  /**
   * Probe the hub cheaply so the page can decide which path to use. Uses actuator/health
   * with a tight timeout — the reachable-hub happy path returns in ~50ms on the LAN, so a
   * 3s cap is safe and gives us a clear failover signal without making offline mode feel
   * "stuck loading".
   */
  isHubReachable(): Observable<boolean> {
    return this.http.get(`${environment.serverUrl}/actuator/health`, { observe: 'response' })
      .pipe(
        timeout(HUB_HEALTH_TIMEOUT_MS),
        map(r => r.status >= 200 && r.status < 500),
        catchError(() => of(false))
      );
  }

  // ==================== HUB PATH ====================

  listActiveViaHub(): Observable<NgApiResponse<InsulationItem[]>> {
    return this.http.get<NgApiResponse<InsulationItem[]>>(`${this.base}/active`);
  }

  /** Recently-closed insulation items — powers the "Show recently closed" toggle. Fail-quiet: */
  listRecentClosedViaHub(days = 30): Observable<InsulationItem[]> {
    return this.http.get<NgApiResponse<InsulationItem[]>>(`${this.base}/recent-closed?days=${days}`).pipe(
      map(r => r.responseData ?? []),
      catchError(() => of([] as InsulationItem[]))
    );
  }

  /** Reopen a closed insulation item. Returns {ok, message} — message flags Maximo-remains-COMP. */
  reopenViaHub(id: number): Observable<NgApiResponse<boolean>> {
    return this.http.post<NgApiResponse<boolean>>(`${this.base}/${id}/reopen`, {});
  }

  /** Save contractor progress WITHOUT completing the WO — appends comment to Maximo worklog
   *  and persists photos to H2 + SP + Maximo doclinks. Item stays in the active queue. */
  saveProgressViaHub(id: number, comment?: string, attachments?: Array<{ fileName: string; contentType: string; base64Content: string }>): Observable<NgApiResponse<boolean>> {
    const body: any = {};
    if (comment && comment.trim()) body.comment = comment.trim();
    if (attachments && attachments.length > 0) body.attachments = attachments;
    return this.http.post<NgApiResponse<boolean>>(`${this.base}/${id}/save-progress`, body);
  }

  /** Live-refresh one item's Maximo status by probing the WO. Called on details-dialog open so
   *  ops-side changes (COMP → WAPPR done directly in Maximo) don't need to wait ~60s for the
   *  passive status-poll. Fail-quiet: on hub outage returns null and the dialog uses the stale
   *  local snapshot rather than blocking the user. */
  refreshMaximoStatus(id: number): Observable<InsulationItem | null> {
    return this.http.post<NgApiResponse<InsulationItem>>(`${this.base}/${id}/refresh-status`, {}).pipe(
      map(r => r.responseData ?? null),
      catchError(() => of(null))
    );
  }

  markCompleteViaHub(id: number, comment?: string, attachments?: Array<{ fileName: string; contentType: string; base64Content: string }>): Observable<NgApiResponse<boolean>> {
    // Body is optional server-side; sending null-equivalents keeps the request compact.
    const body: any = {};
    if (comment && comment.trim()) body.comment = comment.trim();
    if (attachments && attachments.length > 0) body.attachments = attachments;
    return this.http.post<NgApiResponse<boolean>>(`${this.base}/${id}/complete`, body);
  }

  /** Attachments for a hub-side insulation item — powers the details dialog's image grid.
   *  Fail-quiet on hub outage so the dialog just shows no images. */
  getAttachments(id: number): Observable<Array<{ id: number; fileName: string; contentType: string; base64Content: string }>> {
    return this.http.get<NgApiResponse<Array<{ id: number; fileName: string; contentType: string; base64Content: string }>>>(
      `${this.base}/${id}/attachments`
    ).pipe(
      map(r => r.responseData ?? []),
      catchError(() => of([] as Array<{ id: number; fileName: string; contentType: string; base64Content: string }>))
    );
  }

  /**
   * Read-only drift status for hub-mode items. Returns a compact per-id signal — the PWA
   * shows a badge and a short tooltip so the contractor can escalate to admin; resolution
   * itself lives in JG Portal. Never throws — a hub outage returns {} and the badge just
   * doesn't render (fail-quiet is the right UX for a "nice-to-know" indicator).
   */
  driftStatus(ids: number[]): Observable<Record<number, PwaFieldListDriftStatus>> {
    const usable = (ids || []).filter(id => id && id > 0);
    if (usable.length === 0) return of({} as Record<number, PwaFieldListDriftStatus>);
    return this.http.post<NgApiResponse<Record<number, PwaFieldListDriftStatus>>>(
      `${environment.serverUrl}/api/pwa/secured/field-list-drift/status`, usable)
      .pipe(
        map(r => r.responseData ?? {}),
        catchError(() => of({} as Record<number, PwaFieldListDriftStatus>))
      );
  }

  // ==================== SHAREPOINT (OFFLINE) PATH ====================

  /**
   * Fetch all field-list items from SharePoint via the PowerAutomate gateway (which validates
   * the caller's Supabase JWT). Client-side filter to insulation items still-open. Only rows
   * with a sharepointId are returned; sync-only rows without an SP push aren't visible to the
   * offline contractor (as designed — they never made it to SharePoint).
   */
  listActiveViaSp(): Observable<InsulationItem[]> {
    return this.pa.submitV2('fieldList', { actionType: 'getAll', data: {} }).pipe(
      map(resp => {
        const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
        return rows
          .filter(r =>
            (r.ListType || '').toLowerCase().includes('insulation') &&
            (r.Status || '').toLowerCase() !== 'closed' &&
            !this.parseBool(r.ContractorCompleted))
          .map(r => this.mapSpRow(r));
      }),
      catchError(err => {
        console.error('[Insulation-Offline] PA getAll failed:', err?.message ?? err);
        return of([] as InsulationItem[]);
      })
    );
  }

  /**
   * Mark a field-list item complete offline by PATCHing SharePoint via PowerAutomate. Hub
   * will detect the ContractorCompleted flag on its next SP-import poll (~30s after hub
   * reachability restores) and trigger the Maximo WO COMP through the same event listener
   * the online path uses.
   */
  markCompleteViaSp(item: InsulationItem, contractor: string): Observable<boolean> {
    if (!item.sharepointId) {
      console.warn('[Insulation-Offline] cannot close via SP — item has no sharepointId', item);
      return of(false);
    }
    const nowIso = new Date().toISOString();
    // FULL-item update: any field not in the payload would be blanked by the PA flow's
    // Update item action. spRaw is the row we imported — echo every column back, then
    // overlay Status+ContractorCompleted+By+At. Fields we don't have (SP metadata like
    // {Link}, Author) aren't columns and don't get wiped.
    const raw: Record<string, any> = item.spRaw ?? {};
    const dataPayload: Record<string, any> = {
      Title: raw['Title'] ?? '',
      PwaId: raw['PwaId'] ?? '',
      ListType: raw['ListType'] ?? '',
      Location: raw['Location'] ?? '',
      SpecificLocation: raw['SpecificLocation'] ?? '',
      Notes: raw['Notes'] ?? '',
      DateObserved: raw['DateObserved'] ?? '',
      EquipmentTag: raw['EquipmentTag'] ?? '',
      SubmitterName: raw['SubmitterName'] ?? '',
      SubmitterEmail: raw['SubmitterEmail'] ?? '',
      SubmitterPhone: raw['SubmitterPhone'] ?? '',
      MaximoLocation: raw['MaximoLocation'] ?? '',
      MaximoAssetnum: raw['MaximoAssetnum'] ?? '',
      // The mutations
      Status: 'Closed',
      ContractorCompleted: true,
      ContractorCompletedBy: contractor,
      ContractorCompletedAt: nowIso,
    };
    const payload = {
      actionType: 'update',
      id: item.sharepointId,
      data: dataPayload,
    };
    return this.pa.submitV2('fieldList', payload).pipe(
      map(resp => {
        const ok = resp?.success !== false;
        if (ok) {
          this.enqueueCompletion({
            fieldListItemId: item.id,
            sharepointId: item.sharepointId!,
            wonum: item.maximoWonum,
            contractor,
            completedAt: nowIso,
            spPatchAcked: true,
            hubAcked: false,
          });
        }
        return ok;
      }),
      catchError(err => {
        console.error('[Insulation-Offline] PA update failed for spId=' + item.sharepointId, err?.message ?? err);
        return of(false);
      })
    );
  }

  // ==================== OFFLINE QUEUE (localStorage-backed) ====================

  /** All queued offline completions that haven't been confirmed by the hub. */
  getPendingCompletions(): OfflineCompletionEntry[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as OfflineCompletionEntry[];
      return Array.isArray(parsed) ? parsed.filter(e => !e.hubAcked) : [];
    } catch {
      return [];
    }
  }

  /**
   * Called after a successful hub call (once hub is reachable again) that confirms a
   * queued completion has taken effect on Maximo. Marks the entry hubAcked so we can
   * prune it from the offline queue in the next housekeeping cycle.
   */
  ackHubCompletion(sharepointId: string): void {
    const all = this.readRaw();
    const idx = all.findIndex(e => e.sharepointId === sharepointId);
    if (idx >= 0) {
      all[idx].hubAcked = true;
      this.writeRaw(all);
    }
  }

  /** Drop entries the hub has confirmed. Called on page load to keep the queue small. */
  pruneAckedCompletions(): void {
    const all = this.readRaw();
    const kept = all.filter(e => !e.hubAcked);
    if (kept.length !== all.length) this.writeRaw(kept);
  }

  private enqueueCompletion(entry: OfflineCompletionEntry): void {
    const all = this.readRaw();
    // Dedup by sharepointId — a re-tap during retry shouldn't create two queue rows.
    const idx = all.findIndex(e => e.sharepointId === entry.sharepointId);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    this.writeRaw(all);
  }

  private readRaw(): OfflineCompletionEntry[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? (JSON.parse(raw) as OfflineCompletionEntry[]) : [];
    } catch { return []; }
  }

  private writeRaw(rows: OfflineCompletionEntry[]): void {
    try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(rows)); } catch { /* ignore */ }
  }

  // ==================== helpers ====================

  private parseBool(v: any): boolean {
    if (v === true) return true;
    if (typeof v === 'string') return v.toLowerCase() === 'true';
    return false;
  }

  private mapSpRow(r: any): InsulationItem {
    return {
      id: 0,                                    // no hub-side id in SP-only mode
      title: r.Title || '',
      notes: r.Notes || null,
      specificLocation: r.SpecificLocation || null,
      locationName: r.Location || null,
      equipmentTag: r.EquipmentTag || null,
      submitterName: r.SubmitterName || null,
      dateObserved: r.DateObserved || null,
      timeObserved: null,
      maximoWonum: null,                        // not stored on SP row — unknown offline
      maximoStatus: null,
      sharepointId: r.ID || r.Id || null,
      fromSharePoint: true,
      spRaw: r,                                 // keep raw row for full-item resend on complete
    };
  }
}
