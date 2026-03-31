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

// ==================== 3-way verification types ====================

export interface VerificationResult {
  entityType: string;
  spBacked: boolean;
  hubReachable: boolean;
  spReachable: boolean;
  totalChecked: number;
  okCount: number;
  issueCount: number;
  localCount: number;
  hubCount: number;
  spCount: number | null;
  spOnlyCount: number | null;
  issues: EntityVerificationStatus[];
  message: string;
}

export interface EntityVerificationStatus {
  entityId: number | null;
  sharepointId: string | null;
  inLocal: boolean;
  inHub: boolean;
  inSharePoint: boolean | null;
  localHubStatus: string;
  spStatus: string | null;
  overallStatus: string;
  localModified: string | null;
  hubModified: string | null;
  spModified: string | null;
}

export interface ThreeWayFieldDiff {
  entityType: string;
  entityId: number;
  spBacked: boolean;
  spModified: string | null;
  fields: ThreeWayFieldEntry[];
  mismatchCount: number;
}

export interface ThreeWayFieldEntry {
  fieldName: string;
  localValue: string | null;
  hubValue: string | null;
  spValue: string | null;
  spMapped: boolean;
  allMatch: boolean;
  localHubMatch: boolean;
  localSpMatch: boolean;
  hubSpMatch: boolean;
}

/**
 * Unified service for sync checks, 3-way verification, and resolution.
 * Wraps both 2-way (local vs hub) and 3-way (local + hub + SharePoint) endpoints.
 */
@Injectable({ providedIn: 'root' })
export class EntitySyncCheckService {
  private http = inject(HttpClient);
  private syncStatusService = inject(SyncStatusService);
  private compareUrl = `${environment.baseApiUrl}/ng/sync/compare`;
  private resolveUrl = `${environment.baseApiUrl}/ng/sync/resolve`;

  // ==================== 2-way quick checks ====================

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

  /** Full field diff — 2-way (reuses existing) */
  getFieldDiff(entityType: string, entityId: number): Observable<EntityFieldDiff | null> {
    return this.syncStatusService.compareEntity(entityType, entityId);
  }

  /** Change history for a specific entity */
  getChangeHistory(entityType: string, entityId: number): Observable<FieldChange[]> {
    return this.syncStatusService.getEntityChanges(entityType, entityId);
  }

  // ==================== 3-way verification ====================

  /** Full 3-way verification (local + hub + SP) for an entity type */
  verify(entityType: string, entityIds?: number[]): Observable<VerificationResult> {
    return this.http.post<NgApiResponse<VerificationResult>>(
      `${this.compareUrl}/verify/${entityType}`,
      entityIds ?? null
    ).pipe(map(res => res.responseData));
  }

  /** 3-way field-level diff for a single entity */
  threeWayDiff(entityType: string, entityId: number): Observable<ThreeWayFieldDiff> {
    return this.http.get<NgApiResponse<ThreeWayFieldDiff>>(
      `${this.compareUrl}/verify/${entityType}/${entityId}/diff`
    ).pipe(map(res => res.responseData));
  }

  // ==================== Resolution ====================

  /** Push local entity to hub */
  pushToHub(entityType: string, entityId: number): Observable<any> {
    return this.syncStatusService.acceptLocal(entityType, entityId);
  }

  /** Pull entity from hub */
  pullFromHub(entityType: string, entityId: number): Observable<any> {
    return this.syncStatusService.acceptRemote(entityType, entityId);
  }

  /** Accept SharePoint version of an entity */
  acceptFromSp(entityType: string, entityId: number): Observable<any> {
    return this.http.post<NgApiResponse<any>>(
      `${this.resolveUrl}/accept-sp/${entityType}/${entityId}`, {}
    ).pipe(map(res => res.responseData));
  }
}
