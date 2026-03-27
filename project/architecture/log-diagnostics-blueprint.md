# Log Diagnostics Blueprint

## Goal

Provide an internal diagnostics feature that turns retained application logs into:

- recent findings
- incident-like summaries
- searchable recent events
- actionable operational hints

This design intentionally excludes AI. It is rule-based, deterministic, and explainable.

## Rollout Strategy

This should be implemented in multiple phases.

### Phase 1: MVP

- Parse current retained log files
- Normalize major fields from the log pattern and message body
- Expose backend APIs for:
  - overview
  - findings
  - recent event search
- Add a frontend diagnostics page under `/log/diagnostics`

Outcome:
- useful immediately
- no background indexing required
- low operational risk

### Phase 2: Incident Grouping

- Group repeated findings into incident records
- Add timeline views
- Add acknowledgement/resolution workflow

### Phase 3: Persistence and Trends

- Cache or persist analyzed findings
- Store trend snapshots
- Add charts and historical comparisons

### Phase 4: Live Updates

- Tail current logs incrementally
- Push updates to the UI with polling or SSE

## Recommended Backend Shape

### Services

- `LogDiagnosticsFileService`
  - loads current retained log files from `./logs`
  - reads:
    - `power-plant-logger.log`
    - `power-plant-sync.log`
    - `power-plant-security.log`
    - `power-plant-alerts.log`

- `LogDiagnosticsParserService`
  - converts log lines into structured events
  - keeps multiline stack traces attached to the preceding event

- `LogDiagnosticsAnalyzerService`
  - applies rule-based detectors
  - produces findings with severity, subsystem, counts, and recommendations

- `LogDiagnosticsService`
  - orchestrates loading, filtering, sorting, and analysis

### API

- `GET /ng/log-diagnostics/overview`
  - returns:
    - summary counts
    - recent findings
    - recent events

- `GET /ng/log-diagnostics/events`
  - returns filtered recent events

## Event Model

Each parsed event should capture:

- timestamp
- level
- thread
- logger
- message
- details / throwable text
- source file
- subsystem
- event code when recognizable
- correlation fields:
  - requestId
  - userId
  - machineId
  - jobName
  - jobRunId
  - syncRunId
  - entityType
  - entityId
  - sharepointId

Useful extracted message fields:

- method
- path
- status
- durationMs
- remoteIp

## Initial Detection Rules

- `DB_POOL_PRESSURE`
  - triggered by `db.pool.pressure`

- `DB_CONNECTION_TIMEOUT`
  - triggered by Hikari connection timeout messages

- `HTTP_REQUEST_FAILURE`
  - triggered by `http.request.failed`
  - grouped by path

- `SERVER_SYNC_DEGRADED`
  - triggered by server-sync warnings/errors

- `PEER_SYNC_DEGRADED`
  - triggered by peer-sync warnings/errors

- `CIRCUIT_BREAKER_ACTIVITY`
  - triggered by circuit-breaker reset/self-heal/open messages

- `FILE_SYNC_RETRY_ACTIVITY`
  - triggered by file-sync retry or recovery events

## Frontend Shape

Place this inside the existing `/log` feature area as `/log/diagnostics`.

### MVP Layout

- summary strip
  - total events
  - warnings
  - errors
  - findings

- findings panel
  - severity
  - subsystem
  - title
  - count
  - time window
  - recommendation

- recent events table
  - timestamp
  - level
  - subsystem
  - logger
  - event code
  - message
  - requestId / syncRunId / machineId

- filters
  - timeframe
  - level
  - search text
  - source file
  - requestId
  - syncRunId
  - machineId

## Why This Is Multi-Phase

Phase 1 is realistic in one implementation pass because it is on-demand parsing plus deterministic rules.

Incident persistence, historical trends, and live streaming should be separate follow-ups so the first release stays simple and reliable.
