# Test lab — three nodes

The lab models the real topology: a hub, a desktop client, and the PWA. Each is a separate process
on its own port, and each talks to the others the way it does in production.

```
  PWA (browser/ng-ui)          Desktop client (this repo)
    :4200  ──────┐                 :8082  ──┐
                 │                          │
                 └──────▶  HUB  ◀───────────┘
                          :8090
```

The PWA talks **only to the hub** — never to the desktop client. That is the only topology that
exists in production, and pointing it at :8082 would exercise one that doesn't.

## Ports

| Node | Port | Config key |
|---|---|---|
| Hub / sync server | 8090 | `syncServerUrl`, `pwaBackendUrl` |
| Desktop client (+ the Spring-served jgportal bundle) | 8082 | `clientBackendUrl`, `frontendUrl` |
| PWA dev server | 4200 | `pwaUrl` |

All four are overridable by environment variable — see `test.config.ts`.

## Starting it

**Hub** and **desktop client**: start as usual for the lab (hub on 8090, client on 8082).

**PWA**:

```bash
cd browser/ng-ui
npm run start:lab      # ng serve --configuration lab --port 4200
```

The `lab` configuration swaps in `src/environments/environment.lab.ts`, which differs from the dev
environment in three deliberate ways:

- **`serverUrl` points at the lab hub** (`:8090`), not at `:8085` as the dev environment does. Keep
  this in step with `pwaBackendUrl` here.
- **Supabase is blank.** Otherwise the dual-authority fallback reaches a real cloud project from a
  test run: a failed lab login would fall through to Supabase, and assertions about what the hub
  rejected would depend on someone else's data. Blank makes `SupabaseAuthService.configured` false,
  so every fallback path short-circuits and the lab tests exactly one authority.
- **Power Automate is blank**, so a submission must resolve against the lab hub or fail loudly
  rather than quietly succeeding against the real tenant.

The `lab` build also omits `serviceWorker`, because ngsw caching across a run produces stale-asset
flakiness.

## Running the suites

```bash
cd automation-test
npx playwright test --project=chromium   # desktop client + jgportal
npx playwright test --project=pwa        # the PWA
```

The two projects are disjoint: `chromium` ignores `tests/pwa/**`, and `pwa` matches only that
directory.

### Why the PWA project uses a mobile device profile

`devices['Pixel 5']`, and this is load-bearing rather than cosmetic. The PWA's bottom navigation is
declared inside `@media (max-width: 768px)`, so under Desktop Chrome it is `display: none` — every
navigation assertion would silently pass against nothing.

## Signing in from a test

The PWA holds a JWT in `localStorage`, not a session cookie, so `PwaPage.signIn()` exchanges
credentials with the hub and seeds `pwaAuthData` through an init script. It has to be an init script:
`AuthService` reads that key in a field initialiser, so a value written after the app has booted is
never picked up.

`PwaPage.continueAsGuest()` seeds `pwaGuestAcknowledged` to take the "continue without signing in"
path without clicking through the welcome page.

## Known gap

`tests/pwa/pwa-access-tiers.spec.ts` signs in as the seeded admin, which satisfies every role
predicate — enough to prove the signed-in surface renders, but not enough to prove the tiers differ.
Per-role fixtures (plant vs insulation vs instrumentation vs contractor vs pending-approval) need
the `e2e.test-endpoints.enabled` provisioning endpoints and belong in their own spec.
