import { Injectable, inject } from '@angular/core';
import { User } from '../models/auth/user.model';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';
import { UserApiService } from './user/user-api.service';

/**
 * Interface for the authentication data structure.
 */
export interface AuthData {
  token: string;
  userId: string;
  user: User;
  company: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private localStorageService = inject(LocalStorageService);
  private userApiService = inject(UserApiService);
  private readonly AUTH_STORAGE_KEY = 'authData';

  private authDataSubject = new BehaviorSubject<AuthData | null>(this.getAuthDataFromStorage());

  /**
   * Observable stream of the current authentication data.
   * Emits the AuthData object when logged in, and null when logged out.
   */
  public authData$: Observable<AuthData | null> = this.authDataSubject.asObservable();

  constructor() { }

  /**
   * Authenticates the user against the API and logs them in on success.
   * @param username The user's email.
   * @param password The user's password.
   * @returns An observable with the authentication data on success.
   */
  authenticate(username: string, password: string): Observable<AuthData> {
    return this.userApiService.authenticateUser(username, password).pipe(
      map(response => {
        // The API might return a plain object for the 'user' property.
        // We ensure it's an instance of the User class.
        const authData: AuthData = {
          ...response,
          user: new User(response.user)
        };
        return authData;
      }),
      tap(authData => {
        this.login(authData);
      }),
      catchError(error => {
        // On authentication failure, ensure the user is logged out.
        this.logout();
        console.error('Authentication failed:', error);
        return throwError(() => new Error('Authentication failed'));
      })
    );
  }

  /**
   * Stores authentication data in local storage and updates the auth state.
   * @param authData The authentication data to store.
   */
  login(authData: AuthData): void {
    this.localStorageService.setItem(this.AUTH_STORAGE_KEY, authData);
    this.authDataSubject.next(authData);
  }

  /**
   * Clears authentication data from local storage and updates the auth state.
   */
  logout(): void {
    this.localStorageService.removeItem(this.AUTH_STORAGE_KEY);
    this.authDataSubject.next(null);
  }

  /**
   * Retrieves the current authentication data from the service's state.
   * @returns The current AuthData object, or null if not authenticated.
   */
  getAuthData(): AuthData | null {
    return this.authDataSubject.getValue();
  }

  /**
   * Checks if the user is currently authenticated.
   * @returns True if a token exists in the auth data, false otherwise.
   */
  isLoggedIn(): boolean {
    return !!this.getAuthData()?.token;
  }

  /**
   * Retrieves the authentication token.
   * @returns The token string, or null if not authenticated.
   */
  getToken(): string | null {
    return this.getAuthData()?.token ?? null;
  }

  /**
   * Retrieves the logged-in user's data.
   * @returns The User object, or null if not authenticated.
   */
  getUser(): User | null {
    return this.getAuthData()?.user ?? null;
  }

  /**
   * Retrieves authentication data directly from local storage.
   * @returns The AuthData object from storage, or null if not found.
   */
  private getAuthDataFromStorage(): AuthData | null {
    return this.localStorageService.getItem<AuthData>(this.AUTH_STORAGE_KEY);
  }
}