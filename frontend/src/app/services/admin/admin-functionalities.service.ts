import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface FileIntegrityResult {
  filesScanned: number;
  entitiesChecked: number;
  orphanedFiles: OrphanedFile[];
  orphanedCount: number;
  missingFiles: MissingFile[];
  missingCount: number;
  restoredFiles: any[];
  dryRun: boolean;
  success: boolean;
  error?: string;
}

export interface OrphanedFile {
  path: string;
  fileNumber: string;
  extension: string;
  fileType: string;
  vendor: string;
}

export interface MissingFile {
  id: string;
  fileNumber: string;
  expectedPath: string;
  name: string;
}

export interface SplitEquipmentResult {
  success: boolean;
  splitCount: number;
  message: string;
  splitEquipment: SplitEquipmentItem[];
  error?: string;
}

export interface SplitEquipmentItem {
  id: number;
  tagNumber: string;
  description: string;
}

export interface AssignAttributesResult {
  success: boolean;
  message: string;
  pointsWithoutAttributesBefore: number;
  pointsWithoutAttributesAfter: number;
  pointsUpdated: number;
  error?: string;
}

export interface FixExtensionsResult {
  success: boolean;
  dryRun: boolean;
  totalChecked: number;
  totalFixed: number;
  alreadyCorrect: number;
  availableExtensions: string[];
  fixedFiles: FixedFileItem[];
  error?: string;
}

export interface FixedFileItem {
  id: number;
  fileNumber: string;
  name: string;
  oldExtensions: string;
  newExtensions: string;
}

export interface CounterpartAssociationResult {
  success: boolean;
  dryRun: boolean;
  processedCount: number;
  linkedCount: number;
  skippedCount: number;
  linkedPairs: LinkedPair[];
  skippedPoints: SkippedPoint[];
  message: string;
  error?: string;
}

export interface LinkedPair {
  point1Id: number;
  point1Tag: string;
  point2Id: number;
  point2Tag: string;
}

export interface SkippedPoint {
  id: number;
  tagNumber: string;
  reason: string;
}

export interface SyncQueueStatus {
  totalChanges: number;
  pendingForServer: number;
  entityBreakdown: { [entityType: string]: number };
  originMachines: string[];
  oldestChange: string | null;
  newestChange: string | null;
}

export interface SyncQueueActionResult {
  success: boolean;
  message: string;
  affected: number;
}

export interface PwaSyncActionResult {
  success: boolean;
  message: string;
  target: string;
}

export interface SharePointProvisionResult {
  created: string[];
  skipped: string[];
  errors: { [listTitle: string]: string };
  totalCreated: number;
  totalSkipped: number;
  totalErrors: number;
}

export interface SpListStatus {
  title: string;
  fieldCount: number;
  exists: boolean;
  error: string | null;
}

export interface SpProvisionSingleResult {
  title: string;
  success: boolean;
  alreadyExisted?: boolean;
  fieldsAdded?: string[];
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminFunctionalitiesService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Check file integrity - compares physical files with database entries
   * @param dryRun If true, only reports issues without making changes
   */
  restoreFileIntegrity(dryRun: boolean = true): Observable<SpringApiResponse<FileIntegrityResult>> {
    const params = new HttpParams().set('dryRun', dryRun.toString());
    return this.http.post<SpringApiResponse<FileIntegrityResult>>(
      `${this.apiUrl}/restore-file-integrity`,
      {},
      { params }
    );
  }

  /**
   * Fix file extensions - scans filesystem and updates extensions field on FileObjects
   * @param dryRun If true, only reports what would change without updating
   */
  fixFileExtensions(dryRun: boolean = true): Observable<SpringApiResponse<FixExtensionsResult>> {
    const params = new HttpParams().set('dryRun', dryRun.toString());
    return this.http.post<SpringApiResponse<FixExtensionsResult>>(
      `${this.apiUrl}/fix-file-extensions`,
      {},
      { params }
    );
  }

  /**
   * Split equipment with multiple loto points into separate equipment entries
   */
  splitEquipmentWithMultipleLotoPoints(): Observable<SpringApiResponse<SplitEquipmentResult>> {
    return this.http.post<SpringApiResponse<SplitEquipmentResult>>(
      `${this.apiUrl}/split-equipment`,
      {}
    );
  }

  /**
   * Assign Location and EqType from Equipment to their associated LotoPoints
   */
  assignEquipmentAttributesToLotoPoints(): Observable<SpringApiResponse<AssignAttributesResult>> {
    return this.http.post<SpringApiResponse<AssignAttributesResult>>(
      `${this.apiUrl}/assign-equipment-attributes`,
      {}
    );
  }

  /**
   * Associate LotoPoints with their unit counterparts (U1/U2)
   * @param dryRun If true, only reports what would be linked without making changes
   */
  associateLotoPointCounterparts(dryRun: boolean = true): Observable<SpringApiResponse<CounterpartAssociationResult>> {
    const params = new HttpParams().set('dryRun', dryRun.toString());
    return this.http.post<SpringApiResponse<CounterpartAssociationResult>>(
      `${this.apiUrl}/associate-counterparts`,
      {},
      { params }
    );
  }

  // ==================== Sync Queue ====================

  getSyncQueueStatus(): Observable<SpringApiResponse<SyncQueueStatus>> {
    return this.http.get<SpringApiResponse<SyncQueueStatus>>(
      `${this.apiUrl}/sync-queue/status`
    );
  }

  markAllSyncedToServer(): Observable<SpringApiResponse<SyncQueueActionResult>> {
    return this.http.post<SpringApiResponse<SyncQueueActionResult>>(
      `${this.apiUrl}/sync-queue/mark-synced-to-server`,
      {}
    );
  }

  markAllSyncedToMachine(machineId: string): Observable<SpringApiResponse<SyncQueueActionResult>> {
    const params = new HttpParams().set('machineId', machineId);
    return this.http.post<SpringApiResponse<SyncQueueActionResult>>(
      `${this.apiUrl}/sync-queue/mark-synced`,
      {},
      { params }
    );
  }

  clearOldChanges(days: number): Observable<SpringApiResponse<SyncQueueActionResult>> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.post<SpringApiResponse<SyncQueueActionResult>>(
      `${this.apiUrl}/sync-queue/clear-old`,
      {},
      { params }
    );
  }

  clearAllChanges(): Observable<SpringApiResponse<SyncQueueActionResult>> {
    return this.http.post<SpringApiResponse<SyncQueueActionResult>>(
      `${this.apiUrl}/sync-queue/clear-all`,
      {}
    );
  }

  publishPwaData(target: 'all' | 'areas' | 'map' | 'categories'): Observable<SpringApiResponse<PwaSyncActionResult>> {
    const params = new HttpParams().set('target', target);
    return this.http.post<SpringApiResponse<PwaSyncActionResult>>(
      `${this.apiUrl}/pwa-sync`,
      {},
      { params }
    );
  }

  // ==================== SharePoint Provisioning ====================

  getSharePointListStatuses(): Observable<SpListStatus[]> {
    return this.http.get<SpListStatus[]>(
      `${environment.apiUrl}/sharepoint/list-status`
    );
  }

  provisionSharePointList(title: string): Observable<SpProvisionSingleResult> {
    const params = new HttpParams().set('title', title);
    return this.http.post<SpProvisionSingleResult>(
      `${environment.apiUrl}/sharepoint/provision-list`,
      {},
      { params }
    );
  }

  provisionAllSharePointLists(): Observable<SharePointProvisionResult> {
    return this.http.post<SharePointProvisionResult>(
      `${environment.apiUrl}/sharepoint/provision-lists`,
      {}
    );
  }
}
