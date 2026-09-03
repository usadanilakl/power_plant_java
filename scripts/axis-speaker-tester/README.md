# AXIS Speaker API Tester

Throwaway test harness for the plant speakers (VAPIX / AXIS Audio Manager Edge).
Zero dependencies. Two interchangeable backends serve the same UI — pick
whichever the machine can run.

**PowerShell** (no install; use this on plant machines):

```
powershell -ExecutionPolicy Bypass -File scripts\axis-speaker-tester\server.ps1
# then open http://127.0.0.1:8099
```

**Node** (if it happens to be installed):

```
node scripts/axis-speaker-tester/server.js
```

Both serve `index.html`, implement the same hand-rolled Digest, and return the
same JSON, so the UI cannot tell them apart.

| | PowerShell | Node |
| --- | --- | --- |
| port | `-Port 9000` | `PORT=9000` |
| bind address | `-Bind ...` | `BIND=...` |

Windows PowerShell 5.1 is enough and no admin rights are needed for a localhost
bind. A non-localhost `-Bind` needs an elevated prompt or a `netsh http add
urlacl` reservation; only do that on a trusted LAN, since anyone who can reach
the proxy can drive it.

## Why there is a proxy and not just an HTML file

A page opened straight from disk **cannot** call an AXIS device:

1. **CORS** — AXIS devices send no `Access-Control-Allow-Origin`, so the browser
   discards every response, even a successful one.
2. **Digest auth** — VAPIX answers `401` with a `WWW-Authenticate: Digest`
   challenge. `fetch()` cannot compute a digest response; you can only ever get
   the browser's own login popup, which does not survive a cross-origin call.

`server.js` therefore does two jobs: serves `index.html`, and forwards each
request from Node (which *can* do Digest) to the device. It binds to
`127.0.0.1` only.

## Endpoints wired up

| Card | Request |
| --- | --- |
| Basic device info | `POST /axis-cgi/basicdeviceinfo.cgi` |
| List targets | `GET /vapix/aam-edge/api/v1.0/targets` |
| One-shot play | `POST /vapix/aam-edge/api/v1.2/audioSessions/oneshotPlayAudioFiles` |
| Retrieve session | `GET /vapix/aam-edge/api/v1.2/audioSessions/{id}` |
| Stop session | `POST /vapix/aam-edge/api/v1.2/audioSessions/{id}/stopAudioFiles` |
| Endpoint probe | fires GETs at candidate paths, reports status codes |
| Custom | any method / path / headers / body |

Every path segment, version number, parameter and body is editable in the UI.
The play request builds its JSON live from the `fileIds` / `prio` / `targets`
fields, or you can tick **edit raw JSON body** and hand-write it.

## Conveniences

- **Auth mode** `auto` mirrors curl's `--anyauth`: unauthenticated probe, then
  Digest (or Basic) based on the device's challenge. The Request tab shows the
  attempt chain, e.g. `none -> 401 | digest -> 200`.
- Requests that carry a body probe for the challenge **without** the body first,
  so the payload is never submitted unauthenticated. Those chains read
  `challenge probe (no body) -> 401 | digest -> 200`.
- Targets from the list response render as chips; **+ target** pushes the id
  into the play request.
- A successful play copies the returned session `id` into the Session ID field,
  so Retrieve and Stop are immediately ready.
- **copy curl** on every card emits a doc-style command. The password is
  written as `<password>`, never the real one, so it is safe to paste around.
- Settings persist in `localStorage`. The password is only stored if you tick
  **remember**; **clear saved** wipes it.

## Caveats

- The probe card's paths are **guesses** — the docs you captured did not include
  the audio-files or zones endpoints. Treat non-2xx there as "not that path"
  rather than "broken device".
- `targets` is documented as an *array of objects*; the shape selector defaults
  to `[{"id": "..."}]`. If the device rejects it, flip to the plain-string shape
  or edit the raw body.
- The proxy will forward to any host you type. It is a LAN test tool — keep it
  bound to localhost and do not expose it.
