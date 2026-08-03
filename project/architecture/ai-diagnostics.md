# AI Diagnostics

For the production URL, Windows credential target, agent connection sequence, SSE resume behavior,
and operational troubleshooting, see the
[Production AI Live Log Access Runbook](ai-diagnostics-production-runbook.md).

## Status and Security Boundary

The AI diagnostics API is an opt-in, read-only troubleshooting surface. It is disabled by
default:

```properties
logging.ai-diagnostics.enabled=false
```

When disabled, the AI controller is not registered and the path filter returns HTTP 404. Enabling
the feature without at least one valid enabled service key fails application startup.

The feature does not use an end user's session, FULL access grant, or
`ROLE_LOG_DIAGNOSTICS`. It authenticates a distinct service identity with a high-entropy bearer
key and grants only explicitly configured scopes:

| Scope | Capability |
|---|---|
| `logs:read` | Query sanitized historical events |
| `logs:stream` | Open the sanitized WARN/ERROR SSE stream |
| `diagnostics:bundle` | Produce an immediate sanitized NDJSON snapshot |

The service-key filter applies only under `/ng/ai-diagnostics/v1`. A diagnostics service key does
not authenticate general application endpoints. All AI responses carry
`Cache-Control: no-store` and `Pragma: no-cache`. Credentials in a `token` query parameter are
rejected; send the raw service key only as:

```http
Authorization: Bearer <raw-service-key>
```

Expose this interface only through the application's trusted TLS path; a bearer key sent over
plaintext transport can be replayed by anyone who observes it.

The API has no endpoint for changing log levels, restarting the application, triggering sync,
executing queries, reading arbitrary files, or mutating application data. `POST /bundles` is a
read-only snapshot operation and does not persist a bundle.

## Data Flow

```text
Bearer service key
  -> AiDiagnosticsApiKeyFilter (SHA-256 authentication)
       -> scope-authorized controller
            -> historical query / SSE / NDJSON bundle service
                 -> LogDiagnosticsAiEventSource
                      -> LogDiagnosticsService
                           -> mandatory redaction and masking
                           -> incremental bounded active-log cache
```

The adapter never reads raw log files directly. Sanitization occurs before filters, counts, event
mapping, streaming, or bundle serialization. See [Logging System](../logging-system.md) for the
redaction rules, cache bounds, event model, and active-file limitations.

## Service-Key Provisioning

### Key Requirements

Use at least 32 cryptographically random bytes (256 bits) for every raw service key. A human
password is not suitable because configuration stores a fast, unsalted SHA-256 digest; a weak key
would be vulnerable to offline guessing if the digest were disclosed.
The request authenticator rejects bearer strings shorter than 32 characters or longer than
`max-api-key-length`; the length check complements, but cannot verify, cryptographic randomness.

Generate and store the raw key in a secret manager, then deliver it independently to the agent.
Only its 64-character hexadecimal SHA-256 digest belongs in application configuration. Identities
must contain 1-128 characters from `A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, `@`, `/`, or `-`.

Each enabled credential must have:

- a unique identity;
- a unique 64-hex-character SHA-256 digest;
- at least one recognized scope;
- optional `expires-at`, checked on every new HTTP authentication;
- optional `enabled=false` for a configured-but-inactive entry.

Unknown scopes, duplicate identities/digests, malformed digests, or missing scopes stop startup
when the feature is enabled.

### Hash an Injected Key Without Printing It

These examples assume the secret manager has already injected the raw key as
`AI_DIAGNOSTICS_SERVICE_KEY`. They put only the digest into
`AI_DIAGNOSTICS_KEY_SHA256`, do not echo the raw key, and remove the raw key from the environment
before launching the application.

PowerShell (compatible with Windows PowerShell):

```powershell
if ([string]::IsNullOrWhiteSpace($env:AI_DIAGNOSTICS_SERVICE_KEY)) {
    throw 'AI_DIAGNOSTICS_SERVICE_KEY was not injected'
}

$keyBytes = [Text.Encoding]::UTF8.GetBytes($env:AI_DIAGNOSTICS_SERVICE_KEY)
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
    $hashBytes = $sha256.ComputeHash($keyBytes)
    $env:AI_DIAGNOSTICS_KEY_SHA256 = `
        ([BitConverter]::ToString($hashBytes)).Replace('-', '').ToLowerInvariant()
} finally {
    $sha256.Dispose()
    [Array]::Clear($keyBytes, 0, $keyBytes.Length)
    if ($null -ne $hashBytes) {
        [Array]::Clear($hashBytes, 0, $hashBytes.Length)
    }
}
Remove-Item Env:AI_DIAGNOSTICS_SERVICE_KEY
```

Bash with shell tracing disabled:

```bash
set +x
: "${AI_DIAGNOSTICS_SERVICE_KEY:?AI_DIAGNOSTICS_SERVICE_KEY was not injected}"
AI_DIAGNOSTICS_KEY_SHA256="$(
  printf '%s' "$AI_DIAGNOSTICS_SERVICE_KEY" | sha256sum | awk '{print $1}'
)"
export AI_DIAGNOSTICS_KEY_SHA256
unset AI_DIAGNOSTICS_SERVICE_KEY
```

Launch the application from that same shell or inject `AI_DIAGNOSTICS_KEY_SHA256` directly from
the deployment secret store. The hash is not the bearer credential; the agent still receives the
raw key through its own secret channel.

### Credential Configuration

```properties
logging.ai-diagnostics.enabled=true
logging.ai-diagnostics.api-keys[0].identity=troubleshooting-agent
logging.ai-diagnostics.api-keys[0].sha256=${AI_DIAGNOSTICS_KEY_SHA256}
logging.ai-diagnostics.api-keys[0].enabled=true
logging.ai-diagnostics.api-keys[0].expires-at=2026-12-31T23:59:59Z
logging.ai-diagnostics.api-keys[0].scopes=logs:read,logs:stream,diagnostics:bundle
```

Use separate identities/keys when agents need different scopes. For example, a monitoring agent
can receive only `logs:stream`, while an on-demand investigator can receive `logs:read` and
`diagnostics:bundle`.

Credential configuration is loaded at application startup. Removing or disabling a key requires a
restart. Expiration is evaluated for each new request, but an already-open SSE connection is not
reauthenticated; it remains bounded by `stream.max-lifetime` and must authenticate again when it
reconnects.

## Endpoints

| Method and path | Required scope | Output | Default rate limit per identity |
|---|---|---|---:|
| `GET /ng/ai-diagnostics/v1/events` | `logs:read` | JSON event page | 60/minute |
| `GET /ng/ai-diagnostics/v1/events/stream` | `logs:stream` | Server-Sent Events | 6 opens/minute |
| `POST /ng/ai-diagnostics/v1/bundles` | `diagnostics:bundle` | NDJSON attachment | 6/hour |

### Historical Event Query

`GET /ng/ai-diagnostics/v1/events` accepts:

| Parameter | Default | Behavior |
|---|---:|---|
| `from` | maximum history before `to` | ISO-8601 inclusive lower bound |
| `to` | request time | ISO-8601 inclusive upper bound; future values are capped at now |
| `limit` | `200` | Positive page target, capped at `max-events-per-response` |
| `cursor` | | Opaque event cursor returned by this API |
| `sort` | `desc` | Clients should send `asc` or `desc` |
| `levels` | `WARN,ERROR` | Comma-separated TRACE/DEBUG/INFO/WARN/ERROR values |
| `text` | | Sanitized free-text search |
| `sourceFile` | | Exact active source filename |
| `subsystem` | | Exact subsystem |
| `eventCode` | | Event-code filter |
| `requestId` | | Exact sanitized request ID |
| `syncRunId` | | Exact sanitized sync-run ID |
| `machineId` | | Exact sanitized machine ID |

The server limits history to `max-historical-minutes`. An older `from` is moved forward to that
boundary, and `from > to` is rejected. Query/filter lengths and page size are bounded by the
configuration below.

Example response shape:

```json
{
  "generatedAt": "2026-08-02T20:10:00Z",
  "events": [
    {
      "id": "opaque-resume-cursor",
      "logicalId": "opaque-logical-event-id",
      "timestamp": "2026-08-02T20:09:58Z",
      "level": "ERROR",
      "subsystem": "Sync",
      "sourceFile": "power-plant-sync.log",
      "eventCode": "sync.field.apply_failed",
      "message": "sanitized bounded message",
      "details": "sanitized bounded details",
      "requestId": null,
      "syncRunId": "sync-...",
      "status": null,
      "durationMs": 1842
    }
  ],
  "nextCursor": "opaque-resume-cursor",
  "hasMore": true,
  "truncated": false
}
```

An event `id` encodes the event timestamp plus its internal stable event ID and is also the cursor
format used by the AI endpoints. Treat it as opaque. `truncated=true` means the source cache or
response bounds prevented an exhaustive result.

### Live SSE Stream

Open the stream with an HTTP/SSE client that can set an `Authorization` header:

```http
GET /ng/ai-diagnostics/v1/events/stream
Authorization: Bearer <raw-service-key>
Accept: text/event-stream
Last-Event-ID: <last-successfully-processed-log-event-id>
```

The stream is fixed to WARN and ERROR events. It supports optional `subsystem`, `eventCode`,
`requestId`, `syncRunId`, and `machineId` query filters. It does not currently expose INFO/DEBUG,
free-text, source-file, or level selection.

SSE event types are:

- `connected`: confirms the stream and reports the resume value and fixed levels;
- `log`: contains one sanitized AI event and carries its opaque cursor in the SSE `id` field;
- `heartbeat`: contains a timestamp and has no event ID.

Persist the ID only after the corresponding `log` event has been processed. On reconnect, send it
in the standard `Last-Event-ID` header. The next poll requests events strictly after that position.
Without a resume ID, the connection starts at `stream.initial-lookback` before open time. A cursor
older than the allowed historical window restarts at that window boundary; a malformed or
future-dated cursor is rejected.

Resume is best effort within the in-memory retained event set. It is not a durable delivery log:
cache eviction, source truncation, or an application restart may create a gap, signaled where
possible by query/bundle `truncated` metadata.

The last record in an active text file is provisional until another event header arrives. If late
stack-trace lines extend it after delivery, the stream emits its updated full representation with
a new `id` and the same `logicalId`. Agents should upsert by `logicalId`, while persisting the
newest processed SSE `id` for resume.

Every client has a bounded outbound queue. A slow client whose queue overflows on a log event is
closed instead of growing memory. The stream also has global/per-identity connection caps, a
bounded dispatcher pool/queue, a maximum events-per-poll limit, heartbeats, and a maximum lifetime
that forces periodic reauthentication.

### NDJSON Troubleshooting Bundle

`POST /ng/ai-diagnostics/v1/bundles` accepts an optional JSON body with `from`, `to`, `limit`,
`levels`, `text`, `sourceFile`, `subsystem`, `eventCode`, `requestId`, `syncRunId`, and `machineId`.
The default levels are WARN and ERROR.

The response is an immediate `application/x-ndjson` attachment. The first line is a manifest:

```json
{"type":"manifest","schemaVersion":1,"generatedAt":"...","application":"power-plant","sanitized":true,"eventCount":42,"truncated":true,"nextCursor":"..."}
```

Each remaining line has this shape:

```json
{"type":"event","event":{"id":"...","logicalId":"...","timestamp":"...","level":"ERROR","message":"..."}}
```

Response headers include `X-Diagnostics-Event-Count`, `X-Diagnostics-Truncated`, and an attachment
filename. Event count, byte size, and internal page size are bounded. `truncated=true` means the
event target, byte budget, cache, or query paging left more evidence available.

The bundle is assembled synchronously in memory and returned directly. It is not stored and does
not currently include health, metrics, configuration, database data, arbitrary files, or a later
bundle-download ID.

## Limits and Back-Pressure

Rate limiting uses fixed windows keyed by configured service identity and operation:

| Limit | Default window/value |
|---|---:|
| Historical queries | 60 per minute |
| Stream opens | 6 per minute |
| Bundle requests | 6 per hour |
| Active streams, all identities | 8 |
| Active streams per identity | 2 |
| Queued events per stream | 200 |
| Events read per stream poll | 100 |
| Stream lifetime | 10 minutes |

Rate-limit responses use HTTP 429 and include `Retry-After`. Connection-limit failures also use
HTTP 429. Counters and active-connection state are in-memory and local to one JVM; deployments with
multiple instances do not share a global quota.

## Auditing

The implementation logs:

- denied service-key authentication without logging the credential;
- historical query identity, effective range, returned count, `hasMore`, and truncation;
- stream open/close identity, connection count, close reason, and queue overruns;
- bundle identity, event count, output bytes, and truncation.

It does not copy bearer keys, returned event bodies, or SSE heartbeat deliveries into audit events.

## Configuration Reference

All properties use the `logging.ai-diagnostics` prefix. Values not listed in
`application.properties` still use these typed defaults and can be overridden.

### Feature, Credentials, and Query Bounds

| Property suffix | Default | Purpose |
|---|---:|---|
| `enabled` | `false` | Register and start the AI surface |
| `max-api-key-length` | `512` | Maximum accepted raw bearer-key characters |
| `max-historical-minutes` | `1440` | Maximum query/resume history |
| `max-events-per-response` | `500` | Historical page ceiling |
| `max-cursor-length` | `128` | Cursor and `Last-Event-ID` length ceiling |
| `max-search-text-length` | `512` | Free-text query length ceiling |
| `max-filter-value-length` | `256` | Individual structured-filter length ceiling |
| `api-keys[n].identity` | required | Stable audit/rate-limit identity |
| `api-keys[n].sha256` | required | 64-character SHA-256 hex digest |
| `api-keys[n].enabled` | `true` | Include the credential at startup |
| `api-keys[n].expires-at` | none | Optional ISO-8601 expiration instant |
| `api-keys[n].scopes` | required | Comma-separated recognized scopes |

### Stream Bounds

| Property suffix | Default | Purpose |
|---|---:|---|
| `stream.poll-interval` | `2s` | Delay between source polls |
| `stream.heartbeat-interval` | `20s` | Heartbeat interval |
| `stream.max-lifetime` | `10m` | Connection lifetime/reauthentication bound |
| `stream.initial-lookback` | `5s` | Starting lookback without `Last-Event-ID` |
| `stream.max-connections` | `8` | Global active-stream cap per JVM |
| `stream.max-connections-per-identity` | `2` | Active-stream cap per service identity |
| `stream.max-queued-events-per-connection` | `200` | Per-client outbound queue capacity |
| `stream.max-events-per-poll` | `100` | Query page per client poll |
| `stream.dispatcher-threads` | `2` | SSE send worker count |
| `stream.dispatcher-queue-capacity` | `64` | Pending drain-task capacity |

All stream durations and numeric bounds must be positive when the feature starts.

### Bundle and Rate Limits

| Property suffix | Default | Purpose |
|---|---:|---|
| `bundle.max-events` | `2000` | Maximum events in one NDJSON response |
| `bundle.max-bytes` | `5242880` | Maximum bundle bytes (5 MiB) |
| `bundle.page-size` | `500` | Internal sanitized query page size |
| `rate-limit.historical-requests-per-minute` | `60` | Historical fixed-window quota |
| `rate-limit.stream-opens-per-minute` | `6` | Stream-open fixed-window quota |
| `rate-limit.bundle-requests-per-hour` | `6` | Bundle fixed-window quota |
| `rate-limit.cleanup-interval` | `PT5M` | Expired in-memory counter cleanup cadence |

## Current Operational Limitations

- Key enable/disable changes are not hot-reloaded and require restart.
- Existing SSE connections are not reauthenticated mid-connection; use short expirations together
  with the maximum connection lifetime when prompt revocation matters.
- Resume state, rate limits, connection counts, and rotated-generation cache are process-local and
  not shared or durable.
- The bundle contains sanitized events only; it does not yet collect health, metrics, or safe
  configuration context.
- The underlying Logback files are text, parsed at read time; there is no structured JSON appender.
- Successful queries can describe incomplete evidence through `truncated`; agents must surface that
  fact instead of treating absence of an event as proof that it never occurred.
