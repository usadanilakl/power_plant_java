# Security Remediation Plan — July 2026

Written in plain language. Technical references are given so the work can be picked up directly,
but every item leads with what the problem actually is.

**Background.** On 2026-07-30 a fake "call this number" popup appeared on two plant desktops at
about the same time. It came from an advert on the WeatherBug page, which the app was loading in a
hidden window 24 hours a day to read lightning distance. Investigating that turned up a second,
unrelated and more serious problem: a route from a malicious web page to the SharePoint certificate
that had nothing to do with the popup.

---

## Already done (deployed 2026-07-30)

- Malicious pages can no longer open popup windows anywhere in the app, and can no longer trap a
  window open so it cannot be closed.
- The WeatherBug window was locked to that one website, given its own isolated storage, and refused
  all browser permissions.
- Pop-up dialog boxes are switched off entirely in the background scraper windows, and rate-limited
  in the ones people actually use — this is what made the scam popup impossible to dismiss.
- A hole in the AMS scraper that still allowed popups was closed.
- The app will now only open normal web links externally, not other kinds of system links.
- **Two pages that echoed text back to the browser without cleaning it were fixed**, and given a
  strict content policy as a second layer. This was the important one.
- WeatherBug lightning is now a per-machine on/off switch, **off by default**.

The hub needed this deploy too: those two pages are not restricted to desktops, so the flaw was
reachable from the public internet at `jgportal.jpowerusa.com`, on a page designed to be opened from
an email link.

---

## A1 — Turn off the database web page on plant PCs

**The issue.** The app includes a built-in web page for typing database commands directly. It is a
developer tool and it is currently switched on in the live configuration. On its own that is not a
disaster, but it is the step that turns a small web flaw into a serious one: from inside the app, it
can be used to read files off the hard drive — including `certificate.pfx`, the key that lets the
app write to SharePoint as the company, and its password, which sits in a plain text file next to
it. It is the difference between an intruder being able to poke the app and being able to walk off
with the key.

**The fix.** One line: `spring.h2.console.enabled=false` in `application-prod.properties`.

**The risk of doing it: very low.** Nothing in the app uses this page. The only references to it are
security rules that simply become unused (`SecurityConfigSpring:87`, `:148`).

**What you give up.** Running database queries from a browser on plant PCs. Use `scripts/database/`
instead.

---

## A2 — Stop the hub trusting "this came from the same machine"

**The issue.** On a desktop, the app signs the operator in automatically because the request comes
from the same PC — this is why nobody ever sees a login screen. The same code also runs on the hub
server, which is published to the internet. There, the only thing separating outside traffic from
"same machine" traffic is that the web server (IIS) tags outside requests with a header, and the app
rejects anything carrying that tag (`NetworkUtils:37-39`). That works today. But if the tagging ever
stopped — a web server reconfiguration, a scheduled task running on the hub, a monitoring tool, or a
flaw elsewhere in the app — anything reaching the hub would be treated as a **full administrator
with no password**. The hub has no operator sitting at it, so the feature earns nothing there.

**The fix.** `@Profile("!hub")` on `DesktopAutoAuthFilter` so it runs on desktops only.

**The risk of doing it: low**, and verified three ways:
1. Sync never used this feature. It only applies to same-machine requests, and a desktop talking to
   the hub is not the same machine.
2. Sync is authorised by network address instead (`lanOnlyMatcher`, `SecurityConfigSpring:283-295`)
   — no login involved at any point.
3. The Electron app always talks to its own local copy on port 8082 (`constants.ts:45`), never the
   hub.

Desktop auto-login is completely unchanged. Reverting is one annotation.

**What you give up.** If someone remotes into the hub server and opens the app in a browser *there*,
they now type their password.

---

## A3 — Require a private handshake on requests that change data

**The issue.** This is the leftover from the popup incident. A malicious page inside the app cannot
read anything back from the local backend — that is blocked. But it can still *fire off* requests,
and those are treated as coming from a signed-in administrator. It never sees the result, but the
action still happens. Real examples found in the code:

- `/server/stop` — one hidden image tag shuts the backend down (`AppController:15`)
- `/work-request/process/{id}` — closes a work request and triggers a SharePoint write
  (`WorkRequestController:75`)
- `/ng/admin/sync-queue/compact` — whose own comment says it was made a GET to *avoid* the security
  token a POST would need (`NgAdminFunctionalitiesController:211`)

**Making operators log in would not fix this.** The malicious page borrows the operator's own signed-in
session — that is precisely how this class of attack works. A login screen changes whose name is on
it, nothing else.

**The fix.** Require every data-changing request to carry a small custom header. Browsers do not let
a page from another website attach custom headers without asking the destination for permission
first — and that permission will be refused. So the attack stops working entirely. Our own app adds
the header automatically everywhere.

**The risk of doing it: moderate to high if rushed.** The rule rejects anything without the header,
and several callers cannot easily send one:

| Caller | Problem |
|---|---|
| Electron app itself | Makes ~20 calls directly (`/ng/rounds/report`, `/ng/contractors/sync`, `/ng/schedule/sync`, `/ng/sds-chemicals/*`, `/ng/maximo/*`, `/api/fire-impairment`) that bypass the app's web layer. Fixable — it is our code |
| 17 older pages | Use plain HTML forms, which **physically cannot** send custom headers. These need a different mechanism |
| Sync | Sends no such header (`ServerSseClient:224-227`). Include those addresses and **sync stops across the whole plant** |
| Power Automate | An outside service we cannot modify |
| Email submission link | A data-changing link clicked from a mail app — can never carry a header |
| PWA | Only uses `/api/pwa`, so it is safe as long as that is excluded |

**Mitigation that makes this safe: ship it in watch mode first.** It logs what it *would* have
blocked, and blocks nothing. Run for a week, collect the real list from live use, then switch it on.
That extra deploy turns this from the riskiest item into one of the safest.

**Estimate:** 2–3 days including the watch-mode phase.

---

## B — Fix the auto-updater before shipping anything large

**The issue.** When the app updates itself it unzips the new version over the old one. If any file
is still locked — because the app has not fully closed — the unzip skips that file, prints an error,
and **still reports success**. This was reproduced exactly:

```
Remove-Item : Cannot remove item ...\locked.txt: being used by another process
RAW_ERRORLEVEL=0
RESULT=MARKER_WRITTEN__UPDATE_REPORTS_SUCCESS
locked.txt   : OLD-CONTENT      <-- silently not updated
unlocked.txt : NEW-CONTENT
```

The PC then records itself as up to date, deletes the downloaded update, and there is nothing left
to retry from. Three related problems make it worse: it carries on even when the app has not closed
(which is what causes the locking in the first place), it wipes the staging folder afterwards, and
when it does fail it leaves the PC sitting at a console prompt with no app and no backend running.

Today this is harmless, because every update ships the *same* core program files — a skipped file
gets rewritten identically. The moment we ship a version where those files genuinely change, a
half-finished update leaves a PC that will not start, believes it is current, and cannot be repaired
remotely. Someone has to physically visit each one.

**The fix.** Four changes in `electron-update.manager.ts`: make the unzip fail loudly (`:271`),
refuse to continue if the app has not closed (`:306`), keep the previous version so it can be rolled
back (`:376`, `:382`), and relaunch the old version on failure so a PC is never left with nothing
(`:367`).

**The risk of doing it: moderate**, for an unusual reason — we are modifying the very thing that
delivers fixes. Break it and we cannot push a repair. It must be tested on one machine, with the old
version restorable by hand, before going anywhere near the fleet. It ships as a normal update where
the program files do not change, so the existing flaw stays harmless while we fix it.

**Estimate:** ~2 days. **This must happen before C.**

---

## C — Update Electron

**The issue.** The app contains its own private copy of Google Chrome — that is what draws the
screen and loads outside websites. It is from **June 2024**. Normal Chrome patches itself every few
weeks; this copy cannot, and roughly 18 months of published browser security fixes have never
reached it. Because those fixes are public, so are the flaws they fix: it is a documented list of
ways to attack a browser of that exact version. If one were used, a malicious page could read files
straight off the PC, including the SharePoint certificate, skipping every step described above.

There is also a practical, non-security reason: the outside sites the app scrapes — Perry Weather,
PJM, AMS, eBinder, Maximo — will eventually stop supporting a 2024 browser, and when they do the
scrapers will quietly return nothing rather than fail visibly.

**Urgency dropped** once WeatherBug was switched off by default. An out-of-date browser is dangerous
in proportion to the hostile content fed to it, and that supply has largely been cut. It still has
to happen — it just is not the most likely thing to hurt you any more.

**The fix.** Upgrade Electron, bump the packaging tool from `electron-builder ^24`, and test
everything that touches the browser.

**The risk of doing it: high.** Every core program file changes, which is why B comes first. Several
things would fail *silently* rather than loudly — particularly the SDS PDF capture, which locates
Chrome's built-in PDF viewer in a way a newer Chrome reportedly rearranged; it would keep reporting
success while attaching zero PDFs. Needs a staged rollout: one machine, a full test pass, a shift of
ordinary use, then the rest.

**One thing in our favour:** no native code modules are installed, which is normally the hardest part
of this kind of upgrade. (`vosk` is listed but not installed, and it is loaded defensively at
`vosk.manager.ts:60`.)

**Estimate:** 4–6 days. Verified locally: Electron 31 = Chrome 126, 39 = Chrome 142, 41 = Chrome 146.

---

## Risk at a glance

| Item | Risk | Effort | Note |
|---|---|---|---|
| A1 Database page off | **Low** | Minutes | Nothing depends on it |
| A2 Hub auto-login off | **Low** | Minutes | Sync and desktop login verified unaffected |
| A3 Handshake header | **Mod–High** | 2–3 days | Watch-mode phase is mandatory |
| B Updater fix | **Moderate** | ~2 days | Break it and you cannot push a repair |
| C Electron upgrade | **High** | 4–6 days | Requires B first |

---

## Order, and why

1. **A1 + A2 together, now.** Minutes of work, each reversible in one line, and A1 is the difference
   between a future web flaw costing an API call or the SharePoint key.
2. **A3 next, on its own,** starting in watch mode. Not batched with A1/A2 — it needs its own
   release and its own observation period.
3. **B before C.** A dependency, not a preference. C delivered through today's updater risks leaving
   PCs that will not start and cannot be fixed remotely.
4. **C last.** Biggest job, and its exposure has already been largely removed.

---

## Observations — noted, not scheduled

- **Sync trusts any device on the plant network with no password.** Authorisation is purely by
  network address (`SecurityConfigSpring:283-295`), and the sync clients send no credentials
  (`ServerSseClient:224-227`). This is a deliberate design choice, unchanged by anything above — but
  it is why the "closed network" assumption carries so much weight here. Revisiting it is a much
  bigger conversation.
- **The desktop backend listens on every network connection, not just its own machine** — no
  `server.address` is set anywhere, so port 8082 is reachable from the plant network.

## Open decisions

- **A1** — is the database web page used for admin work on plant PCs?
- **A2** — does anyone regularly administer from the hub server console? If so there is a narrower
  variant that keys on the network interface rather than the address.
- **C** — target version, pending a check of the PDF-capture question.
