/**
 * Test-lab environment — the PWA as the THIRD node of the local lab, alongside the hub and the
 * desktop client. Selected by `npm run start:lab` (see angular.json's `lab` configuration).
 *
 * Two deliberate differences from the dev environment:
 *
 *  - `serverUrl` points at the LAB HUB, not the desktop client. In production the PWA only ever
 *    talks to the hub, and pointing it at a desktop client in the lab would exercise a topology
 *    that does not exist. It stays cross-origin rather than being proxied through the dev server,
 *    so the hub's CORS rules are actually under test (they already allow http://localhost:*).
 *
 *  - Supabase is BLANK. The dual-authority fallback would otherwise reach a real cloud project from
 *    a test run: a failed lab login would fall through to Supabase and could mutate live auth state,
 *    and tests asserting "the hub rejected this" would pass or fail on someone else's data. Blank
 *    means `SupabaseAuthService.configured` is false and every fallback path short-circuits, so the
 *    lab tests exactly one authority.
 *
 * Keep the port in step with `automation-test/test.config.ts` (syncServerUrl).
 */
export const environment = {
  production: false,
  /** The lab hub. Matches automation-test/test.config.ts syncServerUrl. */
  serverUrl: 'http://localhost:8090',
  supabase: {
    url: '',
    anonKey: '',
  },
  // No Power Automate from the lab — submissions must resolve against the lab hub or fail loudly,
  // not silently succeed by reaching the real Power Automate tenant.
  paGatewayUrl: '',
  powerAutomateUrl: '',
  paFlowUrls: {
    workRequest: '',
    jha: '',
    confinedSpace: '',
    instrument: '',
    fieldList: '',
    inventory: '',
    sds: '',
    qualifications: ''
  },
  emailRecipient: '',
  emailCcRecipients: '',
  retryAttempts: 1,
  retryDelayMs: 200,
};
