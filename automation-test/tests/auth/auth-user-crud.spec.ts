import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

/**
 * User Management CRUD Tests
 *
 * Tests admin user management endpoints (create, read, update, delete).
 * Prerequisites: Spring Boot running on 8082 with AdminUserSeeder active.
 */

test.describe('User Management (Admin CRUD)', () => {
  let auth: AuthPage;
  const ts = Date.now().toString();

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
    // Login as admin for all tests
    await auth.loginAsAdmin();
  });

  test.describe('Create User', () => {
    test('should create a new user', async () => {
      const response = await auth.createUser({
        username: `newuser_${ts}`,
        firstName: 'New',
        lastName: 'User',
        email: `newuser_${ts}@test.local`,
        role: 'ROLE_EMPLOYEE',
        password: 'securePass123',
        windowsUsername: '',
      });
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(body.data.email).toBe(`newuser_${ts}@test.local`);
      expect(body.data.role).toBe('ROLE_EMPLOYEE');
      // Password should never be in the response
      expect(body.data.password).toBeUndefined();
    });

    test('should reject duplicate email', async () => {
      const email = `dup_${ts}@test.local`;

      // Create first
      await auth.createUser({
        username: `dup1_${ts}`,
        firstName: 'Dup',
        lastName: 'One',
        email,
        role: 'ROLE_EMPLOYEE',
        password: 'pass123',
        windowsUsername: '',
      });

      // Create second with same email
      const response = await auth.createUser({
        username: `dup2_${ts}`,
        firstName: 'Dup',
        lastName: 'Two',
        email,
        role: 'ROLE_EMPLOYEE',
        password: 'pass123',
        windowsUsername: '',
      });
      expect(response.ok()).toBeFalsy();
    });
  });

  test.describe('Read Users', () => {
    test('should get paginated user list', async () => {
      const response = await auth.getUsers();
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(body.data.content).toBeDefined();
      expect(Array.isArray(body.data.content)).toBe(true);
      // At least the seeded admin should exist
      expect(body.data.content.length).toBeGreaterThan(0);
    });

    test('should get user by ID', async () => {
      // Create a user to get by ID
      const createResponse = await auth.createUser({
        username: `getbyid_${ts}`,
        firstName: 'Get',
        lastName: 'ById',
        email: `getbyid_${ts}@test.local`,
        role: 'ROLE_CONTRACTOR',
        password: 'pass123',
        windowsUsername: 'testwin',
      });
      const created = await createResponse.json();
      const userId = created.data.id;

      const response = await auth.getUser(userId);
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data.id).toBe(userId);
      expect(body.data.email).toBe(`getbyid_${ts}@test.local`);
      expect(body.data.role).toBe('ROLE_CONTRACTOR');
      expect(body.data.windowsUsername).toBe('testwin');
    });

    test('should get available roles', async () => {
      const response = await auth.getRoles();
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.roles).toBeDefined();
      expect(body.roles).toContain('ROLE_ADMIN');
      expect(body.roles).toContain('ROLE_EMPLOYEE');
      expect(body.roles).toContain('ROLE_CONTRACTOR');
    });
  });

  test.describe('Update User', () => {
    test('should update user fields', async () => {
      // Create user
      const createResponse = await auth.createUser({
        username: `update_${ts}`,
        firstName: 'Before',
        lastName: 'Update',
        email: `update_${ts}@test.local`,
        role: 'ROLE_EMPLOYEE',
        password: 'pass123',
        windowsUsername: '',
      });
      const created = await createResponse.json();
      const userId = created.data.id;

      // Update
      const updateResponse = await auth.updateUser(userId, {
        firstName: 'After',
        lastName: 'Updated',
        role: 'ROLE_CONTRACTOR',
        windowsUsername: 'newwinuser',
      });
      expect(updateResponse.ok()).toBeTruthy();

      const updated = await updateResponse.json();
      expect(updated.data.firstName).toBe('After');
      expect(updated.data.lastName).toBe('Updated');
      expect(updated.data.role).toBe('ROLE_CONTRACTOR');
      expect(updated.data.windowsUsername).toBe('newwinuser');
    });

    test('should update user password (login with new password)', async ({ browser }) => {
      const email = `pwdupd_${ts}@test.local`;

      // Create user
      const createResponse = await auth.createUser({
        username: `pwdupd_${ts}`,
        firstName: 'Pwd',
        lastName: 'Update',
        email,
        role: 'ROLE_EMPLOYEE',
        password: 'oldPassword',
        windowsUsername: '',
      });
      const created = await createResponse.json();

      // Update password
      await auth.updateUser(created.data.id, { password: 'newPassword' } as any);

      // Login with new password in fresh context
      const ctx = await browser.newContext();
      const freshPage = await ctx.newPage();
      const freshAuth = new AuthPage(freshPage);

      const loginResponse = await freshAuth.login(email, 'newPassword');
      expect(loginResponse.ok()).toBeTruthy();

      // Old password should fail
      const oldLoginResponse = await freshAuth.login(email, 'oldPassword');
      // Rejected credentials answer 400, not 401 — see 0004d8906.
      expect(oldLoginResponse.status()).toBe(400);

      await ctx.close();
    });
  });

  test.describe('Delete User', () => {
    test('should soft-delete user', async () => {
      // Create user
      const email = `delete_${ts}@test.local`;
      const createResponse = await auth.createUser({
        username: `delete_${ts}`,
        firstName: 'To',
        lastName: 'Delete',
        email,
        role: 'ROLE_EMPLOYEE',
        password: 'pass123',
        windowsUsername: '',
      });
      const created = await createResponse.json();

      // Delete
      const deleteResponse = await auth.deleteUser(created.data.id);
      expect(deleteResponse.ok()).toBeTruthy();

      // User should no longer appear in paginated list (soft delete + @Where clause)
      const listResponse = await auth.getUsers();
      const list = await listResponse.json();
      const found = list.data.content.find((u: any) => u.email === email);
      expect(found).toBeUndefined();
    });
  });
});
