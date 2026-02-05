import { Page, expect } from '@playwright/test';
import { config } from '../test.config';

export interface SeedRequest {
  prefix: string;
  categories: { name: string; values: string[] }[];
  equipmentCount: number;
  lotoPointCount: number;
  lotoStandardCount: number;
  lotoPointsPerStandard: number;
}

export interface SeedResult {
  success: boolean;
  prefix: string;
  categoryIds: number[];
  valueIds: number[];
  equipmentIds: number[];
  lotoPointIds: number[];
  lotoStandardIds: number[];
  totalEntities: number;
  durationMs: number;
}

export interface DedupSeedResult {
  success: boolean;
  prefix: string;
  categoryA: { id: number; name: string };
  categoryB: { id: number; name: string };
  valuesA: { id: number; name: string }[];
  valuesB: { id: number; name: string }[];
  lotoPointIds: number[];
  equipmentIds: number[];
  durationMs: number;
}

export interface BulkSeedResult {
  success: boolean;
  prefix: string;
  lotoStandardsCreated: number;
  lotoPointsCreated: number;
  totalEntities: number;
  durationMs: number;
  entitiesPerSecond: number;
}

export interface VerifyResult {
  prefix: string;
  categories: any[];
  values: any[];
  equipment: any[];
  lotoPoints: any[];
  lotoStandards: any[];
  counts: {
    categories: number;
    values: number;
    equipment: number;
    lotoPoints: number;
    lotoStandards: number;
  };
}

export interface FileSeedResult {
  success: boolean;
  prefix: string;
  fileTypeCategoryId: number;
  vendorCategoryId: number;
  fileTypeValueIds: Record<string, number>;
  vendorValueIds: Record<string, number>;
  fileObjectIds: number[];
  equipmentIds: number[];
  lotoPointIds: number[];
  lotoStandardIds: number[];
  filesOnDisk: string[];
  totalEntities: number;
  durationMs: number;
}

export interface FileVerifyResult {
  fileObjects: {
    id: number;
    name: string;
    fileNumber: string;
    vendorId: number | null;
    vendorName: string | null;
    fileTypeId: number | null;
    fileTypeName: string | null;
    fileLink: string | null;
    folder: string | null;
    extension: string;
    extensions: string;
    fileExistsOnDisk: boolean;
    equipmentIds: number[];
  }[];
  equipment: {
    id: number;
    name: string;
    fileIds: number[];
    lotoPointIds: number[];
    eqTypeId: number | null;
    locationId: number | null;
  }[];
  lotoPoints: {
    id: number;
    name: string;
    eqTypeId: number | null;
    locationId: number | null;
    isoPosId: number | null;
    normPosId: number | null;
  }[];
  lotoStandards: {
    id: number;
    name: string;
    lotoPointIds: number[];
    lotoPointOrder: Record<string, number>;
    groupIds: number[];
  }[];
  counts: {
    fileObjects: number;
    equipment: number;
    lotoPoints: number;
    lotoStandards: number;
  };
}

export class SyncE2EPage {
  readonly page: Page;
  private readonly clientBackendUrl: string;
  private readonly syncServerUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.clientBackendUrl = config.clientBackendUrl;
    this.syncServerUrl = config.syncServerUrl;
  }

  // ==================== SEED OPERATIONS ====================

  async seedEntityGraph(request: SeedRequest): Promise<SeedResult> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-e2e/seed`,
      { data: request, timeout: 60000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async seedDuplicateCategories(prefix?: string): Promise<DedupSeedResult> {
    const url = prefix
      ? `${this.clientBackendUrl}/api/sync-e2e/seed/dedup?prefix=${prefix}`
      : `${this.clientBackendUrl}/api/sync-e2e/seed/dedup`;
    const response = await this.page.request.post(url, { timeout: 30000 });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async seedBulkLotoStandards(count: number, prefix?: string, lotoPointsPerStandard: number = 3): Promise<BulkSeedResult> {
    let url = `${this.clientBackendUrl}/api/sync-e2e/seed/bulk?count=${count}&lotoPointsPerStandard=${lotoPointsPerStandard}`;
    if (prefix) url += `&prefix=${prefix}`;
    const response = await this.page.request.post(url, { timeout: 300000 });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== VERIFICATION ====================

  async verifyEntityGraph(prefix: string): Promise<VerifyResult> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/sync-e2e/verify/${prefix}`,
      { timeout: 30000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== CLEANUP ====================

  async cleanupByPrefix(prefix: string): Promise<any> {
    const response = await this.page.request.delete(
      `${this.clientBackendUrl}/api/sync-e2e/cleanup/${prefix}`,
      { timeout: 60000 }
    );
    return response.json();
  }

  async cleanupAll(): Promise<any> {
    const response = await this.page.request.delete(
      `${this.clientBackendUrl}/api/sync-e2e/cleanup/all`,
      { timeout: 60000 }
    );
    return response.json();
  }

  // ==================== SYNC OPERATIONS ====================

  async triggerSync(): Promise<any> {
    // Retry up to 10 times — sync may be in progress from SSE reconnect
    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await this.page.request.post(
        `${this.clientBackendUrl}/api/field-sync/trigger`,
        { timeout: 10000 }
      );
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      if (result.success) return result;
      // "Sync in progress" — wait and retry
      await this.page.waitForTimeout(2000);
    }
    // Return last result even if not successful
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/field-sync/trigger`,
      { timeout: 10000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async getSyncHealth(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/resync/sync-health`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async forceSyncHealthCheck(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/resync/sync-health/check`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async getEntityCounts(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/sync-test/entity-counts`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async triggerDedup(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-e2e/trigger-dedup`,
      { timeout: 30000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== COMBINED FLOWS ====================

  async seedAndSync(request: SeedRequest): Promise<{ seed: SeedResult; sync: any }> {
    const seed = await this.seedEntityGraph(request);
    const sync = await this.triggerSync();
    return { seed, sync };
  }

  // ==================== CONCURRENT CLIENT SIMULATION ====================

  async simulateConcurrentClients(
    clientCount: number,
    changesPerClient: number,
    entityType: string = 'Equipment'
  ): Promise<{ totalClients: number; totalChanges: number; successCount: number; failCount: number; durationMs: number }> {
    const start = Date.now();
    const promises: Promise<any>[] = [];

    for (let i = 0; i < clientCount; i++) {
      const machineId = `SIM-CLIENT-${String(i + 1).padStart(3, '0')}`;
      const changes = [];

      for (let j = 0; j < changesPerClient; j++) {
        changes.push({
          entityType,
          entityId: 900000 + i * 1000 + j,
          fieldName: 'specificLocation',
          newValue: `SimClient ${machineId} change ${j}`,
          oldValue: '',
          timestamp: new Date().toISOString(),
          originMachineId: machineId,
          originMachineName: `Simulated Client ${i + 1}`,
          changeType: 'UPDATE',
        });
      }

      promises.push(
        this.page.request.post(`${this.syncServerUrl}/api/sync/exchange`, {
          data: changes,
          headers: {
            'X-Machine-Id': machineId,
            'X-Machine-Name': `Simulated Client ${i + 1}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        })
      );
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.ok).length;
    const failCount = responses.filter(r => !r.ok).length;

    return {
      totalClients: clientCount,
      totalChanges: clientCount * changesPerClient,
      successCount,
      failCount,
      durationMs: Date.now() - start,
    };
  }

  /**
   * Simulate concurrent clients all updating the SAME entity field.
   * Used for LWW conflict resolution testing.
   */
  async simulateLWWConflict(
    clientCount: number,
    entityId: number = 999999
  ): Promise<{ clients: { machineId: string; timestamp: string }[]; durationMs: number }> {
    const start = Date.now();
    const clients: { machineId: string; timestamp: string }[] = [];
    const promises: Promise<any>[] = [];

    for (let i = 0; i < clientCount; i++) {
      const machineId = `LWW-CLIENT-${String(i + 1).padStart(3, '0')}`;
      // Stagger timestamps by 100ms each so there's a clear winner
      const timestamp = new Date(Date.now() + i * 100).toISOString();
      clients.push({ machineId, timestamp });

      const changes = [{
        entityType: 'Equipment',
        entityId,
        fieldName: 'specificLocation',
        newValue: `Value from ${machineId}`,
        oldValue: '',
        timestamp,
        originMachineId: machineId,
        originMachineName: `LWW Client ${i + 1}`,
        changeType: 'UPDATE',
      }];

      promises.push(
        this.page.request.post(`${this.syncServerUrl}/api/sync/exchange`, {
          data: changes,
          headers: {
            'X-Machine-Id': machineId,
            'X-Machine-Name': `LWW Client ${i + 1}`,
          },
          timeout: 30000,
        })
      );
    }

    await Promise.all(promises);

    return { clients, durationMs: Date.now() - start };
  }

  // ==================== FILE ENTITY GRAPH ====================

  async seedFileEntityGraph(prefix: string, iterations: number = 3): Promise<FileSeedResult> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-e2e/seed/files`,
      { data: { prefix, iterations }, timeout: 60000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async verifyFileEntityGraph(prefix: string): Promise<FileVerifyResult> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/sync-e2e/verify/files/${prefix}`,
      { timeout: 30000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async hardDeleteFileGraph(prefix: string): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-e2e/hard-delete/${prefix}`,
      { timeout: 60000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== VALUE DELETE-AND-TRANSFER ====================

  async deleteAndTransferValue(valueIdToDelete: number, transferToValueId: number): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/ng/values/delete-and-transfer`,
      {
        data: { valueIdToDelete, transferToValueId },
        timeout: 30000,
      }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== BACKUP & RESTORE ====================

  async createBackup(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/resync/backup`,
      { timeout: 120000 }
    );
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Backup failed with status ${response.status()}: ${body}`);
    }
    return response.json();
  }

  async executeRestore(force: boolean = true): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/resync/execute?force=${force}`,
      { timeout: 120000 }
    );
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Restore failed with status ${response.status()}: ${body}`);
    }
    return response.json();
  }

  async getResyncStatus(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/resync/status`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== FULL SYNC TO SERVER ====================

  async startFullSyncToServer(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/field-sync/full-sync/start`,
      { timeout: 60000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async getFullSyncStatus(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/field-sync/full-sync/status`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async waitForFullSyncComplete(timeoutMs: number = 120000): Promise<any> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const status = await this.getFullSyncStatus();
      if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'IDLE') {
        return status;
      }
      await this.page.waitForTimeout(2000);
    }
    throw new Error(`Full sync to server did not complete within ${timeoutMs}ms`);
  }

  // ==================== SYNC SERVER TEST UTILITIES ====================

  async resetSyncMarkersOnServer(machineId: string): Promise<any> {
    const response = await this.page.request.post(
      `${this.syncServerUrl}/api/test/e2e/reset-sync-markers/${machineId}`,
      { timeout: 30000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async clearServerDataByPrefix(prefix: string): Promise<any> {
    const response = await this.page.request.delete(
      `${this.syncServerUrl}/api/test/e2e/clear-by-prefix/${prefix}`,
      { timeout: 30000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== CLIENT MACHINE ID ====================

  async getClientMachineId(): Promise<string> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/field-sync/status`
    );
    expect(response.ok()).toBeTruthy();
    const status = await response.json();
    return status.machineId;
  }

  // ==================== UNIQUE PREFIX GENERATOR ====================

  static generatePrefix(testName: string): string {
    return `SYNC_E2E_${Date.now()}_${testName}`;
  }
}
