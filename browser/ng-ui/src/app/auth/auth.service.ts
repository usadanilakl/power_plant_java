import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServerApiService, PwaRegistrationStatus } from '../services/server-api.service';
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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private serverApi = inject(ServerApiService);
  private userSetupService = inject(UserSetupService);
  private readonly AUTH_STORAGE_KEY = 'pwaAuthData';

  private authDataSubject = new BehaviorSubject<PwaAuthData | null>(this.getAuthDataFromStorage());

  public authData$: Observable<PwaAuthData | null> = this.authDataSubject.asObservable();

  public currentUser$ = this.authData$.pipe(
    map(data => data?.user ?? null)
  );

  public currentUser = toSignal(this.currentUser$, { initialValue: null });

  public isLoggedIn$: Observable<boolean> = this.authData$.pipe(
    map(data => !!data?.token && data.expiresAt > Date.now())
  );

  authenticate(email: string, password: string): Observable<PwaAuthData> {
    return this.serverApi.pwaLogin(email, password).pipe(
      map(response => {
        const authData: PwaAuthData = {
          token: response.token,
          expiresAt: Date.now() + (response.expiresIn * 1000),
          user: response.user
        };
        return authData;
      }),
      tap(authData => {
        this.storeAuth(authData);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  refreshToken(): void {
    const current = this.getAuthData();
    if (!current?.token) return;

    this.serverApi.pwaRefreshToken(current.token).subscribe({
      next: (response) => {
        const authData: PwaAuthData = {
          token: response.token,
          expiresAt: Date.now() + (response.expiresIn * 1000),
          user: response.user
        };
        this.storeAuth(authData);
      },
      error: () => this.logout()
    });
  }

  logout(): void {
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

  private storeAuth(authData: PwaAuthData): void {
    localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(authData));
    this.authDataSubject.next(authData);
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
