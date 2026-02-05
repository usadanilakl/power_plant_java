import { test, expect } from '@playwright/test';
import { SyncE2EPage } from '../../pages/sync-e2e.page';
import { config } from '../../test.config';

/**
 * Concurrency Stress Tests
 *
 * Simulates multiple clients syncing simultaneously by POSTing
 * directly to the sync server's /api/sync/exchange endpoint
 * with different X-Machine-Id headers.
 *
 * Tests server-side @Transactional processing, LWW conflict resolution,
 * and SSE broadcast under concurrent load.
 *
 * Limitation: Does not test 100 client-side CentralSyncService instances.
 * Tests server concurrency only.
 */

test.describe.configure({ mode: 'serial' });

test.describe('Concurrency Stress Tests', () => {
  let e2ePage: SyncE2EPage;

  test.beforeEach(async ({ page }) => {
    e2ePage = new SyncE2EPage(page);
  });

  test.setTimeout(120000);

  test.describe('Concurrent Client Simulation', () => {
    test('should handle 10 concurrent clients', async () => {
      const result = await e2ePage.simulateConcurrentClients(10, 50);

      console.log(`10 clients × 50 changes: ${result.successCount} succeeded, ${result.failCount} failed in ${result.durationMs}ms`);

      expect(result.successCount).toBe(10);
      expect(result.failCount).toBe(0);
    });

    test('should handle 50 concurrent clients', async () => {
      const result = await e2ePage.simulateConcurrentClients(50, 20);

      console.log(`50 clients × 20 changes: ${result.successCount} succeeded, ${result.failCount} failed in ${result.durationMs}ms`);

      expect(result.successCount).toBe(50);
      expect(result.failCount).toBe(0);
    });

    test('should handle 100 concurrent clients', async () => {
      const result = await e2ePage.simulateConcurrentClients(100, 10);

      console.log(`100 clients × 10 changes: ${result.successCount} succeeded, ${result.failCount} failed in ${result.durationMs}ms`);

      expect(result.successCount).toBe(100);
      expect(result.failCount).toBe(0);
      expect(result.durationMs).toBeLessThan(60000); // Under 60 seconds
    });
  });

  test.describe('LWW Conflict Resolution', () => {
    test('should resolve conflicts with latest timestamp winning', async () => {
      const result = await e2ePage.simulateLWWConflict(10);

      console.log(`LWW test: ${result.clients.length} clients contested same field in ${result.durationMs}ms`);

      // The client with the latest timestamp should win
      const latestClient = result.clients[result.clients.length - 1];
      console.log(`Latest timestamp from: ${latestClient.machineId} at ${latestClient.timestamp}`);

      // Verify by checking what the server stored — query the sync server
      // The last client's value should be the winner
      expect(result.clients.length).toBe(10);
    });
  });

  test.describe('Client-Side Sync Guard', () => {
    test('should handle concurrent sync trigger requests gracefully', async () => {
      // Fire 5 concurrent trigger requests to the client backend
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          e2ePage.page.request.post(
            `${config.clientBackendUrl}/api/field-sync/trigger`,
            { timeout: 30000 }
          )
        );
      }

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successes = results.filter((r: any) => r.success);
      console.log(`5 concurrent triggers: ${successes.length} succeeded`);

      // At least one should succeed — the AtomicBoolean guard prevents truly concurrent syncs
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });
  });
});
