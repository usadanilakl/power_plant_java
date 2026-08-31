# Air monitoring, 2026-08-30

Everywhere that needs atmosphere testing while work is live there, and what it last read.

## Built clean, not on the old `Space`

The half-finished `Space` entity was not salvageable, for reasons that all point the same way:

- **A bare `@Entity`** — it does not extend `BaseIdEntity`, so no soft delete, no prefixed ids, no
  `FieldChangeEntityListener`. It is not in `EntityTableRegistry` either, so **it never synced at
  all**.
- **Flat and overwritten** — one set of readings held directly on the row. For air monitoring the
  *history* is the artifact: "was this space tested before entry, and what did it read" is a
  question about a moment, and a single overwritten row can only answer it for the last one. It
  also makes "overdue" uncomputable.
- **Dead** — nothing outside its own five files referenced it.
- **Confined space only.** Hot work needs monitoring too.

## Two entities

`MonitoredArea` — the place. `AirTest` — one row per reading set: when, who, which meter, the five
gases, pass/fail. Both extend `BaseAuditEntity`, both registered in `EntityTableRegistry` **and**
`ServiceFacade`. The second half matters: `ServiceFacade` is what resolves an inbound change to the
service that owns the type, so registering only the table gives you an entity that emits changes on
every node and applies them on none — a silent one-way sync that looks like it is working.

Readings are Strings, matching `ConfinedSpace`. Field meters report things a number cannot hold —
`<0.1`, `OR` for over-range — and coercing those would turn "the meter pegged" into what looks like
a measurement.

## The list is derived, then edited

Every open Confined Space and Hot Work permit puts its place on the list. Deriving it is the point:
a list somebody has to remember to add to is a list that will be missing the space nobody thought
of.

Two rules keep the derivation from fighting the operator, and they are **deliberately asymmetric**:

- **A manual removal is remembered.** Regeneration runs repeatedly; without this, an entry somebody
  took off would come back on the next pass and they would have to remove it again after every
  refresh until the permit closed.
- **A manual addition is never auto-removed.** Nothing about a permit closing proves a space
  somebody added by hand stopped needing monitoring, and the two mistakes do not cost the same.

When a source permit closes its entry is **switched off, not deleted**, so the readings taken
against it stay reachable.

**Never tested counts as overdue**, not as fine. A space nobody has ever tested is the most overdue
thing on the list; reporting it as safe because it has no history would be exactly the wrong way
round.

## Offline: Supabase snapshot to read, hub to write

SharePoint is deliberately not in this path. An SP-backed list needs a provisioned column set and a
hand-edited Power Automate flow per field — the friction we just paid for one `WorkAreas` column —
and this list has no SharePoint reporting requirement to justify it.

- **Read**: hub → Supabase `monitored_areas` snapshot → last cached copy. The snapshot path already
  existed (`SupabasePwaDataSink` publishes with content-hash dedup, `snapshotOrElse` reads it), so
  this costs nothing per field and needs no manual flow work.
- **Write**: the hub is the only authority. A phone with no signal cannot write to any remote store,
  so "offline" here means a **local outbox and a retry**, not a second system of record. The reading
  is queued BEFORE the network is attempted — a test that exists only in an in-flight request is one
  that can vanish without anyone knowing.

`testedAt` travels in the payload rather than being stamped on arrival. A reading taken in a
basement at 06:00 and uploaded at 14:00 has to keep 06:00, or the record misrepresents when the
atmosphere was safe.

## Snapshot freshness

Writes call `publishMonitoredAreas()` directly, and `PwaSnapshotReconciler` now fingerprints
`MonitoredArea` and `AirTest` as well. Belt and braces on purpose: the direct call is the latency
fix (ten minutes is a long time to a technician standing in front of a space wondering why it is not
on their list), the reconciler is the safety net that catches whatever path forgot — including sync
apply, which has no call site by design.

## A circular dependency worth knowing about

The publisher reads the service to build the snapshot; the service asks the publisher to refresh it
after a write. As a **constructor** dependency that cannot be resolved, and `@Lazy` does not help
there: Lombok does not copy the annotation onto the generated constructor parameter unless
`lombok.config` says to, and this project has no `lombok.config`. On a **field** Spring applies it
directly and injects a proxy. Anything else in this codebase relying on `@Lazy` with
`@RequiredArgsConstructor` is relying on it not mattering.

## Surface

| | |
|---|---|
| `GET /ng/air-monitoring/areas` | the list, overdue first |
| `POST /ng/air-monitoring/refresh` | rebuild the derived entries |
| `POST/DELETE /ng/air-monitoring/areas` | add / edit / remove — PLANT, SAFETY or ADMIN |
| `POST /ng/air-monitoring/tests` | record a reading |
| `GET/POST /api/pwa/secured/air-monitoring/**` | field read + record |

Desktop: Permits → **Air Monitoring**. PWA: `plant/air-monitoring`.

Covered by `AirMonitoringIT` — both permit types derive, refresh is idempotent, removal survives a
refresh, manual entries survive, a closed permit retires its entry without deleting it, never-tested
is overdue, a stale test goes overdue again, the reading's own timestamp is kept, an unknown area is
refused, and history is newest-first.

## Codex review — eight findings, all fixed

A new feature of this size earning eight findings is unsurprising; several were the kind that only
show up under partition, retry or the passage of time.

### The list was not actually derived

`refreshFromPermits()` only ran when somebody pressed a button. A permit raised at 02:00 would have
stayed absent from the field app until the next person happened to open the desktop page — which
makes the list a snapshot with a manual step in front of it, not a derived list, and defeats the
one claim the feature rests on. Now scheduled every fifteen minutes, hub-gated like the other
sweeps, with `permits.air-monitoring.derive.enabled` to disable it.

### Duplicates under partition

Ids are device-prefixed, so two nodes deriving the same permit each mint their own row and sync
keeps **both** — removing one leaves the other active. Two fixes, prevention and cure:

- hub-gated derivation, so there is normally one writer;
- when duplicates do exist (a client that swept while the hub was unreachable), they collapse onto
  the **smallest id** — every node computes that identically, the same deterministic-survivor rule
  the Category/Value dedup uses. Losers are retired, not deleted, and **a removal on either copy
  survives the collapse**, because a removal is a decision.

### Retries could duplicate a reading, and a flush could lose one

Both fixed by giving each reading a client-generated `clientUuid`:

- The server resolves by it first, so a retry after a lost response **updates** the committed
  reading instead of creating a second row for the same test. This matters more than it sounds: a
  dropped connection at exactly the wrong moment is the normal case in a basement.
- The outbox is addressed by that id and always read-modify-written against the CURRENT contents.
  The old version replaced the whole outbox with a snapshot captured before the awaits, so a
  reading recorded mid-flush was silently overwritten — and reported back as safely queued.

### Overdue froze at snapshot time

The snapshot carried the server's computed `overdue`, and the passage of time is not a change, so
nothing republished it: an area snapshotted at 11 hours would have said "11h ago, fine" indefinitely
after crossing its interval. The device now recomputes from `lastTest.testedAt` — time is the one
input a phone always has, even with no signal.

### Three smaller ones

- **Publishing raced the commit.** The `@Async` publisher was called inside the transaction, so the
  worker could query before the write was visible and publish the previous state, reporting success.
  Now registered as an `afterCommit` synchronisation.
- **Future readings suppressed monitoring.** A wrong device clock became the newest test and marked
  the area not overdue until that moment arrived — the system confidently calling an untested space
  fine. Anything more than five minutes ahead is recorded as now.
- **The "recent" query pulled the whole history** and collapsed it in Java, so list loads scaled with
  the size of the test table rather than the number of areas. Now a correlated `MAX(testedAt)`
  subquery, one row per area.
- **An empty snapshot resurrected stale areas.** `snapshotOrElse` treats an empty dataset as
  "unavailable" and falls back — so once the last area retired, an offline phone would drop to its
  old cache and keep prompting people to test finished spaces. The service now reads the snapshot
  directly, so an empty answer is an answer.

Codex confirmed no sync registration gap: both entities are in `EntityTableRegistry`, the sync order
and `ServiceFacade`.
