# Hub as a Windows Service (boot start, crash restart, log shipping)

How the **hub** instance runs on the Windows server: as a Windows Service via **WinSW**, so it
starts at boot without a login and auto-restarts on crash, plus a scheduled task that ships logs
to SharePoint so the latest log survives a crash.

Scripts live in [`scripts/server/`](../../scripts/server/) (`README.md` there has the step-by-step
install). This doc is the architecture/rationale + operations reference.

## Why a service (not the Startup folder)

The hub used to be launched by a `.bat` shortcut in the Windows **Startup folder**. That folder
(user *and* all-users) only runs on interactive **login** — never at boot before sign-in. So the
hub only came up after someone logged into the server, and nothing restarted it if it crashed.

A Windows Service fixes both:
- **Boot start, no login** — runs under `LOCAL SYSTEM` at boot.
- **Crash restart** — the wrapper relaunches the JVM if it dies unexpectedly.

## Components

| Piece | File | Role |
|---|---|---|
| Service wrapper | `power-plant-hub.exe` (WinSW-x64, renamed) | Runs the jar as service `PowerPlantHub` |
| Service config | [`scripts/server/power-plant-hub.xml`](../../scripts/server/power-plant-hub.xml) | java path, args, working dir, restart + log rules |
| Control menu | [`scripts/server/hub-control.bat`](../../scripts/server/hub-control.bat) | Self-elevating start/stop/restart/status/watch/debug/uninstall |
| Log uploader | [`scripts/server/upload-logs-to-sharepoint.ps1`](../../scripts/server/upload-logs-to-sharepoint.ps1) | Pushes `logs\*.log` to SharePoint (PnP + existing cert) |
| Uploader installer | [`scripts/server/install-log-upload-task.ps1`](../../scripts/server/install-log-upload-task.ps1) | Registers the upload as a SYSTEM scheduled task |

## Server layout

```
C:\forms\power_plant\                      <- working dir (jar, data\, logs\)
  power_plant_java-1.jar
  jdk-21.0.11+10\bin\java.exe              <- bundled JDK (no dependency on system Java)
  data\  logs\
  scripts\server\                          <- exe + xml + scripts + captured console logs
    power-plant-hub.exe / .xml
    power-plant-hub.out.log / .err.log     <- stdout/stderr capture
    hub-control.bat
```

### Key decisions
- **Bundled JDK**, not system Java. System Java resolves through Oracle's `javapath` shim, which
  repoints to whatever Oracle Java was installed *last* — a later JRE install could silently
  break the app. The XML points at `C:\forms\power_plant\jdk-21.0.11+10\bin\java.exe`. Trade-off:
  we own its security patching.
- **`java.exe`, not `javaw.exe`** — console process so WinSW can deliver Ctrl+C for graceful
  shutdown.
- **No `-Dspring.profiles.active`** — `prod,hub,server` is baked into the jar's
  `application.properties`, so the args match the original bat exactly (`-jar power_plant_java-1.jar`).
- **Graceful shutdown** — `server.shutdown=graceful` + `spring.lifecycle.timeout-per-shutdown-phase=30s`
  are already in `application.properties`. WinSW's `<stoptimeout>35 sec</stoptimeout>` sits just
  above the 30s window so the service waits for a clean H2 close instead of hard-killing.

## Behavior

- **Crash** (process exits unexpectedly / non-zero) → restart with escalating backoff 5s → 20s →
  60s; counter resets after 1h of clean uptime (`<onfailure>` + `<resetfailure>`). A *clean* exit
  (manual stop, exit 0) is **not** restarted.
- **Reboot** → `Automatic (Delayed)` start; comes up without login, after network/disk are ready.
- **No console window** — stdout/stderr go to `power-plant-hub.out.log` / `.err.log` (roll ~10MB,
  keep 8). Watch live with option 5 of the control menu or
  `Get-Content ...\power-plant-hub.out.log -Tail 40 -Wait`.

## Log shipping to SharePoint

A **separate** scheduled task (not in-app) uploads `logs\*.log` every 5 min + at startup. It is
deliberately external so it captures the latest log even when the app is dead — an in-app
uploader can't log the crash that kills it.

- Reuses the existing Azure app registration + `data\certificate.pfx` (the same SharePoint
  app-only auth the Java app uses); reads client/tenant/site/pfx-password from
  `application-secrets.properties` (searched next to the jar → `config\` → src tree).
- Lands in the default doc library under `ServerLogs\<machine-name>\`, overwritten each run
  (latest snapshot); local rolling history stays in `logs\archived\`.
- Requires a SharePoint *application* permission (`Sites.ReadWrite.All` or `Sites.Selected`) with
  admin consent — already granted for the Java app. A 403 from `Connect-PnPOnline` means that
  consent is what's missing.

See [logging-system.md](../logging-system.md) and the logback config
([`logback-spring.xml`](../../src/main/resources/logback-spring.xml)) for the log files themselves;
`power-plant-alerts.log` (WARN+) is the highest-value file for crash diagnosis.

## Operations (daily)

Use **`hub-control.bat`** (double-click, self-elevates):

| Option | Does |
|---|---|
| 1 Start / 2 Stop / 3 Restart | Service control |
| 4 Status | Service state + port 8085 reachability |
| 5 Watch live log | Tails `out.log` (Ctrl+C stops watching, not the app) |
| 6 Debug in console | Stops service, runs app foreground (`test`) with the *exact* service config |
| 7 Uninstall | Removes the service registration (jar/data/logs untouched) |

Manual equivalents (elevated): `power-plant-hub.exe install|start|stop|restart|uninstall|test`.

## Gotchas / notes

- **Port**: running instance is on **8085**. Note the repo's
  [`application-hub.properties`](../../src/main/resources/application-hub.properties) says
  `server.port=8090` — there is a device/deploy override on the server. If rebuilt+redeployed
  from repo defaults the port could flip; the control menu's status check would need updating.
- **Don't run two instances**: after the service is confirmed healthy, **delete the old
  `shell:startup` shortcut**, or login launches a second instance that fights over port 8085 and
  the H2 file.
- **`test` mode needs the port free**: it fails to bind if the service is already running (option
  6 stops the service first; manual `test` does not).
- **Editing the XML**: `install` reads it once. After edits, `restart` for runtime changes;
  `uninstall` + `install` if service identity changes.
- **JDK folder name**: verify it matches the unzipped Adoptium folder (`dir C:\forms\power_plant\jdk*`).

## Related

- [secrets.md](secrets.md) — SharePoint cert / Azure app registration used by the uploader
- [sharepoint/](sharepoint/) — SharePoint access architecture
- [logging-production-checklist.md](logging-production-checklist.md) — production logging
- Hub profile config: [`application-hub.properties`](../../src/main/resources/application-hub.properties)
