# Electron upgrade preparation — 31.7.7 to 43.x

Written 2026-08-09. Companion to `remediation-plan-2026-07.md` (this closes its "EOL Electron 31" item).

**Status: preparation only. No code has been changed for the upgrade.** The updater hardening
(extract-to-swap, verified swap, `<install>.prev` rollback copy, `rollback.cmd`) is already
committed and is the prerequisite that made this upgrade safe to attempt.

Everything version-specific below carries a URL. Where a fact could not be sourced, it says so —
see section 6, which is not optional reading.

---

## 1. Target version recommendation

**Target `electron@^43.0.0`** (43.3.0 as of this writing).

| | current | target |
|---|---|---|
| Electron | 31.7.7 | 43.3.0 |
| Chromium | 126 | 150.0.7871.212 |
| Node (bundled) | 20.x | 24.18.1 |
| V8 | — | 15.0.245.23 |
| Node ABI (`modules`) | — | 148 |

Source for the 43.3.0 row, verbatim record from <https://releases.electronjs.org/releases.json>:
`{"version": "43.3.0", "date": "2026-08-04", "node": "24.18.1", "v8": "15.0.245.23", "modules": "148", "chrome": "150.0.7871.212"}`.

### Why 43 and not something else

Support policy, <https://www.electronjs.org/docs/latest/tutorial/electron-timelines>:
> The latest three _stable_ major versions are supported by the Electron team.

and

> The latest stable release unilaterally receives all fixes from `main`, and the version prior to
> that receives the vast majority of those fixes as time and bandwidth warrants. The oldest
> supported release line will receive only security fixes directly.

Schedule rows from <https://releases.electronjs.org/schedule>:

| Electron | Chromium | stable | EOL |
|---|---|---|---|
| 31.0.0 | M126 | Jun 11, 2024 | **Jan 14, 2025** |
| 40.0.0 | M144 | Jan 13, 2026 | Jun 30, 2026 |
| 41.0.0 | M146 | Mar 10, 2026 | **Aug 25, 2026** |
| 42.0.0 | M148 | May 5, 2026 | Oct 20, 2026 |
| 43.0.0 | M150 | Jun 30, 2026 | **Jan 5, 2027** |
| 44.0.0 | M152 | Aug 25, 2026 | Mar 2, 2027 |

- **41 is not a destination** — it dies ~2 weeks after this was written. It also shipped the new
  PDF implementation with a crash bug fixed only in a later 41 patch
  (<https://github.com/electron/electron/pull/50845>, backport to `41-x-y` merged Apr 10 2026,
  release note: "Fixed a crash when rendering PDFs when Site Isolation is disabled").
- **42 buys ~10 weeks.** Not worth the test cycle.
- **44 ships Aug 25, 2026** and would buy two more months (EOL Mar 2, 2027), but it would be a `.0`
  on day one, and it removes prebuilt Windows ia32 binaries. Our `build.win` is
  `{"target": ["nsis"]}` with **no `arch` key** — x64 is an unpinned electron-builder default, not a
  stated fact. Before ever moving to 44, pin `arch: ["x64"]` explicitly.
- **43** is three patches deep, is the newest stable, and buys ~5 months. Take 43 now; take 43→44 as
  a routine one-major bump around Nov 2026, before 43 EOLs.

Our installed 31.7.7 is dated **2025-01-14 — the exact EOL date**, i.e. it is the last patch that
will ever exist on that line. That is ~19 months and 24 Chromium majors of unshipped security fixes.

### Companion bumps

**`electron-builder` `^24.13.3` → `^26.15.7`** (in `electron-manager/package.json`).

There is **no official electron ↔ electron-builder compatibility matrix**. The GitHub issue that
asks exactly this (<https://github.com/electron-userland/electron-builder/issues/7660>) has no
maintainer answer. So this bump is justified by recency and by what changed, not by a policy quote:
electron-builder 26.0.0 "migrate to official `electron/asar` packaging" and "adding integration with
@electron/fuses" (<https://github.com/electron-userland/electron-builder/releases>, v26.0.0,
2025-01-26). `app-builder-lib@26.15.7` depends on `@electron/asar` 3.4.1, `@electron/get` ^3.0.0,
`@electron/fuses` ^1.8.0, `@electron/rebuild` ^4.0.4; our installed 24.13.3 has **none** of them.

Gotcha: the npm `latest` dist-tag is `26.15.3` while the `v26` tag is `26.15.7`. A bare
`npm i -D electron-builder` installs 26.15.3. Write the range explicitly.

The one electron-builder 26 breaking change — Windows signing config moved to `win.signtoolOptions`
— **does not apply**: `build.win` declares only a target, no certificate keys anywhere.

**`@types/node` `^20.11.0` → `^24`** in *both* `electron-manager/package.json` and
`electron-manager/src/renderer/package.json`.

This is partly forced, not elective: `electron@43.3.0` declares `@types/node: ^24.9.0` as a real
dependency (`npm view electron@43.3.0 dependencies`), where `electron@31.7.7` declares `^20.9.0`.
Bumping Electron alone drags 24 into the tree alongside our declared `^20.11.0`; npm hoists one and
nests the other, and `tsconfig.main.json`'s `"types": ["node"]` then resolves whichever won —
non-deterministic. Align them.

Do **not** go to `@types/node` 26 — that tracks a Node major Electron does not ship.

TypeScript: the declared `^5.3.3` has already resolved to **5.9.3** in `node_modules`, which is
above `@types/node`'s `typesVersions` fallback ceilings (`<=5.6`, `<=5.7`), so the main process gets
the primary type definitions. Nothing to do. The renderer is pinned `~5.6.0` and will use the
`ts5.6/` fallback folder — harmless, the Angular renderer does not consume Electron types.

**Build-box Node:** `electron@43.3.0` declares `engines: { node: ">= 22.12.0" }`. This machine is on
v22.14.0 / npm 11.3.0. Already satisfied. Note the asymmetry — Node 22 builds it, Node 24 runs
inside it.

**Native modules: none.** `find node_modules -name "*.node"` returns zero results, and
`node_modules/vosk` does not exist despite `vosk` being declared in `package.json`. Its `require` is
inside a try/catch at `electron-manager/src/main/managers/vosk.manager.ts:59-66` that sets
`this.vosk = null` and warns. **No ABI rebuild is needed for this upgrade.** If vosk is ever
actually installed it must be rebuilt against ABI 148.

**Install mechanics change at 42+.** From
<https://www.electronjs.org/docs/latest/breaking-changes> (42.0):
> Previously, the `electron` npm package would download the Electron binary from the repository's
> GitHub Releases in the package's `postinstall` script.

and

> Electron will now download itself dynamically the first time that its main `bin` script is run
> (e.g. via `npx electron`).

Confirmed at the registry: `electron@43.3.0` has an empty `scripts` object; our installed 31.7.7
still has `"postinstall": "node install.js"`. So after `npm ci`, `node_modules/electron/dist` will
not exist until something runs the bin script. Packaging is **not** affected — I read our own
`app-builder-lib`: `out/electron/electronVersion.js` reads the version out of
`node_modules/electron/package.json` (which still exists) and `out/electron/ElectronFramework.js:23`
downloads the dist itself rather than copying from `node_modules`.

---

## 2. The PDF-capture question — **STILL OPEN**

**It cannot be closed from documentation. It has to be run.** But it is bounded, it is not a
blocker, and the shape of the work is known.

### What is settled

**Staying below the change is not an option.** From
<https://www.electronjs.org/docs/latest/breaking-changes>, under "Planned Breaking API Changes
(41.0)", heading "Behavior Changed: PDFs no longer create a separate WebContents":
> Previously, PDF resources created a separate guest WebContents for rendering. Now, PDFs are
> rendered within the same WebContents instead. If you have code to detect PDF resources, use the
> frame tree instead of WebContents.

and

> Under the hood, Chromium enabled a feature that changes PDFs to use out-of-process iframes
> (OOPIFs) instead of the `MimeHandlerViewGuest` extension.

The last release without this is Electron 40, which is already EOL. Every supported target (41/42/43)
carries it.

**The approach is already correct.** `webview-sds.manager.ts:1070-1079` detects the viewer by
walking `mainFrame.framesInSubtree` — exactly the "use the frame tree" migration the doc prescribes.
The URL matcher accepts `chrome-extension://`, `chrome-untrusted://`, and the literal PDF-viewer
extension id `mhjfbmdgcfjbbpaeojofohoefgiehjai`.

**There is exactly one load-bearing capture mechanism, not three.** The file's comments describe a
layered design (CDP body capture, `setWindowOpenHandler` URL harvest, Ctrl+S fallback). Two of the
three are dead **today, on Electron 31**, before any upgrade:

- `pendingPdfCapture` (declared `= null` at line 68) is **never assigned a resolver anywhere in the
  file**. I grepped: it appears only at 68 (init), 458 (guard), 460 (read), 461 (set null), 520
  (guard), 537 (guard). No assignment site. Therefore `notifyPdf` always returns at 458, and the CDP
  `Network.getResponseBody` path always aborts at 537.
- The Ctrl+S fallback promised by the comment at line 1031 does not exist — the only `sendInputEvent`
  in the file sends Escape, inside `dismissPdfViewer`.

So the whole feature rides on: find viewer frame → `executeJavaScript` inside it → click
`cr-icon-button#save` through up to 6 nested shadow roots → catch `will-download`. Electron 41
perturbs the first link and there is no backstop behind it.

### The three concrete risks

**(a) Frame selection — first-match-wins.** Under OOPIF the viewer is composed of two frames.
From a Chromium resource-access CL,
<https://groups.google.com/a/chromium.org/g/extensions-reviews/c/fte5FbmiFsw>:
> The frames that should be able to access the resources are the extension frame and the content frame.

and

> This is the case for MimeHandlerViewGuest PDF Viewer, as the PDF extension is in an inner
> WebContents... For OOPIF PDF Viewer, there is only one WebContents, so the top frame's origin is
> not the same.

`webview-sds.manager.ts:1136` is `all.find(f => isViewerFrame(f) && !preClickFrameIds.has(...))` —
first match wins. If the content frame enumerates first, we bind to a frame with no toolbar,
`findBtn` returns `'no-btn'`, `capturePdf` returns null. Whether both frames match `isViewerFrame`
at all is unknown — nothing sourced says what URL the OOPIF *content* frame carries.

**(b) Detached frames — applies to every target ≥ 33, not just the PDF change.** From the same
breaking-changes page, "Planned Breaking API Changes (33.0)", heading "Behavior Changed: frame
properties may retrieve detached WebFrameMain instances or none at all":
> APIs which provide access to a `WebFrameMain` instance may return an instance with
> `frame.detached` set to `true`, or possibly return `null`.

and

> When receiving an event, it's important to access WebFrameMain properties immediately upon being
> received. Otherwise, it's not guaranteed to point to the same webpage as when received.

`capturePdf` does precisely the late-access pattern the doc warns against: it captures
`const main = win.webContents.mainFrame` **once** at line 1070, then holds that reference across
`await dismissPdfViewer` (1077), the row click (1093-1121), and a 24-iteration / 12-second poll loop
that re-reads `main.framesInSubtree` after each `await sleep(500)` (1133-1137). `pdfFrame` is bound
at 1136 and used after further awaits at 1147 and 1151. Grep confirms the file never touches
`frame.detached` and never calls `isDestroyed()` on a frame (the five `isDestroyed()` hits are all on
`BrowserWindow`). OOPIF makes this **more** likely, not less — PDF frames are now created and torn
down inside the page's own frame tree once per row. `weather.manager.ts:261` walks
`framesInSubtree` on an ad-laden page and has the same exposure.

Both `detached` and `isDestroyed()` are documented, non-deprecated members of `WebFrameMain`
(<https://www.electronjs.org/docs/latest/api/web-frame-main>). `frameTreeNodeId` is also still
documented and not deprecated — the pairing key is fine; frame *lifetime* is what changed.

**(c) Closed shadow root — UNCONFIRMED, do not assume it applies.** A Chromium extensions thread,
<https://groups.google.com/a/chromium.org/g/chromium-extensions/c/cEXWmvxozP0>, reports "the shadow
root with the flag enable is showing as 'closed'". **That thread is about a content script querying
the *embedder* document**, not about code running inside the extension frame. Our code runs inside
the extension frame, where `PdfViewerElement` is a Lit element (`chrome/browser/resources/pdf/
pdf_viewer.ts` extends `PdfViewerBaseElement` extends `CrLitElement`) with no closed-mode
declaration and a dozen `this.shadowRoot.querySelector(...)` call sites — implying an open root.
Marked **unknown**, not asserted. The spike answers it.

Note also that risks (b) and (c) produce the **same** log signature (`no-btn` / `exec-error`). The
spike must log `detached` to tell them apart.

**(d) Minor — `#save` may open a menu instead of downloading.** At Chromium ToT,
`chrome/browser/resources/pdf/elements/viewer_download_controls.ts` imports
`cr_action_menu.js` and declares a `menu: CrActionMenuElement`; the `<cr-icon-button id="save">`
dispatches `onSaveClick`, which can route to a save-original / save-with-changes menu instead of
firing a download. Low risk for read-only SDS PDFs, but it is a Chromium 126→150 jump. Signature:
log says `clicked:save` but no `captured PDF N bytes` follows.

### How it fails: silently, and it blames the vendor

`capturePdf` returns `null` on every failure branch (1125, 1145, 1176, 1187, 1194) with only
`console.warn`. Null flows to `collectFromEbinder:681,683`, then to the backend, where
`src/main/java/com/dk_power/power_plant_java/sevice/angular/sds/SdsSyncPdfsService.java:135-137`
increments `ebinderHadNoPdf` and returns **without** appending to `report.getErrors()`. `scrape()`
sets `lastError` only when the whole import POST fails. So `getStatus()` reports `error: undefined`.

**The operator sees a green, completed run that says "the eBinder had no PDF for these N chemicals."**
That is a plausible-sounding wrong answer that blames the third-party site.

The one saving grace: no data loss. `SdsSyncPdfsService.java:131-133` states the contract in its own
comment — "Validate the incoming PDF before doing ANY writes. Missing or invalid -> skip and
preserve existing attachments. This is the preservation guarantee: a bad scrape can't overwrite a
good local copy." The early return precedes all writes. A silent capture failure is a **no-op**, not
a destroyer.

### What to do, and what it costs

**Do not gate the upgrade on a rewrite. Spike first — 30 minutes.**

The code already dumps every frame's `url` and `origin` on failure at line 1143. Install Electron 43,
run the *unmodified* scraper against ONE chemical with the scrape window visible, and read that dump.
The eBinder is a third-party site; its real frame tree can only be observed, not derived. Before the
spike, add two throwaway lines to that dump: `f.detached` and `f.isDestroyed()`.

If a rewrite is needed, budget **~100-150 lines in one file, half a day to a day** — dominated by
live iteration against the vendor site, not by coding:

1. Try *every* candidate viewer frame instead of `.find()` first-match.
2. Re-read `win.webContents.mainFrame` fresh on each poll iteration; re-resolve the frame immediately
   before `executeJavaScript`; guard on `detached`.
3. Implement the Ctrl+S fallback the comment at 1031 already promises.
4. Delete the two dead paths (`pendingPdfCapture` and everything that guards on it) or wire them up —
   but do not leave them looking like fallbacks when they are not.
5. Add a run-level fail-loud: "0 PDFs captured from N rows" must set `lastError`, not just a counter.

Item 5 is worth doing **regardless of what the spike finds** — it is a pre-existing defect.

---

## 3. Breaking changes that affect us

| Change | Version | Our code | What to do |
|---|---|---|---|
| **PDFs no longer create a separate WebContents** (OOPIF replaces MimeHandlerViewGuest) | 41 | `webview-sds.manager.ts:1070-1147` (frame hunt), `:1151-1177` (shadow-DOM `#save`), `:443` (`plugins:true`) | Spike before upgrading (section 2). Rewrite the frame selection if the dump shows two frames. |
| **Frame properties may return detached `WebFrameMain` or null** | 33 | `webview-sds.manager.ts:1070` (`main` held across 12s of awaits), `:1133-1151`; `weather.manager.ts:261` | Re-read `mainFrame` per poll iteration; guard on `frame.detached`. Log `detached` in the spike. |
| **`app.commandLine` lowercases switches AND arguments** — "The API will convert upper-case switches and arguments to lowercase, and will not pass them to child processes." | 36 | `app.ts:826` — `appendSwitch('enable-features', 'WebBluetooth')` | **Verify empirically.** The doc establishes lowercasing; nothing sourced says Chromium's feature-list parser is case-sensitive on feature *values*. Read `chrome://version`'s Command Line row after upgrading. If it shows `webbluetooth`, Brady pairing may be dead silently. `:825` is all-lowercase and unaffected. |
| **`urls` property of `WebRequestFilter`** — empty `urls` no longer matches everything; `<all_urls>` required | 35 | `app.ts:78` and `app.ts:163` — `onHeadersReceived` registered with **no filter argument at all** | **Unresolved.** The doc covers an empty `urls` array; it does not say what an *omitted* filter does. Test it (checklist C1) rather than reason about it. If it degrades, the Permissions-Policy override stops applying and Bluetooth dies the same way as the row above. |
| **`electron` no longer downloads itself via `postinstall`** | 42 | `package.json` `"start"`, `"electron"`, and any clean-checkout CI | Binary arrives on first `npx electron`. Test from a deleted `node_modules`, not an incremental install. Packaging is unaffected (verified in `app-builder-lib`). |
| **`console-message` positional args deprecated**; `level` becomes a string | 35 | `webview.manager.ts:587` — `(_event, _level, message)` | **Deprecated only, still emitted** (the API page still lists `level`/`message`/`line`/`sourceId` marked *Deprecated* alongside the new `details` object). Our handler ignores `_level` entirely and compares `message` to a string sentinel, so the Integer→string change is inert. Clean up when convenient. |
| **`window.open` popups are always resizable** | 39 | `window-guards.ts:43-49` returns bare `{action:'allow'}`; caller at `renderer/.../electron.service.ts:1801` | Cosmetic. Popups our own UI opens become resizable. The deny path is unchanged, so there is no security consequence. Restore with `overrideBrowserWindowOptions: { resizable: ... }` only if someone complains. |
| **Windows ia32 prebuilt binaries removed** | 44 | `package.json` `build.win` = `{"target":["nsis"]}` — **no `arch` key** | Not a 43 problem. Before moving to 44, pin `arch: ["x64"]`. Right now x64 is an electron-builder default, not something we state. |

### Considered and does not apply

Each of these was grepped, not assumed. All return zero hits in our source.

- **`File.path` removed** (32) — no `.path` read off a `File` or `DataTransfer` anywhere in the
  renderer; no `webUtils` usage.
- **`clipboard` deprecated in renderers (40), removed from renderers (44)** — we already use
  `navigator.clipboard.writeText`
  (`renderer/.../fire-impairment/close-impairment-dialog.component.ts:178,184`), which is the
  documented replacement. Electron's `clipboard` module is imported nowhere, including the preload.
- **Dialog methods default to Downloads** (43) — zero `showOpenDialog` / `showSaveDialog` /
  `*Sync` hits. We only use `dialog.showMessageBox`.
- **`webContents.printToPDF()` argument overhaul** (21) — `handlers.ts:1701-1705` already uses the
  post-21 `margins: { marginType: 'none' }` shape. Already migrated.
- **`setPermissionCheckHandler` first param may be null** (13) — `app.ts:154` ignores it
  (`(_webContents, permission)`).
- **Native modules require C++20** (33) — zero native modules installed (see section 1). Becomes
  live only if vosk is ever actually installed.
- **`PrinterInfo.isDefault` / `.status` removed** (36) — zero `PrinterInfo` / `getPrintersAsync`
  hits. We only call `webContents.print` and `printToPDF`.
- **`webPreferences.plugins`** — exhaustive grep of the full 3348-line breaking-changes doc for
  `plugins|pepper` returns exactly one hit: Pepper Flash removal in Electron 12. Nothing has
  touched `plugins` since. Our two uses (`webview-sds.manager.ts:443`, `handlers.ts:1710`) are safe.
- **`will-download` / `DownloadItem`** — exhaustive grep of the same doc returns **zero** hits in
  any version section back to 5.0. Session-level, not frame-level, so structurally insulated from
  the OOPIF change. This is the last link of the SDS capture chain and it should survive.
- **`sandbox` / `contextIsolation` / `nodeIntegration` defaults** — no entry in any section ≥ 32
  changes them; those entries live under 12.0 and 20.0. Irrelevant anyway: all 13 `BrowserWindow`
  creations set `contextIsolation: true` + `nodeIntegration: false` explicitly, and
  `main-window.manager.ts:41` sets `sandbox: false` explicitly. Our security posture is pinned by
  our own code.
- **`session.clearStorageData` `quotas` removal** (42), **`session` extension API move** (36),
  **`session.setPreloads` deprecation** (35), **`plugin-crashed` removal** (38),
  **`utilityProcess` changes** (37), **`ProtocolResponse` session=null** (37),
  **cookie change-cause** (41), **WebUSB/WebSerial blocklists** (37), **desktopCapturer /
  NSAudioCaptureUsageDescription** (39), **offscreen rendering `deviceScaleFactor`** (42),
  **`nativeImage` getBitmap/toBitmap** (36/43), **`systemPreferences.isAeroGlassEnabled`** (35/36),
  **`nativeTheme` reduced-transparency** (33), **`textured` window type** (33), **WebSQL
  directory deletion** (32), **`showHiddenFiles`** (41/43) — all grepped, all zero hits.
- **Every macOS entry** (33 drops 10.15, 38 drops 11, 42 UNNotification, 44 drops 12) and **every
  Linux entry** (35 portal, 36 GTK4, 37 IsVisibleOnAllWorkspaces, 38 Wayland/ozone, 43 rounded
  corners / WCO) — inapplicable. `package.json` `build` has `win` and `nsis` keys only;
  `build.mac` and `build.linux` are both undefined.

---

## 4. Manual test checklist

Run on **one disposable machine**. Do the baseline pass first — most acceptance criteria here are
log lines, and "the log line is missing" is uninterpretable unless you know it was there before.

Items marked **[SILENT]** fail without any visible error. They are the ones that get skipped and
they are the ones that matter. If you only have an hour, do the SILENT items.

Working directory for all configs and logs: `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\`
when packaged, `electron-manager/managed_apps/pid/` in dev.

### 0. Pre-flight (before touching package.json)

**0.1 — Snapshot credentials. [SILENT if skipped]**
Do: open `perry-config.json`, `gate-log-config.json`, `webview-ams-config.json`, `pjm-config.json`
in the working dir.
Proves: `perryUsername`/`perryPassword`, `gateUsername`/`gatePassword`, `username`/`password`,
`voyagerUsername`/`voyagerPassword` are all non-empty.
Failure: any blank means that scraper is currently running purely on a persisted cookie in its
`persist:` partition. If the upgrade invalidates the Chromium profile, there is nothing to log in
with and the credential has to be obtained from scratch. **Fill these in before upgrading.**

**0.2 — Back up the working dir.** Copy `db\proddb.mv.db`, `uploads-prod\`, all `*.json`,
`electron-version.json` to external storage. Item 8.4 physically swaps install directories.

**0.3 — Baseline pass on the CURRENT 31.7.7 build.**
Do: build and package on 31.7.7 as-is, then run items **C1, E4, F1, G1, H3, K3, L1** and save the
full log to a file.
Proves: you have a before-picture.
Failure: if something is already broken today, you find out now instead of blaming Electron for it.
Specifically expect **K3 (Smart Resync) to already fail in a packaged build** — see section 6.

**0.4 — Confirm the packaged layout the updater expects. [SILENT until an update is attempted]**
Do: `npm run package:zip`, then inspect the output.
Proves: `build\<unpacked>\` root contains `DK Power Manager.exe` **and** `resources\app.asar`, and
the produced `.zip` contains both at its root.
Failure: either missing. `electron-update.manager.ts:302-312` verifies exactly those two paths
inside the extracted payload and aborts the swap if either is absent — a layout change from
electron-builder 26 blocks every field update, and it fails at apply time on the user's machine, not
here.

### 1. Build and package

**1.1** `npm run build:main` after the `@types/node` bump. Proves: clean `tsc`. Failure: type errors
pointing at a `typesVersions` fallback folder → raise the renderer's TypeScript.

**1.2** Confirm `node_modules/@types/node` resolves to a **single** 24.x. Failure: two copies (one
hoisted, one nested under `electron`) → the main-process build resolves against whichever won, which
is not deterministic.

**1.3 — Install mechanics (Electron 42+ change).** Delete `node_modules/electron`, run
`npm install`. Proves: `node_modules/electron/dist` does **not** exist but
`node_modules/electron/package.json` does; then `npm run electron` downloads the binary on first run
and the app launches. This is the single most likely thing to surprise you.

**1.4** `npm run package:dir` with electron-builder 26. Proves: `build\win-unpacked` has the exe
with the right stamped version, and **all** extraResources landed — `jre/`, `tessdata/`,
`config-defaults/`, `etapro-defaults/`, `qa-data/`, `data/certificate.pfx`, `vosk-model/`,
`scripts/database/h2-2.2.224.jar`. electron-builder 26 changed file-copy and asar logic; verify
extraResources rather than assume.

**1.5** Confirm the installer produced is x64 only, no ia32 output. `build.win` specifies no arch,
so a builder default change shows up here.

### 2. App shell

**2.1 — Main window.** Launch the packaged app. Proves: frameless dark `#1a1a2e` window appears once
content is ready; sidebar renders Home / PID App / Updates / Permits / Fire Impairment / Gate Log /
WebView AMS / SDS Import / Personnel / TOI-TMOD / Cork-Board / Weather / PJM / Logs / Sync & Updates
/ Settings; custom titlebar minimize/maximize/close all work. Failure: white or black empty window
(Angular bundle not loading from the `file://` URL) or an OS titlebar appears.

**2.2 — Preload bridge.** Ctrl+Shift+I on the main window, evaluate
`Object.keys(window.electronAPI).length`. Proves: ~100+, and `window.electronAPI.isElectron === true`.
Failure: `undefined` — `contextBridge.exposeInMainWorld` did not run, every page renders and every
button is dead.

**2.3 — Security posture.** In the main window and in one scraper window, evaluate `typeof require`.
Proves: `'undefined'` in both. Failure: `'function'` — `contextIsolation`/`nodeIntegration` are not
what our code asked for.

**2.4 — IPC + log stream.** Open the Logs page, leave it open, Stop then Start JG Portal from the
menu. Proves: `[OUT]`/`[ERR]` (Spring stdout) and `[EM] [LOG]` (main process) stream live; the Home
status card flips stopped → starting → running without a refresh. Failure: logs only appear after
navigating away and back (subscription broken) or never (invoke/handle broken).

### 3. Spring Boot lifecycle

**3.1 — Start/stop.** Menu JG Portal > Stop, then Start. Proves: log shows "Stopping Spring
Boot..." → "Spring Boot exited (code: ...)"; on start, the bundled JRE path, then within ~15s
running/healthy and the Start item greys out. Failure: stuck on "starting" (health check to
`/actuator/health` never 2xx) or immediate "Process exited unexpectedly".

**3.2 — Port-conflict recovery.** With JG Portal running, restart the manager. Proves: "Port 8082 is
already in use — stopping existing instance...", "Graceful shutdown succeeded", then a normal start.
Failure: falls through to "Force killing process on port 8082 (PID: n)" — still works but means the
`/server/stop` path regressed.

**3.3 — Clean exit.** With JG Portal running, close the window. Proves: modal "Confirm Exit"; "Stop
and Exit" removes `java.exe` from Task Manager before closing. Failure: window closes with
`java.exe` orphaned holding port 8082 and the H2 file lock.

**3.4 — H2 compaction pre-launch hook.** Watch Logs for `[Compact]` at startup. Proves: exactly one
of "skip: last checked Nh ago", "skip: DB NNNMB below 250MB floor", or "running maintenance ..." +
"finished (exit 0)". Failure: "[Compact] spawn failed" (powershell.exe spawn broken under the new
Node) or a multi-minute hang before Spring Boot starts.

### 4. Web Bluetooth / Brady printer — **[SILENT]**

This is the highest-risk item after the SDS scraper, and the UI only ever says "Failed to connect".
**The log is the only diagnostic.**

**C1 — Pair and print.** With JG Portal healthy: PID App → a LOTO Points page → Brady Printer
Manager → "Connect to Printer", with a Brady printer powered on and in range.

Proves, in order:
- at startup: `[BLUETOOTH-FIX] Registering Permissions-Policy override on defaultSession`
- then: `[BLUETOOTH-FIX] Header override applied to <url> (hit #1)`
- on click: `[BLUETOOTH-FIX] select-bluetooth-device fired at +Nms, K device(s)` with **K > 0**
- then: `[BLUETOOTH-FIX] Brady match: "<name>" — selecting`
- panel shows "Successfully Connected!" and Test Print emits a label.

Three distinct failures that look identical in the UI:
- **No "Header override applied" lines at all** → the `WebRequestFilter` change (Electron 35) bit
  us; `onHeadersReceived` with no filter no longer matches anything.
- **Header lines present but "select-bluetooth-device fired" never appears** → `requestDevice` was
  blocked by Permissions Policy before Electron asked us. Most likely the `enable-features` switch
  got lowercased (Electron 36).
- **Fires repeatedly with 0 devices, ends at "12000ms timeout ... Cancelling"** → discovery works,
  the chooser never receives named devices. Not an Electron-API problem; a Chromium BLE scanning
  behaviour change.

**C2 — Read the switch directly.** With the app running, navigate a throwaway window to
`chrome://version` and read the **Command Line** row. Proves: `--enable-features=WebBluetooth` in
**mixed case**. Failure: `webbluetooth` lowercase → the Electron 36 change applies to us. 30 seconds,
unambiguous, do it regardless of whether C1 passed.

### 5. SDS scraper — the most Chromium-fragile path in the app

**H1 — List scrape only (touches nothing).** SDS Import → "1 · Run report". Proves:
`[SDS-Scraper] page 1: N rows`, page 2, ...; the gap report renders. Failure: a `page-1-no-rows`
diagnostic dump — that is an eBinder page change, not a Chromium change.

**H2 — CDP attach. [SILENT]** Watch the log at the start of any SDS run. Proves:
`[SDS-Scraper] CDP attached for PDF body capture (auto-attach enabled)`. Failure:
`CDP unavailable — falling back to re-fetch` — the run continues on a fallback the code itself
documents as producing invalid bytes, because the PDF endpoint is one-time-signed. The scrape
"succeeds" and attaches garbage.

**H3 — PDF capture, the spike. [SILENT — read `pdfsAttached`, not the success banner]**
Do: SDS Import → "2 · Close gaps", with the scrape window visible, ~5 rows then Stop.
Proves, per row:
- `row N (KEY): fresh PDF viewer frame found (id=..): chrome-extension://...` — and check the URL is
  the **extension UI page**, not a content/stream frame
- `row N (KEY): Download click result: clicked:save`
- `row N (KEY): captured PDF NNNNN bytes` with a plausible N (tens of KB+)
- final report shows `PDFs attached: N` with N > 0, and the chemical opens with a renderable
  attachment in JG Portal.

Failures — all logged, **none surfaced to the user**, and the import still reports created/updated
counts:
- `no NEW PDF viewer frame after click; K frame(s) in subtree` → read the per-frame `url=` /
  `origin=` dump that follows. **That dump is the ground truth for the rewrite.** Paste it into the
  ticket. Count how many frames match — two is the OOPIF signature.
- `Download click result: no-btn` **with a correct extension-frame URL in the previous line** → this
  is the specific signature that either the closed-shadow-root report applies to us, or the frame
  detached between binding and use. Log `f.detached` in the dump to tell them apart.
- `clicked:save` but **no** `captured PDF N bytes` → screenshot the viewer; check whether a save
  *menu* opened instead of a download starting.
- `downloaded bytes are not a PDF (head=...)`.

**H4 — Multi-row pairing.** Run 3 rows. Proves: each row logs a **different** frame id and a
**different** byte count; `leftover viewer frame(s) survived dismiss` does not appear on rows 1 and 2.
Failure: repeated leftover warnings then `no NEW PDF viewer frame` — the ESC + close-button dismiss
no longer tears down an OOPIF frame, and every subsequent row fails. This is where the
wrong-PDF-under-wrong-key bug (already fixed once, see the comment at line 1128) would silently
return.

### 6. Other scrapers

**E4 — Perry Weather. [SILENT — its scrape catch block is literally empty]**
Restart the app and watch from launch (Perry starts automatically).
Proves: `[Perry] Starting Perry Weather monitor...` → `[Perry] Page loaded: https://app.perryweather.com/...`
(a **dashboard** URL, not `/Account/Login`) → `[Perry] Logged in successfully` →
`[Perry] Lightning: All Clear (0-10 mi)`; the Perry tile shows a status and temperature.
Failures, all quiet:
- `Page loaded: .../Account/Login` repeating with `Login submitted` between → `insertText` no longer
  reaches the MUI inputs; status stays `login-pending` forever.
- `No credentials configured in perry-config.json` → that file is blank on this machine.
- Dashboard loads but **no `[Perry] Lightning:` line ever appears** and the tile keeps its old value
  → `scrapeDashboard`'s catch at `perry-weather.manager.ts:275-277` is empty. A broken
  `executeJavaScript` produces **literally no output**.

**E5 — Perry session persistence.** Quit fully, relaunch. Proves: `Page loaded: <dashboard>` with no
`Login submitted` — the `persist:perry-weather` cookie survived. Failure: a full login every launch
= the Chromium profile was invalidated by the upgrade. Survivable only because 0.1 was done.

**F1 — Gate Log.** Gate Log page → Refresh. Proves: table fills, log ends with
`[GateLog] Gate: NNN CSV rows -> NN on site`. Failures, each naming its stage:
`ERR_CERT_*` → `setCertificateVerifyProc(callback(0))` on the window's own session no longer
suppresses the appliance's self-signed cert (`gate-log.manager.ts:506-509`, host
`https://10.56.80.80/`); "Gate Excel download button not found" → the DOM click chain broke;
"Gate CSV download timed out after 30s" → session `will-download` + `item.setSavePath` no longer
fires.

**G1 — WebView AMS.** WebView AMS → Refresh. Proves the full sequence for **both** report defs:
login or "Already logged in (session cookie) — skipping login"; `Login fields filled` with non-zero
lengths; `[rounds] Reports sidebar: clicked`; `Report Name "Set"`; `report-type row: clicked`;
`Saved Search "Rounds": option-selected`; `Run Report button: clicked`; `Excel downloaded`;
`done: N rows, M columns`; then the same for `[alarms]`; finally `Scrape complete: 2 ok, 0 failed`.
Failures: "Reports sidebar did not load — login may have failed" (login or DHTMLX bootstrap, note
`backgroundThrottling:false` exists specifically because Chromium throttles hidden windows to ~1Hz);
`Saved Search "Rounds" not applied ... available: <list>` (fails loud on purpose — running without
the filter dumps the whole unfiltered report); "Run Report download timed out after 90s".

**G2 — AMS stale-data trap. [SILENT]** A failed report **keeps its previously cached data** by
design (`webview-ams.manager.ts:159-167`). The tab shows a full table of yesterday's readings with a
small error line next to it, and operators read the numbers. **The log sequence in G1, not the
table, is the acceptance criterion.**

**G3 — AMS → H2 handoff. [SILENT]** Proves: `[WebViewAMS] Rounds report saved to Spring Boot H2`.
Failure: "Spring Boot unavailable — skipping DB save" — the scrape still "succeeds", the data never
lands.

**E1 — Open-Meteo forecast (always on, no browser window).** Open the Weather page. Proves:
`[Weather] Forecast updated: NN°F` and a non-zero temperature. Failure: fetch/parse error with the
panel stuck at 0°F. This uses Electron's `net` module, so it is the cheapest early warning that the
new Chromium network stack has a proxy/TLS problem on this machine.

**E2 — WeatherBug lightning. OFF BY DEFAULT — enable for the test, then TURN IT BACK OFF. [SILENT]**
Settings → Data Polling → WeatherBug lightning ON. Proves: `[Weather] WeatherBug lightning scraper
enabled` → `Page loaded, starting scraping...` → `[Weather] Lightning: <n> mi`; the tile shows a
distance.
Failure: `[Weather] Lightning data not available from any frame` — but note this line is guarded and
**fires only once**, on the transition into `unavailable`, then goes silent. And the tile shows `--`
with status `unavailable`, which is byte-for-byte what it shows when the scraper is **disabled** and
also what it shows on a quiet day. You cannot tell these three apart from the UI. Acceptance is
"exactly one such line and the status never leaves unavailable", not "a repeating line".
This page delivered the 2026-07-30 malvertising locker. Turn the toggle back off when done.

**E3 — Popup guard on the ad page.** With E2 still on, leave it 10-15 minutes (it reloads every
10 min) and grep for `[Weather] blocked`. Proves: either nothing, or `blocked popup:` /
`blocked navigation:` lines — and **no new visible window ever appears**. Failure: any unexpected
window, or the scrape suddenly reporting `unavailable` forever because the top frame navigated off
weatherbug.com.

**I1 — Session partition inventory. [SILENT — a re-login looks identical to a normal run]**
After the upgrade, before any manual re-login, exercise each scraper once and record whether it
re-authenticated. The six persisted partitions:

| partition | credentials | UI to edit them |
|---|---|---|
| `persist:perry-weather` | `perry-config.json` | **none** |
| `persist:gate-scraper` | `gate-log-config.json` | Gate Log page form |
| `persist:webview-ams` | `webview-ams-config.json` | WebView AMS page form |
| `persist:pjm` | `pjm-config.json` | **none** |
| `persist:webview-sds` | none (anonymous token URL) | — |
| `persist:weatherbug` | none | — |

Proves: AMS and gate report "already logged in ... skipping login" on their second run; Perry reaches
its dashboard with no login submit.
Failure: **all** of them re-login → the Chromium profile was invalidated. Survivable only because
credentials are on disk. Verify 0.1 was actually done.

### 7. Print and window guards

**D1 — Print current page.** Proves: OS print dialog opens; output has background colours
(`printBackground:true`) and zero margins. Failure: `{success:false}` (loud), or the dialog opens but
backgrounds are stripped / margins reappear (options shape changed — quiet).

**D2 — HTML preview window.** Trigger `printHtml`. Proves: a 900x700 "Print Preview" window with no
menu bar shows the rendered HTML. Failure: blank window — the whole document is URL-encoded into a
`data:text/html;charset=utf-8` URL, which is the thing most likely to bite on a Chromium jump.

**D3 — `printToPDF` + built-in PDF viewer.** Trigger `printWithPreview`, both orientations. Proves:
the generated PDF renders in the preview window (which sets `plugins:true`); the temp
`print-preview-*.pdf` is gone after closing. Failure: a download prompt or an empty grey pane means
the PDF plugin no longer mounts for `loadFile` — **this is the same plugin dependency the SDS
scraper needs, so a failure here predicts H3.** Cheapest possible canary; run it before H3.

**D4 — Gate Log print with a LONG list.** Refresh until 20+ people, then Print. Proves: dialog opens
with the full table; the hidden window is destroyed after. Failure: "Print failed", or nothing
happens and the renderer promise never settles — the hidden `data:`-URL window never became
printable.

**J1 — Popup deny from remote content.** PJM page → Open Voyager → in *that* window's DevTools run
`window.open('https://example.com')`. Proves: no window appears; log shows
`[WindowGuard] blocked popup from https://<pjm-host>/...: https://example.com`. Failure: a real
window opens — this is exactly the hole that popped the 2026-07-30 scam locker out of a hidden
scraper.

**J2 — Trusted origins still allowed.** From the PID App page, trigger any feature that opens a
popup (a printable-form view, a file viewer). Proves: it opens. Failure: blocked, with
`blocked popup from ...localhost...` — `isTrustedOrigin` mis-classified our own content, which
breaks print views app-wide.

**J3 — `safeDialogs` on interactive windows.** In the Voyager window's console run
`for (let i=0;i<6;i++) alert(i)`. Proves: one or two show, then "This page is repeatedly showing
dialogs and has been muted." Failure: all six show — a locker page can again block the whole app.

**J4 — `disableDialogs` on headless scrapers. [SILENT — presents as a hang, not a failure]**
You cannot inject into an invisible window. Instead observe that WeatherBug, Perry, gate and AMS each
reach their terminal log line. Failure: the log stops mid-sequence and the refresh never returns. An
invisible window is parked on a modal dialog nobody can dismiss. No error, no timeout on most of
these, no visible window.

**J5 — `beforeunload` trap override.** In the Voyager window run
`window.onbeforeunload = () => 'stay'`, then close it. Proves: closes with no prompt, log shows
`overrode beforeunload trap`. Failure: you get the prompt — remote pages can again refuse to close.

### 8. Sync and self-update

**K1 — Assessment refresh.** Sync & Updates → Refresh. Proves: rows for JAR / Database / Files /
resource packs / Electron with statuses and sizes; log `Assessment: JAR=yes DB=NNNMB ...`. Failure:
everything unreachable — a Node-side `http` failure to the sync server, not Chromium.

**K2 — JAR / DB / Files / Resource Packs.** One at a time. Proves: progress walks Stopping →
download% → extract → restart; JG Portal comes back healthy with the expected data; Help > Open
Guides shows a populated folder. The DB path unzips an H2 backup with `adm-zip` (pure JS), so a Node
24 issue surfaces here as an extraction error.

**K3 — Smart Resync.** Sync & Updates → Smart Resync. Proves: progresses into db + files phases and
restarts JG Portal. Failure: "Failed to fetch" / CORS. **Compare against your 0.3 baseline before
blaming the upgrade** — see section 6.

**K4 — Live SSE.** Proves: `[SyncUpdate] Connected to SSE`; a Fire Impairment change made elsewhere
refreshes without a reload. Failure: reconnects every 5s. This stream is plain Node `http`, not
Chromium — a failure here points at Node 24.

**L1 — Update download + verify.** Publish the new ZIP to the hub, then Download Update. Proves:
downloading → verifying → green "Update downloaded and verified"; the file lands in
`electron-update-staging\`. Failure: "Checksum mismatch: expected ... got ..." — the tmp file is
deleted, nothing staged.

**L2 — Apply (extract-to-swap).** Apply Update (Restart). Proves: `electron-update-staging\update.log`
contains, in order — "Waiting for PID <n>", "Process exited", "Extracting update to: `<install>.new`",
"Update applied and verified.", "Version file copied", "Previous version kept at `<install>.prev`
(run rollback.cmd to restore)", "Relaunching". Then: the app relaunches itself, Help > About shows
the new version, `<install>.prev` exists, `managed_apps\pid\rollback.cmd` exists.
Failures — each is **safe** (nothing was changed) but each blocks rollout:
"app still running after 60s - aborting, nothing changed"; "Verification FAILED: executable missing
from extracted payload" or "resources\app.asar missing" (the electron-builder 26 layout does not
match — see 0.4); "Swap FAILED: the install folder is still in use" (the script relaunches the OLD
exe rather than leaving the machine with nothing).

**L3 — Rollback. Test it explicitly, do not assume it.** After L2, fully quit, then double-click
`managed_apps\pid\rollback.cmd` and press a key at the "Close DK Power Manager first" prompt.
Proves: "Rollback complete. Relaunching..."; the app returns and About shows the **old** version.
Failure: "Nothing to roll back to - no previous version is stored" (the `.prev` folder was cleaned or
the swap never happened) or "FAILED: the install folder is in use".
Note `rollback.cmd` is written inside a **non-fatal** try/catch
(`electron-update.manager.ts:517-522` — a write failure is only a `console.warn`). **If the file is
absent after L2, do not ship the fleet until you know why** — recovery would be a manual folder swap
by someone standing at the machine.
Then re-apply L2 to leave the machine on the new build.

**L4 — Staging cleanup.** Relaunch after L2/L3. Proves: "Cleaned up staging directory (update
applied successfully)" and `electron-update-staging\` is gone. Failure: "Staging preserved (update
not yet applied)" after a successful apply → `electron-version.json` in the working dir does not
match the staged one, i.e. the copy step in `update.cmd` did not run.

### 9. Sweep

**N1 — Vosk degrade.** Grep startup log for `[Vosk]`. Proves: `Native module not available: Cannot
find module ...` appears once and the app carries on; a mic button returns an error string instead of
crashing. Failure: unhandled exception at startup. This is the only native `require` in the
codebase — if it degrades cleanly, no ABI work is needed anywhere.

**N2 — Backend-backed pages.** One click each: Fire Impairment (open a record), Personnel (contacts +
chat), Updates (news feed), TOI/TMOD (file list), Cork-Board. Proves: real data in each. Failure: all
of them empty = the backend client or IPC broke; one of them = that feature's endpoint.

**N3 — Shell integrations.** File > Open Data Folder; Help > Open Guides; any external link;
JG Portal > Open in Browser. Proves: Explorer/browser open. Failure: nothing happens —
`shell.openPath` failing on a path that did not ship is common after a repackage (check
`resources\qa-data` actually exists).

**N4 — Secondary windows + layout.** Open Permits Monitor and PJM Voyager, move/resize both, File >
Save Window Layout, quit, relaunch. Proves: `[Layout] Restoring secondary windows: [...]`, both
reopen at saved position/size, Permits Monitor navigates away from its waiting spinner once health
goes green. Failure: default position/size, or the waiting page forever.

**N5 — GPU / rendering sanity.** The app calls `app.disableHardwareAcceleration()` unconditionally.
Scroll a long PID App table, open the Weather charts, drag a window between monitors of different DPI.
Proves: no tearing, no blank regions, no font blurring, acceptable scroll. Failure: repaint artifacts
or sluggish scrolling — software rasterisation changes across Chromium majors and there is no GPU
fallback to hide behind.

**N6 — Power/session hooks (optional, 5 min).** With JG Portal running, sign out of Windows and back
in. Proves: log recorded "System shutdown detected — stopping Spring Boot" and no orphaned
`java.exe`. Failure: `java.exe` survives — the next launch goes through the port-conflict path.

**Do NOT run "File > Clear Application Data..." on a machine you care about** — it deletes the entire
working dir (JAR, database, uploads, device config). Exercise it only on the disposable machine, only
after 0.2.

---

## 5. Rollout procedure

**One machine at a time. There is no staged-percentage mechanism and none is needed.**

### Sequence

1. Do section 0 on the test machine, **including the 0.3 baseline on 31.7.7**. Keep the baseline log.
2. Bump `electron`, `electron-builder`, `@types/node` (both files). `npm install`. Section 1.
3. **Run the SDS spike (H3) before anything else that costs time.** It is 30 minutes and it decides
   whether this is a version bump or a version bump plus a day of scraper work.
4. Run the rest of the checklist. Diff every log against the baseline.
5. Section 8 (L1–L4) on the test machine, including a real rollback and a re-apply.
6. Leave the test machine on the new build for **one full working week**, in real use, before
   publishing to the fleet. Most of the failure modes above are silent and only surface when someone
   notices data is stale.

### What "go" looks like

All of the following, not a subjective impression:

- Every **[SILENT]** item produced its expected log line, and the line differs from the baseline only
  in ways you can explain.
- `PDFs attached` is non-zero on a 3-row SDS run, and the PDFs are correctly paired with their rows.
- Brady pairs and prints, and `chrome://version` shows `WebBluetooth` in mixed case.
- L2 succeeded, `<install>.prev` exists, `rollback.cmd` exists, **and L3 was actually executed and
  restored the old build**.
- One week of real use with no user-reported staleness.

### What "abort" looks like

Any one of these stops the rollout:

- `rollback.cmd` is missing after L2, or L3 fails to restore.
- L2 reports "Verification FAILED" (the electron-builder 26 packaged layout is not what the updater
  expects) — fix the layout or the verification before anything ships.
- Brady pairing dead with no diagnosis (this is a plant-floor workflow, not a nice-to-have).
- SDS captures 0 PDFs and the frame dump does not point at an obvious fix.

### The abort itself

The updater already keeps the previous install and writes the recovery script — you do not have to
build anything:

- `<install>.prev` — the full previous install tree. Deliberately not deleted after a successful
  update; the *next* update replaces it, so exactly one previous version is ever retained.
- `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\rollback.cmd` — written at apply time into the
  **working** dir (not staging, which is cleaned on success). Quit the app, double-click it, press a
  key. It moves `<install>` aside, moves `.prev` back, relaunches, and if the restore fails it puts
  things back and tells you.

Two limits to know before you rely on it: it needs the app **closed** (it prints "FAILED: the install
folder is in use" otherwise), and it does **not** touch the database or uploads — a rollback restores
the binary, not the data. If a bad build wrote bad data, that is a separate restore from your 0.2
backup.

---

## 6. Still unverified — read this before you start

These could not be closed from documentation. They are not edge cases.

1. **Whether the SDS PDF scraper survives.** Genuinely open. The eBinder is a third-party site whose
   frame tree can only be observed. The 30-minute spike (H3) answers it. Everything else in this
   document is knowable in advance; this is not.

2. **Whether Chromium's feature-list parser is case-sensitive on feature *values*.** The Electron 36
   doc establishes that `app.commandLine` lowercases arguments. Nothing sourced says whether
   `webbluetooth` still matches the `WebBluetooth` feature. The blog rationale ("Chromium switches
   aren't case-sensitive") is about switch **names**, not values. **This is the difference between
   Brady printing and not printing, and it fails silently.** Test C2 decides it in 30 seconds.

3. **Whether an omitted `WebRequestFilter` behaves like an empty `urls` array.** The Electron 35
   entry describes an empty `urls` property. Our two `onHeadersReceived` calls (`app.ts:78`, `:163`)
   pass **no filter object at all**. The docs do not say what that does. **COULD NOT CONFIRM.** Same
   blast radius as item 2 — the Permissions-Policy override is what makes Web Bluetooth work.

4. **Whether the OOPIF PDF viewer's shadow root is open or closed from inside the extension frame.**
   The report claiming "closed" concerns the *embedder* document seen by a content script; our code
   runs inside the extension frame, and the upstream `PdfViewerElement` is a Lit element with an
   apparently open root. Genuinely unknown. Do not plan around either answer.

5. **What URL the OOPIF PDF *content* frame carries.** Determines whether `isViewerFrame` matches one
   frame or two, which determines whether the first-match `.find()` at line 1136 is a bug. Nothing
   sourced answers it. The line-1143 dump does.

6. **Smart Resync (K3) may already be broken in packaged builds today.** The renderer fetches
   `http://localhost:8082/api/resync/smart-resync` directly from a `file://` document
   (`sync-updates.component.ts:681`; packaged renderer loads via `file:` in
   `main-window.manager.ts:77-84`). The backend CORS allow-list
   (`application.properties:226`) is `http://localhost:*` plus three https origins — a `file://`
   document sends `Origin: null`, which matches none of them. `FullResyncController` has no
   `@CrossOrigin` and the global CORS source registers `/**` with `allowCredentials(true)`. In **dev**
   the renderer is served from `http://localhost:<port>` and passes. **So this plausibly fails in
   every packaged build and works in every dev run, today, on Electron 31.** Baseline it at 0.3 or you
   will attribute a pre-existing bug to the upgrade and block the rollout on it.

7. **The Node 20 → 24 delta was not audited.** The whole of `src/main/**` is Node code — `fs`, `path`,
   `child_process` (the JRE spawn, the powershell H2 compaction), the CDP debugger attach. Electron's
   breaking-changes page does not list Node's removals. Nobody read Node 21/22/23/24 changelogs for
   this. Checklist items 3.1, 3.4, K1, K2 and K4 exercise the main Node paths, but that is smoke
   testing, not an audit. If something inexplicable breaks in the main process and not the renderer,
   look here first.

8. **electron-builder 26 packaged-layout compatibility was verified only by reading 24.13.3's
   source.** I confirmed that 24.13.3 resolves the Electron version from `node_modules` and downloads
   the dist itself — so the Electron 42 postinstall change does not break packaging. I did **not**
   verify that 26.15.7 produces the same output tree. Since the updater hard-codes `<exe>` and
   `resources\app.asar` inside the extracted payload, item 0.4 is the check that matters, and it must
   be done on the packaged output, not assumed.

9. **`vosk` is declared but not installed.** Everything in section 1 about "no native modules" is
   true only while that remains true. If anyone installs it, it needs a rebuild against ABI 148 and
   the C++20 requirement from Electron 33 becomes live.
