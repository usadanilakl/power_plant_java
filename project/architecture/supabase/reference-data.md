# Reference-data failover (LOTO points / work areas / locations)

The PWA needs a few read-only datasets available offline. They used to be shipped as **static JSON in
the PWA bundle** and served **publicly on GitHub Pages** — but the hub gates the same data behind
`ROLE_PLANT`, so the public copy was a data exposure (~12k LOTO points readable by anyone). This moves
the failover to **auth-gated Supabase**, keeping the hub as the primary provider.

## Priority chain (per dataset)

```
1. Hub  (primary)   GET /api/pwa/field-list-item/loto-points | /locations, /api/pwa/work-request/work-areas
2. Supabase (failover, auth-gated)   reference_snapshot table, read with the user's Supabase session
3. localStorage (last resort)        whatever the device cached from a previous hub/Supabase load
4. static /data/*.json               now EMPTY stubs — real data no longer ships publicly
```

`equipment-data.service.ts` implements this: on a hub error it calls `SupabaseDataService.getSnapshot(key)`,
then falls through to the (now-empty) static JSON → localStorage.

## Why the chain still works after removing the public data

The only case that needs the Supabase failover is a **fresh login while the hub is down** — and that
login authenticates via the Supabase fallback, so the PWA holds a Supabase session and can read
`reference_snapshot`. A device that loaded data while the hub was up already has it in **localStorage**.
So no realistic case loses data; only the public exposure is removed. (Total outage — hub down, Supabase
down, empty cache — has no data, which is acceptable.)

## Server side (hub)

- **`PwaReferenceDataService`** — the single source of truth for the three datasets. Both the live PWA
  controllers and the mirror call it, so the failover payload is byte-identical to the live response.
- **`SupabaseReferenceDataMirror`** — `@Scheduled` (every 10 min), hub/dev only (skips prod desktops).
  Serializes each dataset, hashes it, and upserts to `reference_snapshot` only when it changed
  (`SupabaseAdminClient.upsertReferenceSnapshot`, service-role write). Toggle:
  `supabase.reference-mirror-enabled` (default true).

## Supabase side

- Migration `20260726000000_reference_data.sql`: `reference_snapshot(key, payload jsonb, content_hash,
  updated_at)`, RLS **enabled**.
- Read policy: `authenticated` **and** `(auth.jwt() -> 'user_metadata' ->> 'is_active') = 'true'` — i.e.
  approved users only (is_active is mirrored into the Supabase JWT). Not public; unapproved self-signups
  are denied. The service role (hub) bypasses RLS to write.

## Deploy / cutover

1. `manage.sh push` (applies the reference_data migration).
2. Restart the hub — the mirror populates `reference_snapshot` within ~10 min (or immediately on the
   first cycle).
3. **Rebuild + redeploy the PWA** so the empty static stubs replace the real data on GitHub Pages —
   this is the step that actually closes the public exposure. Until redeployed, the old public JSON
   remains live on Pages.

## Extending

Other bundled static datasets (`field-list-types`, `inventory-types`, `work-categories`,
`work-area-shapes`) can follow the same pattern (add a producer to `PwaReferenceDataService`, a key to
the mirror, and a `getSnapshot` call in the relevant service) if they also need to leave the public bundle.
