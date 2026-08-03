# Production AI Live Log Access Runbook

## Purpose

This runbook explains how an authorized AI troubleshooting agent reaches the production hub's
sanitized historical log API and live Server-Sent Events (SSE) feed. It is an operational guide;
the complete security model, event schema, bounds, and configuration are documented in
[AI Diagnostics](ai-diagnostics.md).

The AI agent is an HTTPS client. The hub does not initiate a connection to the agent, and this
integration does not require an OpenAI API key, a browser session, a user role, or a FULL access
grant.

## Production Access Contract

| Item | Production value |
|---|---|
| Base URL | `https://jgportal.jpowerusa.com` |
| Historical events | `GET /ng/ai-diagnostics/v1/events` |
| Live log stream | `GET /ng/ai-diagnostics/v1/events/stream` |
| Troubleshooting bundle | `POST /ng/ai-diagnostics/v1/bundles` |
| Authentication | `Authorization: Bearer <raw-service-key>` |
| Windows credential target | `PowerPlant-AI-Diagnostics` |
| Service identity | `production-ai-agent` |
| Live event levels | `WARN` and `ERROR` |
| Data boundary | Sanitized, bounded active-log events only |

Production access was validated on 2026-08-03 through the public HTTPS route. An authenticated
historical request returned HTTP 200, sanitized events, `Cache-Control: no-store`, and
`Pragma: no-cache`. A bounded live test returned HTTP 200 with `text/event-stream` and delivered
`connected`, sanitized `log`, and `heartbeat` events without proxy buffering.

## Where the Key Lives

The two sides deliberately store different values:

```text
AI client workstation                    Production hub
---------------------                    --------------
Windows Credential Manager               application-secrets.properties
raw high-entropy service key             SHA-256 digest only
```

On the authorized Windows workstation, the raw key is a Generic Credential under:

```text
Target:    PowerPlant-AI-Diagnostics
User name: production-ai-agent
```

An agent running as the same Windows user can retrieve the credential with the Windows Credential
API (`CredReadW`) or an approved credential-store adapter. `cmdkey /list` can confirm the target but
cannot return its secret. The agent should assign the result directly to an in-memory variable and
must never print it.

An agent running on another machine must receive its own secret through that machine's secret
manager. Prefer a separate identity and key with only the scopes that agent requires; do not export
the workstation credential into source code, chat, a prompt, a shell command, or a URL.

## Required Security Behavior

An AI agent accessing production logs must:

- use only the HTTPS production URL;
- retrieve the raw key at runtime from an approved secret store;
- send the key only in the `Authorization` header;
- never use a query-string token;
- never print, log, persist, or include the raw key in model context;
- avoid copying complete event bodies into ordinary agent logs or chat when a bounded summary is
  sufficient;
- clear its in-memory key reference when the request or stream ends;
- treat the returned data as sensitive even though it is server-sanitized;
- use one live connection and close it when active troubleshooting ends.

The hub service key authenticates only `/ng/ai-diagnostics/v1/**`. It does not authorize any other
application endpoint or any write operation.

## Recommended Agent Sequence

1. Retrieve the raw key from the secret store without displaying it.
2. Make a small historical request to confirm authentication and establish recent context.
3. Check `truncated` and `hasMore`; page deliberately if more evidence is needed.
4. Open one SSE connection for active troubleshooting.
5. Process `log` events, upsert revisions by `logicalId`, and persist the newest successfully
   processed SSE `id` as the resume cursor.
6. Reconnect with `Last-Event-ID` after the server's bounded stream lifetime or a network failure.
7. Close the stream as soon as the troubleshooting session ends.

## Historical Preflight

Use the historical endpoint before opening a stream. A small request verifies the key, IIS header
forwarding, JSON parsing, and the sanitization boundary without holding a connection open.

Example request:

```http
GET /ng/ai-diagnostics/v1/events?limit=20&sort=desc&levels=INFO,WARN,ERROR
Host: jgportal.jpowerusa.com
Authorization: Bearer <key-loaded-from-secret-store>
Accept: application/json
```

Useful filters include `from`, `to`, `text`, `sourceFile`, `subsystem`, `eventCode`, `requestId`,
`syncRunId`, and `machineId`. Use the opaque `nextCursor` for another page rather than expanding the
time range without a reason.

Expected successful response properties:

- HTTP 200 and `Content-Type: application/json`;
- `events` contains only sanitized event objects;
- `hasMore` indicates whether another cursor page exists;
- `truncated=true` means the available response is incomplete and must be reported as such;
- `Cache-Control: no-store` and `Pragma: no-cache` are present.

The raw key in the following PowerShell outline must come from a secret-store adapter. Never replace
the retrieval comment with a literal key:

```powershell
$baseUri = 'https://jgportal.jpowerusa.com'
$key = $null

try {
    # Retrieve PowerPlant-AI-Diagnostics through CredReadW or an approved adapter.
    $key = Get-KeyFromApprovedSecretStore

    $headers = @{
        Authorization = "Bearer $key"
        Accept = 'application/json'
    }

    $response = Invoke-RestMethod `
        -Uri "$baseUri/ng/ai-diagnostics/v1/events?limit=20&sort=desc" `
        -Headers $headers `
        -Method Get

    # Pass only the bounded, relevant, sanitized events to the troubleshooting workflow.
    $events = @($response.events)
} finally {
    $key = $null
}
```

`Get-KeyFromApprovedSecretStore` is intentionally a placeholder for the host agent's secret adapter;
it is not an application command.

## Live SSE Connection

The live feed request is:

```http
GET /ng/ai-diagnostics/v1/events/stream
Host: jgportal.jpowerusa.com
Authorization: Bearer <key-loaded-from-secret-store>
Accept: text/event-stream
Last-Event-ID: <last-successfully-processed-log-event-id>
```

Omit `Last-Event-ID` on the first connection. Optional live filters are `subsystem`, `eventCode`,
`requestId`, `syncRunId`, and `machineId`. The live stream is intentionally fixed to WARN and ERROR;
use the historical endpoint when INFO, text search, source selection, or explicit sorting is needed.

The stream emits three event types:

| SSE event | Agent action |
|---|---|
| `connected` | Confirm the connection and record the reported resume mode. |
| `log` | Process the sanitized event, upsert by `logicalId`, then persist its SSE `id`. |
| `heartbeat` | Mark the transport healthy; do not treat it as a log event or resume position. |

Minimal agent logic:

```text
key = secretStore.read("PowerPlant-AI-Diagnostics")
lastId = state.read("production-log-cursor")

while troubleshooting is active:
    response = https.openSse(
        url = "https://jgportal.jpowerusa.com/ng/ai-diagnostics/v1/events/stream",
        headers = {
            "Authorization": "Bearer " + key,
            "Accept": "text/event-stream",
            "Last-Event-ID": lastId when lastId exists
        }
    )

    for event in response:
        if event.type == "log":
            sanitized = parse(event.data)
            evidence.upsert(sanitized.logicalId, sanitized)
            troubleshoot(sanitized)
            lastId = event.id
            state.write("production-log-cursor", lastId)
        else if event.type == "heartbeat":
            transport.markHealthy()

    reconnect with bounded backoff and the saved lastId

key = null
```

Persist the cursor only after successfully processing the corresponding `log` event. A reconnect
requests events strictly after that cursor. The stream is not a durable message queue: process
restart, cache eviction, or source truncation can create a gap. The agent must state that limitation
instead of treating missing events as proof that nothing happened.

The server closes streams after the configured maximum lifetime (currently 10 minutes) so the next
connection reauthenticates. Reconnect normally with the saved cursor. For HTTP 429, honor the
`Retry-After` header rather than reconnecting immediately.

## Troubleshooting Bundle

Use a bounded bundle when an agent needs a point-in-time NDJSON evidence set rather than a live
connection:

```http
POST /ng/ai-diagnostics/v1/bundles
Host: jgportal.jpowerusa.com
Authorization: Bearer <key-loaded-from-secret-store>
Accept: application/x-ndjson
Content-Type: application/json

{"levels":["WARN","ERROR"],"limit":500}
```

The first line is a manifest. The remaining lines are sanitized events. The response is generated
in memory and is not stored on the hub.

## Status Codes and Recovery

| Result | Meaning | Agent or operator action |
|---|---|---|
| `200` | Authenticated historical query or bundle | Validate response type and no-cache headers. |
| `401` | Missing, invalid, expired, or out-of-sync key | Confirm the credential target and deployed digest; rotate if the raw key is lost. |
| `403` | Valid identity without the endpoint's required scope | Add only the required scope and restart the hub. |
| `404` | Feature disabled, old JAR, or route not forwarded | Check the running artifact, enabled property, and IIS route. |
| `429` | Request rate or stream connection limit | Honor `Retry-After`; close duplicate streams. |
| `400` | Invalid filter, range, or cursor | Correct the request; do not retry unchanged. |
| `5xx` | Hub or proxy failure | Stop retry amplification, preserve the cursor, and check hub health. |

If historical access works but SSE does not:

- confirm IIS forwards `Authorization` and `Last-Event-ID`;
- confirm proxy buffering is disabled for this route;
- confirm the proxy permits a connection longer than the heartbeat interval;
- set the proxy timeout beyond the 10-minute application stream lifetime;
- expect a `connected` event immediately and a heartbeat approximately every 20 seconds;
- verify that the client reads incrementally instead of buffering the entire response.

## Current Production Operating Policy

Use the historical endpoint deliberately within its rate limit, but treat live SSE as an on-demand
troubleshooting tool:

- open only one live stream;
- do not leave the stream running as permanent monitoring;
- begin with a short staffed test and watch hub CPU, heap/GC, request latency, and security-log
  growth;
- stop the stream if application performance changes materially.

The current implementation polls separately per connection and level. One live client therefore
causes repeated sanitized cache scans and audit records; multiple continuous clients can amplify
hub load. This does not affect an idle enabled endpoint or an occasional historical query.

Configured defaults relevant to an agent are:

| Limit | Current default |
|---|---:|
| Historical requests | 60 per identity per minute |
| Stream opens | 6 per identity per minute |
| Active streams | 2 per identity, 8 globally |
| Stream heartbeat | 20 seconds |
| Stream lifetime | 10 minutes |
| Stream event levels | WARN and ERROR only |

The service permits more connections than the current operating policy recommends. Agents should
follow the one-stream policy until the polling implementation is optimized and load-tested.

## Key Rotation

The raw key cannot be recovered from its SHA-256 digest. When a key is lost, rejected, exposed, or
expired:

1. Generate at least 32 cryptographically random bytes.
2. Overwrite the client's secret-store entry without displaying the new key.
3. Put only the new SHA-256 digest in the hub's `application-secrets.properties`.
4. Rebuild and redeploy the JAR, or update the approved external server configuration.
5. Restart the hub; credentials are loaded only at startup.
6. Verify unauthenticated access returns 401 and authenticated historical access returns 200.
7. Open a short SSE connection and confirm `connected`, heartbeat, and resume behavior.

During rotation, the client and hub can temporarily be out of sync. A 401 is expected until both
sides contain the same key/digest pair and the hub has restarted.

## Related Documentation

- [AI Diagnostics](ai-diagnostics.md) — complete API and configuration contract
- [Logging System](../logging-system.md) — files, redaction, event parsing, and retention
- [Secrets Management](secrets.md) — repository and packaging secret conventions
- [Hub Windows Service](hub-windows-service.md) — production service deployment and restart
