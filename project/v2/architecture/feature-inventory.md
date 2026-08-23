---
title: Feature Inventory
type: architecture
status: draft
deployable: []
domain: []
concern: [build]
created: 2026-08-22
updated: 2026-08-22
code_refs: []
---

# Feature Inventory

**Step 1 of planning the rebuild.** Every feature in the system, with what it costs to
maintain. The point is not to describe them — it is to decide **which ones you are not
rebuilding.**

Measured 2026-08-22 from the code. The **Keep?** column is yours to fill in; nothing else
here requires judgement.

---

## How to fill in the last column

Three questions per row. The first one decides it:

1. **Does the plant stop without this?** → CORE
2. **Is it used, but people could work around it for a week?** → SUPPORTING
3. **When did anyone last use it?** If you don't know, that is itself the answer → DEAD or DROP

Be ruthless. Everything marked CORE is work you have committed to doing twice — once in the
old system and once in the new one. Everything marked DROP is work you never have to do again.

---

## The inventory

Angular LOC covers `.ts` + `.html` under that feature folder. Entity counts are from the
domain packages. Backend service lines are **not** listed per feature because
`sevice/angular/` is a 30,919-line catch-all that mixes every domain together — that is
itself a finding.

### Permitting — the core of the application

| Feature                                                                                                                     | Entities | Angular LOC | Docs           | Keep? |
| --------------------------------------------------------------------------------------------------------------------------- | -------: | ----------: | -------------- | ----- |
| **Permits** (Work Request, JHA, SafeWork, HotWork, Confined Space, Energized Work, Excavation, Venting, Job, Daily Package) |       33 |      17,981 | yes, good      |       |
| **LOTO Standard**                                                                                                           |  (of 16) |      16,103 | yes, excellent |       |
| **LOTO Points**                                                                                                             |  (of 16) |      11,862 | yes            |       |
| **LOTO permit runtime** (`loto`, `loto-conflict`)                                                                           |  (of 16) |       5,094 | yes            |       |
| **Red tag automation**                                                                                                      |        — |           — | yes            |       |

### Supporting the permit flow

| Feature | Entities | Angular LOC | Docs | Keep? |
|---|---:|---:|---|---|
| **Files / attachments** | 4 | 14,076 | — | |
| **Equipment** | 7 | 2,072 | — | |
| **Values / categories** (lookup data) | 2 | 3,441 | yes | |
| **Field list** | 1 | 1,289 | yes | |
| **Users & auth** | 7 | 4,086 | yes | |
| **Work areas** | (in permits) | — | yes | |

### Separate applications sharing the platform

| Feature | Entities | Angular LOC | Docs | Keep? |
|---|---:|---:|---|---|
| **Maximo integration** | 9 | 7,623 | yes | |
| **Rounds** | 14 | 1,899 | — | |
| **Schedule v2** | 12 | — | — | |
| **Scheduler** (DAG workflow engine) | 5 | 2,000 | — | |
| **EtaPRO** (historian) | 9 | 2,702 | yes | |
| **SDS** (chemical inventory) | 2 | 1,834 | yes | |
| **Inventory** | 2 | 1,440 | yes | |
| **Instrumentation** | 2 | 1,436 | — | |
| **Ordering** | — | 912 | yes | |
| **Messaging** | 5 | — | — | |
| **Fire impairment** | 4 | — | — | |

### Tools and visualisation

| Feature | Entities | Angular LOC | Docs | Keep? |
|---|---:|---:|---|---|
| **Diagram builder** | 3 | 9,012 | — | |
| **Physical objects / plant map** | 2 | 5,438 | yes | |
| **Form designer** | 2 | 5,133 | yes | |
| **Printable forms** | (forms) | — | yes | |
| **Tag number** | — | 987 | — | |
| **QR** | — | 662 | — | |
| **3D model** | — | 494 | — | |
| **ESP / LED wall** | 3 | — | — | |
| **Engraver** | 1 | — | — | |
| **Sim equipment** | 3 | — | — | |
| **QA help system** | — | — | yes | |
| **WebView AMS** | — | — | yes | |

### Infrastructure — not features, but they cost the most

| | Entities | Backend LOC | Keep? |
|---|---:|---:|---|
| **Sync** | 12 | 24,739 | rebuilding |
| **SharePoint integration** | — | 10,038 | |
| **Hub** | 3 | 5,880 | |
| **Automation** | — | 5,797 | |
| **PWA endpoints** | — | 4,405 | |
| **Data transfer** | 8 | 3,522 | |
| **Logging** | — | 2,705 | |
| **AI agent** | — | 2,459 | |
| **Email** | — | 1,696 | |

---

## What this already tells you

**Permitting is roughly half the front end.** Permits, LOTO Standard, LOTO Points and the
LOTO runtime come to about 51,000 Angular lines — more than everything else combined. If
anything is core, it is this, and it confirms starting there rather than assuming it.

**Entity count and interface size do not track each other.** Rounds has 14 entities and 1,899
lines of UI. Schedule has 12 entities and no feature folder at all. Either they are used
through some other surface, or they were built and left. **This is the first thing worth
checking.**

**Files is 14,076 lines** — larger than Maximo, larger than the plant map. That is a lot of
interface for attachments, and it is worth knowing why before rebuilding it.

**`sevice/angular/` is a 30,919-line catch-all** that mixes every domain. There is no clean
per-feature backend measurement because the packaging does not permit one.

**Sync costs more than any feature.** 24,739 lines of backend, against 2,208 of interface.

---

## What is missing, and how to get it

**Usage data.** The inventory says what exists, not what is used. That is the decisive input
and it is one query per entity against production:

```sql
SELECT COUNT(*) AS rows,
       MAX(date_modified) AS last_touched
FROM <table>;
```

Anything with few rows, or nothing touched in a year, is a candidate to drop regardless of
how much code it has. **The best outcome of this exercise is a shorter list, not a better
understood long one.**

Run it against a **copy** of `db/proddb.mv.db`, not the live file.

---

## Next

1. Fill in **Keep?** — this is the decision that determines the size of the rebuild.
2. Get usage numbers for anything you are unsure about.
3. For CORE features only, in migration order: write the workflow, then the invariants, then
   build.

Everything not marked CORE needs no workflow document and no invariants until its turn comes,
and some will never have a turn.
