import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { StorageService } from './storage.service';
import { NetworkModeService, NetworkMode } from './network-mode.service';
import { LotoBox } from '../models/loto-box.model';

const SYNC_INTERVAL_MS = 60000; // Sync every minute when server available

export interface SyncStatus {
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
  lastError: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DataSyncService implements OnDestroy {
  private storage = inject(StorageService);
  private networkMode = inject(NetworkModeService);

  // Sync status
  private _syncStatus = signal<SyncStatus>({
    lastSync: null,
    pendingChanges: 0,
    isSyncing: false,
    lastError: null
  });
  readonly syncStatus = this._syncStatus.asReadonly();

  private syncSubscription: Subscription | null = null;

  constructor() {
    // Load last sync time from storage
    const lastSync = this.storage.getLastSync();
    if (lastSync) {
      this.updateSyncStatus({ lastSync });
    }

    // Start sync interval (for future server sync)
    this.startSyncInterval();
  }

  ngOnDestroy(): void {
    this.stopSyncInterval();
  }

  /**
   * Start periodic sync with server (when available)
   */
  private startSyncInterval(): void {
    this.syncSubscription = interval(SYNC_INTERVAL_MS).subscribe(() => {
      if (this.networkMode.networkMode() === NetworkMode.SERVER) {
        this.syncWithServer();
      }
    });
  }

  /**
   * Stop periodic sync
   */
  private stopSyncInterval(): void {
    this.syncSubscription?.unsubscribe();
    this.syncSubscription = null;
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(partial: Partial<SyncStatus>): void {
    this._syncStatus.update(current => ({
      ...current,
      ...partial
    }));
  }

  /**
   * Sync data with server (future implementation)
   */
  async syncWithServer(): Promise<boolean> {
    if (this.networkMode.networkMode() !== NetworkMode.SERVER) {
      return false;
    }

    this.updateSyncStatus({ isSyncing: true, lastError: null });

    try {
      // Future: Implement actual server sync
      // 1. Get local changes since last sync
      // 2. Send to server
      // 3. Receive server changes
      // 4. Merge (server wins on conflicts)
      // 5. Update local storage

      const now = new Date();
      this.storage.setLastSync(now);
      this.updateSyncStatus({
        isSyncing: false,
        lastSync: now,
        pendingChanges: 0
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateSyncStatus({
        isSyncing: false,
        lastError: errorMessage
      });
      return false;
    }
  }

  /**
   * Save boxes to local storage
   */
  saveToLocalStorage(boxes: LotoBox[]): boolean {
    const success = this.storage.saveBoxes(boxes);
    if (success) {
      // Track pending changes for future server sync
      const currentStatus = this._syncStatus();
      this.updateSyncStatus({
        pendingChanges: currentStatus.pendingChanges + 1
      });
    }
    return success;
  }

  /**
   * Load boxes from local storage
   */
  loadFromLocalStorage(): LotoBox[] | null {
    return this.storage.getBoxes<LotoBox[]>();
  }

  /**
   * Force manual sync
   */
  async forceSync(): Promise<boolean> {
    if (this.networkMode.networkMode() === NetworkMode.SERVER) {
      return this.syncWithServer();
    }

    // If not connected to server, just update the sync timestamp
    // to indicate local save was successful
    const now = new Date();
    this.storage.setLastSync(now);
    this.updateSyncStatus({ lastSync: now });
    return true;
  }

  /**
   * Get time since last sync in human-readable format
   */
  getTimeSinceSync(): string {
    const lastSync = this._syncStatus().lastSync;
    if (!lastSync) {
      return 'Never';
    }

    const diff = Date.now() - lastSync.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}
