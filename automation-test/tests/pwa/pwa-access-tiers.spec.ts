import { test, expect } from '@playwright/test';
import { PwaPage } from '../../pages/pwa.page';
import { AuthPage } from '../../pages/auth.page';

/**
 * The PWA's two-tier access model, end to end.
 *
 * Covers the change that retired the old "known but not signed in" tier: there is now signed in, or
 * not, and one declaration (nav.model.ts) drives the menus, the Home tiles and the route guards.
 *
 * Requires the PWA dev server on config.pwaUrl — `npm run start:lab` in browser/ng-ui — pointed at
 * the lab hub.
 */
test.describe('PWA access tiers', () => {

  test.describe('signed out', () => {

    test('a first-time visitor lands on the welcome page', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.goto('/home');
      // welcomeGuard redirects; it gates nothing, it only decides whether the explainer shows first.
      await expect(page).toHaveURL(/\/welcome$/);
      await expect(page.getByRole('button', { name: /continue without signing in/i })).toBeVisible();
    });

    test('continuing as a guest shows only the public sections', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.continueAsGuest();
      await pwa.goto('/home');

      const labels = await pwa.tileLabels();
      // Work Request / JHA (Permits) and the safety pages (Plant) are the entire public surface.
      expect(labels).toContain('Permits');
      expect(labels).toContain('Plant');
      // Everything else needs a session — and SDS needs one too, by decision.
      for (const hidden of ['Maximo', 'LOTO', 'Rounds', 'Personnel', 'Qualifications', 'SDS', 'Inventory']) {
        expect(labels, `${hidden} must not be offered to a signed-out visitor`).not.toContain(hidden);
      }
    });

    test('safety information is reachable without an account', async ({ page }) => {
      const pwa = new PwaPage(page);
      // First-time visitor, nothing in storage — an emergency page you have to click past an
      // explainer to reach is worse than useless.
      await pwa.goto('/plant/emergency');
      await expect(page).toHaveURL(/\/plant\/emergency$/);
      // The page title specifically: a role+name lookup for /emergency/i also matches the
      // "In an emergency" sub-heading, which is a strict-mode violation rather than a pass.
      await expect(page.locator('.info-title')).toHaveText(/emergency/i);
    });

    test('orientation is reachable without an account and carries both links', async ({ page }) => {
      const pwa = new PwaPage(page);
      // NO continueAsGuest() on purpose. This is a FIRST-TIME scan: a contractor with nothing in
      // localStorage. Seeding the guest flag here is what hid the bug where welcomeGuard sat on every
      // route and redirected the scan to a sign-in screen instead of the page it asked for.
      await pwa.goto('/plant/orientation');
      await expect(page, 'a scanned deep link must not be diverted to the welcome screen')
        .toHaveURL(/\/plant\/orientation$/);

      const video = page.getByRole('link', { name: /watch the video/i });
      const quiz = page.getByRole('link', { name: /take the quiz/i });
      await expect(video).toBeVisible();
      await expect(quiz).toBeVisible();
      // The hub supplies both, so a misconfigured property shows up here rather than as a dead tile.
      expect(await video.getAttribute('href')).toMatch(/^https?:\/\//);
      expect(await quiz.getAttribute('href')).toMatch(/^https?:\/\//);
    });

    test('orientation does not touch the hub at all', async ({ page }) => {
      const pwa = new PwaPage(page);
      // Nothing about orientation may touch the hub. Blocking the whole hub origin proves it:
      // if any part of this page needed it, these assertions fail.
      await page.route('**://localhost:8090/**', route => route.abort());
      await pwa.goto('/plant/orientation');

      const video = page.getByRole('link', { name: /watch the video/i });
      const quiz = page.getByRole('link', { name: /take the quiz/i });
      await expect(video).toBeVisible();
      await expect(quiz).toBeVisible();
      expect(await video.getAttribute('href')).toMatch(/^https?:\/\//);
      expect(await quiz.getAttribute('href')).toMatch(/^https?:\/\//);
    });

    test('orientation can be shared: copy link and QR', async ({ context, page }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const pwa = new PwaPage(page);
      await pwa.goto('/plant/orientation');

      await page.getByRole('button', { name: /copy link/i }).click();
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard, 'the copied link must be this page').toMatch(/\/plant\/orientation$/);

      await page.getByRole('button', { name: /show qr/i }).click();
      const qr = page.locator('.share-qr-img');
      await expect(qr).toBeVisible();
      // A rendered QR, not a broken image — the src must be a real PNG payload.
      expect(await qr.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });

    test('a plant-only screen bounces to login', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.continueAsGuest();
      await pwa.goto('/loto');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('signed in', () => {

    /**
     * The lab's seeded admin holds ROLE_ADMIN, which satisfies every role predicate — enough to
     * prove the signed-in surface renders. Per-role fixtures (plant vs insulation vs contractor)
     * need the e2e provisioning endpoints and belong in their own spec.
     */
    const ADMIN_CREDENTIAL = 'admin';
    const ADMIN_PASSWORD = AuthPage.ADMIN_PASSWORD;

    test('an admin sees the full section list', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);
      await pwa.goto('/home');

      const labels = await pwa.tileLabels();
      for (const expected of ['Permits', 'SDS', 'Maximo', 'Personnel', 'Qualifications', 'Inventory']) {
        expect(labels, `${expected} should be visible to an admin`).toContain(expected);
      }
    });

    test('the More sheet groups destinations by section', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);
      await pwa.goto('/home');

      const sections = await pwa.moreSheetSections();
      expect(sections.length, 'the overflow sheet should carry section headings').toBeGreaterThan(0);
    });

    test('a section page lists its sub-sections', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);
      await pwa.goto('/section/permits');

      const labels = await pwa.tileLabels();
      expect(labels).toContain('Work Request');
      expect(labels).toContain('JHA');
      // LOTO lives under Permits, not in a section of its own.
      expect(labels).toContain('LOTO');
      expect(labels).toContain('LOTO Standards');
    });

    test('section cards carry pills that jump straight to a sub-section', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);
      await pwa.goto('/home');

      const permits = page.locator('.tile', { hasText: 'Permits' });
      const pill = permits.locator('.tile-pill', { hasText: 'Work Request' });
      await expect(pill).toBeVisible();

      // The pill is a destination, not decoration — it must skip the section page entirely.
      await pill.click();
      await expect(page).toHaveURL(/\/work-request/);
    });

    test('a card with more sub-sections than fit says so, and the counter opens the section', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);
      await pwa.goto('/home');

      // Permits holds six for an admin, so the card must account for the ones it cannot show
      // rather than looking complete at four.
      const permits = page.locator('.tile', { hasText: 'Permits' });
      const more = permits.locator('.tile-pill.more');
      await expect(more).toHaveText(/^\+\d+ more$/);

      await more.click();
      await expect(page).toHaveURL(/\/section\/permits$/);
      // And the section page really does show everything the card could not.
      expect((await pwa.tileLabels()).length).toBeGreaterThan(4);
    });

    test('the card itself still opens the section page', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);
      await pwa.goto('/home');

      await page.locator('.tile', { hasText: 'Permits' }).locator('.tile-main').click();
      await expect(page).toHaveURL(/\/section\/permits$/);
    });

    test('a section can be pinned to the bar', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);
      await pwa.goto('/home');

      await page.getByRole('button', { name: 'More' }).click();
      await page.getByRole('button', { name: /^Edit$/ }).click();

      // The bar holds four and starts full, so make room first — pinning must refuse rather than
      // silently evict, which is exactly what the free slot proves below.
      const inBar = page.locator('.bn-edit-row.pinned').last();
      const evicted = (await inBar.locator('.bn-edit-label').innerText()).trim();
      await inBar.locator('.bn-edit-pin').click();

      // Sections are pinnable now, which they were not — one tap, from wherever the row sits.
      await page.getByRole('button', { name: /Add Rounds to the bar/i }).click();
      await page.getByRole('button', { name: /^Done$/ }).click();
      await page.locator('.bn-scrim').click({ force: true });

      await expect(page.locator('.bn .bn-tab', { hasText: 'Rounds' })).toBeVisible();
      await expect(page.locator('.bn .bn-tab', { hasText: evicted })).toHaveCount(0);
    });

    test('deep links select the right tab', async ({ page }) => {
      const pwa = new PwaPage(page);
      await pwa.signIn(ADMIN_CREDENTIAL, ADMIN_PASSWORD);

      await pwa.goto('/maximo?tab=sr');
      await expect(page.locator('.mx-tab.active')).toHaveText(/requests/i);
    });
  });

  test.describe('hub endpoints', () => {

    /**
     * Inventory and SDS moved from anonymous to PLANT/ADMIN. The regression this guards is subtle:
     * if the path is missing from PwaJwtAuthFilter's prefixes the filter never parses the token, the
     * SecurityContext stays anonymous, and a legitimately signed-in user is refused — which surfaces
     * in the app as "server unavailable" rather than as a permission error.
     */
    test('a signed-in plant user can reach the newly gated endpoints', async ({ page }) => {
      const pwa = new PwaPage(page);
      const auth = await pwa.signIn('admin', AuthPage.ADMIN_PASSWORD);

      for (const path of ['/api/pwa/inventory-item/all', '/api/pwa/sds-chemical/all']) {
        const response = await pwa.apiGet(path, auth.token);
        expect(response.status, `${path} must not refuse a signed-in user`).not.toBe(401);
        expect(response.status, `${path} must not refuse a signed-in user`).not.toBe(403);
      }
    });

    test('those endpoints refuse an anonymous caller', async ({ page }) => {
      const pwa = new PwaPage(page);
      const response = await pwa.apiGet('/api/pwa/inventory-item/all');
      expect([401, 403]).toContain(response.status);
    });

    test('an iCal subscription token cannot be used as a session', async ({ page }) => {
      const pwa = new PwaPage(page);
      const auth = await pwa.signIn('admin', AuthPage.ADMIN_PASSWORD);

      const urlResponse = await pwa.apiGet('/api/pwa/secured/schedule/ical/url', auth.token);
      test.skip(urlResponse.status !== 200, 'iCal URL endpoint unavailable in this lab');

      // The token is the LAST PATH SEGMENT of /api/pwa/public/schedule/ical/{token}, not a query
      // parameter — the subscription URL is handed to calendar apps verbatim.
      const icalUrl: string = urlResponse.body?.url ?? '';
      const icalToken = icalUrl.split('/ical/')[1]?.split(/[?#]/)[0] ?? '';
      expect(icalToken, 'could not extract a token from the iCal URL').not.toBe('');

      // That token is handed to Google/Apple Calendar and is designed to leak. It is hub-issued and
      // RS256-signed with the same key as a session token, so nothing but an explicit audience check
      // stops it buying a full session.
      const response = await pwa.apiGet('/api/pwa/secured/my-permits', icalToken);
      expect(response.status, 'an iCal token must never authenticate a session').toBe(401);
    });
  });
});
