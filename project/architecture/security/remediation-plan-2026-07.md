# Security Remediation Plan — July 2026

Opened after the 2026-07-30 incident: a tech-support-scam popup ("browser locker") appeared on two
plant desktops at roughly the same time. Forensics attributed it to the hidden **WeatherBug**
scraper window — an ad-funded page rendered 24/7 in a hidden `BrowserWindow`, where a malicious ad
frame called `window.open()`.

Investigating that turned up a second, unrelated and more serious finding: a chain from a web page
to `data/certificate.pfx` that did not depend on Electron isolation at all.

---

## Status

### Shipped (deployed to most desktops + hub, 2026-07-30)

| Change | Where |
|---|---|
| App-wide popup default-deny for non-local pages, `beforeunload` traps neutralised | `managers/window-guards.ts` + `App.onReady()` |
| WeatherBug window pinned to host, own `persist:weatherbug` partition, deny-all permissions | `weather.manager.ts` |
| `disableDialogs` on headless scrapers; `safeDialogs` on interactive external windows | weather / perry / gate-log / ams; pjm / webview |
| AMS scraper's unconditional `{action:'allow'}` popup handler scoped to the AMS host | `webview-ams.manager.ts:273` |
| `shell.openExternal` restricted to http/https/mailto | `handlers.ts:440` |
| **Reflected XSS fixed** — `HtmlUtils.htmlEscape` on both `submit-from-email` sinks | `PwaWorkRequestController`, `PwaJhaController` |
| **CSP** on those two endpoints (`default-src 'none'`) | same, via `htmlResponse()` helper |
| WeatherBug enable/disable toggle, **default OFF**, per machine | Settings > Data Polling |

The hub deploy was **necessary**: neither PWA controller is profile-gated, so the XSS was
internet-facing at `jgportal.jpowerusa.com` on an endpoint designed to be clicked from email.

### Not shipped — this plan

---

## Release A — Spring Boot + Angular (hours)

All three need one deploy, so batch them.

### A1. Disable the H2 console in prod
`spring.h2.console.enabled=false` in `application-prod.properties` (currently only
`application-postgres.properties` disables it).

**Why:** it is the file-read primitive. From a foothold in the `localhost:8082` origin, the console
lets an attacker open a fresh `jdbc:h2:mem:` database (creator = admin, so shipped credentials are
not needed) and call `FILE_READ('data/certificate.pfx')`. It is what decides whether a future web
bug means *API abuse* or *stolen certificate*.
**Cost:** no SQL console on prod desktops; use `scripts/database/` instead.
**Not an auth change** — does not affect desktop auto-login.

### A2. Gate `DesktopAutoAuthFilter` off the hub
`@Profile("!hub")` on the filter. `sync.role=hub` appears only in `application-hub.properties:8`,
so desktops (profile `prod`) keep it and **auto-login is unchanged on every desktop**. Electron
always talks to its own port 8082 (`constants.ts:45`), never the hub's.

**Why:** on an internet-facing server, "any loopback request gets full ROLE_ADMIN with no
credential" is safe only because IIS reliably adds `X-Forwarded-For` and `NetworkUtils:37-39`
rejects proxied requests. One IIS reconfiguration, or any scheduled task / monitoring probe / SSRF
on the hub box, and that becomes admin-for-free. The hub has no desktop user, so the filter does no
useful work there.
**Cost:** browsing to the hub's own port from the hub console now shows a login prompt.

### A3. Custom-header requirement on state-changing requests
A filter rejecting state-changing requests without e.g. `X-Requested-With: DKPowerManager`, plus one
Angular `HttpInterceptor` adding it globally.

**Why:** this closes the residual desktop exposure. A malicious page in an Electron window can still
fire **blind GETs** at `localhost:8082` and be auto-authenticated as admin — it cannot read the
response, but the side effect lands. Real examples:

- `/ng/admin/sync-queue/compact` — `NgAdminFunctionalitiesController:211`, whose own comment says
  it is a GET to *"avoid the CSRF token a POST needs"*
- `/work-request/process/{sharepointId}` — `WorkRequestController:75`, closes a work request and
  fires a certificate-signed SharePoint write
- `/server/stop` — `AppController:15`, `System.exit(1)`

One `<img src>` triggers any of them. A custom header forces a CORS preflight that a cross-origin
attacker cannot satisfy, killing the whole class at once.

**Note:** requiring operators to log in would NOT fix this — the attack rides the user's own
authenticated session. That is what CSRF is. The header is the fix; a login screen is not.

**Also noted, not scheduled:** no `server.address` is set anywhere, so desktop port 8082 listens on
all interfaces and is reachable from the LAN (no auto-auth off-loopback, but endpoints are exposed).

---

## Release B — Electron updater hardening (~2 days)

**Prerequisite for Release C. Ships as an Electron 31 → 31 update, where the flaw is still benign.**

`electron-update.manager.ts:271-278` extracts with `Expand-Archive` and gates the success marker on
`if not errorlevel 1`. `Expand-Archive` raises a **non-terminating** error when it cannot replace a
locked file and `powershell.exe` still exits 0. Reproduced verbatim:

```
Remove-Item : Cannot remove item ...\dest\locked.txt: being used by another process
RAW_ERRORLEVEL=0
RESULT=MARKER_WRITTEN__UPDATE_REPORTS_SUCCESS
locked.txt   : OLD-CONTENT      <-- silently stale
unlocked.txt : NEW-CONTENT
```

Harmless today only because every build ships **identical Electron 31 binaries**, so a failed binary
overwrite rewrites the same bytes. A major bump changes every binary — a partial extraction then
leaves a mixed Chromium tree that will not launch. It compounds:

- `:306` — `Wait-Process ... } catch { }` swallows the timeout and extracts over a running app,
  *creating* the locked-file condition
- `:376` / `:382` — copies the new version file and deletes staging, so the machine records itself
  as current with no ZIP to retry from
- `:367` — failure branch ends at `pause >nul`, after the app and Spring Boot are already stopped

Net: a bricked desktop that believes it is up to date, with no remote path to push a fix.

**Fixes, in order:**
1. `$ErrorActionPreference='Stop'` + explicit `exit 1`; gate the marker on SHA-256 verification of
   the exe and `app.asar` against a manifest shipped in the ZIP
2. Drop the empty `catch {}` — abort if the app did not exit
3. Rename install dir to `.prev` before extracting; add `--rollback`. **This is what makes the
   Electron upgrade reversible without visiting each machine** (the working dir lives outside the
   install dir, so a directory swap is safe)
4. Relaunch the old exe on failure instead of `pause`

---

## Release C — Electron 31.7.7 → current (~4–6 days)

Chromium 126 (June 2024), several majors past end-of-life, so ~18 months of published Chromium
security fixes have never reached it. Verified locally from the project's own `electron-to-chromium`:
`31 → chromium 126`, `39 → 142`, `41 → 146`.

**Urgency dropped** once WeatherBug went off by default — an EOL renderer is dangerous in proportion
to the hostile content fed to it. Still must happen: the app cannot stay on an unsupported browser,
and the vendor sites it scrapes (Perry, PJM, AMS, eBinder, Maximo) will eventually stop supporting a
2024 browser, at which point scrapers fail silently.

**Eases the work:** zero native modules installed. `vosk` is declared but not installed and
`vosk.manager.ts:60` requires it inside a try/catch that degrades gracefully. Nothing needs
recompiling against a new ABI.

**Needs verification before committing to a target** (unverified leads from the scoping run):
- The SDS PDF capture identifies Chromium's PDF viewer by extension id and diffs the frame tree
  (`webview-sds.manager.ts:1071-1079`). Electron 41 reportedly moved PDF rendering into the same
  WebContents, which would break the primary path *and* both fallbacks, failing silently with zero
  PDFs attached.
- Latest stable version, and the "latest three majors" support window.
- The claim that no removed APIs are used anywhere in the main process.

---

## Order, and why

1. **A** first — hours of work, no rollout risk, and A1 is the difference between a future web bug
   costing an API call versus the SharePoint certificate.
2. **B** before **C** — a dependency, not a preference. C delivered through today's updater risks
   bricking machines that then report themselves current.
3. **C** last — largest job, and its exposure is already mostly removed.

## Open decisions

- **A1** — is the H2 console used for admin work on prod desktops?
- **A2** — does anyone regularly administer from the hub console? If so, a narrower variant keys on
  the loopback interface binding rather than the client IP.
- **C** — target version, pending the PDF-capture verification above.
