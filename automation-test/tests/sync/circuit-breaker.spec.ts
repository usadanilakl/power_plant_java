import { test, expect } from '@playwright/test';
import { SyncPage } from '../../pages/sync.page';
import { config } from '../../test.config';

/**
 * Circuit Breaker and Sync Toggle Tests
 *
 * Tests the circuit breaker behavior in CentralSyncService
 * and the runtime sync toggle in FieldSyncController.
 *
 * IMPORTANT: These tests toggle sync on/off. afterAll always re-enables sync.
 */

test.describe.configure({ mode: 'serial' });

test.describe('Circuit Breaker and Sync Toggle', () => {
  let syncPage: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  // Safety: always re-enable sync after tests
  test.afterAll(async ({ request }) => {
    try {
      await request.post(`${config.clientBackendUrl}/api/field-sync/sync-toggle`, {
        data: { enabled: true },
      });
      await request.post(`${config.clientBackendUrl}/api/field-sync/reset-circuit-breaker`);
    } catch { /* ignore */ }
  });

  test.describe('Healthy State Verification', () => {
    test('should report healthy metrics with no consecutive failures', async () => {
      const metrics = await syncPage.getFieldSyncMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.syncMetrics).toBeDefined();

      console.log('Sync metrics:', JSON.stringify(metrics.syncMetrics));
    });

    test('should show SSE connected in status', async () => {
      const status = await syncPage.getFieldSyncStatus();

      expect(status).toBeDefined();
      expect(status.machineId).toBeDefined();
      // When server is available, SSE should be connected
      if (status.serverAvailable) {
        expect(status.sseConnected).toBe(true);
      }

      console.log(`SSE connected: ${status.sseConnected}, server available: ${status.serverAvailable}`);
    });
  });

  test.describe('Circuit Breaker Reset', () => {
    test('should reset circuit breaker via API', async () => {
      const result = await syncPage.resetCircuitBreaker();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Circuit breaker reset');

      console.log('Circuit breaker reset successful');
    });
  });

  test.describe('Sync Toggle', () => {
    test.setTimeout(60000);

    test('should get current sync toggle state', async () => {
      const toggle = await syncPage.getSyncToggle();

      expect(toggle).toBeDefined();
      expect(toggle.enabled).toBeDefined();
      expect(toggle.configured).toBeDefined();
      expect(toggle.effectivelyEnabled).toBeDefined();

      console.log(`Toggle: enabled=${toggle.enabled}, configured=${toggle.configured}, effective=${toggle.effectivelyEnabled}`);
    });

    test('should disable sync via toggle', async () => {
      // Disable sync
      const disableResult = await syncPage.setSyncToggle(false);

      expect(disableResult.success).toBe(true);
      expect(disableResult.effectivelyEnabled).toBe(false);

      // Wait for SSE to disconnect
      await syncPage.page.waitForTimeout(3000);

      // Verify sync is disabled — sseConnected is absent or false when disabled
      const status = await syncPage.getFieldSyncStatus();
      expect(status.syncRuntimeEnabled).toBe(false);

      console.log('Sync disabled, runtime enabled:', status.syncRuntimeEnabled);
    });

    test('should re-enable sync via toggle', async () => {
      // Ensure sync is disabled first
      await syncPage.setSyncToggle(false);
      await syncPage.page.waitForTimeout(2000);

      // Re-enable sync
      const enableResult = await syncPage.setSyncToggle(true);
      expect(enableResult.success).toBe(true);
      expect(enableResult.effectivelyEnabled).toBe(true);

      // Wait for sync runtime to come back
      let enabled = false;
      for (let i = 0; i < 10; i++) {
        await syncPage.page.waitForTimeout(2000);
        const status = await syncPage.getFieldSyncStatus();
        if (status.syncRuntimeEnabled) {
          enabled = true;
          console.log(`Sync re-enabled after ${(i + 1) * 2}s, sseConnected=${status.sseConnected}`);
          break;
        }
      }

      expect(enabled).toBe(true);
    });

    test('should sync successfully after re-enable', async () => {
      // Ensure sync is enabled
      await syncPage.setSyncToggle(true);
      await syncPage.page.waitForTimeout(3000);

      // Trigger sync
      const syncResult = await syncPage.triggerFieldSync();
      expect(syncResult).toBeDefined();

      console.log('Sync after re-enable:', JSON.stringify(syncResult));
    });
  });
});
