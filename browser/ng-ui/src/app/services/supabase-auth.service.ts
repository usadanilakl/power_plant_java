import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Thin wrapper over the Supabase GoTrue REST auth API (the secondary auth authority).
 *
 * Implemented directly over Angular {@link HttpClient} rather than pulling in
 * `@supabase/supabase-js` — the surface we need (password sign-in/up, token refresh, self-service
 * password/profile update) is a handful of endpoints, and staying on HttpClient avoids a bundle
 * dependency and keeps every request observable/testable. Swap in the SDK later if richer features
 * (realtime, storage) are ever needed. See project/features/users/dual-auth.md.
 *
 * These calls go to `<supabase.url>` (a different host than the hub), so they bypass the hub
 * `authInterceptor`; the anon key + bearer token are attached here explicitly.
 */
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  user: SupabaseUserObj;
}

export interface SupabaseUserObj {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  private http = inject(HttpClient);
  private readonly cfg = (environment as any).supabase ?? {};
  private readonly url: string = (this.cfg.url ?? '').replace(/\/+$/, '');
  private readonly anonKey: string = this.cfg.anonKey ?? '';

  /** True only when both a URL and anon key are configured — otherwise the app runs hub-only. */
  get configured(): boolean {
    return !!this.url && !!this.anonKey;
  }

  private baseHeaders(): Record<string, string> {
    return { apikey: this.anonKey, 'Content-Type': 'application/json' };
  }

  private authHeaders(accessToken: string): Record<string, string> {
    return { ...this.baseHeaders(), Authorization: `Bearer ${accessToken}` };
  }

  /**
   * Mirror of the hub's anonymous "does this account exist?" lookup, backed by the
   * `lookup_user_by_email` RPC — lets the identify → register-vs-signin flow work unchanged when the
   * hub is down. Returns { found, isActive, name }.
   */
  lookupUser(email: string): Observable<{ found: boolean; isActive: boolean; name: string }> {
    return this.http.post<{ found: boolean; is_active: boolean; name: string | null }>(
      `${this.url}/rest/v1/rpc/lookup_user_by_email`,
      { p_email: email },
      { headers: this.baseHeaders() },
    ).pipe(
      timeout(10000),
      map(r => ({ found: !!r?.found, isActive: !!r?.is_active, name: r?.name ?? '' })),
    );
  }

  signInWithPassword(email: string, password: string): Observable<SupabaseSession> {
    return this.http.post<SupabaseSession>(
      `${this.url}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: this.baseHeaders() },
    ).pipe(timeout(10000));
  }

  /** GoTrue signup. `data` becomes raw_user_meta_data. Returns a session when confirmations are off. */
  signUp(email: string, password: string, data: Record<string, any>): Observable<any> {
    return this.http.post<any>(
      `${this.url}/auth/v1/signup`,
      { email, password, data },
      { headers: this.baseHeaders() },
    ).pipe(timeout(15000));
  }

  refreshSession(refreshToken: string): Observable<SupabaseSession> {
    return this.http.post<SupabaseSession>(
      `${this.url}/auth/v1/token?grant_type=refresh_token`,
      { refresh_token: refreshToken },
      { headers: this.baseHeaders() },
    ).pipe(timeout(10000));
  }

  updatePassword(accessToken: string, newPassword: string): Observable<any> {
    return this.http.put<any>(
      `${this.url}/auth/v1/user`,
      { password: newPassword },
      { headers: this.authHeaders(accessToken) },
    ).pipe(timeout(10000));
  }

  /** Update email and/or metadata (name/phone/company). `attrs` e.g. { email, data: {...} }. */
  updateUser(accessToken: string, attrs: { email?: string; data?: Record<string, any> }): Observable<any> {
    return this.http.put<any>(
      `${this.url}/auth/v1/user`,
      attrs,
      { headers: this.authHeaders(accessToken) },
    ).pipe(timeout(10000));
  }
}
