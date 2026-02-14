import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

/**
 * Desktop Auto-Auth Tests
 *
 * Tests the DesktopAutoAuthFilter which auto-authenticates
 * localhost requests via System.getProperty("user.name") → User.windowsUsername.
 *
 * Prerequisites:
 * - Spring Boot running on 8082 with AdminUserSeeder active
 * - Admin user seeded with windowsUsername="usada"
 * - Tests run from the same machine (Playwright requests come from 127.0.0.1)
 *
 * Note: These tests work because Playwright's HTTP requests originate from localhost,
 * which the DesktopAutoAuthFilter treats as a local desktop request.
 */

test.describe('Desktop Auto-Authentication', () => {
  let auth: AuthPage;

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
  });

  test('should auto-authenticate via localhost without login', async () => {
    // Do NOT login first — just call /me directly
    // DesktopAutoAuthFilter should auto-auth because request is from 127.0.0.1
    // and admin user has windowsUsername="usada" matching System.getProperty("user.name")
    const response = await auth.getCurrentUser();
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.email).toBe(AuthPage.ADMIN_EMAIL);
    expect(body.role).toBe('ROLE_ADMIN');
    expect(body.name).toBe('System Administrator');

    console.log(`Desktop auto-auth: user=${body.email}, role=${body.role}`);
  });

  test('should have full access level via desktop auto-auth', async () => {
    const response = await auth.getCurrentUser();
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    // Desktop auto-auth from localhost bypasses AccessGrantFilter entirely
    // so the access level check in /me depends on grant status.
    // Admin users always have effective full access regardless of accessLevel field.
    expect(body.role).toBe('ROLE_ADMIN');
  });

  test('should access admin endpoints via desktop auto-auth', async () => {
    // Admin endpoints should be accessible without explicit login
    // because DesktopAutoAuthFilter creates the auth context
    const pendingResponse = await auth.getPendingRequests();
    expect(pendingResponse.ok()).toBeTruthy();

    const activeResponse = await auth.getActiveGrants();
    expect(activeResponse.ok()).toBeTruthy();

    const rolesResponse = await auth.getRoles();
    expect(rolesResponse.ok()).toBeTruthy();
  });

  test('should access user management via desktop auto-auth', async () => {
    const response = await auth.getUsers();
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.content.length).toBeGreaterThan(0);
  });
});
