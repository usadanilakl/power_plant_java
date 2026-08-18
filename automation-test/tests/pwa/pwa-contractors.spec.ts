import { test, expect } from '@playwright/test';
import { PwaPage } from '../../pages/pwa.page';
import { AuthPage } from '../../pages/auth.page';

/**
 * Contractor lookup — contacts and orientation dates for plant personnel.
 *
 * The directory itself comes from OnLocation, which a lab hub has no key for, so these intercept the
 * endpoint with a fixture. That is deliberate rather than a shortcut: it pins the rendering and the
 * staleness rules, which is where the behaviour that matters lives.
 */
const DIRECTORY = {
  fetchedAt: new Date().toISOString(),
  source: 'ONLOCATION',
  total: 3,
  contractors: [
    { onLocationMemberId: '1', name: 'Dana Whitfield', company: 'Apex Mechanical', title: 'Millwright',
      email: 'dana@apex.example', phone: '555-0101',
      validFrom: '2026-01-05', validTo: '2027-01-05' },
    { onLocationMemberId: '2', name: 'Rob Castellano', company: 'Northline Insulation',
      phone: '555-0102', validFrom: '2025-02-01', validTo: '2026-02-01' },
    { onLocationMemberId: '3', name: 'Priya Raman', company: 'Apex Mechanical',
      email: 'priya@apex.example', validFrom: '2026-01-01', validTo: '2099-01-01' },
  ],
};

async function openDirectory(page: any, body: any = DIRECTORY, status = 200) {
  await page.route('**/api/pwa/secured/contractors*', (route: any) =>
    status === 200
      ? route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      : route.abort());
  const pwa = new PwaPage(page);
  await pwa.signIn('admin', AuthPage.ADMIN_PASSWORD);
  await pwa.goto('/personnel?tab=contractors');
}

test.describe('Contractor lookup', () => {

  test('lists contractors with contacts and orientation dates', async ({ page }) => {
    await openDirectory(page);

    await expect(page.locator('.cd-card')).toHaveCount(3);
    const dana = page.locator('.cd-card', { hasText: 'Dana Whitfield' });
    await expect(dana).toContainText('Apex Mechanical');
    await expect(dana).toContainText('555-0101');
    // The date the whole screen exists to answer.
    await expect(dana).toContainText('2027-01-05');
  });

  test('flags an expired orientation', async ({ page }) => {
    await openDirectory(page);
    // validTo 2026-02-01 is in the past relative to the suite's clock.
    await expect(page.locator('.cd-card', { hasText: 'Rob Castellano' }).locator('.cd-badge'))
      .toHaveText(/expired/i);
    await expect(page.locator('.cd-card', { hasText: 'Priya Raman' }).locator('.cd-badge'))
      .toHaveText(/current/i);
  });

  test('search filters the list', async ({ page }) => {
    await openDirectory(page);
    await page.locator('.cd-search').fill('northline');
    await expect(page.locator('.cd-card')).toHaveCount(1);
    await expect(page.locator('.cd-card')).toContainText('Rob Castellano');
  });

  test('says how fresh the list is', async ({ page }) => {
    await openDirectory(page);
    await expect(page.locator('.cd-status')).toContainText(/updated/i);
  });

  test('falls back to the cached copy and says so when the hub is unreachable', async ({ page }) => {
    // First visit populates the device cache.
    await openDirectory(page);
    await expect(page.locator('.cd-card')).toHaveCount(3);

    // Second visit with the hub refusing: the list must survive, flagged as a saved copy — someone
    // is deciding site access on it, so silently showing stale data would be the wrong failure.
    await page.unroute('**/api/pwa/secured/contractors*');
    await page.route('**/api/pwa/secured/contractors*', route => route.abort());
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cd-card')).toHaveCount(3);
    await expect(page.locator('.cd-status')).toContainText(/offline|saved copy/i);
    await expect(page.locator('.cd-status')).toHaveClass(/stale/);
  });
});
