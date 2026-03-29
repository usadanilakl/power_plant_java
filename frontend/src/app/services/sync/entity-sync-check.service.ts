import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SyncStatusService, NgApiResponse, EntityFieldDiff, FieldChange
} from '../sync-status.service';

export interface EntitySyncStatus {
  entityType: string;
  entityId: number;
  existsLocally: boolean;
  existsOnServer: boolean;
  timestampsMatch: boolean;
  localModified: string | null;
  serverModified: string | null;
  status: 'IN_SYNC' | 'LOCAL_ONLY' | 'SERVER_ONLY' | 'STALE_LOCAL' | 'STALE_SERVER' | 'UNKNOWN' | 'NOT_FOUND';
}

/**
 * Shared service for per-entity sync checks and resolution.
 * Wraps the quick-check endpoint and reuses existing comparison/resolution APIs.
 */
@Injectable({ providedIn: 'root' })
export class EntitySyncCheckService {
  private http = inject(HttpClient);
  private syncStatusService = inject(SyncStatusService);
  private compareUrl = `${environment.baseApiUrl}/ng/sync/compare`;

  /** Quick sync status check for a single entity */
  checkEntity(entityType: string, entityId: number): Observable<EntitySyncStatus> {
    return this.http.get<NgApiResponse<EntitySyncStatus>>(
      `${this.compareUrl}/check/${entityType}/${entityId}`
    ).pipe(map(res => res.responseData));
  }

  /** Batch sync check for multiple entities of the same type */
  checkEntities(entityType: string, entityIds: number[]): Observable<EntitySyncStatus[]> {
    return this.http.post<NgApiResponse<EntitySyncStatus[]>>(
      `${this.compareUrl}/check/${entityType}`, entityIds
    ).pipe(map(res => res.responseData ?? []));
  }

  /** Full field diff (reuses existing) */
  getFieldDiff(entityType: string, entityId: number): Observable<EntityFieldDiff | null> {
    return this.syncStatusService.compareEntity(entityType, entityId);
  }

  /** Change history for a specific entity */
  getChangeHistory(entityType: string, entityId: number): Observable<FieldChange[]> {
    return this.syncStatusService.getEntityChanges(entityType, entityId);
  }

  /** Push local entity to hub */
  pushToHub(entityType: string, entityId: number): Observable<any> {
    return this.syncStatusService.acceptLocal(entityType, entityId);
  }

  /** Pull entity from hub */
  pullFromHub(entityType: string, entityId: number): Observable<any> {
    return this.syncStatusService.acceptRemote(entityType, entityId);
  }
}
