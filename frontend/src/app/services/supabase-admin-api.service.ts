import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

/**
 * A hub User missing a Supabase link — one row per surviving reason so the admin can decide what
 * override to send. {@code eligibleForAutoProvision} = true means the scheduled reconciler would
 * pick this user up on its next tick; the others need manual intervention (email override, link
 * to an existing Supabase uuid, or a fix to the underlying User row).
 */
export interface SupabaseOrphan {
  id: number;
  username?: string;
  email?: string;
  isActive?: boolean;
  reason: 'inactive' | 'no-email' | 'malformed-email' | 'non-dotted-domain' | 'eligible' | string;
  eligibleForAutoProvision: boolean;
}

export interface SupabaseLookupResult {
  email: string;
  uuid: string | null;
}

export interface SupabaseProvisionRequest {
  emailOverride?: string;
  linkExistingUuid?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseAdminApiService {
  private base = `${environment.apiUrl}/admin/supabase`;

  constructor(private http: HttpClient) {}

  orphans(): Observable<SpringApiResponse<SupabaseOrphan[]>> {
    return this.http.get<SpringApiResponse<SupabaseOrphan[]>>(`${this.base}/orphans`);
  }

  lookupByEmail(email: string): Observable<SpringApiResponse<SupabaseLookupResult>> {
    const params = new HttpParams().set('email', email);
    return this.http.get<SpringApiResponse<SupabaseLookupResult>>(`${this.base}/lookup`, { params });
  }

  provision(userId: number, body: SupabaseProvisionRequest = {}):
      Observable<SpringApiResponse<{ userId: number; supabaseUuid: string }>> {
    return this.http.post<SpringApiResponse<{ userId: number; supabaseUuid: string }>>(
      `${this.base}/orphan/${userId}/provision`, body);
  }

  reconcileNow(): Observable<SpringApiResponse<{ triggered: boolean }>> {
    return this.http.post<SpringApiResponse<{ triggered: boolean }>>(
      `${this.base}/reconcile-now`, {});
  }
}
