import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserDto } from '../models/user.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  /** Broadcast when a user is created or updated */
  userUpdated$ = new Subject<UserDto>();
  /** Broadcast when a user is deleted */
  userDeleted$ = new Subject<number>();

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<UserDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<UserDto[]>>(`${this.apiUrl}/paginated`, { params });
  }

  searchUsers(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<UserDto[]>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<UserDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }

  getUserById(id: string): Observable<SpringApiResponse<UserDto>> {
    return this.http.get<SpringApiResponse<UserDto>>(`${this.apiUrl}/${id}`);
  }

  createUser(user: UserDto): Observable<SpringApiResponse<UserDto>> {
    return this.http.post<SpringApiResponse<UserDto>>(this.apiUrl, user);
  }

  updateUser(id: string, user: UserDto): Observable<SpringApiResponse<UserDto>> {
    return this.http.put<SpringApiResponse<UserDto>>(`${this.apiUrl}/${id}`, user);
  }

  // ── PIN administration (admin-only endpoints under /api/auth/admin/users/:id) ──

  /** Set or change a user's signing initials (2-3 letters). Admin-only. */
  setSigningInitials(userId: number, initials: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/admin/users/${userId}/initials`,
      { initials },
    );
  }

  /** Generate a fresh random PIN for a user. Returns the cleartext PIN ONCE. Admin-only. */
  resetUserPin(userId: number): Observable<{ pin: string; message: string }> {
    return this.http.post<{ pin: string; message: string }>(
      `${environment.apiUrl}/auth/admin/users/${userId}/pin/reset`,
      {},
    );
  }

  deleteUser(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // User-specific operations
  getUserByEmail(email: string): Observable<SpringApiResponse<UserDto>> {
    return this.http.get<SpringApiResponse<UserDto>>(`${this.apiUrl}/email/${email}`);
  }

  changePassword(id: string, oldPassword: string, newPassword: string): Observable<SpringApiResponse<void>> {
    const payload = { oldPassword, newPassword };
    return this.http.post<SpringApiResponse<void>>(`${this.apiUrl}/${id}/change-password`, payload);
  }

  getRoles(): Observable<{ roles: string[] }> {
    return this.http.get<{ roles: string[] }>(`${this.apiUrl}/roles`);
  }

  seedPlantUsers(): Observable<SpringApiResponse<{ created: string[], skipped: string[] }>> {
    return this.http.post<SpringApiResponse<{ created: string[], skipped: string[] }>>(`${this.apiUrl}/seed-plant-users`, {});
  }

  /** Get all active users (for user-select dropdowns) */
  getAllOptions(): Observable<SpringApiResponse<UserDto[]>> {
    return this.http.get<SpringApiResponse<UserDto[]>>(`${this.apiUrl}/all-options`);
  }
}