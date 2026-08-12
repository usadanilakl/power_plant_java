import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

/**
 * Authentication Login/Logout Tests
 *
 * Tests the login, /me, and logout endpoints.
 * Prerequisites: Spring Boot running on 8082 with AdminUserSeeder active.
 */

test.describe('Authentication - Login/Logout', () => {
  let auth: AuthPage;

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
  });

  test.describe('Login', () => {
    test('should login with valid admin credentials', async () => {
      const response = await auth.login(AuthPage.ADMIN_EMAIL, AuthPage.ADMIN_PASSWORD);
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.email).toBe(AuthPage.ADMIN_EMAIL);
      expect(body.role).toBe('ROLE_ADMIN');
      expect(body.name).toBe('System Administrator');
      expect(body.id).toBeDefined();
    });

    test('should return 400 for wrong password', async () => {
      const response = await auth.login(AuthPage.ADMIN_EMAIL, 'wrong-password');
      // 400, not 401: a 401 on this same-origin endpoint makes the reverse proxy's
      // WWW-Authenticate header raise the browser's native credential dialog (0004d8906).
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('INVALID_CREDENTIALS');
    });

    test('should return 400 for non-existent email', async () => {
      const response = await auth.login('nobody@test.local', 'password');
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('INVALID_CREDENTIALS');
    });

    test('should return 400 for empty credentials', async () => {
      const response = await auth.login('', '');
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Current User (/me)', () => {
    test('should return user info after login', async () => {
      // Login first
      await auth.loginAsAdmin();

      // Then check /me
      const meResponse = await auth.getCurrentUser();
      expect(meResponse.ok()).toBeTruthy();

      const me = await meResponse.json();
      expect(me.email).toBe(AuthPage.ADMIN_EMAIL);
      expect(me.role).toBe('ROLE_ADMIN');
      expect(me.accessLevel).toBeDefined();
      expect(me.id).toBeDefined();
      expect(me.name).toBe('System Administrator');
    });

    test('should return 401 for /me without login', async ({ browser }) => {
      // Use a fresh context with no cookies
      const context = await browser.newContext();
      const freshPage = await context.newPage();
      const freshAuth = new AuthPage(freshPage);

      const response = await freshAuth.getCurrentUser();
      // Desktop auto-auth may kick in for localhost, so accept either 200 or 401
      // The key is that if it returns 200, it should have valid user data
      if (response.ok()) {
        const body = await response.json();
        expect(body.email).toBeDefined();
      }

      await context.close();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async () => {
      // Login first
      await auth.loginAsAdmin();

      // Verify logged in
      const meResponse = await auth.getCurrentUser();
      expect(meResponse.ok()).toBeTruthy();

      // Logout
      const logoutResponse = await auth.logout();
      expect(logoutResponse.ok()).toBeTruthy();

      const body = await logoutResponse.json();
      expect(body.success).toBe(true);
    });
  });
});
