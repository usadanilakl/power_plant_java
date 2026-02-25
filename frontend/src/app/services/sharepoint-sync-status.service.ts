import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SharePointSyncStatus {
  entityType: string;
  lastSyncTimeMs: number;
  lastSyncTimeFormatted: string;
  syncEnabled: boolean;
  hubOnline: boolean;
  dataStale: boolean;
  lastResult: SyncResult | null;
}

export interface SyncResult {
  created: number;
  updated: number;
  autoClosed: number;
  skipped: number;
  failed: number;
  errorMessage: string | null;
}

interface NgApiResponse<T> {
  responseData: T;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SharePointSyncStatusService {
  private apiUrl = `${environment.baseApiUrl}/api/sharepoint-sync`;

  constructor(private http: HttpClient) {}

  getStatus(entityType: string): Observable<SharePointSyncStatus | null> {
    return this.http.get<NgApiResponse<SharePointSyncStatus>>(
      `${this.apiUrl}/status/${entityType}`
    ).pipe(
      map(resp => resp.responseData),
      catchError(err => {
        console.error(`Failed to fetch SP sync status for ${entityType}:`, err);
        return of(null);
      })
    );
  }

  getAllStatuses(): Observable<NgApiResponse<SharePointSyncStatus[]>> {
    return this.http.get<NgApiResponse<SharePointSyncStatus[]>>(
      `${this.apiUrl}/status`
    );
  }

  triggerSync(entityType: string): Observable<NgApiResponse<SyncResult>> {
    return this.http.post<NgApiResponse<SyncResult>>(
      `${this.apiUrl}/sync/${entityType}`, {}
    );
  }

  getEntityTypes(): Observable<NgApiResponse<string[]>> {
    return this.http.get<NgApiResponse<string[]>>(
      `${this.apiUrl}/entity-types`
    );
  }
}
