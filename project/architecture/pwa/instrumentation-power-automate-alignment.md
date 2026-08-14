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

## 1. Set `Title` on both lists — REQUIRED

The hub now writes SharePoint's `Title` column, because an unset Title renders as a blank row in
every default list view (the item link is the Title). The flow must match, or items created through
the fallback are the blank ones.

**Case `addInstrument`** — add to the *Create item* action:

| Column | Expression |
|--------|-----------|
| Title | `triggerBody()?['data']?['Tag_x0020_Number']` |

(The hub sets the register's Title to the tag number.)

**Case `addInstrumentationLog`** — add to its *Create item* action:

```
@{concat(
   triggerBody()?['instrumentationLog']?['instrumentTagNumber'],
   ' — ', triggerBody()?['instrumentationLog']?['status'],
   ' (', triggerBody()?['instrumentationLog']?['date'], ' ',
        triggerBody()?['instrumentationLog']?['time'], ')')}
```

producing `01MBH02AA711S12 — In Progress (2026-08-14 19:09)`, which is exactly what the hub writes
(`InstrumentLogSharePointAdapter#buildTitle`).

Existing rows keep their blank Titles. Register rows self-heal — every log submission upserts the
register item — but the log rows already in SharePoint need a manual backfill if you want them named.

## 2. Tag column internal names differ PER LIST — do not "fix" this

Verified against the live tenant on 2026-08-14 (hub log, `spId=28` create):

| List | Tag column internal name |
|------|--------------------------|
| `Instrumentation` (register) | `Tag_x0020_Number` |
| `Instrumentation Log` | `TagNumber` |

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

| Column | Expression |
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

## 6. Cases that must exist — VERIFY

[instrument-flow-refactor.md](../supabase/instrument-flow-refactor.md) lists two of the four cases as
"ADD", i.e. specified but not necessarily built. The PWA calls all four:

| `actionType` | Used for | If missing |
|---|---|---|
| `getAllInstruments` | register fallback | the offline list never refreshes while the hub is down |
| `addInstrumentationLog` | log fallback | logs stay queued on the device until the hub returns |
| `getState` | version probe | every PA refresh re-pulls the whole register instead of skipping |
| `addInstrument` | new instrument fallback | new instruments stay queued until the hub returns |

Nothing is *lost* if the two "ADD" cases are missing — the device outbox holds the work and retries —
but the fallback is only as good as the cases that exist. Worth confirming in the designer.

Also confirm `getAllInstruments` maps its Select to the PWA's **camelCase** keys (`tagNumber`,
`description`, `vendor`, `location`, `type`, `currentStatus`, `lastUpdatedDate`, `lastUpdatedTime`,
`lastUpdatedBy`, `lastComment`, `sharepointId`). The client casts the rows straight through with no
field mapping, so raw SharePoint column names would yield a list of blank instruments.

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
2. §3 register update on the log case — silent stale status in SharePoint during a hub outage.
3. §4 failure reporting — protects devices from losing their offline register.
4. §1 Title — cosmetic but affects every SharePoint view.
5. §6 verification, §2 don't-break-this.
