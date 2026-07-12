import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ObjectLog, PhysicalObjectAggregate } from './physical-object.model';

/**
 * Mobile PhysicalObject binder API. Calls the Plant-gated PWA endpoints on the hub
 * (`/api/pwa/secured/physical-object`). JWT interceptor attaches the bearer token. Backs the Rounds
 * question-context ("everything about this object").
 */
@Injectable({ providedIn: 'root' })
export class PhysicalObjectApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/physical-object`;

  getAggregate(id: number): Observable<PhysicalObjectAggregate | null> {
    return this.http
      .get<{ responseData: PhysicalObjectAggregate | null }>(`${this.base}/${id}/aggregate`)
      .pipe(timeout(30000), map(r => r.responseData ?? null));
  }

  getLogs(id: number): Observable<ObjectLog[]> {
    return this.http
      .get<{ responseData: ObjectLog[] }>(`${this.base}/${id}/logs`)
      .pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  addLog(id: number, content: string, needsAttention = false): Observable<ObjectLog> {
    return this.http
      .post<{ responseData: ObjectLog }>(`${this.base}/${id}/logs`, { content, needsAttention })
      .pipe(timeout(20000), map(r => r.responseData));
  }
}
