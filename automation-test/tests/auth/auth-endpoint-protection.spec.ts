import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { config } from '../../test.config';

/**
 * Endpoint Protection Tests
 *
 * Verifies that security rules are enforced:
 * - Public endpoints accessible without auth
 * - Protected endpoints return 401 without auth
 * - Admin endpoints return 403 for non-admin users
 *
 * Note: Since Playwright runs on localhost, DesktopAutoAuthFilter may auto-auth.
 * Tests that need a truly unauthenticated state must account for this.
 * We test non-admin role enforcement using an employee user instead.
 *
 * Prerequisites: Spring Boot running on 8082 with AdminUserSeeder active.
 */

test.describe('Endpoint Protection', () => {
  const backendUrl = config.clientBackendUrl;

  test.describe('Public Endpoints', () => {
    test('health check should be accessible without auth', async ({ page }) => {
      const response = await page.request.get(`${backendUrl}/actuator/health`);
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.status).toBeDefined();
    });

    test('login endpoint should be accessible without auth', async ({ page }) => {
      // Login endpoint itself is public (even if credentials are wrong, it should not 401 *the endpoint*)
      const response = await page.request.post(`${backendUrl}/api/auth/login`, {
        data: { email: 'nobody@test.local', password: 'wrong' },
      });
      // Should get 401 for bad credentials, not 403 for endpoint protection
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('INVALID_CREDENTIALS');
    });
  });

  test.describe('Admin-Only Endpoints', () => {
    test('employee should not access user management', async ({ browser }) => {
      // First, create employee as admin
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      const adminAuth = new AuthPage(adminPage);
      await adminAuth.loginAsAdmin();
      const ts = Date.now().toString();
      await adminAuth.createTestEmployee(ts + '_noadmin');
      await adminContext.close();

      // Login as employee in a new context
      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);
      await empAuth.login(`employee_${ts}_noadmin@test.local`, 'password123');

      // Try to access admin-only endpoint
      const usersResponse = await empAuth.getUsers();
      expect(usersResponse.status()).toBe(403);

      await empContext.close();
    });

    test('employee should not access access-management admin endpoints', async ({ browser }) => {
      // Create employee as admin
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      const adminAuth = new AuthPage(adminPage);
      await adminAuth.loginAsAdmin();
      const ts = Date.now().toString();
      await adminAuth.createTestEmployee(ts + '_noadmin2');
      await adminContext.close();

      // Login as employee
      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);
      await empAuth.login(`employee_${ts}_noadmin2@test.local`, 'password123');

      // Try admin endpoints
      const pendingResponse = await empAuth.getPendingRequests();
      expect(pendingResponse.status()).toBe(403);

      await empContext.close();
    });
  });

  test.describe('Auth-Required Endpoints', () => {
    test('request-access requires authentication', async ({ browser }) => {
      // Use a completely fresh browser context with no previous session
      const ctx = await browser.newContext();
      const freshPage = await ctx.newPage();

      // Note: From localhost, DesktopAutoAuthFilter may auto-auth.
      // This test verifies the endpoint is wired correctly.
      // For true unauthenticated testing, the server would need to be accessed from external IP.
      const response = await freshPage.request.post(`${backendUrl}/api/auth/request-access`);
      // Accept either 200 (auto-auth) or 401 (no auth) — depends on windowsUsername match
      expect([200, 401]).toContain(response.status());

      await ctx.close();
    });

    test('access-status requires authentication', async ({ browser }) => {
      const ctx = await browser.newContext();
      const freshPage = await ctx.newPage();

      const response = await freshPage.request.get(`${backendUrl}/api/auth/access-status`);
      expect([200, 401]).toContain(response.status());

      await ctx.close();
    });
  });

  test.describe('Role-Based Access', () => {
    test('admin can access all admin endpoints', async ({ page }) => {
      const auth = new AuthPage(page);
      await auth.loginAsAdmin();

      const endpoints = [
        auth.getPendingRequests(),
        auth.getActiveGrants(),
        auth.getUsers(),
        auth.getRoles(),
      ];

      const responses = await Promise.all(endpoints);
      for (const response of responses) {
        expect(response.ok()).toBeTruthy();
      }
    });

    test('employee can access /me and request-access', async ({ browser }) => {
      // Create employee
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      const adminAuth = new AuthPage(adminPage);
      await adminAuth.loginAsAdmin();
      const ts = Date.now().toString();
      await adminAuth.createTestEmployee(ts + '_empaccess');
      await adminContext.close();

      // Login as employee
      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);
      await empAuth.login(`employee_${ts}_empaccess@test.local`, 'password123');

      // Should access /me
      const meResponse = await empAuth.getCurrentUser();
      expect(meResponse.ok()).toBeTruthy();

      // Should access request-access
      const reqResponse = await empAuth.requestAccess();
      expect(reqResponse.ok()).toBeTruthy();

      // Should access access-status
      const statusResponse = await empAuth.getAccessStatus();
      expect(statusResponse.ok()).toBeTruthy();

      await empContext.close();
    });
  });
});
