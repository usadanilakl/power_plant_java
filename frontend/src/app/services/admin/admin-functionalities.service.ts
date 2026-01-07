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
}
