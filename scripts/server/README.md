# Server management — hub as a service + log shipping

Two independent pieces:

1. **`power-plant-hub.xml`** — runs the hub as a Windows Service (WinSW): starts at boot
   *without a login*, and auto-restarts on crash.
2. **`upload-logs-to-sharepoint.ps1`** + **`install-log-upload-task.ps1`** — a scheduled
   task that ships `logs\*.log` to SharePoint every few minutes, so you can read the latest
   log even after a crash.

> Why the Startup-folder shortcut never ran at boot: the Startup folder (user *or* all-users)
> only runs on interactive **login**, never before login at boot. A service is the fix.

---

## Layout on this server

```
C:\forms\power_plant\                      <- working dir: holds the jar, data\, logs\
  power_plant_java-1.jar
  jdk-21.0.11+10\bin\java.exe              <- bundled JDK (VERIFY this folder name)
  data\  logs\
  scripts\server\                          <- this folder: exe + xml + scripts
    power-plant-hub.exe
    power-plant-hub.xml
```

The XML is already set for these paths. **Only thing to verify:** the JDK folder name in
`power-plant-hub.xml` `<executable>` matches what you actually unzipped under
`C:\forms\power_plant` (Adoptium unzips as `jdk-21.0.11+10`).

All commands below use full paths, so you can run them from any PowerShell location.

> **Day-to-day shortcut:** after the one-time install, use **`hub-control.bat`** (double-click)
> for start / stop / restart / status / watch-log / debug / uninstall. It self-elevates to
> admin. The manual commands below are still here for the initial install and reference.

## 1. Install the service (WinSW)

Download `WinSW-x64.exe` from https://github.com/winsw/winsw/releases, drop it in
`C:\forms\power_plant\scripts\server`. Then, in an **elevated** PowerShell:

```powershell
# Rename so it matches the xml (WinSW finds power-plant-hub.xml by its own name):
Rename-Item C:\forms\power_plant\scripts\server\WinSW-x64.exe power-plant-hub.exe

C:\forms\power_plant\scripts\server\power-plant-hub.exe install
C:\forms\power_plant\scripts\server\power-plant-hub.exe start
Get-Service PowerPlantHub        # Running, StartType = Automatic (Delayed)
```

Useful later:
```powershell
C:\forms\power_plant\scripts\server\power-plant-hub.exe stop
C:\forms\power_plant\scripts\server\power-plant-hub.exe restart
C:\forms\power_plant\scripts\server\power-plant-hub.exe uninstall
```
Console output (incl. crash stack traces) lands in `power-plant-hub.out.log` / `.err.log`
in `C:\forms\power_plant\scripts\server`.

**Graceful shutdown:** add this to your hub config so Ctrl+C from WinSW closes H2 cleanly:

```properties
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
```

**Remove the old Startup-folder shortcut** so the app isn't launched twice when you log in:
`shell:startup` (and `shell:common startup`) — delete the hub shortcut there.

---

## 2. Install the log uploader

```powershell
# One-time: install the PnP module (elevated)
Install-Module PnP.PowerShell -Scope AllUsers

# Register the scheduled task (every 5 min + at startup, runs as SYSTEM, no login)
powershell -ExecutionPolicy Bypass -File C:\forms\power_plant\scripts\server\install-log-upload-task.ps1 -AppDir C:\forms\power_plant -IntervalMinutes 5

# Smoke test
Start-ScheduledTask -TaskName PowerPlantHub-LogUpload
```

The uploader reads SharePoint settings (client id, tenant id, site, pfx password) from
`application-secrets.properties` automatically — same app registration + `data\certificate.pfx`
the Java app already uses. Logs land in the default doc library under
`ServerLogs\<machine-name>\`. Files are overwritten each run so SharePoint always shows the
latest snapshot; the rolling archive in `logs\archived\` keeps local history.

**Permission note:** the Azure app registration needs a *SharePoint application* permission
(`Sites.ReadWrite.All`, or `Sites.Selected` on this site) with admin consent. The Java app
already authenticates with this cert, so this is usually already granted — if `Connect-PnPOnline`
returns 403, that permission/consent is what's missing.
```
