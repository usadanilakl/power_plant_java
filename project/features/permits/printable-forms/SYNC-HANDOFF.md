# Hand-off: `PrintableForm.formContainers` membership does not sync on UPDATE

**Status:** investigated and reproduced, not fixed. Needs a decision + implementation by someone
who owns the sync layer.

**Scope:** one field — `PrintableForm.formContainers`. Nothing else in this document needs changing.

---

## 1. Problem in one paragraph

`PrintableForm` owns its containers through a **unidirectional** `@OneToMany` + `@JoinColumn`
(`entities/forms/PrintableForm.java:21-23`). Adding or removing a container writes only the *child*
row (`UPDATE form_container SET printable_form_id = ?`); the parent row is never dirtied, so
Hibernate never fires `@PreUpdate`/`@PostUpdate` on `PrintableForm` and **no FieldChange is emitted
for the membership change**. The container itself does emit a CREATE, but `printable_form_id` has
no Java field on `FormContainer`, so the FK cannot ride along in the child's own change. Net effect:
the container row arrives on every peer **unlinked**. Separately, when the collection *does* sync
(on CREATE), the apply path is destructive and can drop a concurrent peer's containers.

---

## 2. Verified facts

Each of these was confirmed by reading current `HEAD`, not inferred.

| # | Fact | Evidence |
|---|---|---|
| F1 | `formContainers` is a unidirectional `@OneToMany` with `@JoinColumn(name="printable_form_id")`, `cascade=ALL`, `orphanRemoval=true`, and (as of this work) `fetch=EAGER`. | `entities/forms/PrintableForm.java:21-23` |
| F2 | `FormContainer` has **no** Java field for `printable_form_id`. It is reachable only via native SQL. | `entities/forms/FormContainer.java` (whole file) |
| F3 | **CREATE emits correctly.** `shouldTrack` skips `@OneToMany` only when `mappedBy` is set; `formContainers` has no `mappedBy`, so a newly persisted form emits its full container ID list. | `sevice/sync/FieldChangeTracker.java:144-150`, `:230-263` |
| F4 | **UPDATE does not emit.** `@PreUpdate` only runs when Hibernate flushes an UPDATE for the entity's own row. A child-FK-only change does not dirty the parent, so no original state is captured and `@PostUpdate` is never reached. | `sevice/sync/FieldChangeEntityListener.java:59-64`, `:99-110` |
| F5 | The state-capture layer *does* know how to snapshot this kind of collection — it queries the child table's FK column. It is simply never invoked for this case (see F4). | `sevice/sync/EntityStateCapture.java:162-196` |
| F6 | **Apply is destructive.** `applyUnidirectionalOneToManyChange` NULLs every child FK for the parent, then re-points only the IDs in the payload. | `sevice/sync/FieldSyncService.java:1690-1710` |
| F7 | The additive-only guard exists but covers only `JobLog.packages` and `DailyPermitPackage.{workRequests,safeWorks,hotWorks,confinedSpaces,lotos,energizedWorkPermits,excavationPermits,ventingPermits}`. `PrintableForm.formContainers` is **not** in it. | `sevice/sync/FieldSyncService.java:1731-1749` |
| F8 | Both entity types are fully registered for sync. | `sevice/sync/EntityTableRegistry.java:128-129,241-242`; `FullSyncToServerService.java:201-202`; `ClientDataExportService.java:53,619-620` |
| F9 | Sync core is unchanged by the two most recent commits. Latest commit touching `sevice/sync/` is `4ef7378c8`. | `git log -- src/main/java/com/dk_power/power_plant_java/sevice/sync/` |

### Observed damage (this machine, before repair)

`db/proddb`, queried read-only:

```
FORM_CONTAINER: 1881 rows total, 1211 linked, 670 with printable_form_id IS NULL

  device 1: 1102 rows, 490 orphaned
  device 2:  599 rows,   0 orphaned
  device 3:  180 rows, 180 orphaned   <- entire ExcavationPermit seed, parent never arrived here
```

The orphan set is **per node** — that is why the repair added in this work is deliberately
local-only. Those 670 have since been soft-deleted via Admin → Forms → Form Maintenance.

---

## 3. What is NOT broken — do not chase these

- **Seeding.** CREATE emits the full membership list (F3). Newly seeded forms propagate correctly.
- **Registration.** Both types are in every registry (F8).
- **The repair tooling.** `sevice/forms/PrintableFormMaintenanceService` + three
  `/ng/forms/maintenance/*` endpoints already exist for diagnose / repair-orphans (local-only) /
  fix-duplicate-primaries (broadcasts). Re-use, don't rebuild.
- **Duplicate primaries.** Fixed, and the seeder now routes through `PrintableFormService.save()`
  so re-seeding cannot recreate them.
- **Lazy-init 500s.** Fixed by `fetch=EAGER` on `formContainers`. The app runs with
  `spring.jpa.open-in-view=false` (`application.properties:115`, `application-hub.properties:67`) —
  **any** entity returned from a controller with a LAZY collection will 500 in the Jackson
  converter. Keep that in mind for whichever option is chosen.

---

## 4. Options

### Option A — targeted (smaller blast radius)

1. Add `PrintableForm.formContainers` to `isProtectedAggregateMembershipField`
   (`FieldSyncService.java:1731`) so the apply path stops NULL-ing all children.
2. Dirty the parent whenever membership changes, so `@PreUpdate` fires and the collection is
   captured. Call sites: `PrintableFormRestController` `/add/{containerId}/to/{formId}` and
   `/add-all/{id}`, plus `FormContainerService` removal paths.

**Pros:** ~10 lines; mirrors the mechanism already in place for `JobLog`/`DailyPermitPackage`;
easily reverted.
**Cons:** additive-only means a *removal* never propagates as a membership change. In practice a
removed container also emits its own DELETE, so the stale FK points at a soft-deleted row — verify
that is acceptable. Also relies on manually dirtying the parent at every call site, which is easy
to forget in future code.

### Option B — proper (owning side moves to the child)

```java
// FormContainer
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "printable_form_id")
@JsonIgnore                      // required: parent serializes children, would recurse
private PrintableForm printableForm;

// PrintableForm
@OneToMany(mappedBy = "printableForm", cascade = CascadeType.ALL,
           orphanRemoval = true, fetch = FetchType.EAGER)
private Set<FormContainer> formContainers = new HashSet<>();
```

**Pros:** `printable_form_id` becomes a real field, captured in the container's own CREATE/UPDATE
FieldChanges. Membership syncs per-container and additively; the destructive collection rewrite
stops applying to this entity entirely (F3's `mappedBy` skip now excludes the parent collection).
Fixes both the emission gap and the concurrent-edit clobber at the source.
**Cons:** model change on a CRDT-synced entity. The DB column already exists so there is no
migration, but every add/remove call site must set both sides, and Jackson needs the back-reference
suppressed. Also confirm `FieldSyncService`'s ManyToOne apply path handles a parent that has not
arrived yet (there is an existing "failed ManyToOne retry" pass — check it covers this).

### Option C — defer

CREATE already works, so form seeding is unaffected. Cost of deferring: any designer edit on any
node keeps orphaning containers on peers, and Admin → Forms → repair-orphans has to be re-run per
machine afterwards.

**Recommendation from the investigation:** Option A, on risk-adjusted grounds — it reuses an
established pattern and is trivially revertible. Option B is architecturally correct and is the
right answer if you are willing to spend the verification effort on a synced entity.

---

## 5. Landmines specific to this codebase

- **Native SQL bypasses sync emission.** Any fix must mutate through JPA so
  `FieldChangeEntityListener` fires.
- **`SyncContext.executeInSyncContext(Runnable)`** suppresses emission — correct for local-only
  repair, wrong for anything that must propagate.
- **IDs are device-prefixed** (`device * 1_000_000_000 + seq`), which is how the per-device orphan
  breakdown above was derived. Useful for diagnostics.
- **`@Where` on `@MappedSuperclass` is not inherited.** `PrintableForm`/`FormContainer` do not
  redeclare it, so `findAll()` returns soft-deleted rows. Filter explicitly.
- **`orphanRemoval = true`** on the parent collection: posting a stale container list to
  `/ng/forms/save` will hard-delete the missing ones. Relevant to any change in how the collection
  is populated.
- This is the same class of defect as the known **M2M LWW-snapshot race** (full post-mutation ID
  set sent, DELETE-all-then-INSERT on apply, no delta). If a general `{added, removed}` wire delta
  is ever built, it subsumes both.

---

## 6. Acceptance criteria

1. On node A, add a container to an existing form in the designer. On node B, the container appears
   **linked to the same form** — `printable_form_id` is set, not NULL.
2. On node A, remove a container. Node B reflects the removal (or, under Option A, the container is
   soft-deleted and the stale FK is demonstrably harmless).
3. Nodes A and B each add a container to the same form concurrently. After sync, **both** containers
   are present and linked on both nodes. This is the case that currently fails.
4. `GET /ng/forms/maintenance/diagnose` reports `orphanedContainers: 0` on every node after the
   above, with no manual repair.
5. Seeding a form still works and still propagates (regression check on the CREATE path).
6. No `LazyInitializationException` from any `/ng/forms/**` endpoint (`open-in-view=false`).
