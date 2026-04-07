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
    this.http.get<AuthUser>(`${this.authUrl}/me`, { withCredentials: true })
      .pipe(
        catchError(() => {
          this.currentUserSubject.next(null);
          this.isLoggedInSubject.next(false);
          return of(null);
        })
      )
      .subscribe(user => {
        if (user) {
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        }
        this.authCheckedSubject.next(true);
      });
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
}
