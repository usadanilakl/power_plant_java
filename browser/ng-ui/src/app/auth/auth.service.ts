import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServerApiService, PwaRegistrationStatus, PwaUserRegistrationDto } from '../services/server-api.service';
import { SupabaseAuthService, SupabaseSession } from '../services/supabase-auth.service';
import { UserSetupService } from '../services/user-setup.service';

export interface PwaAuthUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  permissionLevel: string;
}

export interface PwaAuthData {
  token: string;
  expiresAt: number; // epoch ms
  user: PwaAuthUser;
  /** Which authority issued the stored token. Drives silent-refresh routing. */
  source?: 'hub' | 'supabase';
  /** Present only for Supabase sessions — needed to refresh. */
  refreshToken?: string;
  /**
   * For a HUB-primary session: a best-effort Supabase refresh token captured in the background at
   * login. It lets hub-down fallbacks (profile update, and belt-and-suspenders password change) reach
   * Supabase even though the primary token is hub-issued. Absent until the user is mirrored to Supabase.
   */
  supabaseRefreshToken?: string;
}

/** Outcome of a dual-authority sign-up. */
export interface SignUpOutcome {
  ok: boolean;
  viaSupabase: boolean;
  pendingApproval: boolean;
  message: string;
}

/**
 * Dual-authority auth: the hub (Spring) is primary; Supabase is the fallback. Login / registration /
 * password-change / profile-update each try the hub first and fall back to Supabase when the hub is
 * unreachable (and, for login, when the hub rejects a password that a Supabase change may have
 * superseded). The user never sees which store answered. See project/features/users/dual-auth.md.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private serverApi = inject(ServerApiService);
  private supabase = inject(SupabaseAuthService);
  private userSetupService = inject(UserSetupService);
  private readonly AUTH_STORAGE_KEY = 'pwaAuthData';
  /** Refresh this many ms before expiry. */
  private readonly REFRESH_LEAD_MS = 120_000;
  /** setTimeout stores delays as a 32-bit signed int; anything larger overflows and fires immediately. */
  private readonly MAX_TIMEOUT_MS = 2_000_000_000;
  private refreshTimer: any = null;

  private authDataSubject = new BehaviorSubject<PwaAuthData | null>(this.getAuthDataFromStorage());

  public authData$: Observable<PwaAuthData | null> = this.authDataSubject.asObservable();

  public currentUser$ = this.authData$.pipe(
    map(data => data?.user ?? null)
  );

  public currentUser = toSignal(this.currentUser$, { initialValue: null });

  public isLoggedIn$: Observable<boolean> = this.authData$.pipe(
    map(data => !!data?.token && data.expiresAt > Date.now())
  );

  constructor() {
    // Resume silent-refresh scheduling for a session restored from storage.
    if (this.getAuthData()) this.scheduleSilentRefresh();
  }

  // ── Login (dual-path) ──────────────────────────────────────────────────────

  authenticate(email: string, password: string): Observable<PwaAuthData> {
    return this.serverApi.pwaLoginRaw(email, password).pipe(
      map(response => this.toHubAuthData(response)),
      tap(authData => {
        this.storeAuth(authData);
        // Best-effort: also acquire a Supabase session so this hub-primary session can still write to
        // Supabase (profile/password) if the hub later goes down. No-op if the user isn't mirrored yet.
        this.establishBackgroundSupabaseSession(email, password);
      }),
      catchError(err => this.loginFallback(email, password, err))
    );
  }

  /** After a HUB login, capture a Supabase refresh token in the background for hub-down fallbacks. */
  private establishBackgroundSupabaseSession(email: string, password: string): void {
    if (!this.supabase.configured) return;
    this.supabase.signInWithPassword(email, password).subscribe({
      next: session => {
        const cur = this.getAuthData();
        if (cur && cur.source === 'hub') {
          this.storeAuth({ ...cur, supabaseRefreshToken: session.refresh_token });
        }
      },
      error: () => { /* not mirrored to Supabase yet, or offline — fine, best-effort */ },
    });
  }

  private loginFallback(email: string, password: string, err: any): Observable<PwaAuthData> {
    const { hubDown, hubRejected } = this.classifyHubError(err);

    // The hub is UP and says the account is pending admin approval — that is a terminal answer, NOT a
    // reason to slip in via Supabase (which would defeat the approval gate). Surface it.
    if (this.isAccountInactive(err)) {
      this.logout();
      return throwError(() => err);
    }

    // No Supabase configured, or an error we shouldn't retry against Supabase → surface it.
    if (!this.supabase.configured || (!hubDown && !hubRejected)) {
      this.logout();
      return throwError(() => err);
    }

    return this.supabase.signInWithPassword(email, password).pipe(
      map(session => this.toSupabaseAuthData(session)),
      tap(authData => {
        this.storeAuth(authData);
        // Hub was UP but rejected the password (a Supabase-side change may have superseded it).
        // Now that we hold a valid Supabase session, ask the hub to converge (best-effort). The hub
        // re-verifies the password against Supabase, so no token is sent.
        if (hubRejected) {
          this.serverApi.reconcileWithHub(email, password).subscribe();
        }
      }),
      catchError(() => {
        this.logout();
        const message = hubDown
          ? 'Auth services unavailable, try again shortly.'
          : 'Invalid email or password.';
        return throwError(() => new Error(message));
      })
    );
  }

  // ── Registration (dual-path) ───────────────────────────────────────────────

  signUpDual(dto: PwaUserRegistrationDto): Observable<SignUpOutcome> {
    return this.serverApi.registerUserRaw(dto).pipe(
      map(result => ({
        ok: !!result && (result.success || result.status === 'already_exists'),
        viaSupabase: false,
        pendingApproval: false,
        message: result?.message ?? 'Registered',
      } as SignUpOutcome)),
      catchError(err => {
        const { hubDown } = this.classifyHubError(err);
        if (hubDown && this.supabase.configured) {
          return this.supabase.signUp(dto.email, dto.password, {
            name: dto.name, phone: dto.phone, company: dto.company,
          }).pipe(
            map(() => ({
              ok: true,
              viaSupabase: true,
              pendingApproval: true,
              message: 'Account created — pending admin approval on next connection.',
            } as SignUpOutcome))
          );
        }
        return throwError(() => err);
      })
    );
  }

  // ── Password change (dual-path) ────────────────────────────────────────────

  changePasswordDual(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.serverApi.changePasswordRaw(currentPassword, newPassword).pipe(
      catchError(err => {
        const { hubDown } = this.classifyHubError(err);
        const data = this.getAuthData();
        if (!hubDown || !this.supabase.configured) {
          return throwError(() => err);
        }
        // Already hold a Supabase session → change directly.
        if (data?.source === 'supabase' && data.token) {
          return this.supabase.updatePassword(data.token, newPassword).pipe(
            map(() => ({ success: true, message: 'Password changed' }))
          );
        }
        // Hub-originated session (the common outage case): we don't have a Supabase token, but the
        // user just supplied their CURRENT password — sign into Supabase with it to get one, then change.
        const email = data?.user?.email;
        if (!email) {
          return throwError(() => err);
        }
        return this.supabase.signInWithPassword(email, currentPassword).pipe(
          switchMap(session => this.supabase.updatePassword(session.access_token, newPassword).pipe(
            map(() => ({ success: true, message: 'Password changed' }))
          ))
        );
      })
    );
  }

  // ── Profile update (dual-path) ─────────────────────────────────────────────

  updateProfileDual(data: { name?: string; email?: string; phone?: string; company?: string }):
      Observable<{ success: boolean; message: string }> {
    return this.serverApi.updateProfileRaw(data).pipe(
      catchError(err => {
        const { hubDown } = this.classifyHubError(err);
        const auth = this.getAuthData();
        if (!hubDown || !this.supabase.configured) {
          return throwError(() => err);
        }
        const attrs: { email?: string; data?: Record<string, any> } = {
          data: { name: data.name, phone: data.phone, company: data.company },
        };
        if (data.email) attrs.email = data.email;
        // Supabase-primary session → use its access token directly.
        if (auth?.source === 'supabase' && auth.token) {
          return this.supabase.updateUser(auth.token, attrs).pipe(
            map(() => ({ success: true, message: 'Profile updated' }))
          );
        }
        // Hub-primary session → use the background Supabase session captured at login (refresh it for a
        // fresh access token, persist the rotated refresh token, then update).
        if (auth?.supabaseRefreshToken) {
          return this.supabase.refreshSession(auth.supabaseRefreshToken).pipe(
            switchMap(session => {
              const cur = this.getAuthData();
              if (cur) this.storeAuth({ ...cur, supabaseRefreshToken: session.refresh_token });
              return this.supabase.updateUser(session.access_token, attrs).pipe(
                map(() => ({ success: true, message: 'Profile updated' }))
              );
            })
          );
        }
        // No Supabase fallback available (user not mirrored yet) — the local save persists and the hub
        // picks it up on reconnect; the 60s reconciliation job then mirrors it to Supabase.
        return throwError(() => err);
      })
    );
  }

  /**
   * True if a hub-down write can still reach Supabase for the current session: a Supabase-primary
   * token, or a hub session that captured a background Supabase refresh token at login.
   */
  hasSupabaseFallback(): boolean {
    const d = this.getAuthData();
    if (!this.supabase.configured || !d) return false;
    return (d.source === 'supabase' && !!d.token) || !!d.supabaseRefreshToken;
  }

  // ── Silent refresh ─────────────────────────────────────────────────────────

  /** Public trigger kept for backward compatibility; delegates to the scheduled refresh. */
  refreshToken(): void {
    this.performSilentRefresh();
  }

  private scheduleSilentRefresh(): void {
    if (this.refreshTimer) { clearTimeout(this.refreshTimer); this.refreshTimer = null; }
    const data = this.getAuthData();
    if (!data?.expiresAt) return;
    const untilRefresh = data.expiresAt - Date.now() - this.REFRESH_LEAD_MS;
    if (untilRefresh > this.MAX_TIMEOUT_MS) {
      // Too far out for a single setTimeout (30-day hub tokens overflow the int32 delay and would
      // fire immediately → tight refresh loop). Wake partway and re-arm instead of refreshing now.
      this.refreshTimer = setTimeout(() => this.scheduleSilentRefresh(), this.MAX_TIMEOUT_MS);
    } else {
      this.refreshTimer = setTimeout(() => this.performSilentRefresh(), Math.max(untilRefresh, 0));
    }
  }

  private performSilentRefresh(): void {
    const data = this.getAuthData();
    if (!data?.token) return;
    const onError = () => this.scheduleRefreshRetry();

    if (data.source === 'supabase') {
      if (!data.refreshToken || !this.supabase.configured) return;
      this.supabase.refreshSession(data.refreshToken).subscribe({
        next: session => this.storeAuth(this.toSupabaseAuthData(session)),
        error: onError,
      });
    } else {
      this.serverApi.pwaRefreshRaw(data.token).subscribe({
        next: response => this.storeAuth(this.toHubAuthData(response)),
        error: onError,
      });
    }
  }

  /** A transient refresh failure shouldn't abandon the schedule — retry soon, while still valid. */
  private scheduleRefreshRetry(): void {
    const data = this.getAuthData();
    if (!data?.expiresAt) return;
    const remaining = data.expiresAt - Date.now();
    if (remaining <= 0) return; // expired → let it force a re-login
    if (this.refreshTimer) { clearTimeout(this.refreshTimer); }
    this.refreshTimer = setTimeout(() => this.performSilentRefresh(),
      Math.min(30_000, Math.max(remaining - 1000, 1000)));
  }

  // ── Session state ──────────────────────────────────────────────────────────

  logout(): void {
    if (this.refreshTimer) { clearTimeout(this.refreshTimer); this.refreshTimer = null; }
    localStorage.removeItem(this.AUTH_STORAGE_KEY);
    this.authDataSubject.next(null);
  }

  getAuthData(): PwaAuthData | null {
    return this.authDataSubject.getValue();
  }

  isLoggedIn(): boolean {
    const data = this.getAuthData();
    return !!data?.token && data.expiresAt > Date.now();
  }

  getToken(): string | null {
    if (!this.isLoggedIn()) return null;
    return this.getAuthData()?.token ?? null;
  }

  hasPermission(requiredLevel: string): boolean {
    const user = this.getAuthData()?.user;
    if (!user) return false;
    const level = user.permissionLevel;
    if (requiredLevel === 'BASIC') return level === 'BASIC' || level === 'OPERATOR';
    if (requiredLevel === 'OPERATOR') return level === 'OPERATOR';
    return false;
  }

  /**
   * True if the signed-in user has the Plant (or Admin) role. The hub returns a `roles`
   * array (e.g. ["ROLE_PLANT"]); we match on substring so it works regardless of the
   * ROLE_ prefix. Used to reveal Plant-only tools (Maximo, LOTO) that open the full web app.
   */
  isPlant(): boolean {
    const user = this.getAuthData()?.user;
    if (!user) return false;
    const roles = (user.roles ?? []).map(r => (r ?? '').toUpperCase());
    return roles.some(r => r.includes('PLANT') || r.includes('ADMIN'));
  }

  /**
   * True if the signed-in user belongs to any plant-affiliated group (Admin, Plant, NAES, JPower).
   * These are the groups that see schedule + contacts + plant chat. Contractors are excluded.
   * See {@code project/features/users/communication/pwa-step-5-wiring.md}.
   */
  isPlantGroup(): boolean {
    const user = this.getAuthData()?.user;
    if (!user) return false;
    const roles = (user.roles ?? []).map(r => (r ?? '').toUpperCase());
    return roles.some(r =>
      r.includes('ADMIN') || r.includes('PLANT') || r.includes('NAES') || r.includes('JPOWER'));
  }

  /**
   * After login, sync local PwaUserData with the server profile.
   * Updates localStorage if server data differs from local data.
   * Returns Observable<boolean> (true if sync succeeded).
   */
  syncLocalUserData(): Observable<boolean> {
    if (!this.isLoggedIn()) return of(false);

    return this.serverApi.getProfile().pipe(
      map(profile => {
        if (!profile) return false;
        const local = this.userSetupService.getUserData();

        const needsUpdate = !local ||
          local.name !== profile.name ||
          local.email !== profile.email ||
          local.phone !== (profile.phone ?? '') ||
          local.company !== (profile.company ?? '');

        if (needsUpdate) {
          this.userSetupService.saveUserData({
            name: profile.name ?? local?.name ?? '',
            email: profile.email ?? local?.email ?? '',
            phone: profile.phone ?? local?.phone ?? '',
            company: profile.company ?? local?.company ?? '',
            signature: local?.signature,
            registeredOnServer: true
          });
          console.log('[Auth] Local user data synced with server profile');
        } else if (local && !local.registeredOnServer) {
          this.userSetupService.markRegistered();
        }
        return true;
      }),
      catchError(err => {
        console.warn('[Auth] Could not sync local user data:', err);
        return of(false);
      })
    );
  }

  // ── Mapping / classification helpers ───────────────────────────────────────

  private toHubAuthData(response: { token: string; expiresIn: number; user: PwaAuthUser }): PwaAuthData {
    return {
      token: response.token,
      expiresAt: Date.now() + (response.expiresIn * 1000),
      user: response.user,
      source: 'hub',
    };
  }

  private toSupabaseAuthData(session: SupabaseSession): PwaAuthData {
    const md = session.user?.user_metadata ?? {};
    const roles = Array.isArray(md['roles']) ? md['roles'] : (md['roles'] ? [md['roles']] : []);
    const user: PwaAuthUser = {
      id: Number(md['hub_user_id'] ?? 0),
      name: md['name'] ?? session.user?.email ?? '',
      email: session.user?.email ?? '',
      roles,
      permissionLevel: md['permission_level'] ?? 'NONE',
    };
    return {
      token: session.access_token,
      expiresAt: Date.now() + (session.expires_in * 1000),
      user,
      source: 'supabase',
      refreshToken: session.refresh_token,
    };
  }

  /** True when the hub explicitly rejected login because the account is pending admin approval. */
  private isAccountInactive(err: any): boolean {
    const status = err instanceof HttpErrorResponse ? err.status : err?.status;
    const body = err?.error;
    const code = body && typeof body === 'object' ? body.error : undefined;
    const msg = (body && typeof body === 'object' ? body.message : '') || err?.message || '';
    return status === 401 && (code === 'ACCOUNT_INACTIVE' || /not yet approved/i.test(msg));
  }

  /** Distinguish "hub is DOWN" (fall back) from "hub REJECTED" (a 4xx — try Supabase then reconcile). */
  private classifyHubError(err: any): { hubDown: boolean; hubRejected: boolean } {
    const status = err instanceof HttpErrorResponse ? err.status : err?.status;
    const isTimeout = err?.name === 'TimeoutError' || /timeout/i.test(err?.message ?? '');
    const hubDown = isTimeout || status === 0 || status == null || status >= 500;
    const hubRejected = !hubDown && status >= 400 && status < 500;
    return { hubDown, hubRejected };
  }

  private storeAuth(authData: PwaAuthData): void {
    localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(authData));
    this.authDataSubject.next(authData);
    this.scheduleSilentRefresh();
  }

  private getAuthDataFromStorage(): PwaAuthData | null {
    try {
      const raw = localStorage.getItem(this.AUTH_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as PwaAuthData;
      // Check not expired
      if (data.expiresAt <= Date.now()) {
        localStorage.removeItem(this.AUTH_STORAGE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }
}
