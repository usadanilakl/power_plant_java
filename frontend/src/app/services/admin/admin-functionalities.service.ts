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

export interface SyncAuditTypeSummary {
  entityType: string;
  changeCount: number;
  entityCount: number;
  latestChangeAt: string | null;
  registered: boolean;
}

export interface SyncAuditRecentEntity {
  entityId: number;
  totalChanges: number;
  firstChangeAt: string | null;
  lastChangeAt: string | null;
  latestChangeType: string | null;
  latestFieldName: string | null;
  latestMachineId: string | null;
  latestMachineName: string | null;
  signals: SyncAuditSignal;
  warnings: string[];
}

export interface SyncAuditSignal {
  currentRowMissing: boolean;
  currentSoftDeleted: boolean;
  multipleCreates: boolean;
  deleteThenRecreate: boolean;
  relationshipDetachDetected: boolean;
  currentCreatedAfterHistory: boolean;
  identicalCreatedModified: boolean;
  timelineFiltered: boolean;
}

export interface SyncAuditRelatedEntity {
  relation: string;
  entityType: string;
  entityId: number;
}

export interface SyncAuditMachineSummary {
  machineId: string | null;
  machineName: string | null;
  changeCount: number;
  firstChangeAt: string | null;
  lastChangeAt: string | null;
}

export interface SyncAuditMachineCompareEntity {
  entityId: number;
  leftCount: number;
  rightCount: number;
  leftLastChangeAt: string | null;
  rightLastChangeAt: string | null;
  status: string;
}

export interface SyncAuditMachineCompareReport {
  entityType: string;
  leftMachineId: string;
  rightMachineId: string;
  totalCompared: number;
  leftOnlyCount: number;
  rightOnlyCount: number;
  bothCount: number;
  divergentCount: number;
  entities: SyncAuditMachineCompareEntity[];
}

export interface SyncAuditReconstructedFieldDiff {
  fieldName: string;
  reconstructedValue: string | null;
  currentValue: string | null;
}

export interface SyncAuditReconstruction {
  entityType: string;
  entityId: number;
  asOf: string;
  appliedChangeCount: number;
  machinesSeen: string[];
  reconstructedFields: Record<string, string>;
  diffsFromCurrent: SyncAuditReconstructedFieldDiff[];
  warnings: string[];
}

export interface SyncAuditCurrentRow {
  tableName: string;
  rowExists: boolean;
  deleted: boolean | null;
  dateCreated: string | null;
  dateModified: string | null;
  version: number | null;
  rawRow: Record<string, any> | null;
}

export interface SyncAuditFieldChange {
  id: string;
  timestamp: string | null;
  receivedAt: string | null;
  changeType: string | null;
  fieldName: string | null;
  relationshipType: string | null;
  oldValue: string | null;
  newValue: string | null;
  originMachineId: string | null;
  originMachineName: string | null;
  syncedToMachines: string | null;
}

export interface SyncAuditEntityReport {
  entityType: string;
  entityId: number;
  totalChanges: number;
  visibleTimelineChanges: number;
  firstChangeAt: string | null;
  lastChangeAt: string | null;
  changeTypeCounts: Record<string, number>;
  machines: string[];
  touchedFields: string[];
  machineSummaries: SyncAuditMachineSummary[];
  warnings: string[];
  signals: SyncAuditSignal;
  currentRow: SyncAuditCurrentRow;
  relatedEntities: SyncAuditRelatedEntity[];
  timeline: SyncAuditFieldChange[];
}

export interface SyncAuditFilters {
  machineId?: string;
  fieldName?: string;
  changeType?: string;
  from?: string;
  to?: string;
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

  getSyncAuditTypes(): Observable<SpringApiResponse<SyncAuditTypeSummary[]>> {
    return this.http.get<SpringApiResponse<SyncAuditTypeSummary[]>>(
      `${this.apiUrl}/sync-audit/types`
    );
  }

  getRecentSyncAuditEntities(entityType: string, limit: number = 25, filters?: SyncAuditFilters): Observable<SpringApiResponse<SyncAuditRecentEntity[]>> {
    let params = new HttpParams()
      .set('entityType', entityType)
      .set('limit', limit.toString());
    params = this.applySyncAuditFilters(params, filters);
    return this.http.get<SpringApiResponse<SyncAuditRecentEntity[]>>(
      `${this.apiUrl}/sync-audit/recent`,
      { params }
    );
  }

  getSyncAuditEntityReport(entityType: string, entityId: number, limit: number = 200, filters?: SyncAuditFilters): Observable<SpringApiResponse<SyncAuditEntityReport>> {
    let params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId.toString())
      .set('limit', limit.toString());
    params = this.applySyncAuditFilters(params, filters);
    return this.http.get<SpringApiResponse<SyncAuditEntityReport>>(
      `${this.apiUrl}/sync-audit/entity`,
      { params }
    );
  }

  exportSyncAuditEntityReport(entityType: string, entityId: number, limit: number = 200, filters?: SyncAuditFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId.toString())
      .set('limit', limit.toString());
    params = this.applySyncAuditFilters(params, filters);
    return this.http.get(`${this.apiUrl}/sync-audit/export`, {
      params,
      responseType: 'blob'
    });
  }

  exportSyncAuditIncidentReport(entityType: string,
                                entityId: number,
                                limit: number = 200,
                                filters?: SyncAuditFilters,
                                leftMachineId?: string,
                                rightMachineId?: string,
                                compareLimit?: number,
                                asOf?: string): Observable<Blob> {
    let params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId.toString())
      .set('limit', limit.toString());
    params = this.applySyncAuditFilters(params, filters);
    if (leftMachineId?.trim()) {
      params = params.set('leftMachineId', leftMachineId.trim());
    }
    if (rightMachineId?.trim()) {
      params = params.set('rightMachineId', rightMachineId.trim());
    }
    if (compareLimit) {
      params = params.set('compareLimit', compareLimit.toString());
    }
    if (asOf?.trim()) {
      params = params.set('asOf', asOf.trim());
    }
    return this.http.get(`${this.apiUrl}/sync-audit/incident-report`, {
      params,
      responseType: 'blob'
    });
  }

  compareSyncAuditMachines(entityType: string,
                           leftMachineId: string,
                           rightMachineId: string,
                           limit: number = 200,
                           filters?: SyncAuditFilters): Observable<SpringApiResponse<SyncAuditMachineCompareReport>> {
    let params = new HttpParams()
      .set('entityType', entityType)
      .set('leftMachineId', leftMachineId)
      .set('rightMachineId', rightMachineId)
      .set('limit', limit.toString());
    params = this.applySyncAuditFilters(params, {
      fieldName: filters?.fieldName,
      changeType: filters?.changeType,
      from: filters?.from,
      to: filters?.to
    });
    return this.http.get<SpringApiResponse<SyncAuditMachineCompareReport>>(
      `${this.apiUrl}/sync-audit/compare-machines`,
      { params }
    );
  }

  reconstructSyncAuditEntity(entityType: string, entityId: number, asOf: string): Observable<SpringApiResponse<SyncAuditReconstruction>> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId.toString())
      .set('asOf', asOf);
    return this.http.get<SpringApiResponse<SyncAuditReconstruction>>(
      `${this.apiUrl}/sync-audit/reconstruct`,
      { params }
    );
  }

  private applySyncAuditFilters(params: HttpParams, filters?: SyncAuditFilters): HttpParams {
    if (!filters) {
      return params;
    }

    if (filters.machineId?.trim()) {
      params = params.set('machineId', filters.machineId.trim());
    }
    if (filters.fieldName?.trim()) {
      params = params.set('fieldName', filters.fieldName.trim());
    }
    if (filters.changeType?.trim()) {
      params = params.set('changeType', filters.changeType.trim());
    }
    if (filters.from?.trim()) {
      params = params.set('from', filters.from.trim());
    }
    if (filters.to?.trim()) {
      params = params.set('to', filters.to.trim());
    }

    return params;
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
