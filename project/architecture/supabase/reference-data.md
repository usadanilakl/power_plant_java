# PWA reference data — publish target (GitHub Pages ↔ Supabase)

The PWA needs several read-only datasets available offline. They used to be published as **public
static JSON on GitHub Pages** — but the hub gates the same data behind `ROLE_PLANT`, so the public copy
was a data exposure (~12k LOTO points readable by anyone). The publish pipeline can now target
**auth-gated Supabase** instead, selected by a flag. The hub stays the primary provider.

## The flag

`pwa.data-target` (in `application.properties`):

| value | behavior |
|-------|----------|
| **`supabase`** (default) | write datasets to the Supabase `reference_snapshot` table (auth-gated, secure) |
| `github-pages` | legacy: write the local `public/data` mirror + push to the GitHub Pages repo |
| `both` | write to both (transition/rollback safety net) |

## Write side — one publisher, pluggable sinks

`WorkAreaGitHubPublisher` builds each dataset's JSON once (its `build*Json` methods) and hands it to
every **active** `PwaDataSink`. The debounce/coalesce state machine, the `@Async` entry points, the
`POST /ng/admin/pwa-sync?target=…` admin control, and the on-entity-change triggers in the
`Ng*Service` write methods are all **unchanged** — only the transport is pluggable.

- `PwaDataSink` — interface (`publishText`, `publishBinary`, `isActive`, `name`).
- `GitHubPagesSink` — local `public/data` mirror + GitHub push (the old behavior). Active for
  `github-pages` / `both`.
- `SupabasePwaDataSink` — upserts `reference_snapshot(key, payload, content_hash, updated_at)` via the
  service-role client; per-key content-hash skip; the map image is stored base64. Active for
  `supabase` / `both` (and only when Supabase is configured).

**Datasets (9):** `work_areas`, `work_area_shapes`, `work_categories`, `field_list_types`,
`inventory_types`, `locations`, `loto_points`, `sds_chemicals`, `work_area_map` (binary).

> The standalone scheduled `SupabaseReferenceDataMirror` was **removed** — this publisher-sink (event-
> driven, all 9 datasets) supersedes it.

## Read side — PWA failover chain

Per dataset: **hub (primary) → Supabase `reference_snapshot` → static JSON → localStorage**. The
Supabase read (`SupabaseDataService.getSnapshot(key)`) requires a Supabase session, which the PWA holds
exactly when it needs the failover (a fresh login while the hub is down authenticates via Supabase).

All 8 JSON datasets are wired to the Supabase failover and their static files are emptied to `[]`:

- **`loto_points`, `work_areas`, `locations`** — `equipment-data.service.ts`.
- **`work_categories`** — `work-request-form.component.ts` (also keeps an in-code default category list
  so an offline cold-start with no cache and no Supabase session still populates the dropdown).
- **`field_list_types`** — `field-list.component.ts` (has an in-code default).
- **`inventory_types`** — `inventory.component.ts` (has an in-code default).
- **`work_area_shapes` + `work_areas`** — `work-area-map-select.component.ts`.
- **`sds_chemicals`** — `sds.component.ts` (new `loadFromSupabase` tier before the static JSON).

The wiring uses `SupabaseDataService.snapshotOrElse(key, useData, fallback)` — try the Supabase
snapshot, else run the component's existing static-JSON/localStorage fallback.

- **Deferred:** `work_area_map` (the binary map image, still read from `data/work-area-map-image.jpg` on
  GitHub Pages). It's an image, not tabular plant data — less sensitive; move to Supabase Storage later.
- **Out of scope:** `default-instruments.json` is a separate static seed the publisher does not manage.

## RLS

`reference_snapshot` reads are restricted to **approved** users:
`(auth.jwt() -> 'user_metadata' ->> 'is_active') = 'true'`. Not public; unapproved self-signups are
denied. The hub writes with the service role (bypasses RLS).

## Deploy / cutover

1. `manage.sh push` (applies the `reference_data` migration — already done for project xvrtgccxtsjjwznqkznv).
2. Keep `pwa.data-target=supabase` (default). Restart the hub.
3. **Populate the snapshots once:** hit `POST /ng/admin/pwa-sync?target=all` (Admin → sync-to-PWA), or
   just save any tracked entity — the on-change trigger publishes. (After this, ongoing entity changes
   keep Supabase current automatically.)
4. **Rebuild + redeploy the PWA** so the emptied static files replace the real data on GitHub Pages —
   this is what actually closes the public exposure for the wired datasets.

## Rollback

Set `pwa.data-target=both` (writes GitHub too) or `github-pages` (old behavior). The `GitHubPagesSink`
and `git.token`/`pwa.github.repo` config are retained specifically for this.
