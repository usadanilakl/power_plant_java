import { Injectable, inject } from '@angular/core';
import { User } from '../models/auth/user.model';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';
import { UserApiService } from './user/user-api.service';
import { UserPa } from '../models/auth/user-pa.model';
import { UserDbService } from './user/user-db.service';

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
  private userDbService = inject(UserDbService);
  private readonly AUTH_STORAGE_KEY = 'authData';

  private authDataSubject = new BehaviorSubject<AuthData | null>(this.getAuthDataFromStorage());

  /**
   * Observable stream of the current authentication data.
   * Emits the AuthData object when logged in, and null when logged out.
   */
  public authData$: Observable<AuthData | null> = this.authDataSubject.asObservable();

  /**
   * Observable stream of the currently authenticated user.
   * Emits the User object when logged in, and null when logged out.
   */
  public currentUser$: Observable<User | null> = this.authData$.pipe(
    map(authData => authData?.user ?? null)
  );

  /**
   * Observable stream of the authentication status.
   * Emits true when logged in, false when logged out.
   */
  public isLoggedIn$: Observable<boolean> = this.authData$.pipe(
    map(authData => !!authData?.token)
  );

  constructor() { }

  /**
   * Authenticates the user against the API and logs them in on success.
   * @param username The user's email.
   * @param password The user's password.
   * @returns An observable with the authentication data on success.
   */
  authenticate(username: string, password: string): Observable<AuthData> {
    return this.userApiService.authenticateUser(username, password).pipe(
      switchMap(response => {

        if(!response.user) throw new Error('User not found');

        const userPa = new UserPa(response.user);
        const convertedUser = userPa.convertToUser();
        
        // Check if user exists in DB
        return this.userDbService.getBySharepointId(userPa.ID ?? 0).pipe(
          switchMap(existingUser => {
            // If user doesn't exist, add them first
            if (!existingUser) {
              return this.userDbService.addUser(convertedUser).pipe(
                map(() => response) // Return original response after adding user
              );
            }
            // User exists, just return the response
            return of(response);
          })
        );
      }),
      map(response => {
        const authData: AuthData = {
          ...response,
          user: new UserPa(response.user).convertToUser()
        };
        return authData;
      }),
      tap(authData => {
        this.login(authData);
      }),
      catchError(error => {
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