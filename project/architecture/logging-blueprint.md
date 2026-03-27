# Logging Blueprint

## Goals

- Make production issues traceable across HTTP, security, sync, and background jobs.
- Reduce noise in the default log stream while preserving rich detail when needed.
- Standardize log context, event boundaries, and severity usage.

## Logging Domains

- `http`: request lifecycle and response boundaries
- `security`: authentication, authorization, access grants
- `sync.sharepoint`: SharePoint polling and item processing
- `sync.hub`: hub exchange, retries, SSE heartbeat, cleanup
- `sync.peer`: peer discovery and peer status maintenance
- `sync.health`: lightweight client/server sync health checks
- `sync.attachments`: attachment upload/download/sync
- `startup`: application boot, config bootstrap, seeders
- `files`: file import/export/trash/backup operations
- `email`: polling, matching, send/receive workflows

## MDC Keys

- `requestId`: stable per incoming HTTP request
- `method`: HTTP method
- `path`: request path
- `remoteIp`: caller IP
- `userId`: authenticated user id or email when available
- `machineId`: sync machine id when relevant
- `jobName`: scheduled/background job name
- `jobRunId`: stable id for one job execution
- `syncRunId`: stable id for one sync flow execution
- `entityType`: optional entity type for focused flows
- `entityId`: optional local entity id
- `sharepointId`: optional SharePoint id

## Event Shape

Prefer concise event-style messages over prose-heavy text.

Examples:

- `http.request.start method=GET path=/api/sync/health-stats`
- `http.request.complete status=200 durationMs=124`
- `sharepoint.sync.start entityType=WorkRequest`
- `sharepoint.sync.complete entityType=WorkRequest created=4 updated=2 skipped=80 failed=0 durationMs=842`
- `hub.sync.exchange.complete received=55 skipped=7 pending=12`
- `security.login.failed credential=user@example.com`

## Level Guidance

- `ERROR`: operation failed and needs investigation
- `WARN`: unexpected or degraded but recovered/continuing
- `INFO`: high-value lifecycle milestones and summaries
- `DEBUG`: per-item processing, branch decisions, request boundaries
- `TRACE`: very low-level diagnostics only

## Boundary Logging Rules

- HTTP requests:
  - `DEBUG` start for traced request paths
  - `DEBUG` completion for normal fast responses
  - `INFO` completion for 4xx or slow requests
  - `WARN` completion for 5xx
- Scheduled jobs:
  - `INFO` start and `INFO` completion with duration and summary
- Sync runs:
  - `INFO` start and completion
  - `DEBUG` item-level detail
  - `ERROR` once at the failure boundary with stack trace

## Output Strategy

- Console:
  - human-readable, correlation-friendly
- `logs/power-plant-app.log`:
  - all application logs
- `logs/power-plant-sync.log`:
  - sync, hub, SharePoint, and health workflows
- `logs/power-plant-security.log`:
  - security/auth/access-grant workflows

## First Implementation Slice

1. Add correlation-aware log patterns.
2. Add request correlation filter with request boundary logging.
3. Add MDC helpers for request/job/sync flows.
4. Instrument:
   - `SharePointSyncOrchestrator`
   - `HubSyncService`
   - `SyncHealthChecker`
   - auth filters for `userId`
5. Replace remaining `System.out` / `System.err` startup lines with logger events.

## Follow-Up Cleanup

- Demote noisy per-item `INFO` logs to `DEBUG`.
- Add explicit event naming to top incident-prone flows.
- Add more domain-specific MDC fields where useful.
- Review scheduled jobs one by one and add consistent start/end summaries.
