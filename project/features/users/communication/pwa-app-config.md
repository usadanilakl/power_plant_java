# PWA App-Config — Post-Auth Endpoint Distribution

Small utility layer that keeps sensitive endpoint URLs (Power Automate flow URLs, Supabase Edge Function verifier URL, and any future third-party integration URLs) **out of the PWA bundle shipped from GitHub Pages** and instead delivers them to the PWA at login time.

Status: **Design only** as of 2026-07-24.

Filed under `communication/` because the immediate motivator is protecting the chat + WR / JHA / rounds PA flow URLs, but the mechanism is generic and applies to any endpoint we don't want catalogued by public scanners.

## Problem

The PWA is served from `dk-power.github.io` / `jacksongeneration.github.io`. Everything shipped in its build artefacts is world-readable: view-source, `curl`, GitHub search, and search-engine indexing all pick it up. Today the environment files (`browser/ng-ui/src/environments/environment*.ts`) contain:

- PA V2 flow URLs (each embeds a SAS `sig=` — treat as credential material).
- Backend API base URL (hub public URL, already known and fine).
- Supabase project URL + anon key (once dual-auth ships).
- Any future Edge Function URLs.

The PA URLs in particular are the pain: they're both a secret (SAS-signed) and a target (they receive writes that eventually land in SharePoint / hub). Shipping them in the bundle gives a passive attacker the full attack surface before they've done any work.

The JWT gate on those endpoints raises the floor — an unauthenticated caller can't do anything useful — but does nothing to hide the URLs themselves from scrapers, dorking, or accidental disclosure.

## Goal

- URLs that we consider sensitive **do not appear** in the PWA bundle.
- The PWA fetches them after successful authentication and holds them only for the duration of the session.
- If a URL leaks or is abused, we can rotate it centrally with no PWA redeploy.
- Works whether the login went against hub or against Supabase (dual-auth fallback).
- Cold-loading the PWA without a valid session leaves the sensitive-endpoint features non-functional (they need config that isn't present) — degrades cleanly rather than crashing.

## Non-goals

- Real security against a determined authenticated attacker. Once logged in, the URLs are in browser memory and IndexedDB — same-origin JS can extract them. That's fine: at that point the attacker has a valid JWT and could hit the endpoints directly anyway.
- Encrypting IndexedDB contents. Not useful against same-origin scripts; adds complexity.
- Hiding URLs from anyone with legitimate PWA access. This is defence against reconnaissance, not authorised users.

## Value that this actually delivers

- Search-engine indexing of PA URLs — blocked.
- Bots / crawlers scraping GitHub Pages for endpoint patterns — blocked.
- URL disclosure via accidental console logs, stack traces, bug reports — reduced (URLs only present in memory after login).
- Rapid endpoint rotation without waiting for PWA rebuild + redeploy cycle — enabled.

## Architecture

Two independent endpoints serve the same shape, and the PWA tries them in dual-auth order.

### `GET /api/pwa/secured/app-config` (hub)

New endpoint under `PwaConfigController`. Requires a valid JWT (existing filter). Returns:

```json
{
  "issuedAt": "2026-07-24T10:15:00Z",
  "endpoints": {
    "paFlows": {
      "workRequestSubmit": "https://prod-XX.westus.logic.azure.com/.../triggers/manual/paths/invoke?...&sig=...",
      "jhaSubmit":         "https://prod-XX.westus.logic.azure.com/.../invoke?...&sig=...",
      "fieldListSubmit":   "https://prod-XX.westus.logic.azure.com/.../invoke?...&sig=..."
    },
    "supabase": {
      "verifyJwtFunction": "https://YOUR_PROJECT.functions.supabase.co/verify-jwt"
    }
  },
  "featureFlags": {
    "plantChatEnabled": true,
    "importantAckRequired": true
  }
}
```

Content is populated from `application-secrets.properties` — same properties already loaded server-side today. Not a separate secret store; just a controlled projection of what the server knows.

### `public.app_config` (Supabase)

Table with the same shape, one row keyed by a canonical version string. Read-only for all authenticated users via RLS (`for select using (auth.role() = 'authenticated')`). Hub writes rows periodically (once a day is fine) via the service-role key so Supabase always has a fresh copy.

Why both:
- Hub-served config is authoritative and rotates instantly on hub restart / secrets edit.
- Supabase-served config is the fallback for when the PWA authenticated via Supabase because hub was unreachable. Without this, PWA falls back to Supabase for auth but has no way to fetch its endpoint config → PA fallback path is dead.

## PWA integration

### On successful login

```ts
async function afterLogin() {
  const config = await fetchAppConfig();      // dual-path with fallback
  await appConfigStore.write(config);         // IndexedDB, session-scoped
  configReady$.next(config);
}

async function fetchAppConfig(): Promise<AppConfig> {
  try {
    return await http.get('/api/pwa/secured/app-config');  // hub
  } catch (_hubDown) {
    const { data } = await supabase
      .from('app_config')
      .select('*')
      .single();
    return data;
  }
}
```

### On feature invocation

```ts
async function submitWorkRequest(payload) {
  const config = await appConfigStore.read();
  if (!config) throw new NotLoggedInError();
  const url = config.endpoints.paFlows.workRequestSubmit;
  return http.post(url, payload);
}
```

### On logout / session expiry

- `appConfigStore.clear()` deletes the IndexedDB entry.
- Any in-flight feature invocations that read after logout hit `NotLoggedInError` and route the user back to login.

### On cold start with existing session

- Boot checks IndexedDB. If entry present AND JWT still valid, use it directly — no fetch.
- If entry missing but JWT valid, refetch config silently.
- If JWT expired, force login before touching any feature that needs config.

### Freshness / staleness

- `issuedAt` on the config lets the PWA decide if it should refetch on its own (e.g. every 4 hours). Cheap; no user impact.
- Hub rebuild / secrets edit doesn't invalidate old configs — old URLs may still be live for a grace period. Rotation practice: introduce new URL alongside old, wait for PWAs to refetch (24h), then decommission old.

## Hub-side implementation

New:

- `PwaConfigController` under `controller/pwa/`.
- `AppConfigService` in `sevice/config/` that assembles the payload from `@Value`-injected properties.
- `SupabaseAppConfigSyncJob` — `@Scheduled(fixedDelay = 86400000)`, hub-mode only, writes the current config into Supabase `app_config` table via the existing `SupabaseAdminClient` (available after dual-auth work).

No new secrets — this consumes existing ones.

## Supabase-side implementation

New migration `<ts>_app_config.sql`:

```sql
create table public.app_config (
  version text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
create policy "authenticated_read" on public.app_config
  for select using (auth.role() = 'authenticated');
-- No insert/update/delete policies — service role only.
```

## PWA-side implementation

- New `AppConfigService` in `browser/ng-ui/src/app/services/` — the dual-path fetch, IndexedDB persistence, and typed getters.
- New guard `ConfigReadyGuard` for routes whose features require config to be present. Blocks navigation until config is loaded (rare — usually only right after cold-start-with-valid-JWT).
- Environment file cleanup: strip PA URLs and Edge Function URLs from `environment*.ts`. Keep only truly public config (backend base URL, Supabase URL + anon key).

## Threat model

| Attacker | Before this change | After |
|---|---|---|
| Search-engine crawler | Indexes PA URLs from PWA bundle | Sees only login pages + non-sensitive backend base URL |
| Automated GitHub / dork scanner | Finds SAS-signed URLs by pattern | Finds nothing |
| Casual URL enumerator (no login) | Can probe every PA URL | Nothing to probe |
| Authenticated user extracting from browser | Trivially reads URL from source | Trivially reads URL from IndexedDB (unchanged) |
| Insider with legitimate access | Nothing hidden anyway | Same |
| XSS on the PWA origin | Reads URLs from source | Reads URLs from IndexedDB (same-origin) |

Net: raises the floor against reconnaissance; unchanged ceiling against authenticated compromise.

## Deferred

- Signed short-lived per-URL tokens (rotating on every fetch). Currently the same URL is issued to every session. If PA URL rotation becomes a frequent operational need, add per-session ephemeral URLs by introducing an Azure Function or Supabase Edge Function that proxies to the real PA URL and validates the JWT before forwarding. Not needed for v1.
- Feature-flag delivery via the same channel — the shape already accommodates it. Fine to add flags as we need them; no design change.

## Open items to resolve during implementation

1. Decide whether Supabase's daily `app_config` refresh happens from the hub (via `SupabaseAdminClient`) or from a Supabase cron job (`pg_cron`). Hub-driven is simpler and reuses existing infra; cron-driven works even when hub is fully down for extended periods.
2. IndexedDB storage key — should scope by user ID so multi-account browser sessions don't leak config between users. Standard PWA pattern; verify the existing storage layer already namespaces by user.
