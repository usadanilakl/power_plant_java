import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of, Subscription } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SyncStatus {
  machineId: string;
  machineName: string;
  localIp: string;
  syncPort: number;
  discoveryPort: number;
  discoveryEnabled: boolean;
  syncIntervalSeconds: number;
  activePeers: Peer[];
  peerCount: number;
  totalChangesTracked: number;
  // Server sync fields
  serverSyncEnabled?: boolean;
  syncRuntimeEnabled?: boolean;
  serverSyncConfigured?: boolean;
  syncServerUrl?: string;
  serverAvailable?: boolean;
  sseConnected?: boolean;
  pendingServerChanges?: number;
  syncMode?: 'SERVER' | 'PEER_TO_PEER';
  realtimeEnabled?: boolean;
}

export interface SyncToggleState {
  enabled: boolean;
  configured: boolean;
  effectivelyEnabled: boolean;
}

export interface SyncToggleResponse {
  success: boolean;
  enabled: boolean;
  effectivelyEnabled: boolean;
  message: string;
}

export interface Peer {
  machineId: string;
  machineName: string;
  ipAddress: string;
  port: number;
  lastSeen: string;
  lastSyncTime: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
}

export interface FieldChange {
  id: string;
  entityType: string;
  entityId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  originMachineId: string;
  originMachineName: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  relationshipType: string | null;
}

export interface TriggerSyncResponse {
  success: boolean;
  message: string;
  activePeers?: number;
}

@Injectable({ providedIn: 'root' })
export class SyncStatusService {
  private apiUrl = `${environment.baseApiUrl}/api/field-sync`;
  private resyncApiUrl = `${environment.baseApiUrl}/api/resync`;
  private statusSubject = new BehaviorSubject<SyncStatus | null>(null);
  private syncHealthSubject = new BehaviorSubject<SyncHealthCheckResult | null>(null);
  private pollingSubscription: Subscription | null = null;
  private healthCheckSubscription: Subscription | null = null;

  status$ = this.statusSubject.asObservable();
  syncHealth$ = this.syncHealthSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Start polling for sync status
   * @param intervalMs Polling interval in milliseconds (default: 10000)
   */
  startPolling(intervalMs: number = 10000): void {
    if (this.pollingSubscription) {
      return; // Already polling
    }

    // Initial fetch
    this.fetchStatus().subscribe();

    // Poll at interval
    this.pollingSubscription = interval(intervalMs).pipe(
      switchMap(() => this.fetchStatus())
    ).subscribe();
  }

  /**
   * Stop polling for sync status
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Fetch current sync status
   */
  fetchStatus(): Observable<SyncStatus | null> {
    return this.http.get<SyncStatus>(`${this.apiUrl}/status`).pipe(
      tap(status => this.statusSubject.next(status)),
      catchError(err => {
        console.error('Failed to fetch sync status:', err);
        return of(null);
      })
    );
  }

  /**
   * Get current status value (non-observable)
   */
  getCurrentStatus(): SyncStatus | null {
    return this.statusSubject.value;
  }

  /**
   * Manually trigger sync with all peers
   */
  triggerSync(): Observable<TriggerSyncResponse> {
    return this.http.post<TriggerSyncResponse>(`${this.apiUrl}/trigger`, {});
  }

  /**
   * Get list of active peers
   */
  getPeers(): Observable<Peer[]> {
    return this.http.get<Peer[]>(`${this.apiUrl}/peers`);
  }

  /**
   * Get all known peers (including offline)
   */
  getAllPeers(): Observable<Peer[]> {
    return this.http.get<Peer[]>(`${this.apiUrl}/peers/all`);
  }

  /**
   * Get changes for a specific entity
   */
  getEntityChanges(entityType: string, entityId: number): Observable<FieldChange[]> {
    return this.http.get<FieldChange[]>(`${this.apiUrl}/changes/${entityType}/${entityId}`);
  }

  /**
   * Get changes by origin machine
   */
  getChangesByMachine(machineId: string): Observable<FieldChange[]> {
    return this.http.get<FieldChange[]>(`${this.apiUrl}/changes/machine/${machineId}`);
  }

  /**
   * Get all changes since a timestamp
   */
  getChangesSince(since: Date): Observable<FieldChange[]> {
    const isoDate = since.toISOString();
    return this.http.get<FieldChange[]>(`${this.apiUrl}/changes`, {
      params: { since: isoDate }
    });
  }

  /**
   * Broadcast presence to network
   */
  broadcastPresence(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/broadcast`, {});
  }

  /**
   * Health check
   */
  healthCheck(): Observable<{ status: string; machineId: string; machineName: string; timestamp: string }> {
    return this.http.get<{ status: string; machineId: string; machineName: string; timestamp: string }>(`${this.apiUrl}/health`);
  }

  /**
   * Manually register a peer (bypasses UDP discovery)
   */
  registerPeer(ip: string, port: number = 8082, name?: string): Observable<RegisterPeerResponse> {
    return this.http.post<RegisterPeerResponse>(`${this.apiUrl}/peers/register`, { ip, port, name });
  }

  /**
   * Get all changes (recent)
   */
  getAllChanges(): Observable<FieldChange[]> {
    return this.http.get<FieldChange[]>(`${this.apiUrl}/changes`);
  }

  /**
   * Get file sync queue status
   */
  getFileSyncStatus(): Observable<FileSyncStatus> {
    return this.http.get<FileSyncStatus>(`${this.apiUrl}/file-sync/status`);
  }

  /**
   * Get sync server health status (calls sync server directly)
   */
  getSyncServerHealth(syncServerUrl: string): Observable<SyncServerHealth> {
    return this.http.get<SyncServerHealth>(`${syncServerUrl}/api/sync/health`);
  }

  /**
   * Start polling for sync health check status
   * @param intervalMs Polling interval in milliseconds (default: 60000 - 1 minute)
   */
  startHealthCheckPolling(intervalMs: number = 60000): void {
    if (this.healthCheckSubscription) {
      return; // Already polling
    }

    // Initial fetch
    this.fetchSyncHealthCheck().subscribe();

    // Poll at interval
    this.healthCheckSubscription = interval(intervalMs).pipe(
      switchMap(() => this.fetchSyncHealthCheck())
    ).subscribe();
  }

  /**
   * Stop polling for sync health check
   */
  stopHealthCheckPolling(): void {
    if (this.healthCheckSubscription) {
      this.healthCheckSubscription.unsubscribe();
      this.healthCheckSubscription = null;
    }
  }

  /**
   * Fetch current sync health check status
   */
  fetchSyncHealthCheck(): Observable<SyncHealthCheckResult | null> {
    return this.http.get<SyncHealthCheckResult>(`${this.resyncApiUrl}/sync-health`).pipe(
      tap(health => this.syncHealthSubject.next(health)),
      catchError(err => {
        console.debug('Failed to fetch sync health check:', err);
        return of(null);
      })
    );
  }

  /**
   * Get current sync health check value (non-observable)
   */
  getCurrentSyncHealth(): SyncHealthCheckResult | null {
    return this.syncHealthSubject.value;
  }

  /**
   * Force an immediate sync health check
   */
  forceSyncHealthCheck(): Observable<SyncHealthCheckResult> {
    return this.http.post<SyncHealthCheckResult>(`${this.resyncApiUrl}/sync-health/check`, {}).pipe(
      tap(health => this.syncHealthSubject.next(health))
    );
  }

  /**
   * Get current sync toggle state
   */
  getSyncToggle(): Observable<SyncToggleState> {
    return this.http.get<SyncToggleState>(`${this.apiUrl}/sync-toggle`);
  }

  /**
   * Set sync toggle state (enable/disable sync at runtime)
   */
  setSyncToggle(enabled: boolean): Observable<SyncToggleResponse> {
    return this.http.post<SyncToggleResponse>(`${this.apiUrl}/sync-toggle`, { enabled });
  }

  /**
   * Get detailed sync metrics
   */
  getSyncMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics`);
  }
}

export interface RegisterPeerResponse {
  success: boolean;
  message: string;
  peer?: {
    machineId: string;
    machineName: string;
    ip: string;
    port: number;
  };
}

export interface FileSyncStatus {
  enabled: boolean;
  syncServerUrl: string;
  queues: {
    pendingUploads: number;
    pendingDownloads: number;
    inProgressUploads: number;
    inProgressDownloads: number;
  };
}

export interface SyncServerHealth {
  status: string;
  fileStorage?: {
    available: boolean;
    path: string;
    exists: boolean;
    writable: boolean;
    freeSpaceBytes: number;
    freeSpaceMB: number;
    totalSpaceBytes: number;
    usableSpaceBytes: number;
    usedBySync?: {
      bytes: number;
      megabytes: number;
      fileCount: number;
    };
  };
  sseConnections?: number;
  activeClients?: number;
  warning?: string;
}

// Sync health check types (from background health checker)
export type SyncHealthStatusType = 'IN_SYNC' | 'POSSIBLY_OUT_OF_SYNC' | 'OUT_OF_SYNC' | 'UNKNOWN';

export interface SyncHealthCheckResult {
  checkTime: string;
  machineId: string;
  syncStatus: SyncHealthStatusType;
  message: string;
  serverReachable: boolean;
  entityDifference: number;
  fileDifference: number;
  localStats: {
    entityCounts: Record<string, number>;
    totalEntities: number;
    fileCount: number;
    latestChangeTime: string | null;
    recentChangeCount: number;
    pendingSyncCount: number;
  } | null;
  serverStats: {
    entityCounts: Record<string, number>;
    totalEntities: number;
    fileCount: number;
    latestChangeTime: string | null;
    totalFieldChanges: number;
  } | null;
  // Sync suggestion fields
  suggestResync: boolean;              // True if system recommends a resync
  suggestedSyncDate: string | null;    // yyyy-MM-dd format date to sync from
  lastSuccessfulSyncTime: string | null; // When was the last successful sync
  recommendation: string | null;       // Human-readable recommendation message
  consecutiveOutOfSyncCount: number;   // How many consecutive checks were out of sync
  autoResyncState: AutoResyncState | null; // Current auto-resync escalation state
}

export interface AutoResyncState {
  escalationLevel: number;
  lastAttemptTime: string | null;
  lastAttemptSuccess: boolean;
  lastAttemptDate: string | null;
  lastAttemptMessage: string | null;
  autoResyncExhausted: boolean;
  autoResyncInProgress: boolean;
}
