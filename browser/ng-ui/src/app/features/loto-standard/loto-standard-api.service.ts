import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LotoStandard } from './loto-standard.model';

/**
 * Mobile LOTO Standards API. Calls the Plant-gated PWA endpoints on the hub
 * (`/api/pwa/secured/loto-standards`). The JWT interceptor attaches the bearer token.
 */
@Injectable({ providedIn: 'root' })
export class LotoStandardApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/loto-standards`;

  getAll(): Observable<LotoStandard[]> {
    return this.http.get<{ responseData: LotoStandard[] }>(`${this.base}/get-all`).pipe(
      timeout(20000),
      map(r => r.responseData ?? [])
    );
  }

  getById(id: number | string): Observable<LotoStandard | null> {
    return this.http.get<{ responseData: LotoStandard }>(`${this.base}/${id}`).pipe(
      timeout(20000),
      map(r => r.responseData ?? null)
    );
  }
}
