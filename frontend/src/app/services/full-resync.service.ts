import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SyncHealthStatus {
  machineId: string;
  machineName: string;
  timestamp: string;
  backupAvailable: boolean;
  backupTimestamp: string | null;
  backupMachineId: string | null;
  backupFileCount: number;
  localFileCount: number;
  fileDifference: number;
  potentialMismatch: boolean;
  errorMessage: string | null;
  serverEntityCount: number;  // Number of entities on sync server
}

export interface FileManifestEntry {
  relativePath: string;
  checksum: string;
  size: number;
  lastModified: string;
}

export interface FileComparisonResult {
  totalBackupFiles: number;
  totalLocalFiles: number;
  filesToDownload: FileManifestEntry[];
  filesToDelete: string[];
  unchangedFiles: string[];
  errorMessage: string | null;
}

export interface BackupMetadata {
  timestamp: string;
  machineId: string;
  machineName: string;
  databaseBackupFile: string;
  fileCount: number;
  totalFileSize: number;
}

export interface BackupResult {
  success: boolean;
  message: string;
  metadata: BackupMetadata | null;
}

export interface ResyncResult {
  success: boolean;
  message: string;
  comparison: FileComparisonResult | null;
}

export interface ResyncStatus {
  startTime: string | null;
  endTime: string | null;
  phase: string;
  totalFiles: number;
  processedFiles: number;
  success: boolean;
}

export interface BackupStatus {
  startTime: string | null;
  endTime: string | null;
  phase: string;
  totalFiles: number;
  processedFiles: number;
  success: boolean;
}

export interface OperationStatus {
  resyncInProgress: boolean;
  backupInProgress: boolean;
  resyncStatus: ResyncStatus;
  backupStatus: BackupStatus;
}

@Injectable({
  providedIn: 'root'
})
export class FullResyncService {
  private baseUrl = `${environment.baseApiUrl}/api/resync`;

  constructor(private http: HttpClient) {}

  /**
   * Get current sync health status
   */
  getSyncHealth(): Observable<SyncHealthStatus> {
    return this.http.get<SyncHealthStatus>(`${this.baseUrl}/health`);
  }

  /**
   * Preview what would happen in a resync
   */
  previewResync(): Observable<FileComparisonResult> {
    return this.http.get<FileComparisonResult>(`${this.baseUrl}/preview`);
  }

  /**
   * Execute full resync
   */
  executeResync(force: boolean = false): Observable<ResyncResult> {
    return this.http.post<ResyncResult>(`${this.baseUrl}/execute?force=${force}`, {});
  }

  /**
   * Get current operation status
   */
  getStatus(): Observable<OperationStatus> {
    return this.http.get<OperationStatus>(`${this.baseUrl}/status`);
  }

  /**
   * Create a full backup
   */
  createBackup(): Observable<BackupResult> {
    return this.http.post<BackupResult>(`${this.baseUrl}/backup`, {});
  }

  /**
   * Get backup status
   */
  getBackupStatus(): Observable<BackupStatus> {
    return this.http.get<BackupStatus>(`${this.baseUrl}/backup/status`);
  }
}
