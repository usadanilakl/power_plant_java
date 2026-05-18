import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  roles: string[];
  isActive: boolean;
  accessLevel?: 'RESTRICTED' | 'PENDING' | 'FULL';
}

export interface UserProfile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  roles: string[];
  isActive: boolean;
  lastLoginDate: string | null;
  windowsUsername: string;
  // PIN / signing — populated when admin has assigned initials and the user
  // has set (or had reset) a PIN at least once. Null until first assignment.
  signingInitials?: string | null;
  pinSetAt?: string | null;
  pinLockedUntil?: string | null;
  pinResetRequestedAt?: string | null;
  pinMustChange?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  password?: string;
}

export interface AccessStatus {
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'ALREADY_PENDING' | 'ALREADY_APPROVED';
  requestedAt?: string;
  expiresAt?: string;
  lastActiveAt?: string;
  message?: string;
  requestId?: number;
}

export interface AccessGrantSummary {
  id: number;
  status: string;
  requestIp: string;
  deviceInfo: string;
  requestedAt: string;
  approvedAt: string | null;
  expiresAt: string | null;
  lastActiveAt: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = `${environment.baseApiUrl}/api/auth`;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private authCheckedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  /** Emits true once the initial auth check (/me) has completed */
  authChecked$ = this.authCheckedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  login(credential: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.authUrl}/login`, { credential, password }, { withCredentials: true })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.authUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.isLoggedInSubject.next(false);
          this.router.navigate(['/login']);
        })
      );
  }

  checkAuthStatus(): void {
    this.refreshCurrentUser().subscribe();
  }

  /**
   * Re-fetch /me and update the current-user subject. Callers can subscribe
   * to know when the refresh completes (e.g. after an admin grants new roles
   * to the signed-in user and we want the UI to reflect them without a full
   * page reload).
   */
  refreshCurrentUser(): Observable<AuthUser | null> {
    const req$ = this.http.get<AuthUser>(`${this.authUrl}/me`, { withCredentials: true })
      .pipe(
        catchError(() => {
          this.currentUserSubject.next(null);
          this.isLoggedInSubject.next(false);
          return of(null);
        }),
        tap(user => {
          if (user) {
            this.currentUserSubject.next(user);
            this.isLoggedInSubject.next(true);
          }
          this.authCheckedSubject.next(true);
        })
      );
    return req$;
  }

  requestAccess(): Observable<AccessStatus> {
    return this.http.post<AccessStatus>(`${this.authUrl}/request-access`, {}, { withCredentials: true });
  }

  getAccessStatus(): Observable<AccessStatus> {
    return this.http.get<AccessStatus>(`${this.authUrl}/access-status`, { withCredentials: true });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.authUrl}/profile`, { withCredentials: true });
  }

  updateProfile(data: UpdateProfileRequest): Observable<any> {
    return this.http.put(`${this.authUrl}/profile`, data, { withCredentials: true })
      .pipe(
        tap(() => {
          // Refresh the current user after profile update
          this.checkAuthStatus();
        })
      );
  }

  getMyAccessGrants(): Observable<AccessGrantSummary[]> {
    return this.http.get<AccessGrantSummary[]>(`${this.authUrl}/profile/sessions`, { withCredentials: true });
  }

  changePasswordVerified(req: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.authUrl}/profile/change-password`, req, { withCredentials: true });
  }

  /**
   * Change the signed-in user's own PIN. The current PIN is required so that
   * a logged-in session can't change it without the owner physically present.
   * Returns a generic message on success/failure (no detail leakage).
   */
  changeOwnPin(currentPin: string, newPin: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.authUrl}/pin/change`,
      { currentPin, newPin },
      { withCredentials: true }
    );
  }

  /**
   * Flag the signed-in user's account as "I forgot my PIN — please reset".
   * An administrator's reset action clears the flag and issues a fresh PIN.
   */
  requestPinReset(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.authUrl}/pin/request-reset`,
      {},
      { withCredentials: true }
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.authUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.authUrl}/reset-password`, { token, newPassword });
  }

  isAdmin(): boolean {
    const roles = this.currentUser?.roles ?? [];
    return roles.includes('ROLE_ADMIN');
  }

  hasFullAccess(): boolean {
    return this.currentUser?.accessLevel === 'FULL';
  }

  /** Case-insensitive role check against the current user's role list. */
  hasRole(role: string): boolean {
    if (!role) return false;
    const roles = this.currentUser?.roles ?? [];
    const target = role.toLowerCase();
    return roles.some(r => r?.toLowerCase() === target);
  }

  // ── LOTO role helpers ─────────────────────────────────────────────────────
  // The new canonical names are CONTROL_AUTHORITY / LOTO_QUALIFIED / REQUESTOR /
  // MANAGER. QUALIFIED and AUTHORIZED are legacy aliases (mapped to CA / LOTO_Q).

  /** Control Authority — can do most operations on standards and permits. */
  isControlAuthority(): boolean {
    return this.hasRole('CONTROL_AUTHORITY') || this.hasRole('QUALIFIED');
  }

  /** Can hang and verify LOTO points. CA implicitly satisfies this. */
  isLotoQualified(): boolean {
    return this.isControlAuthority() || this.hasRole('LOTO_QUALIFIED') || this.hasRole('AUTHORIZED');
  }

  /** Can be a permit requestor. CA implicitly satisfies this. */
  isRequestor(): boolean {
    return this.isControlAuthority() || this.hasRole('REQUESTOR');
  }

  /** Manager — final-approves standards after testing. */
  isManager(): boolean {
    return this.hasRole('MANAGER');
  }
}
