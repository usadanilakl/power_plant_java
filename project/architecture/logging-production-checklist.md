# Logging Production Checklist

This checklist tracks the remaining work to keep logging clean, traceable, and operationally useful in production.

## Completed

- [x] Correlation IDs for HTTP requests and scheduled/sync jobs
- [x] MDC utility support for `requestId`, `userId`, `machineId`, `jobRunId`, `syncRunId`
- [x] Request boundary logging
- [x] Job/scheduler boundary logging for major sync flows
- [x] Dedicated rolling files for app, sync, and security logs
- [x] ANSI console noise disabled for CLI runs
- [x] Large-volume sync/sharepoint/file chatter demoted from `INFO` to `DEBUG`
- [x] Event-style naming introduced for major sync/security flows

## Implemented In This Pass

- [x] Production checklist document added
- [x] Request failure boundary logging hardened with exception type, remote IP, and user context
- [x] Log pattern expanded to show entity-level MDC fields
- [x] Dedicated warning/error rolling log added
- [x] Hikari pool observability added with startup summary and pressure warnings
- [x] Hikari leak detection / JMX metrics enabled
- [x] Remaining legacy `FieldSyncService` noise reduced where safely patchable

## Still Optional

- [ ] Add JSON file logging as a parallel appender for machine querying
- [ ] Propagate MDC automatically into all custom async executors/thread factories
- [ ] Mask or hash any fields you decide are too sensitive for retained logs
- [ ] Create an operator runbook for common searches by `requestId`, `syncRunId`, `jobRunId`, `machineId`, and `sharepointId`
- [ ] Continue auditing secondary services such as migrations, resync tooling, and test-only endpoints

## Production Logging Rules

- `ERROR`: request/job/operation failed and needs attention
- `WARN`: unexpected pressure, degraded behavior, retry, or partial failure
- `INFO`: start/end summaries, lifecycle changes, circuit-breaker state, queue summaries
- `DEBUG`: per-entity/per-file/per-field internals used for active troubleshooting

## Priority Follow-Ups

1. Watch the new warning/error log during a real sync window and trim any remaining routine lines that still feel noisy.
2. Monitor Hikari pool pressure warnings to confirm the earlier connection-starvation fix is holding.
3. If incident investigation still feels slow, add JSON retained logs next instead of adding more plain-text detail.
