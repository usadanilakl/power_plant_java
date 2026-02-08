/**
 * SyncStatusManager - Monitors sync status, detects staleness,
 * triggers full resync, and checks for device number conflicts.
 * Queries the local Spring Boot API for sync metrics and the
 * sync server for device registry/conflict info.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { SyncStatusInfo, IpcResult } from '../../shared/types';
import { DEFAULT_SPRING_BOOT_CONFIG, DEFAULT_SYNC_SERVER } from '../constants';

const SYNC_STATUS_FILE = 'sync-status.json';
const STALE_THRESHOLD_DAYS = 14;

interface PersistedSyncStatus {
  lastSyncTime: string | null;
  lastSyncType: 'incremental' | 'full' | null;
}

export class SyncStatusManager {
  private workingDir: string;
  private statusFilePath: string;

  constructor() {
    this.workingDir = path.resolve(__dirname, '..', '..', '..', '..', DEFAULT_SPRING_BOOT_CONFIG.workingDir);
    this.statusFilePath = path.join(this.workingDir, SYNC_STATUS_FILE);
  }

  /** Get comprehensive sync status from local Spring Boot */
  public async getSyncStatus(): Promise<IpcResult<SyncStatusInfo>> {
    const localUrl = `http://localhost:${DEFAULT_SPRING_BOOT_CONFIG.port}`;

    try {
      // Fetch metrics and status in parallel
      const [metrics, status] = await Promise.all([
        this.httpGet(`${localUrl}/api/field-sync/metrics`),
        this.httpGet(`${localUrl}/api/field-sync/status`)
      ]);

      const info: SyncStatusInfo = {
        lastSyncTime: metrics?.lastSyncTime || this.getPersistedLastSyncTime(),
        serverAvailable: status?.serverAvailable ?? false,
        pendingChanges: metrics?.pendingChanges ?? 0,
        sseConnected: status?.sseConnected ?? false,
        syncInProgress: status?.syncInProgress ?? false,
        deviceConflict: status?.deviceNumberConflict != null,
        conflictDetails: status?.deviceNumberConflict || undefined
      };

      // Persist last sync time for pre-startup reads
      if (info.lastSyncTime) {
        this.persistSyncStatus(info.lastSyncTime, 'incremental');
      }

      return { success: true, data: info };
    } catch (err: any) {
      // Spring Boot may not be running — fall back to persisted data
      const persisted = this.getPersistedStatus();
      return {
        success: true,
        data: {
          lastSyncTime: persisted?.lastSyncTime || null,
          serverAvailable: false,
          pendingChanges: 0,
          sseConnected: false,
          syncInProgress: false,
          deviceConflict: false
        }
      };
    }
  }

  /** Check if sync is stale (older than threshold) — works without Spring Boot running */
  public isSyncStale(thresholdDays: number = STALE_THRESHOLD_DAYS): { stale: boolean; daysSinceSync: number | null } {
    const lastSync = this.getPersistedLastSyncTime();
    if (!lastSync) {
      return { stale: true, daysSinceSync: null }; // Never synced
    }

    const daysSince = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24);
    return {
      stale: daysSince > thresholdDays,
      daysSinceSync: Math.round(daysSince)
    };
  }

  /** Trigger a full resync on the local Spring Boot instance */
  public async triggerFullResync(): Promise<IpcResult> {
    const localUrl = `http://localhost:${DEFAULT_SPRING_BOOT_CONFIG.port}`;

    return new Promise((resolve) => {
      try {
        const endpoint = new URL(`${localUrl}/api/resync/execute`);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname + '?force=true',
            method: 'POST',
            timeout: 30000,
            headers: { 'Content-Length': '0' }
          },
          (res) => {
            let body = '';
            res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                console.log('Full resync triggered successfully');
                resolve({ success: true });
              } else {
                resolve({ success: false, error: `Resync returned HTTP ${res.statusCode}: ${body}` });
              }
            });
          }
        );

        req.on('error', (err) => {
          resolve({ success: false, error: `Cannot reach local Spring Boot: ${err.message}` });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Resync request timed out' });
        });

        req.end();
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /** Get resync progress from the local Spring Boot instance */
  public async getResyncStatus(): Promise<IpcResult<any>> {
    const localUrl = `http://localhost:${DEFAULT_SPRING_BOOT_CONFIG.port}`;

    try {
      const data = await this.httpGet(`${localUrl}/api/resync/status`);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /** Check device number conflict against the sync server's device registry */
  public async checkDeviceConflict(
    machineId: string,
    deviceNumber: number,
    serverUrl?: string
  ): Promise<{ conflict: boolean; details?: string }> {
    const url = serverUrl || DEFAULT_SYNC_SERVER.url;

    try {
      const data = await this.httpGet(`${url}/api/sync/device-registry`);
      if (!data || !data.devices) {
        return { conflict: false };
      }

      // Find any other device with the same number but different machineId
      const conflicting = data.devices.find(
        (d: any) => d.deviceNumber === deviceNumber && d.machineId !== machineId
      );

      if (conflicting) {
        return {
          conflict: true,
          details: `Device #${deviceNumber} is also used by "${conflicting.deviceName}" (${conflicting.machineId})`
        };
      }

      return { conflict: false };
    } catch {
      // Server unreachable — can't check
      return { conflict: false };
    }
  }

  /** Update persisted sync time (called after successful syncs) */
  public persistSyncStatus(lastSyncTime: string, syncType: 'incremental' | 'full'): void {
    const status: PersistedSyncStatus = { lastSyncTime, lastSyncType: syncType };
    try {
      fs.writeFileSync(this.statusFilePath, JSON.stringify(status, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing sync-status.json:', err);
    }
  }

  /** Read persisted sync status (works without Spring Boot running) */
  private getPersistedStatus(): PersistedSyncStatus | null {
    if (!fs.existsSync(this.statusFilePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(this.statusFilePath, 'utf-8'));
    } catch {
      return null;
    }
  }

  /** Get last sync time from persisted file */
  private getPersistedLastSyncTime(): string | null {
    return this.getPersistedStatus()?.lastSyncTime || null;
  }

  /** Generic HTTP GET helper that returns parsed JSON */
  private httpGet(urlStr: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const endpoint = new URL(urlStr);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname + (endpoint.search || ''),
            method: 'GET',
            timeout: 10000
          },
          (res) => {
            let body = '';
            res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            res.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch {
                resolve(null);
              }
            });
          }
        );

        req.on('error', (err) => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
