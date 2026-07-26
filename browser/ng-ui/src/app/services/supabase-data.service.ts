import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, timeout, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

/**
 * Reads hub-mirrored reference datasets (LOTO points, work areas, locations) from Supabase — the
 * failover source when the hub is unreachable, replacing the old PUBLIC static JSON on GitHub Pages.
 *
 * Requires a **Supabase** session: PostgREST verifies the token with the Supabase JWT secret, so a
 * hub-issued RS256 token is rejected. This is fine — the only time we need the Supabase failover is a
 * fresh login while the hub is down, which authenticates via the Supabase fallback (source==='supabase').
 * When there's no Supabase session (e.g. a hub session whose hub then dropped), this returns [] and the
 * caller falls through to its localStorage cache. See project/architecture/supabase/reference-data.md.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseDataService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly cfg = (environment as any).supabase ?? {};
  private readonly url: string = (this.cfg.url ?? '').replace(/\/+$/, '');
  private readonly anonKey: string = this.cfg.anonKey ?? '';

  /** Returns the dataset array for a key ('loto_points' | 'work_areas' | 'locations'), or [] if unavailable. */
  getSnapshot(key: string): Observable<any[]> {
    const auth = this.authService.getAuthData();
    if (!this.url || !this.anonKey || auth?.source !== 'supabase' || !auth.token) {
      return of([]);
    }
    return this.http.get<{ payload: any[] }[]>(
      `${this.url}/rest/v1/reference_snapshot?select=payload&key=eq.${encodeURIComponent(key)}`,
      { headers: { apikey: this.anonKey, Authorization: `Bearer ${auth.token}` } },
    ).pipe(
      timeout(10000),
      map(rows => (rows && rows.length ? (rows[0].payload ?? []) : [])),
      catchError(() => of([])),
    );
  }
}
