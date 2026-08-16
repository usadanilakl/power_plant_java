# Instrumentation — Power Automate alignment (2026-08-14)

Everything the hub does for instrumentation now has a Power Automate counterpart that is used when
the hub is unreachable. This document lists **only the places where the flow has drifted from the
hub** after the 2026-08-14 instrumentation work, so the fallback produces the same SharePoint state
the hub produces.

The flow itself lives in Power Automate (target `instrument`, one flow demuxed by `actionType` —
see [instrument-flow-refactor.md](../supabase/instrument-flow-refactor.md) for the full case list and
[pa-gateway.md](../supabase/pa-gateway.md) for the gateway in front of it). Nothing here can be
changed from this repo.

---

## Payload keys vs SharePoint columns

Every flow action has a left side and a right side, from unrelated naming schemes. **They are not the
same and never have been** — verified field by field against the live flow on 2026-08-16:

```
   SharePoint column internal name   ←   expression reading the PWA's JSON payload
   ------------------------------        --------------------------------------
   Tag_x0020_Number                  ←   triggerBody()?['data']?['TagNumber']
   PwaId                             ←   triggerBody()?['localUuid']
   ^ fixed when the column was made       ^ chosen by the PWA's request body
```

Two blank fields on every PA-created instrument were traced to exactly this: the flow read
`data.TagNumber` and top-level `localUuid`, while the PWA sent `data.Tag_x0020_Number` and
`data.PwaId`. The five fields whose names already agreed came through fine. The PWA was changed to
match the flow.

| Case | Payload keys the flow reads |
|---|---|
| `addInstrument` | top-level `localUuid`; `data.{TagNumber, Description, Vendor, Location, Type, CurrentStatus}` |
| `addInstrumentationLog` | top-level `localUuid` and `attachments`; `instrumentationLog.{instrumentTagNumber, instrumentDescription, status, date, time, name, comment}` |
| `getAllInstruments` (response) | `{tagNumber, description, vendor, location, type, currentStatus, lastUpdatedDate, lastUpdatedTime, lastUpdatedBy, lastComment, sharepointId, pwaId}` |

Column names are the flow's own business and differ per list — see §2.

## 1. `addInstrument` — verified working 2026-08-16

Current mapping in the flow's *Create item* on **`Instrumentation`**, all verified to persist:

| SharePoint column | Expression |
|---|---|
| Title | `triggerBody()?['data']?['TagNumber']` |
| Tag Number (`Tag_x0020_Number`) | `triggerBody()?['data']?['TagNumber']` |
| PwaId | `triggerBody()?['localUuid']` |
| Description | `triggerBody()?['data']?['Description']` |
| Vendor | `triggerBody()?['data']?['Vendor']` |
| Location | `triggerBody()?['data']?['Location']` |
| Type | `triggerBody()?['data']?['Type']` |
| CurrentStatus | `triggerBody()?['data']?['CurrentStatus']` |

Title takes the tag number, matching the hub. Response: `200`,
`{ "success": true, "id": "@{body('Create_item')?['ID']}" }`.

Test body (exactly what the PWA sends):

```json
{ "actionType": "addInstrument", "localUuid": "test-uuid",
  "data": { "TagNumber": "PT-101", "Description": "Test", "Vendor": "Acme",
            "Location": "Turbine Hall", "Type": "Pressure",
            "CurrentStatus": "Normal Operation" } }
```

### 1a. `addInstrument` is not idempotent — OPEN RISK

It creates unconditionally. If a run creates the item but the caller never sees the response (see
§6e), the PWA counts the create as failed, keeps it in the device outbox and retries — producing a
**duplicate SharePoint row**. The hub path is protected (it dedups by tag and by localUuid); this
path is not.

Now that `PwaId` persists, the flow can close this: before creating, *Get items* on
`Instrumentation` filtered `PwaId eq '@{triggerBody()?['localUuid']}'` (or on `Tag_x0020_Number`),
and update instead of create when a row comes back — mirroring the hub's `upsertByTagNumber`.

**Case `addInstrumentationLog`** → add `Title` to its *Create item* on **`Instrumentation Log`**:

```
@{concat(
   triggerBody()?['instrumentationLog']?['instrumentTagNumber'],
   ' — ', triggerBody()?['instrumentationLog']?['status'],
   ' (', triggerBody()?['instrumentationLog']?['date'], ' ',
        triggerBody()?['instrumentationLog']?['time'], ')')}
```

producing `01MBH02AA711S12 — In Progress (2026-08-14 19:09)`, exactly what the hub writes.

## 2. Tag column internal names differ PER LIST — do not "fix" this

Verified against the live tenant on 2026-08-14 (hub log, `spId=28` create):

| List | Tag column internal name |
|------|--------------------------|
| `Instrumentation` (register) | `Tag_x0020_Number` |
| `Instrumentation Log` | `TagNumber` |

These are **column** names. The register's *payload key* is separately also spelled
`Tag_x0020_Number`, which is what makes this pair easy to misread — see the note above.

The register really does use the `x0020`-encoded name and the log list really does not. The hub used
to discover this the expensive way — it sent `Tag_x0020_Number` to the log list, ate a `400 The
property 'Tag_x0020_Number' does not exist`, and retried on **every single submission**; it now
latches the accepted name after the first discovery. If the flow's log case is ever edited, keep it
on `TagNumber`.

## 3. The log case must also update the register row — REQUIRED

When the hub accepts a log it does two writes: it creates the log item **and** rolls the summary onto
the register item (`InstrumentSharePointAdapter#upsertByTagNumber`), so the register always shows the
latest status. Today the flow's `addInstrumentationLog` case only creates the log item.

Consequence: a log submitted while the hub is down lands in the log list, but the register keeps the
*previous* status until the hub comes back and its SharePoint sync notices. Anyone reading the
register in SharePoint sees stale status with no indication.

Add to the `addInstrumentationLog` case, after the log item is created — an *Update item* on the
`Instrumentation` list for the row found by the existing "Get Inst By Tag" step:

| SharePoint column | Expression (reads the payload) |
|--------|-----------|
| CurrentStatus | `triggerBody()?['instrumentationLog']?['status']` |
| LastUpdatedDate | `triggerBody()?['instrumentationLog']?['date']` |
| LastUpdatedTime | `triggerBody()?['instrumentationLog']?['time']` |
| LastUpdatedBy | `triggerBody()?['instrumentationLog']?['name']` |
| LastComment | `triggerBody()?['instrumentationLog']?['comment']` |

Note `LastComment` is written through **even when empty** — it means "comment on the most recent
log", so a blank one must clear a stale comment rather than leave an old one looking current. That is
deliberately the one field the hub does not blank-guard.

## 4. Failure must be reported as failure — REQUIRED

The PWA now treats a Power Automate answer as unusable when `success` is `false` **or** when the
register payload is empty, and keeps its cached list instead of overwriting it.

This closed a real defect: the client used to hard-code `success: true` for the register fetch, so a
gateway rejection (HTTP 200 + `{"success": false}`) or a missing Switch case read as "a register of
zero instruments" and wiped the device's offline copy — silently, showing "Updated just now ·
0 instruments".

So the flow must:

- return `{"success": false, "message": "..."}` on any failure path, never a bare 200 with no data;
- keep the Default case's `400 {"success": false, "message": "Unknown action"}` response;
- return the register as a **non-empty** `data` array on success (an empty array is now read as a
  failed fetch and ignored, which is the safe interpretation but means a genuinely empty register
  cannot be represented).

## 5. Gateway authorization is out of step with the hub — REQUIRED

The hub gates instrumentation on a dedicated role:

```
/api/pwa/secured/instruments/**     hasAnyRole("INSTRUMENTATION", "ADMIN")
/api/pwa/secured/instrument-log/**  hasAnyRole("INSTRUMENTATION", "ADMIN")
```

The gateway's documented condition checks `ROLE_PLANT` ([pa-gateway.md](../supabase/pa-gateway.md)
step 3). For the `instrument` target that is now both wrong ways round: an I&C tech holding only
`ROLE_INSTRUMENTATION` is refused by the fallback, and a plant operator without it is allowed
through — bypassing the role the hub enforces.

Update the gateway's condition for `target == 'instrument'` to accept
`ROLE_INSTRUMENTATION` or `ROLE_ADMIN`, mirroring the hub. The role travels in the same claim the
existing check reads (`claims.roles` for hub tokens, `claims.user_metadata.roles` for Supabase ones).

## 6. Live test results — 2026-08-16

All four cases were exercised directly against flow `832a87fa…` (bypassing the gateway). Two work as
specified, two do not.

| `actionType` | Result | Response |
|---|---|---|
| `getState` | ✅ correct | `{"success":true,"data":[{"itemCount":3172,"lastModified":"…","version":"3172:…"}]}` |
| `addInstrument` | ✅ correct | `{"success":true,"id":"3251"}` |
| `getAllInstruments` | ❌ **broken** — see below | `{"success":true,"data":[…100 rows…]}` |
| `addInstrumentationLog` | ⚠️ works, wrong response shape | `{"message":"success to submit entry"}` |
| *(unknown action)* | ⚠️ `502 Bad Gateway`, empty body | no Response action on the Default case |

### 6a. `getAllInstruments` truncation — FIXED 2026-08-16

SharePoint's *Get items* defaulted to Top Count 100, so the flow answered 100 of 3172 rows while
`getState` reported 3172. Top Count is now 5000 and the two agree (3174/3174 at last check, ~6s and
~600 KB per pull).

### 6b. Null `tagNumber` on every row — RESOLVED (my earlier diagnosis was wrong)

I reported that the Select was reading the wrong column. It was not: after the Top Count change the
same rows return their tags correctly, so the field was simply not being returned by *Get items*
before. The read path needs no change.

The one row still lacking a tag is the test instrument created by the broken write path — see the
payload-key note at the top.

### 6c. `addInstrumentationLog` doesn't return the standard shape — SHOULD FIX

It returns `{"message":"success to submit entry"}` — no `success`, no `id`. The client currently
treats "no explicit `success:false`" as success, so this works, but it is one edit away from a data
loss: if the case ever returns `{"message":"…failed…"}` without `success:false`, the client would
count a failed submission as delivered and delete the log from the device outbox — the only copy.

Return `{"success": true, "id": "@{body('Create_item')?['ID']}"}`, matching `addInstrument`.

### 6e. Runs that create but never respond — WATCH

One `addInstrument` call returned `NoResponse` ("the server did not receive a response from an
upstream server") **after successfully creating the item**. Observed while the flow was being edited,
so it may have been a mid-save artifact rather than a standing defect — but the consequence is the
duplicate-row risk in §1a, so it is worth confirming the Response action is reached on every path.

### 6d. Default case has no Response — SHOULD FIX

An unknown `actionType` produces `502 Bad Gateway` with an empty body (the run ends without
responding). The client handles it as a transport failure and falls back correctly, so nothing
breaks, but the error is misleading. Add the Response the refactor doc already specifies:
`400 {"success": false, "message": "Unknown action"}`.

### What the client now does about all this

The PWA rejects a register answer that is empty, **short of the count `/state` reported** (5%
tolerance), or **carries no tag numbers at all**, keeping the device's existing register instead.
That is defence in depth, not a substitute for 6a/6b — while those are broken, the Power Automate
register fallback simply does nothing.

## 7. The new incremental sync needs NO flow change — by design

The hub gained `GET /api/pwa/secured/instruments/changes?since=<cursor>`, so a device that already
holds the register downloads only what moved instead of all ~3200 rows every time somebody logs
anything.

There is deliberately **no** Power Automate equivalent. The cursor is the hub's own
`dateModified`; SharePoint's `Modified` is a different clock on a different store, so a delta
answered by Power Automate against a hub-issued cursor would silently skip rows. The client tracks
which source issued its cursor and discards it whenever an answer comes from Power Automate.

The Power Automate path therefore stays full-pull, bounded instead by a **15-minute refresh
cooldown** — during a hub outage the fallback is swept at most once per quarter hour per device, not
once per app open. If PA volume still turns out to matter, the cheaper next step is dropping the
`getState` probe on the PA path (it reads the same list as the full pull) rather than adding a
`Modified`-based delta case, which would need its own cursor namespace to stay correct.

---

## Priority

1. §5 gateway roles — currently lets the wrong people through and blocks the right ones.
3. §3 register update on the log case — silent stale status in SharePoint during a hub outage.
4. §4 failure reporting — protects devices from losing their offline register.
5. §6 verification, §2 don't-break-this.
