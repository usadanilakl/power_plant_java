# Logging System

## Overview

The application uses SLF4J and Logback for correlation-aware text logging. Four
purpose-separated active files are written under `./logs/`, with size/time rotation and
bounded archive retention. A diagnostics pipeline incrementally tails the active files,
parses them into structured events, sanitizes every externally visible field, and serves
the authorized Angular log viewer.

The AI troubleshooting API uses the same sanitized event source. Its separate service-key
model and endpoints are documented in [AI Diagnostics](architecture/ai-diagnostics.md).

## Log Files

| File | Content | Max active file | Retention | Total archive cap |
|---|---|---:|---:|---:|
| `power-plant-logger.log` | General application logs | 5 MB | 7 days | 50 MB |
| `power-plant-sync.log` | Sync, hub, and SharePoint | 5 MB | 7 days | 50 MB |
| `power-plant-security.log` | Authentication and security events | 2 MB | 7 days | 20 MB |
| `power-plant-alerts.log` | WARN and ERROR from all routed domains | 5 MB | 14 days | 50 MB |

The configured archive caps total 170 MB; the four active files can add approximately 17 MB,
for roughly 187 MB overall. All appenders use `SizeAndTimeBasedRollingPolicy` with
`cleanHistoryOnStart=true`, so Logback also prunes old archives during startup.

The diagnostics cache reads only the four allowlisted active filenames. It never resolves a
caller-supplied path and does not scan `logs/archived`.

## Logger Routing

Sync-related loggers route to `SyncFile` with `additivity="false"`. WARN and ERROR events
also go to `WarnErrorFile`:

- `com.dk_power.power_plant_java.sevice.sync.*`
- `com.dk_power.power_plant_java.sevice.sharepoint`
- `com.dk_power.power_plant_java.sevice.hub`
- `com.dk_power.power_plant_java.controller.hub`
- `com.dk_power.power_plant_java.controller.sync`
- `com.dk_power.power_plant_java.controller.sync_and_backup`

Security loggers under `config.security` and `controller.auth` follow the same pattern with
`SecurityFile` and `WarnErrorFile`. Everything else flows through the root logger to
`RollingFile`, `WarnErrorFile`, and the console.

The alerts file mirrors WARN/ERROR events routed to a domain file. The diagnostics service
suppresses an identical alerts-file copy when the original domain event is also retained,
so summary counts do not double-count it.

## MDC and HTTP Request Context

`RequestCorrelationFilter`, the highest-precedence servlet filter, establishes request MDC.
`LoggingContext` supplies scoped MDC for background jobs, sync runs, and entity operations.

| Key | Source | Example |
|---|---|---|
| `requestId` | Valid `X-Request-Id` or generated ID | `req-a1b2c3d4` |
| `userId` | Spring Security principal | `admin` |
| `machineId` | Valid `X-Machine-Id` | `DESKTOP-ABC` |
| `jobName` | `LoggingContext.openJobScope()` | `SyncScheduler` |
| `jobRunId` | `LoggingContext.openJobScope()` | `job-e5f6g7h8` |
| `syncRunId` | `LoggingContext.openSyncScope()` | `sync-i9j0k1l2` |
| `entityType` | `LoggingContext.openEntityScope()` | `SafeWork` |
| `entityId` | `LoggingContext.openEntityScope()` | `SW-001` |
| `sharepointId` | Set for a SharePoint operation | `sp-m3n4o5p6` |

Caller-provided request and machine IDs must match `[A-Za-z0-9._:-]{1,128}`. Invalid values
are replaced with a generated request ID or omitted from context. Query strings are not
included in the request-boundary message.

The request filter records:

- normal successful boundaries at DEBUG;
- slow requests and configured client errors at INFO;
- 5xx completion at WARN;
- an escaped exception boundary at ERROR.

Static resources and the human/AI diagnostics endpoints are excluded. Excluding diagnostics
prevents polling or streaming from generating the events that they are reading.

### File Log Pattern

```text
yyyy-MM-dd HH:mm:ss.SSS LEVEL [thread] [req=... user=... machine=... job=... jobRun=... sync=... entity=TYPE/ID sp=...] logger - message
```

The console uses a shorter time, level, thread, logger, and message pattern.

## Sanitized Operational Diagnostics

### Authorization

The human endpoint is:

```http
GET /ng/log-diagnostics/events
```

It requires an authenticated user with either `ROLE_ADMIN` or
`ROLE_LOG_DIAGNOSTICS`. `NgLogDiagnosticsController` is marked `@RestrictedAllowed`, so a
user specifically delegated `ROLE_LOG_DIAGNOSTICS` can use this narrow surface while their
application access grant remains `RESTRICTED`; a FULL access grant is not required. The
Spring Security role matcher remains authoritative. The Angular guard and menu visibility
provide UX enforcement, not backend authorization.

Admins can assign `ROLE_LOG_DIAGNOSTICS` in user management. The role does not grant access
to other log pages, arbitrary files, raw logs, or application data.

The response includes `Cache-Control: no-store` and `Pragma: no-cache`.

### Mandatory Outbound Sanitization

On-disk files and the internal tail cache retain their original text for local operations.
Every event leaves the cache through `LogDiagnosticsRedactionService` before filtering,
counting, searching, serialization, the Angular viewer, or the AI adapter. Sanitizing before
caller-controlled search also prevents probing a guessed secret through counts or match/no-match
behavior.

The sanitizer redacts or masks:

- authorization, proxy-authorization, cookie, and set-cookie values;
- password, secret, API-key, token, signature, and related assignments;
- bearer tokens, JWTs, common cloud access-key identifiers, and secret URL parameters;
- password reset/recovery URLs;
- email addresses, by default retaining only the first character and domain;
- IPv4 addresses, by default retaining only the first two octets;
- IPv6 addresses, by default replacing the complete address;
- oversized messages, details/stack traces, paths, and context values.

Email and IP masking can be disabled by configuration, but production/external diagnostics
should leave both enabled. Secret redaction and per-field length bounds remain in the common
outbound path.

### Backend Flow

```text
NgLogDiagnosticsController
  -> LogDiagnosticsService
       -> LogDiagnosticsFileService (incremental bounded cache)
            -> LogDiagnosticsParserService
       -> LogDiagnosticsRedactionService (before filters and output)
```

The AI event adapter calls `LogDiagnosticsService`; it does not read raw files directly.

## Incremental, Rotation-Aware Cache

`LogDiagnosticsFileService` maintains independent state and a lock for each allowlisted active
file:

```text
file identity + prefix + byte offset + partial line + provisional event + retained events
```

On a normal refresh it reads only bytes appended since the previous offset. A partial final
line remains buffered, and the provisional final event is reparsed until the next event header
arrives so multiline stack traces remain attached.

Rotation, replacement, truncation, or an in-place rewrite starts a new file generation. Events
from the previous generation remain in the in-memory deque until an event-count or character
limit evicts them. This makes a rotation between viewer refreshes less disruptive without
re-reading archives. Rotation retention is not persisted: after an application restart, only
the current active files can repopulate the cache. Because the service deliberately does not
open archived files, every observed generation change conservatively sets `truncated=true`:
bytes appended and rotated between two reads cannot be proven complete.

Each event receives a stable opaque `logicalEventId` derived from its allowlisted source, file
generation, byte offset, and timestamp. Its cursor-facing `eventId` also contains a content
revision. A finalized event keeps that ID; the provisional active-tail event receives a newer ID
if late continuation/stack-trace lines grow it. Consumers should upsert by `logicalEventId` so the
new representation replaces the earlier one. The versioned `eventId` prevents an ascending/SSE
cursor from silently advancing past those late details.

The response-level `truncated` flag is set when any cache event/line is evicted or truncated,
when a read cannot safely refresh the last snapshot, or when the response byte budget is reached.

## Parser

`LogDiagnosticsParserService` recognizes:

1. the current timestamp, level, thread, MDC, logger, and message pattern;
2. the legacy timestamp, level, thread, logger, and message pattern without MDC.

Continuation lines are attached to the preceding event as `details`. Known message fields such
as method, path, status, duration, and remote IP are extracted when present.

Subsystem detection uses the logger/message domain:

- `config.security` and `controller.auth` -> Security
- `sevice.sharepoint` -> SharePoint
- `sevice.hub` and `controller.hub` -> Hub
- `sevice.sync` and `controller.sync` -> Sync
- database pool event names/Hikari messages -> Database
- `http.request.*` events -> HTTP
- everything else -> Application

The Logback output remains human-readable text. There is currently no JSON-lines Logback
appender; structured JSON is produced by the diagnostics APIs after parsing and sanitization.

## Human Query Contract

### Request Parameters

| Parameter | Default | Behavior |
|---|---:|---|
| `windowMinutes` | `240` | Relative window when neither `from` nor `to` is supplied |
| `from` | | ISO-8601 lower bound; activates absolute-range mode |
| `to` | current time | ISO-8601 upper bound; activates absolute-range mode |
| `limit` | `200` | Page size; positive and capped by `query.max-limit` |
| `cursor` | | Opaque cursor returned by the previous page |
| `sort` | `desc` | `asc` or `desc`; the cursor must use the same direction |
| `level` | all | `TRACE`, `DEBUG`, `INFO`, `WARN`, or `ERROR` |
| `text` | | Case-insensitive substring over sanitized message/details/logger/subsystem/event code/path |
| `sourceFile` | | Exact allowlisted active filename |
| `subsystem` | | Exact subsystem |
| `eventCode` | | Case-insensitive event-code substring |
| `requestId` | | Exact sanitized request ID |
| `syncRunId` | | Exact sanitized sync-run ID |
| `machineId` | | Exact sanitized machine ID |

If either absolute bound is supplied, `windowMinutes` is not used. An omitted `from` is derived
from the maximum configured range before `to`; an omitted `to` uses the request time. Absolute
ranges exceeding the configured maximum are rejected. An oversized relative window is capped.

Cursors are opaque implementation values, not event IDs for storage or parsing by clients. A
cursor is bound to its sort direction; malformed or mismatched cursors return HTTP 400.

### Response

The event payload is wrapped by the normal Angular `NgApiResponse` under `responseData`:

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
    "sourceFiles": [
      "power-plant-alerts.log",
      "power-plant-sync.log",
      "power-plant-security.log",
      "power-plant-logger.log"
    ],
    "subsystems": ["Application", "Sync"],
    "eventCodes": ["sync.field.apply_failed"],
    "events": [
      {
        "eventId": "opaque-versioned-id",
        "logicalEventId": "opaque-logical-id",
        "timestamp": "2026-03-28T14:32:01.123Z",
        "level": "ERROR",
        "subsystem": "Sync",
        "sourceFile": "power-plant-sync.log",
        "logger": "c.d.p.sevice.sync.FieldSyncService",
        "thread": "sync-worker-1",
        "eventCode": "sync.field.apply_failed",
        "message": "sanitized event message",
        "details": "sanitized bounded stack trace",
        "requestId": null,
        "syncRunId": "sync-20260328-001",
        "machineId": "DESKTOP-ABC"
      }
    ],
    "nextCursor": "opaque-page-cursor",
    "hasMore": true,
    "truncated": false
  },
  "message": "Log events retrieved",
  "timestamp": "2026-03-28T14:32:02.010"
}
```

`totalMatched`, the summary, subsystem choices, and event-code choices describe all matching
events retained for the selected range before cursor pagination. `hasMore` means another page is
available. `truncated` means some source or response data was bounded and the result should not be
treated as exhaustive.

Each query is audit logged with the principal, effective time range, limit, sort, names of active
filters, returned count, estimated response bytes, and truncation state. Search text and returned
log contents are not copied into the audit event.

## Angular Log Viewer

Route: `/log/diagnostics`

The current viewer provides:

- explicit `ROLE_ADMIN`/`ROLE_LOG_DIAGNOSTICS` route and menu gating;
- a visible **Sanitized view** badge;
- total/info/warn/error counts for all retained matches;
- URL-persisted range, page size, sort, level, source, subsystem, text, event-code, request,
  sync-run, and machine filters;
- immediate dropdown filtering and 300 ms debounced text filtering;
- one RxJS `switchMap` request stream, which cancels obsolete filter/refresh/page requests;
- 10-second auto-refresh that pauses while the browser tab is hidden and refreshes on return;
- manual refresh even when auto-refresh is disabled;
- cursor-based **Load older** or **Load newer**, depending on sort order;
- merging/deduplication by event ID while retaining loaded pages during refresh;
- row expansion preserved by event ID rather than array index;
- stale state, last-updated time, API latency, and server-truncation indicators;
- keyboard-expandable rows, sanitized JSON copy, correlation-value copy, and one-click
  request/sync/machine correlation filtering.

The UI does not expose raw-file download or live streaming. AI streaming is a separate,
service-authenticated interface.

## Configuration

### Request and Diagnostics Foundation

| Property | Default | Purpose |
|---|---:|---|
| `logging.file.path` | `./logs` | Logback active/archive root |
| `logging.http.slow-request-ms` | `3000` | INFO threshold for a slow request |
| `logging.http.include-client-errors` | `true` | Retain 4xx request boundaries at INFO |
| `logging.diagnostics.directory` | `${logging.file.path}` | Directory containing allowlisted active files |
| `logging.diagnostics.cache.max-events-per-file` | `10000` | Retained events per active-source cache across generations |
| `logging.diagnostics.cache.max-line-bytes` | `65536` | Maximum buffered bytes per physical line |
| `logging.diagnostics.cache.max-event-characters` | `32768` | Maximum parsed characters per event |
| `logging.diagnostics.cache.max-characters-per-file` | `8388608` | Aggregate retained character budget per source |
| `logging.diagnostics.query.max-limit` | `1000` | Maximum human API page size |
| `logging.diagnostics.query.max-range-minutes` | `10080` | Maximum absolute query range (7 days) |
| `logging.diagnostics.query.max-filter-length` | `256` | Maximum non-search filter length |
| `logging.diagnostics.query.max-search-length` | `512` | Maximum free-text length |
| `logging.diagnostics.query.max-response-bytes` | `2097152` | Estimated event response budget |
| `logging.diagnostics.redaction.max-message-length` | `4096` | Sanitized message bound |
| `logging.diagnostics.redaction.max-details-length` | `16384` | Sanitized details/stack-trace bound |
| `logging.diagnostics.redaction.max-context-length` | `512` | Sanitized logger/MDC context bound |
| `logging.diagnostics.redaction.max-path-length` | `2048` | Sanitized path bound |
| `logging.diagnostics.redaction.mask-email-addresses` | `true` | Mask emails in outbound diagnostics |
| `logging.diagnostics.redaction.mask-ip-addresses` | `true` | Mask IPv4 and IPv6 in outbound diagnostics |

Log file sizes, archive history, and archive caps are defined in
`src/main/resources/logback-spring.xml`.

## Operational Notes

- Treat files under `logs/` as sensitive; API sanitization does not modify their contents.
- Keep filesystem permissions restricted to the application identity and operators who require
  raw evidence.
- Archived files remain available to local operators according to Logback retention but are not
  returned by the diagnostics APIs.
- A restart discards the in-memory cache of prior rotations and any resume position older than
  the currently readable/retained event set.
- Narrow filters when `truncated=true`; neither a cursor nor a larger page can recover an event
  already evicted from the bounded cache.
- Public actuator health uses `management.endpoint.health.show-details=when_authorized` so public
  health requests do not receive component details.

## Adding a New Log Category

To route a package to another diagnostics-visible file:

1. Add a bounded `RollingFileAppender` in `logback-spring.xml`.
2. Add a logger entry with the intended additivity and alert routing.
3. Add only the fixed filename to `LOG_FILE_NAMES` in `LogDiagnosticsFileService`; never accept a
   request path as a filename.
4. Add subsystem detection in `LogDiagnosticsParserService` if the logger/message domain is new.
5. Add parser, rotation, sanitization, authorization, and response-limit tests before exposing it.
