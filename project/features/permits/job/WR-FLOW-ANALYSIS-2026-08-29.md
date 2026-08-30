# Work Request processing flow — analysis, 2026-08-29

Traced end to end, then two changes made. Findings first, because two of the three things asked for
turned out to already exist and one of those was silently broken.

## The flow as it actually runs

1. Contractor submits a WR from the PWA. Hazards travel as one `DeclaredHazards` envelope
   (`SwHazards` + `HotWorkMeasures` + `ConfinedSpaceHazards` + `HotWorkProfile`) so the declaration
   survives the Power Automate fallback path when the hub is unreachable.
2. `WorkRequestExpiryService` auto-expires overdue OPEN requests. **Jobs and packages have no
   equivalent** — this is why they accumulate.
3. Operator opens `process-wr-dialog` (reachable from the WR list state service, the WR context
   menu, the WR detail dialog, and the package service).
4. The dialog answers "new job or existing?" with two independent signals, then the operator picks.
5. Chosen job → `processWorkRequest(jobId, wrId)` creates a package on it; "new" →
   `createFromWorkRequest`.
6. In the package builder the operator adds SW/HW/CS. Hazard blocks are seeded from the work area's
   constants plus every WR on the package. LOTOs are attached to the **package**.
7. Package feeds the Red Tag automation.

## 1. Open job suggestion — already built, no change made

Two layers, both live:

- **`suggestedJobLogId`** — exact grouping key (company + work area + work category), bounded by the
  job's start..end window or `permits.job.grouping-window-days` from its start. Explicitly
  advisory: nothing attaches or changes status.
- **`GET /ng/job-logs/find-matching/{wrId}`** — scored sweep of all open jobs. Company 40 (25
  partial), work area 30, category 20, location 15 (8 partial), work date inside the job range 15.
  Rendered as "Other open jobs that look related" with the score and a chip per match reason.

Plus an already-processed guard, and `merge-into` / `move-package` to repair duplicates after the
fact. Nothing needed here.

## 2. Job ↔ LOTO — the page existed and was structurally always empty

`/loto-usage` is in the nav and `getLotoUsageMonitor()` computes exactly the right thing:
`associatedJobs`, `foremen`, `jobCount`, `hasNoJobs`. The component even styles orphan rows and
prints "No jobs".

It read `JobLog.lotos` (`job_log_lotos`) — a table with **no writer anywhere in the codebase**:
`attachLoto`/`detachLoto` have zero callers, `JobLogDto` carries no lotos field, `JobLogMapper`
never maps one. So every active LOTO reported zero jobs, no foremen, `hasNoJobs = true`.

That fails in the dangerous direction. The screen exists to tell an operator whether a LOTO can be
cleared, and it was saying "nothing needs this" about every LOTO on the plant.

**Fix: derive the association from the job's packages** (`daily_permit_package_lotos`, which the
package builder does populate) instead of adding a writer for the unused table. A job owns its
packages, so the link is already implied — deriving it means no schema change, no new sync surface,
and no second source of truth that can drift out of step. `job_log_lotos` is simply no longer read.

## 3. Job & package management — did not exist, now added

`closeJob` existed but **refuses while any package is open**, which meant the stale jobs worth
clearing were precisely the ones that could not be cleared. Package close existed, single only. No
bulk anything, no selection in the job table.

### Staleness rules (deliberately different)

| | rule | why |
|---|---|---|
| **Package** | open more than **14h** from the start of its own work window | a package authorises one 12h shift; past that it was abandoned, not extended |
| **Job** | **no activity for N days** (default 30) on the job or any of its packages | jobs legitimately run for weeks, so elapsed time says nothing |

A package with no parseable date falls back to its creation time, so undated rows still age —
otherwise the ones most likely to be abandoned would be invisible to the sweep.

### Cascade

Closing a stale job closes its open packages first, because `closeJob` would otherwise refuse. The
cascade reaches packages that are **not** individually stale, so the dry run lists them per job.
Cascaded packages are excluded from the standalone stale-package list so the totals do not
double-count.

### Close semantics

`NgDailyPermitPackageService.adminForceClose` is new and reuses the existing close path, so status
still cascades to child permits, personnel are signed off, a `PackageModification` entry is written
and the change is emitted for sync.

Two deliberate differences from the operator-facing close:

- It accepts **Building** as well as Active/Test. `closePackage` refuses anything else because an
  operator closing a package asserts the work finished; stale packages are frequently still in
  Building — started, never activated, abandoned — and that guard made them unclearable.
- It does **not** set `workCompleted`. Nobody knows whether the work happened. This also stops
  `updateParentJobStatus` from auto-closing the job behind the sweep's back (it only auto-closes
  when every package is closed *and* `workCompleted`), so the job is closed explicitly with its own
  audit trail. The reason string is appended to `closureComments` on every row.

A row that fails is reported and the sweep continues; one bad package must not strand the rest. If
a cascade fails, its job is left open rather than reported as closed.

### Surface

- `GET  /ng/job-logs/maintenance/stale?inactiveDays=30&packageHours=14` — read-only scan
- `POST /ng/job-logs/maintenance/close-stale?...&dryRun=false&reason=...` — dry run by default
- Admin → **Jobs & Packages** tab, same dry-run/apply shape as the form and sync maintenance tools

**Gated `hasRole("ADMIN")` by path rule in `SecurityConfigSpring`, not `@PreAuthorize`** — method
security is not enabled in this application (`@EnableMethodSecurity` appears nowhere), so a
`@PreAuthorize` would have been silently ignored and the endpoint left open to any signed-in user.
The rule sits with the other `/ng/**` admin rules and must precede any broader `/ng/job-logs`
matcher, since the first match wins.

## Not done

- No scheduled auto-close. An operator losing live work to a background job is far worse than a
  stale row surviving another day, so this stays a manual, previewed action.
- `job_log_lotos` is left in place, just unread. Dropping it is a schema change with sync
  implications and buys nothing.

## Fix — "Transaction silently rolled back because it has been marked as rollback-only"

First apply from Admin failed with that message and saved nothing. The cause was in the sweep, not
in the data.

`JobPackageMaintenanceService`, `NgDailyPermitPackageService` and `NgJobLogService` are all
`@Transactional`, so `closeStale` opened a transaction and every `adminForceClose` /
`closeJob` call **joined it** rather than getting its own. Spring marks a transaction rollback-only
as soon as a `@Transactional` method throws inside it. The sweep caught that exception, recorded a
failure and carried on closing the remaining rows — all of them writing into a transaction that was
already doomed. At commit Spring raised `UnexpectedRollbackException`, and everything the sweep
appeared to close was discarded.

So the "keep going and report failures" design was precisely what produced the error: without
isolation, continuing after a failure is exactly the thing that cannot work.

69. **Each close runs in its own transaction.** `adminForceClose` and the new
    `NgJobLogService.closeJobIsolated` are annotated `REQUIRES_NEW`, so a failing row rolls back
    alone and the sweep's own transaction is never marked. Ordering still works: a job's packages
    are closed and committed before `closeJobIsolated` re-reads the job, so the "packages still
    open" guard sees them closed.
70. **Spelt `@Transactional(Transactional.TxType.REQUIRES_NEW)`.** These classes import
    `jakarta.transaction.Transactional`, not Spring's, so `propagation = Propagation.REQUIRES_NEW`
    does not compile here. Worth remembering — the two annotations share a simple name and the
    codebase uses both.
71. **Failures now report the exception type and root cause**, not just `getMessage()`. Every row
    previously came back saying "Transaction silently rolled back", which names the symptom and
    hides the throw that caused it.

### Still possible, and now visible

Isolation stops one bad row poisoning the sweep; it does not stop that row failing. Two known
candidates, both of which will now surface per row with their real exception type:

- `updateParentJobStatus` (runs on every package status change) catches and swallows after
  `jobLogRepo.save`. Swallowing does not undo a rollback-only mark — it just defers the failure to
  commit. Left alone deliberately: isolating it in its own transaction would commit a job-status
  change that a later package rollback could contradict, which is a trade-off worth deciding
  separately rather than in passing.
- `ngValueService.createValue("Job Status", "Closed")` goes through the shared Category/Value
  path, which has an open dedup defect in production.

## Fix — sweep saw 5 of 159 open packages

The dry run reported 5 stale packages while the dashboard showed 154 more in Building. The sweep
was not mis-scoring them; it never loaded them.

72. **`x.status.name` in a JPQL WHERE clause is an IMPLICIT INNER JOIN.** Every row whose status FK
    is NULL is dropped before the `IS NULL` branch is evaluated, so
    `WHERE p.packageStatus IS NULL OR p.packageStatus.name <> 'Closed'` cannot ever return a
    null-status row — the `IS NULL` half is dead code.

    A null status is not an edge case here. It is this codebase's own encoding of **Building**:
    `NgDailyPermitPackageService` reads `packageStatus == null` as `"Building"` in four places, and
    Building is the state of the overwhelming majority of open packages. So the query returned only
    the handful that had ever been given an explicit status.

    Fixed with an explicit `LEFT JOIN` in all three affected queries:
    - `DailyPermitPackageRepo.findAllOpenPackages` — the sweep
    - `JobLogRepo.findAllOpenJobs` — the sweep, **and** the LOTO usage monitor, **and** the scored
      job matcher behind the WR process dialog
    - `JobLogRepo.findOpenJobsByGroupingKey` — the suggested-job grouping key

    The last two mean the job suggestion and the LOTO usage screen have both been silently ignoring
    every job without an explicit status. Neither would have looked broken; they would just have
    offered fewer matches than they should.

73. **Package dates are not stored in one shape.** Most are `MM/dd/yyyy`, some a plain ISO date, and
    some a full ISO instant (`2025-10-19T00:00:00.000Z`) from a date picker. The parser handled the
    first two; the third fell through to the creation-time fallback and reported the wrong
    "hours open". All three now parse.

74. **The admin tab uses the theme tokens** (`--card-background`, `--primary-text`,
    `--border-color`, …) from `theme-styles.css` rather than fixed light colours, so it follows the
    dark theme. Note the other admin tabs still hardcode light values and will look wrong in dark
    mode — worth a follow-up pass, not done here.

### Scale note

With the join fixed the first sweep will offer well over a hundred packages, some more than a year
old. Each close runs in its own transaction and commits independently, so a request that times out
mid-sweep leaves the rows it already closed closed — it just loses the summary. Re-running is safe
and picks up where it left off.

## Fix — five packages refused with "Cannot change status from 'Open' to 'Closed'"

The sweep closed most rows and reported five failures, all from `changeStatus`'s allowed-from
guard.

75. **The allowed-from set is now the package's own current status, not a hardcoded list.**
    `adminForceClose` passed `Set.of("Building", "Active", "Test")`. The five stragglers were in
    **"Open"** — a status `NgDailyPermitPackageService` does not mention anywhere (its vocabulary is
    Building / Active / Test / Closed / Processed) but which exists in the data, presumably
    predating the current set.

    Enumerating states was the wrong shape: any status nobody thought to list breaks the
    force-close the same way, and there is no way to know them all from the code. "Close it from
    whatever state it is in" is the actual rule, so the guard now rejects only *already Closed* —
    and returns quietly in that case, which also makes re-running the sweep idempotent instead of
    reporting spurious failures for rows it closed on a previous pass.

## Fix — the sweep prevented itself from ever finding an idle job

Not reported, found while checking the above. `lastActivity` used `dateModified` on the job and its
packages. Closing a package writes the package, and `updateParentJobStatus` then writes the job —
so **the sweep's own writes reset the idle clock on every job it touched**, and after the first run
no job could go stale again for another full window. Inbound CRDT sync stamps the same column for
any field arriving from another node, which is a second source of meaningless churn.

76. **Job idleness is measured from the newest package WORK WINDOW**, not from row timestamps.
    That value is operator-entered and is not rewritten by status cascades or by sync, so it
    actually tracks whether work is being scheduled. Jobs with no packages fall back to the job's
    creation time.
