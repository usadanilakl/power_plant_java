# Power Automate Flow Modifications - Instrumentation (Revised)

## Current State Snapshot

- `SUBMIT NEW LOG THROUGH SERVER`: works.
- `SUBMIT NEW INSTRUMENT THROUGH SERVER`: works.
- `SUBMIT NEW LOG THROUGH PWA -> PA -> SP`: log row is created, but instrumentation master list is not updated consistently.
- Missing in current PA flow:
  - branch for new instrument creation from unified naming (`createNewInst`)
  - branch for full instrument fetch (`getAllInst`)

## Naming Standard (Required)

All instrumentation-related action cases must use `inst...` prefix.

## Canonical Action Types

| actionType | Purpose |
|---|---|
| `instAddLog` | Create instrumentation log row, add attachments, then upsert instrumentation master |
| `instGetAll` | Return full instrumentation master list |
| `instCreateNew` | Create new instrumentation master row |
| `instUpdateById` | Update instrumentation master row by SharePoint ID |
| `instUpsertByTag` | Upsert instrumentation master row by tag number |
| `instGetState` | Lightweight probe (`itemCount`, `lastModified`) for 24h server pull strategy |

## Backward Compatibility Aliases

Map existing action names to canonical names inside the flow `Switch` entry step:

| Legacy actionType | Canonical actionType |
|---|---|
| `addInstrumentationLog` | `instAddLog` |
| `getAllInstruments` | `instGetAll` |
| `getAll` | `instGetAll` |
| `addInstrument` | `instCreateNew` |
| `create` | `instCreateNew` |
| `update` | `instUpdateById` |
| `upsertByTagNumber` | `instUpsertByTag` |
| `getState` | `instGetState` |

This lets current clients continue working while you migrate to canonical names.

## Trigger Contract

Trigger body should support:

- `actionType: string` (required)
- `id: string` (for `instUpdateById`)
- `localUuid: string`
- `instrumentationLog: object`
- `attachments: array`
- `data: object`

`data` fields for instrumentation master:

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

For log submission (`instAddLog` / `addInstrumentationLog`) include:

- `instrumentTagNumber`
- optional `instrumentSharepointId` (when known)
- optional `instrumentId` (resolved in-flow before log create)

## Switch Cases to Implement / Verify

## Case: `instGetState`

Goal: cheap probe without full list transfer.

1. Get newest `Modified` from `Instrumentation` (`Top 1`, order desc).
2. Get `ItemCount` for `Instrumentation`.
3. Return:

```json
{
  "success": true,
  "data": [
    { "itemCount": 1234, "lastModified": "2026-03-09T14:22:31Z" }
  ]
}
```

## Case: `instGetAll`

Return full `Instrumentation` list with:

- `ID`, `Tag_x0020_Number`, `Description`, `Vendor`, `Location`, `Type`,
- `CurrentStatus`, `LastUpdatedDate`, `LastUpdatedTime`, `LastUpdatedBy`, `LastComment`,
- `PwaId`, `Modified`

Envelope:

```json
{ "success": true, "data": [ ...items... ] }
```

## Case: `instCreateNew`

Create instrumentation master row from `data.*`.

Duplicate tag conflict behavior:

- `mergePolicy=merge`: update existing with non-empty incoming fields.
- `mergePolicy=skip`: no update, return success+message skipped.
- `mergePolicy=none` or missing: return merge-required style response.

Return:

```json
{ "success": true, "id": "123" }
```

## Case: `instUpdateById`

Update instrumentation master by `id` using `data.*`.

Return:

```json
{ "success": true }
```

## Case: `instUpsertByTag`

Find by `Tag_x0020_Number`:

- found -> update (merge semantics)
- not found -> create

Return:

```json
{ "success": true }
```

## Case: `instAddLog` (Critical)

Flow must do all 3 steps in this order:

1. Create item in `Instrumentation Log`.
2. Add attachments (guarded by array-safe condition).
3. Upsert `Instrumentation` master row using log payload (`tag`, `status`, date/time/user/comment).

This is the missing behavior seen in testing: log creation works, instrumentation master is not always updated.

Required relationship behavior:

- Resolve instrumentation master row by `Tag_x0020_Number`.
- If missing, create it.
- When creating log row, set `instrumentId` (lookup/reference to instrumentation row ID).
- Keep `Tag Number` in log row as denormalized text (do not remove).

## Attachment Condition (PA runtime-safe)

Use expression:

```text
@greater(length(coalesce(triggerBody()?['attachments'], createArray())), 0)
```

## Default Case

Return:

```json
{ "success": false, "message": "Unknown actionType" }
```

HTTP status `400`.

## Server Sync Behavior Dependency

Server assumes `instGetState` + `instGetAll` behavior for 24h cached pull:

1. Full pull at least once every 24h.
2. Inside 24h, call probe action.
3. If `itemCount` or `lastModified` changed, run full pull.
4. Else serve H2 cache.

## Implementation Checklist

1. Add/rename action switch cases to canonical `inst...` names.
2. Add alias normalization for legacy action names.
3. Implement `instGetAll` branch.
4. Implement `instCreateNew` branch.
5. Fix `instAddLog` to always upsert instrumentation master.
6. Update attachment condition to array-safe expression.
7. Validate with 3 tests:
   - server submit log -> SP log + SP instrumentation update
   - PWA->PA log submit -> SP log + SP instrumentation update
   - getAll call returns full instrumentation list in expected shape

## Power Automate Designer Blueprint (Exact Build Order)

Use this as the concrete flow structure in PA UI builder.

1. Trigger: `When an HTTP request is received`
2. Action: `Initialize variable` -> `actionRaw` (String) = `triggerBody()?['actionType']`
3. Action: `Compose` -> `actionNormalized` (Expression):

```text
toLower(trim(coalesce(variables('actionRaw'), '')))
```

4. Action: `Switch` on `outputs('actionNormalized')`

### Switch Case Values (include all)

- `instaddlog`
- `instgetall`
- `instcreatenew`
- `instupdatebyid`
- `instupsertbytag`
- `instgetstate`
- `addinstrumentationlog`
- `getallinstruments`
- `getall`
- `addinstrument`
- `create`
- `update`
- `upsertbytagnumber`
- `getstate`

### Canonical Routing Pattern

For each legacy case, immediately route to canonical behavior (copy same actions or call child scope).

- `addinstrumentationlog` -> same actions as `instaddlog`
- `getallinstruments` + `getall` -> same actions as `instgetall`
- `addinstrument` + `create` -> same actions as `instcreatenew`
- `update` -> same actions as `instupdatebyid`
- `upsertbytagnumber` -> same actions as `instupsertbytag`
- `getstate` -> same actions as `instgetstate`

## Case Template: `instAddLog`

1. Action: `Compose` -> `log`:

```text
coalesce(triggerBody()?['instrumentationLog'], createObject())
```

2. Action: `Create item` in list `Instrumentation Log`
3. Required fields mapping:
   - `PwaId` <- `coalesce(outputs('log')?['localUuid'], triggerBody()?['localUuid'], '')`
   - `Tag Number` (or list-internal equivalent) <- `coalesce(outputs('log')?['instrumentTagNumber'], '')`
   - `instrumentId` (lookup/id column) <- resolved instrumentation item ID
   - `Description` <- `coalesce(outputs('log')?['instrumentDescription'], '')`
   - `Status` <- `coalesce(outputs('log')?['status'], '')`
   - `Date` <- `coalesce(outputs('log')?['date'], '')`
   - `Time` <- `coalesce(outputs('log')?['time'], '')`
   - `Name` <- `coalesce(outputs('log')?['name'], '')`
   - `Comment` <- `coalesce(outputs('log')?['comment'], '')`
4. Action: `Condition` for attachments (Expression):

```text
@greater(length(coalesce(triggerBody()?['attachments'], createArray())), 0)
```

5. If `true`: `Apply to each` over `coalesce(triggerBody()?['attachments'], createArray())`
6. Inside loop: `Add attachment` to created `Instrumentation Log` item
   - File name <- `items('Apply_to_each')?['fileName']`
   - File content <- `base64ToBinary(items('Apply_to_each')?['base64Content'])`
7. Before/after attachments (either order, same transaction intent): upsert instrumentation master:
   - `Get items` from `Instrumentation` with filter by tag number
   - If found -> `Update item` with latest status/date/time/by/comment
   - Else -> `Create item` in `Instrumentation`
   - Ensure log row has `instrumentId` reference to that instrumentation item
8. Action: `Response`:

```json
{ "success": true, "id": "<InstrumentationLogItemID>" }
```

## Case Template: `instGetAll`

1. `Get items` from `Instrumentation`
2. `Select` map fields:
   - `ID`, `Tag_x0020_Number`, `Description`, `Vendor`, `Location`, `Type`
   - `CurrentStatus`, `LastUpdatedDate`, `LastUpdatedTime`, `LastUpdatedBy`, `LastComment`
   - `PwaId`, `Modified`
3. `Response`:

```json
{ "success": true, "data": [ ... ] }
```

## Case Template: `instCreateNew`

1. `Compose` data object:

```text
coalesce(triggerBody()?['data'], createObject())
```

2. Find existing by `Tag_x0020_Number`
3. Branch by `mergePolicy` (`none` / `merge` / `skip`)
4. Create or update accordingly
5. `Response`:

```json
{ "success": true, "id": "<InstrumentationItemID>" }
```

## Case Template: `instUpdateById`

1. Read `id` from `triggerBody()?['id']`
2. Update `Instrumentation` item by ID with `data.*`
3. `Response`: `{ "success": true }`

## Case Template: `instUpsertByTag`

1. Find by `Tag_x0020_Number`
2. If exists -> update (merge non-empty fields)
3. Else -> create
4. `Response`: `{ "success": true }`

## Case Template: `instGetState`

1. `Get items` from `Instrumentation`
   - order by `Modified desc`
   - top `1`
2. Get list `ItemCount` (connector/REST)
3. `Response`:

```json
{
  "success": true,
  "data": [
    { "itemCount": 1234, "lastModified": "2026-03-09T14:22:31Z" }
  ]
}
```

## Default Case Response

```json
{ "success": false, "message": "Unknown actionType" }
```

## Cross-Layer Relationship Requirement

### PWA

- Sends log by tag number and local UUID.
- May include `instrumentSharepointId` when known, but server/PA must still resolve by tag if absent.

### Java

- Server submit path should preserve local save behavior, then enforce SP linkage:
  - instrumentation resolved/created first,
  - log row created with `instrumentId`,
  - instrumentation status updated from log payload.

### SharePoint

- `Instrumentation Log` must have reference column to `Instrumentation` (`instrumentId` / lookup).
- Existing text `Tag Number` remains for diagnostics and backward compatibility.
