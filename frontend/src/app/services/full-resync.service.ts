import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { catchError, map, switchMap, takeWhile, tap } from 'rxjs/operators';
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

export interface RestartProgress {
  isRestarting: boolean;
  message: string;
  checkCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class FullResyncService {
  private baseUrl = `${environment.baseApiUrl}/api/resync`;

  // Observable for tracking restart progress
  private restartProgress = new BehaviorSubject<RestartProgress>({
    isRestarting: false,
    message: '',
    checkCount: 0
  });

  restartProgress$ = this.restartProgress.asObservable();

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

  /**
   * Check if backend is available (for restart detection)
   */
  checkBackendHealth(): Observable<boolean> {
    return this.http.get<SyncHealthStatus>(`${this.baseUrl}/health`, {
      // Short timeout to quickly detect if server is down
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Start monitoring for application restart completion.
   * Shows restart message and polls until backend is available again.
   */
  startRestartMonitoring(): void {
    this.restartProgress.next({
      isRestarting: true,
      message: 'Application is restarting. Please wait...',
      checkCount: 0
    });

    // Wait a bit before starting to poll (give the app time to shut down)
    setTimeout(() => {
      this.pollForRestart();
    }, 3000);
  }

  /**
   * Poll the backend until it becomes available again
   */
  private pollForRestart(): void {
    let checkCount = 0;
    const maxChecks = 60; // Max 60 checks (about 2 minutes)

    const checkInterval = interval(2000).pipe(
      takeWhile(() => checkCount < maxChecks),
      switchMap(() => {
        checkCount++;
        this.restartProgress.next({
          isRestarting: true,
          message: `Waiting for application to restart... (${checkCount})`,
          checkCount
        });
        return this.checkBackendHealth();
      })
    ).subscribe({
      next: (isAvailable) => {
        if (isAvailable) {
          checkInterval.unsubscribe();
          this.restartProgress.next({
            isRestarting: false,
            message: 'Application restarted successfully!',
            checkCount
          });

          // Auto-reload the page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      },
      error: () => {
        this.restartProgress.next({
          isRestarting: false,
          message: 'Restart monitoring stopped. Please refresh the page manually.',
          checkCount
        });
      },
      complete: () => {
        if (checkCount >= maxChecks) {
          this.restartProgress.next({
            isRestarting: false,
            message: 'Restart taking longer than expected. Please refresh the page manually.',
            checkCount
          });
        }
      }
    });
  }

  /**
   * Stop restart monitoring (if needed)
   */
  stopRestartMonitoring(): void {
    this.restartProgress.next({
      isRestarting: false,
      message: '',
      checkCount: 0
    });
  }
}
