import { Injectable } from '@angular/core';

const STORAGE_KEYS = {
  BOXES: 'loto-boxes',
  SYNC_QUEUE: 'loto-sync-queue',
  AUDIT_LOGS: 'loto-audit-logs',
  LAST_SYNC: 'loto-last-sync',
  NETWORK_MODE: 'loto-network-mode'
} as const;

const MAX_LOG_ENTRIES = 1000;
const MAX_STORAGE_SIZE_MB = 4; // Keep under 5MB localStorage limit

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /**
   * Get an item from localStorage with JSON parsing
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Failed to parse localStorage item: ${key}`, e);
      return null;
    }
  }

  /**
   * Set an item in localStorage with JSON serialization
   */
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Failed to save to localStorage: ${key}`, e);
      // Attempt cleanup if quota exceeded
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Remove an item from localStorage
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Get boxes from storage
   */
  getBoxes<T>(): T | null {
    return this.get<T>(STORAGE_KEYS.BOXES);
  }

  /**
   * Save boxes to storage
   */
  saveBoxes<T>(boxes: T): boolean {
    return this.set(STORAGE_KEYS.BOXES, boxes);
  }

  /**
   * Get sync queue from storage
   */
  getSyncQueue<T>(): T[] {
    return this.get<T[]>(STORAGE_KEYS.SYNC_QUEUE) || [];
  }

  /**
   * Save sync queue to storage
   */
  saveSyncQueue<T>(queue: T[]): boolean {
    return this.set(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  /**
   * Get audit logs from storage
   */
  getAuditLogs<T>(): T[] {
    return this.get<T[]>(STORAGE_KEYS.AUDIT_LOGS) || [];
  }

  /**
   * Save audit logs with automatic trimming
   */
  saveAuditLogs<T>(logs: T[]): boolean {
    // Trim to max entries
    const trimmedLogs = logs.slice(-MAX_LOG_ENTRIES);
    return this.set(STORAGE_KEYS.AUDIT_LOGS, trimmedLogs);
  }

  /**
   * Get last sync timestamp
   */
  getLastSync(): Date | null {
    const timestamp = this.get<string>(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Set last sync timestamp
   */
  setLastSync(date: Date): boolean {
    return this.set(STORAGE_KEYS.LAST_SYNC, date.toISOString());
  }

  /**
   * Get stored network mode
   */
  getNetworkMode(): string | null {
    return this.get<string>(STORAGE_KEYS.NETWORK_MODE);
  }

  /**
   * Save network mode
   */
  saveNetworkMode(mode: string): boolean {
    return this.set(STORAGE_KEYS.NETWORK_MODE, mode);
  }

  /**
   * Get estimated storage usage in bytes
   */
  getStorageUsage(): number {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total * 2; // UTF-16 characters = 2 bytes each
  }

  /**
   * Get storage usage in MB
   */
  getStorageUsageMB(): number {
    return this.getStorageUsage() / (1024 * 1024);
  }

  /**
   * Check if storage is near capacity
   */
  isStorageNearCapacity(): boolean {
    return this.getStorageUsageMB() > MAX_STORAGE_SIZE_MB;
  }

  /**
   * Cleanup old data to free storage space
   */
  cleanup(): void {
    // Trim audit logs
    const logs = this.getAuditLogs<unknown>();
    if (logs.length > MAX_LOG_ENTRIES / 2) {
      this.saveAuditLogs(logs.slice(-MAX_LOG_ENTRIES / 2));
    }

    // Clear old sync queue entries (keep only last 50)
    const queue = this.getSyncQueue<unknown>();
    if (queue.length > 50) {
      this.saveSyncQueue(queue.slice(-50));
    }
  }

  /**
   * Clear all app storage
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
