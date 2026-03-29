# Logging System

## Overview

The application uses SLF4J + Logback for structured logging. Logs are written to four
purpose-separated files under `./logs/`, each with rolling policies and size caps.
A diagnostics API reads and caches parsed log events for the frontend log viewer.

## Log Files

| File                        | Content                        | Max File | Retention | Total Cap |
|-----------------------------|--------------------------------|----------|-----------|-----------|
| `power-plant-logger.log`    | General application logs       | 5 MB     | 7 days    | 50 MB     |
| `power-plant-sync.log`      | Sync, hub, SharePoint          | 5 MB     | 7 days    | 50 MB     |
| `power-plant-security.log`  | Auth and security events       | 2 MB     | 7 days    | 20 MB     |
| `power-plant-alerts.log`    | WARN and ERROR only (all code) | 5 MB     | 14 days   | 50 MB     |

**Maximum total disk usage: ~170 MB** (active files + archived rotations combined).

All appenders use `SizeAndTimeBasedRollingPolicy` with `cleanHistoryOnStart=true`,
so archived logs are pruned at startup.

## Logger Routing

All sync-related loggers route exclusively to `SyncFile` (`additivity="false"`), plus
a copy of WARN/ERROR to `WarnErrorFile` so alerts are never missed:

- `com.dk_power.power_plant_java.sevice.sync.*`
- `com.dk_power.power_plant_java.sevice.sharepoint`
- `com.dk_power.power_plant_java.sevice.hub`
- `com.dk_power.power_plant_java.controller.hub`
- `com.dk_power.power_plant_java.controller.sync`
- `com.dk_power.power_plant_java.controller.sync_and_backup`

Security loggers behave the same way (`SecurityFile` + `WarnErrorFile`, no additivity).

Everything else flows to the root logger: `RollingFile` + `WarnErrorFile` + `Console`.

## MDC Context

The `RequestCorrelationFilter` (highest-precedence servlet filter) populates MDC for
every HTTP request. The `LoggingContext` utility provides scoped MDC for background jobs
and sync operations.

### MDC Fields

| Key           | Source                          | Example                |
|---------------|---------------------------------|------------------------|
| `requestId`   | `X-Request-Id` header or auto   | `req-a1b2c3d4`         |
| `userId`      | Spring Security principal       | `admin`                |
| `machineId`   | Device ID header                | `DESKTOP-ABC`          |
| `jobName`     | `LoggingContext.openJobScope()` | `SyncScheduler`        |
| `jobRunId`    | `LoggingContext.openJobScope()` | `job-e5f6g7h8`         |
| `syncRunId`   | `LoggingContext.openSyncScope()`| `sync-i9j0k1l2`        |
| `entityType`  | `LoggingContext.openEntityScope()`| `SafeWork`           |
| `entityId`    | `LoggingContext.openEntityScope()`| `SW-001`             |
| `sharepointId`| Set manually during SP ops      | `sp-m3n4o5p6`          |

### File Log Pattern

```
yyyy-MM-dd HH:mm:ss.SSS LEVEL [thread] [req=... user=... machine=... job=... jobRun=... sync=... entity=TYPE/ID sp=...] logger - message
```

Console uses a shorter pattern (time + level + thread + logger + message).

## Diagnostics API

A single REST endpoint serves the frontend log viewer.

### `GET /ng/log-diagnostics/events`

| Param           | Default | Description                                 |
|-----------------|---------|---------------------------------------------|
| `windowMinutes` | 240     | How far back to look (1 = last minute)      |
| `limit`         | 200     | Max events returned (capped at 500)         |
| `level`         |         | `INFO`, `WARN`, `ERROR`, or omit for all    |
| `text`          |         | Substring search across message/logger/path |
| `sourceFile`    |         | Filter to one log file                      |
| `requestId`     |         | Exact match on MDC requestId                |
| `syncRunId`     |         | Exact match on MDC syncRunId                |
| `machineId`     |         | Exact match on MDC machineId                |

**Response shape:**

```json
{
  "responseData": {
    "totalMatched": 342,
    "summary": {
      "totalEvents": 342,
      "infoEvents": 280,
      "warnEvents": 50,
      "errorEvents": 12
    },
    "sourceFiles": ["power-plant-logger.log", "power-plant-sync.log", ...],
    "events": [
      {
        "timestamp": "2026-03-28T14:32:01.123Z",
        "level": "ERROR",
        "subsystem": "Sync",
        "sourceFile": "power-plant-sync.log",
        "logger": "c.d.p.sevice.sync.FieldSyncService",
        "thread": "sync-worker-1",
        "eventCode": "sync.field.apply_failed",
        "message": "sync.field.apply_failed entity=SafeWork/SW-001 ...",
        "details": "java.lang.NullPointerException...",
        "requestId": null,
        "userId": null,
        "machineId": "DESKTOP-ABC",
        "syncRunId": "sync-20260328-001",
        "entityType": "SafeWork",
        "entityId": "SW-001"
      }
    ]
  }
}
```

## Backend Architecture

```
NgLogDiagnosticsController          (single GET /events endpoint)
  -> LogDiagnosticsService          (filtering, sorting, summary computation)
       -> LogDiagnosticsFileService (file I/O with caching)
            -> LogDiagnosticsParserService (regex parsing of log lines)
```

### File-Level Caching

`LogDiagnosticsFileService` checks `lastModified` + `size` for each of the four log
files before reading. Only files that have actually changed are re-read and re-parsed.
On a typical 10-second auto-refresh cycle, 0-1 files change, so most calls are a
stat-only no-op.

### Parser

`LogDiagnosticsParserService` matches each line against two regex patterns:

1. **Structured** -- timestamp + level + thread + MDC bracket + logger + message
2. **Legacy** -- timestamp + level + thread + logger + message (no MDC)

Continuation lines (stacktraces) are appended to the preceding event as `details`.

Subsystem detection is based on logger package name:
- `.config.security` / `.controller.auth` -> Security
- `.sevice.sharepoint` -> SharePoint
- `.sevice.hub` / `.controller.hub` -> Hub
- `.sevice.sync` / `.controller.sync` -> Sync
- Messages starting with `db.pool.` or containing `hikaripool` -> Database
- Messages starting with `http.request.` -> HTTP
- Everything else -> Application

## Frontend Log Viewer

Route: `/log/diagnostics`

### Features

- **Summary cards** -- total, info, warning, error counts for the selected time window
- **Reactive filters** -- dropdowns apply immediately; text inputs debounce 300ms
- **Auto-refresh** -- polls every 10 seconds (toggleable)
- **Relative timestamps** -- displayed as "2m ago", "1h ago"; full ISO on hover
- **Expandable rows** -- click any row to see MDC context, logger, thread, stacktrace
- **Advanced filters** -- requestId, syncRunId, machineId hidden behind "More" button

### Key Files

| File | Purpose |
|------|---------|
| `frontend/.../log-diagnostics-page/log-diagnostics-page.component.ts` | Component + RelativeTimePipe |
| `frontend/.../log-diagnostics-page/log-diagnostics-page.component.html` | Template |
| `frontend/.../log-diagnostics-page/log-diagnostics-page.component.css` | Styles |
| `frontend/.../services/log-diagnostics-api.service.ts` | Single `getEvents()` HTTP call |
| `frontend/.../services/log-diagnostics.models.ts` | `LogEvent`, `LogSummary`, `LogEventsResponse` |

## Configuration

| Property                          | Default  | Description                      |
|-----------------------------------|----------|----------------------------------|
| `logging.diagnostics.directory`   | `./logs` | Directory where log files reside |

Logback configuration: `src/main/resources/logback-spring.xml`

## Adding a New Log Category

To route a new package to its own file:

1. Add a new `RollingFileAppender` in `logback-spring.xml` with size/time rolling policy
2. Add a `<logger>` entry with `additivity="false"` pointing to the new appender + `WarnErrorFile`
3. Add the new file name to `LOG_FILE_NAMES` in `LogDiagnosticsFileService`
4. Optionally add subsystem detection in `LogDiagnosticsParserService.detectSubsystem()`
