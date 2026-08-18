import { APIResponse, Page, expect, request as playwrightRequest } from '@playwright/test';
import { config } from '../test.config';

/** A completed API call: status plus an already-read body, since the context is disposed. */
export interface ApiResult {
  status: number;
  text: string;
  body: any;
}

/** Shape the PWA persists under localStorage['pwaAuthData'] — see AuthService.toHubAuthData. */
interface PwaAuthData {
  token: string;
  expiresAt: number;
  user: { id: number; name: string; email: string; roles?: string[]; permissionLevel: string; isActive?: boolean };
  source: 'hub';
}

/**
 * Page object for the PWA (browser/ng-ui) — the lab's third node.
 *
 * Two things differ from {@link AuthPage} and are the reason this can't reuse it:
 *  - the PWA authenticates with a JWT held in localStorage, not a session cookie, so signing in
 *    means seeding that key before the app boots rather than letting a Set-Cookie land;
 *  - it talks to the HUB, not the desktop client.
 */
export class PwaPage {
  readonly backendUrl = config.pwaBackendUrl;

  constructor(readonly page: Page) {}

  // ── Session ────────────────────────────────────────────────────────────────

  /** Exchange credentials with the hub. Accepts an email OR a username. */
  async apiLogin(credential: string, password: string): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/pwa/auth/login`, {
      data: { email: credential, password },
    });
  }

  /**
   * Sign in and seed the session the way the app itself would.
   *
   * The seed has to happen via an init script: AuthService reads localStorage in a field
   * initialiser, so a value written after the app has booted is never picked up.
   */
  async signIn(credential: string, password: string): Promise<PwaAuthData> {
    const response = await this.apiLogin(credential, password);
    expect(response.status(), `PWA login failed for ${credential}`).toBe(200);
    const body = await response.json();
    const auth: PwaAuthData = {
      token: body.token,
      expiresAt: Date.now() + body.expiresIn * 1000,
      user: body.user,
      source: 'hub',
    };
    await this.seedStorage({ pwaAuthData: JSON.stringify(auth) });
    return auth;
  }

  /** Take the "continue without signing in" path without clicking through the welcome page. */
  async continueAsGuest(): Promise<void> {
    await this.seedStorage({ pwaGuestAcknowledged: '1' });
  }

  /** Write localStorage before any app code runs. */
  private async seedStorage(entries: Record<string, string>): Promise<void> {
    await this.page.addInitScript((kv: Record<string, string>) => {
      for (const [key, value] of Object.entries(kv)) window.localStorage.setItem(key, value);
    }, entries);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async goto(path = '/home'): Promise<void> {
    await this.page.goto(`${config.pwaUrl}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Labels of the section/destination tiles on the current page. */
  async tileLabels(): Promise<string[]> {
    const tiles = this.page.locator('.tile .tile-title');
    await tiles.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => { /* empty grid */ });
    return (await tiles.allTextContents()).map(t => t.replace(/\s*↗$/, '').trim());
  }

  /** Labels of the bottom-nav tabs. Requires a mobile viewport — see the `pwa` Playwright project. */
  async bottomNavLabels(): Promise<string[]> {
    return (await this.page.locator('.bn .bn-tab .bn-label').allTextContents()).map(t => t.trim());
  }

  /** Open the "More" sheet and read its section headings. */
  async moreSheetSections(): Promise<string[]> {
    await this.page.getByRole('button', { name: 'More' }).click();
    const headings = this.page.locator('.bn-sheet-section');
    await headings.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => { /* none */ });
    return (await headings.allTextContents()).map(t => t.trim());
  }

  // ── API helpers ────────────────────────────────────────────────────────────

  /**
   * Call a hub endpoint with a bearer token (or none), in an ISOLATED request context.
   *
   * `page.request` shares the browser context's cookie jar, and the hub sets a JSESSIONID on a
   * successful JWT call. A second call through the same jar is then authenticated by that cookie —
   * PwaJwtAuthFilter short-circuits on an already-authenticated context and never looks at the
   * Authorization header at all. Any assertion about what a token buys would be testing the cookie
   * instead. A fresh context per call makes the token the only credential in play.
   */
  async apiGet(path: string, token?: string): Promise<ApiResult> {
    const context = await playwrightRequest.newContext();
    try {
      const response = await context.get(`${this.backendUrl}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        failOnStatusCode: false,
      });
      // Read the body BEFORE disposing — a disposed context invalidates its responses.
      const text = await response.text();
      let body: any = null;
      try { body = JSON.parse(text); } catch { /* not JSON */ }
      return { status: response.status(), text, body };
    } finally {
      await context.dispose();
    }
  }
}
