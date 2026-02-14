import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

/**
 * Access Grant Flow Tests
 *
 * Tests the full access request → admin approval → token lifecycle.
 * Prerequisites: Spring Boot running on 8082 with AdminUserSeeder active.
 */

test.describe('Access Grant Flow', () => {
  let auth: AuthPage;
  const ts = Date.now().toString();

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
  });

  test.describe('Request Access', () => {
    test('should create a pending access request', async ({ browser }) => {
      // Login as admin and create an employee
      await auth.loginAsAdmin();
      const empResult = await auth.createTestEmployee(ts + '_req');
      const empEmail = `employee_${ts}_req@test.local`;

      // Login as employee in a new context
      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);

      await empAuth.login(empEmail, 'password123');

      // Request access
      const reqResponse = await empAuth.requestAccess();
      expect(reqResponse.ok()).toBeTruthy();

      const reqBody = await reqResponse.json();
      expect(reqBody.status).toBe('PENDING');
      expect(reqBody.requestId).toBeDefined();

      // Check access status
      const statusResponse = await empAuth.getAccessStatus();
      expect(statusResponse.ok()).toBeTruthy();

      const statusBody = await statusResponse.json();
      expect(statusBody.status).toBe('PENDING');

      await empContext.close();
    });

    test('should return ALREADY_PENDING for duplicate request', async ({ browser }) => {
      // Login as admin and create employee
      await auth.loginAsAdmin();
      await auth.createTestEmployee(ts + '_dup');
      const empEmail = `employee_${ts}_dup@test.local`;

      // Login as employee
      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);

      await empAuth.login(empEmail, 'password123');

      // First request
      await empAuth.requestAccess();

      // Second request → already pending
      const dupResponse = await empAuth.requestAccess();
      expect(dupResponse.ok()).toBeTruthy();

      const dupBody = await dupResponse.json();
      expect(dupBody.status).toBe('ALREADY_PENDING');

      await empContext.close();
    });
  });

  test.describe('Admin Approve/Deny/Revoke', () => {
    test('should approve a pending request', async ({ browser }) => {
      // Admin: create employee
      await auth.loginAsAdmin();
      await auth.createTestEmployee(ts + '_approve');
      const empEmail = `employee_${ts}_approve@test.local`;

      // Employee: login and request access
      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);
      await empAuth.login(empEmail, 'password123');
      const reqResult = await (await empAuth.requestAccess()).json();
      const requestId = reqResult.requestId;

      // Admin: check pending
      const pendingResponse = await auth.getPendingRequests();
      expect(pendingResponse.ok()).toBeTruthy();
      const pending = await pendingResponse.json();
      const found = pending.find((g: any) => g.userEmail === empEmail);
      expect(found).toBeDefined();

      // Admin: approve
      const approveResponse = await auth.approveRequest(found.id);
      expect(approveResponse.ok()).toBeTruthy();
      const approveBody = await approveResponse.json();
      expect(approveBody.success).toBe(true);
      expect(approveBody.accessToken).toBeDefined();
      expect(approveBody.expiresAt).toBeDefined();

      // Employee: check status → APPROVED
      const statusResponse = await empAuth.getAccessStatus();
      const statusBody = await statusResponse.json();
      expect(statusBody.status).toBe('APPROVED');
      expect(statusBody.expiresAt).toBeDefined();

      // Admin: check active grants
      const activeResponse = await auth.getActiveGrants();
      expect(activeResponse.ok()).toBeTruthy();
      const active = await activeResponse.json();
      const activeGrant = active.find((g: any) => g.userEmail === empEmail);
      expect(activeGrant).toBeDefined();

      await empContext.close();
    });

    test('should deny a pending request', async ({ browser }) => {
      // Admin: create employee
      await auth.loginAsAdmin();
      await auth.createTestEmployee(ts + '_deny');
      const empEmail = `employee_${ts}_deny@test.local`;

      // Employee: request access
      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);
      await empAuth.login(empEmail, 'password123');
      await empAuth.requestAccess();

      // Admin: find and deny
      const pending = await (await auth.getPendingRequests()).json();
      const found = pending.find((g: any) => g.userEmail === empEmail);
      expect(found).toBeDefined();

      const denyResponse = await auth.denyRequest(found.id);
      expect(denyResponse.ok()).toBeTruthy();
      const denyBody = await denyResponse.json();
      expect(denyBody.success).toBe(true);

      // Employee: check status → NONE (denied grants aren't shown as active)
      const statusResponse = await empAuth.getAccessStatus();
      const statusBody = await statusResponse.json();
      expect(statusBody.status).toBe('NONE');

      await empContext.close();
    });

    test('should revoke an approved grant', async ({ browser }) => {
      // Admin: create employee, approve
      await auth.loginAsAdmin();
      await auth.createTestEmployee(ts + '_revoke');
      const empEmail = `employee_${ts}_revoke@test.local`;

      const empContext = await browser.newContext();
      const empPage = await empContext.newPage();
      const empAuth = new AuthPage(empPage);
      await empAuth.login(empEmail, 'password123');
      await empAuth.requestAccess();

      const pending = await (await auth.getPendingRequests()).json();
      const found = pending.find((g: any) => g.userEmail === empEmail);
      await auth.approveRequest(found.id);

      // Now revoke
      const revokeResponse = await auth.revokeGrant(found.id);
      expect(revokeResponse.ok()).toBeTruthy();
      const revokeBody = await revokeResponse.json();
      expect(revokeBody.success).toBe(true);

      // Employee: check status → NONE
      const statusResponse = await empAuth.getAccessStatus();
      const statusBody = await statusResponse.json();
      expect(statusBody.status).toBe('NONE');

      await empContext.close();
    });
  });
});
