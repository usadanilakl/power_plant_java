# Secrets Management

No credentials, API keys, or passwords in git-tracked source code. All secrets are externalized to gitignored files that live on each machine at runtime.

## Principle

Source code contains **empty defaults** and **placeholder templates**. Real credentials live in:
- Gitignored config files on each machine
- Bundled into the Electron package via `extraResources` (not in git)
- Inside the Spring Boot JAR (built from local `src/main/resources/` which has the gitignored secrets file)

## Spring Boot

### How it works

`application.properties` (tracked) includes:
```properties
spring.profiles.include=secrets
```

This loads `application-secrets.properties` (gitignored) from the classpath. The secrets file contains credentials for OneDrive OAuth, SharePoint certificate access, and any other sensitive config.

When you run `mvn package`, Maven bundles everything in `src/main/resources/` into the JAR — including `application-secrets.properties` since it exists locally. So the deployed JAR contains the credentials even though git doesn't.

If the file is missing (fresh clone), Spring Boot starts normally — features that need credentials just won't work until the file is created.

### Files

| File | Tracked | Contains |
|---|---|---|
| `src/main/resources/application.properties` | Yes | All non-secret config, `spring.profiles.include=secrets` |
| `src/main/resources/application-secrets.properties` | No (gitignored) | OneDrive OAuth (client-id, client-secret, tenant-id), SharePoint certificate config |
| `src/main/resources/application-secrets.example.properties` | Yes | Template with `YOUR_*` placeholders |
| `src/main/resources/private_key.pem` | No (gitignored) | Encrypted RSA private key (legacy Box integration) |
| `data/certificate.pfx` | No (gitignored) | SharePoint certificate |

### Setup on a new machine

Copy `application-secrets.example.properties` to `application-secrets.properties` and fill in the real values.

## Electron

### How it works

Credentials live in JSON config files at the Electron working directory:
- **Dev**: `electron-manager/managed_apps/pid/` (gitignored)
- **Packaged**: `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\`

On startup, `provisionDefaultConfigs()` in `paths.ts` runs **before** any managers are created. It seeds config files from bundled defaults:

```
1. ensureWorkingDir()          — create working dir if missing
2. provisionDefaultConfigs()   — copy/merge config files from defaults
3. new IpcHandlers()           — managers read configs in their constructors
```

### Provisioning behavior

| Scenario | Action |
|---|---|
| Config file missing | Copies bundled default (first-run) |
| Config file exists, missing new keys | Merges: existing values win, new keys added from defaults |
| Config file up-to-date | No-op |

### Default configs source

| Mode | Location |
|---|---|
| Dev | `electron-manager/config-defaults/` |
| Packaged | `<install>/resources/config-defaults/` |

The `config-defaults/` directory is **gitignored** — it contains real credentials. It ships with the package via `extraResources` in `package.json`.

### Config files

**`pjm-config.json`** — PJM Data Miner API + Voyager login:
```json
{
  "apiKey": "<PJM API subscription key>",
  "pnodeId": 33092371,
  "pnodeName": "ComEd",
  "pollIntervalMinutes": 5,
  "voyagerUsername": "<Voyager username>",
  "voyagerPassword": "<Voyager password>"
}
```

**`gate-log-config.json`** — Gate website + OnLocation API:
```json
{
  "onLocationApiKey": "<OnLocation API key>",
  "onLocationBaseUrl": "https://api.whosonlocation.com/v1",
  "gateWebUrl": "https://10.56.80.80/",
  "gateUsername": "<gate username>",
  "gatePassword": "<gate password>",
  "onLocationEmail": "<OnLocation email>",
  "onLocationPassword": "<OnLocation password>",
  "autoRefresh": false,
  "intervalMinutes": 60
}
```

### Source code defaults

`constants.ts` has `DEFAULT_GATE_LOG_CONFIG` with empty strings for all credential fields. `pjm.manager.ts` has empty `apiKey` and no Voyager credentials in the code defaults. Real values only come from the runtime config files.

### Example templates (tracked)

For reference on what config fields are needed:
- `electron-manager/config-examples/pjm-config.example.json`
- `electron-manager/config-examples/gate-log-config.example.json`

### Setup on a new machine

For **dev mode**: populate `electron-manager/config-defaults/` with real config files (copy from example templates and fill in values). These get copied to `managed_apps/pid/` on startup.

For **packaged mode**: the `config-defaults/` ships inside the package. On first run, `provisionDefaultConfigs()` copies them to `%PROGRAMDATA%`. No manual setup needed if the package was built from a machine that had the defaults.

## Other

| File | Tracked | Purpose |
|---|---|---|
| `global.env` | No (gitignored) | Server deploy user/host for remote JAR deployment scripts |
| `token.properties` | No (gitignored) | GitHub personal access token |
| `machine-id.properties` | No (gitignored) | Device identity for sync (auto-generated) |

## .gitignore entries

All secret files are covered by these `.gitignore` rules:
```gitignore
/src/main/resources/application-secrets.properties
/src/main/resources/private_key.pem
/data/certificate.pfx
global.env
token.properties
machine-id.properties
/electron-manager/config-defaults/
/electron-manager/managed_apps/**
```

## Adding new secrets

1. **Spring Boot**: add to `application-secrets.properties` (and update the `.example` template)
2. **Electron**: add the field to the appropriate config file in `config-defaults/` — existing installs get the new key via merge on next startup
3. **Never** put real credentials in tracked source files — use empty-string defaults in code, real values in runtime config

## Git history

Previous commits contain hardcoded credentials (Azure OAuth, AWS keys, PJM API key, gate/OnLocation passwords, Mega credentials, Box OAuth). The repo is private, but these should be rotated and optionally scrubbed with `git filter-repo` or BFG Repo Cleaner.
