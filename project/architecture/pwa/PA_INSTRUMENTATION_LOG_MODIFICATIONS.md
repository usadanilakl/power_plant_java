# Power Automate Flow Modifications - Instrumentation

This document defines required Power Automate changes for instrumentation so the server can:
- do a full SharePoint pull at most once every 24 hours,
- run lightweight change checks between pulls,
- keep instrument log + instrument master actions working as-is.

## Required Action Types

Configure the flow to support these `actionType` values:

| actionType | Purpose |
|---|---|
| `addInstrumentationLog` | Create instrumentation log item, add attachments, upsert instrument master row |
| `getAllInstruments` | Return full instrument list (PWA compatibility) |
| `addInstrument` | Create new instrument (PWA compatibility) |
| `getAll` | Return full instrument list (server adapter compatibility) |
| `create` | Create new instrument (server adapter compatibility) |
| `update` | Update existing instrument by `id` |
| `upsertByTagNumber` | Update/create instrument by `Tag_x0020_Number` |
| `getState` | Return lightweight probe state: `itemCount` + `lastModified` |

`getAllInstruments` and `getAll` should return the same shape.
`addInstrument` and `create` should perform the same create behavior.

## Trigger Contract

Trigger body must accept:
- `actionType: string` (required)
- `id: string` (for update paths)
- `localUuid: string`
- `instrumentationLog: object`
- `attachments: array`
- `data: object`

`data` should support:
- `Tag_x0020_Number`
- `Description`
- `Vendor`
- `Location`
- `Type`
- `CurrentStatus`
- `LastUpdatedDate`
- `LastUpdatedTime`
- `LastUpdatedBy`
- `LastComment`
- `PwaId`
- `mergePolicy` (`none` | `merge` | `skip`)

## Switch Cases

## Case: `getState`

Goal: cheap probe, no full list transfer.

1. SharePoint `Get items` on `Instrumentation`:
- Order by `Modified desc`
- Top count `1`
- Select only `ID,Modified`

2. SharePoint list metadata read for `ItemCount`:
- any method is acceptable (SharePoint connector, REST, or cached value),
- must return total current item count for the list.

3. Build response:
- `itemCount`: total count (integer)
- `lastModified`: newest Modified value in ISO-8601 UTC or `null` if empty list

Response body:
```json
{
  "success": true,
  "data": [
    {
      "itemCount": 1234,
      "lastModified": "2026-03-09T14:22:31Z"
    }
  ]
}
```

## Case: `getAllInstruments` and `getAll`

Return all rows from `Instrumentation` list with fields:
- `ID`, `Tag_x0020_Number`, `Description`, `Vendor`, `Location`, `Type`,
- `CurrentStatus`, `LastUpdatedDate`, `LastUpdatedTime`, `LastUpdatedBy`, `LastComment`,
- `PwaId`, `Modified`.

Response item mapping:
```json
{
  "ID": "15",
  "Tag_x0020_Number": "PT-101",
  "Description": "Pressure Transmitter",
  "Vendor": "ABB",
  "Location": "Turbine Hall",
  "Type": "Transmitter",
  "CurrentStatus": "Normal Operation",
  "LastUpdatedDate": "2026-03-09",
  "LastUpdatedTime": "09:15",
  "LastUpdatedBy": "Operator A",
  "LastComment": "OK",
  "PwaId": "uuid-value",
  "Modified": "2026-03-09T14:22:31Z"
}
```

Response envelope:
```json
{
  "success": true,
  "data": [ ...items... ]
}
```

## Case: `addInstrument` and `create`

Create in `Instrumentation` using `data.*` fields.

Conflict behavior by tag number (`Tag_x0020_Number`):
- `mergePolicy=merge`: update existing item with non-empty incoming fields; keep existing value when incoming is blank.
- `mergePolicy=skip`: do not change existing item, return success with message indicating skipped.
- `mergePolicy=none` (or omitted): return a merge-required style response for duplicate tags.

Response body:
```json
{
  "success": true,
  "id": "123"
}
```

## Case: `update`

Update `Instrumentation` item by `id` using `data.*` fields.

Response body:
```json
{
  "success": true
}
```

## Case: `upsertByTagNumber`

Find by `Tag_x0020_Number`:
- if found, update it,
- if not found, create it.

When updating existing row, apply merge semantics:
- non-empty incoming fields overwrite,
- empty incoming fields do not clear existing fields.

Response body:
```json
{
  "success": true
}
```

## Case: `addInstrumentationLog`

Keep existing behavior:
1. Create item in `Instrumentation Log`,
2. Add attachments,
3. Upsert instrument status fields in `Instrumentation`.

## Default Case

Return:
```json
{
  "success": false,
  "message": "Unknown actionType"
}
```

HTTP status: `400`.

## Server Behavior This Enables

With the `getState` case added, server logic is:
1. Full pull from SharePoint at least once every 24 hours.
2. Inside 24 hours, call `getState`.
3. If `itemCount` or `lastModified` changed, run full pull.
4. If unchanged, serve H2 cache.

This reduces SharePoint load while keeping data freshness predictable.

## Bulk Upload Policy (Server API)

Backend bulk endpoint supports:
- `onConflict=merge` (default): merge with existing same-tag rows.
- `onConflict=skip`: skip same-tag rows.

Result payload now includes `skipped` count in addition to `created`, `updated`, and `failed`.
