import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/** One client + its next-boot directive + immediate-command state (mirrors backend ClientDirectiveView). */
export interface ClientView {
  machineId: string;
  machineName?: string;
  deviceNumber?: number;
  status?: string;
  lastSeen?: string;
  lastSyncTime?: string;
  directiveActions?: string;      // CSV: jar,db,files,electron
  directiveId?: string;
  directiveMandatory?: boolean;
  directiveMessage?: string;
  directiveSetAt?: string;
  lastAppliedDirectiveId?: string;
  directiveAppliedAt?: string;
  directivePending?: boolean;
  pendingCommand?: string;        // SHUTDOWN | RESTART
  pendingCommandIssuedAt?: string;
  commandPending?: boolean;
}

interface NgApiResponse<T> { responseData: T; message: string; }

/** Hub-admin control of connected clients: list, set/clear next-boot update directives, and issue immediate
 *  shutdown/restart commands. All endpoints are ADMIN-gated on the hub. */
@Injectable({ providedIn: 'root' })
export class AdminClientsService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/sync/clients`;

  list(): Observable<ClientView[]> {
    return this.http.get<NgApiResponse<ClientView[]>>(this.base).pipe(
      map(r => r?.responseData ?? []), catchError(() => of([])));
  }

  setDirective(machineId: string, actions: string[], mandatory: boolean, message: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<NgApiResponse<any>>(`${this.base}/${encodeURIComponent(machineId)}/directive`,
      { actions, mandatory, message }).pipe(
      map(r => ({ ok: !!r?.responseData, message: r?.message ?? 'Directive set' })),
      catchError(e => of({ ok: false, message: e?.error?.message ?? 'Failed to set directive' })));
  }

  clearDirective(machineId: string): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<NgApiResponse<any>>(`${this.base}/${encodeURIComponent(machineId)}/directive`).pipe(
      map(r => ({ ok: true, message: r?.message ?? 'Directive cleared' })),
      catchError(() => of({ ok: false, message: 'Failed to clear directive' })));
  }

  issueCommand(machineId: string, command: 'SHUTDOWN' | 'RESTART'): Observable<{ ok: boolean; message: string }> {
    return this.http.post<NgApiResponse<any>>(`${this.base}/${encodeURIComponent(machineId)}/command`,
      { command }).pipe(
      map(r => ({ ok: !!r?.responseData, message: r?.message ?? command + ' issued' })),
      catchError(e => of({ ok: false, message: e?.error?.message ?? 'Failed to issue command' })));
  }

  clearCommand(machineId: string): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<NgApiResponse<any>>(`${this.base}/${encodeURIComponent(machineId)}/command`).pipe(
      map(r => ({ ok: true, message: r?.message ?? 'Command cleared' })),
      catchError(() => of({ ok: false, message: 'Failed to clear command' })));
  }
}
