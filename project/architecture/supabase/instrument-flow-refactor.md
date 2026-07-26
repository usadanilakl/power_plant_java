# Instrument flow refactor — make 832a87fa instrument-only

The Power Automate flow `832a87fa6bd042459fbb042c2163f25a` today is **combined**: a `Switch` on
`actionType` with **user** cases (`create`, `save`, `delete`, `authenticate`, `getAll`) *and*
**instrument** cases (`addInstrumentationLog`, `getAllInstruments`). The user cases are legacy — PWA auth
now goes through the hub + Supabase (see [dual-auth.md](../../features/users/dual-auth.md)), so the PA
user path is obsolete.

**Goal:** drop the user part, keep the working instrument part, and add the two missing instrument
register actions — so this becomes a clean **instrument-only** flow that the PWA already targets.

## Why the PWA needs no changes

The PWA already sends exactly these four `actionType`s (the gateway forwards each `payload` verbatim):

| Action | PWA caller | Status in flow |
|--------|-----------|----------------|
| `getState` | `fetchInstrumentsState()` | **ADD** |
| `getAllInstruments` | `fetchInstruments()` | keep (exists) |
| `addInstrument` | `createInstrument()` | **ADD** |
| `addInstrumentationLog` | `submitInstrumentLog()` → `tryPaInstrumentLog()` | keep (exists) |

So the refactor is entirely inside the flow: **remove** the 5 user cases, **keep** the 2 instrument
cases, **add** the 2 register cases below.

## New trigger schema (instrument-only)

Replace the trigger's *Request Body JSON Schema* with this (drops `user`; adds `data`/`id`/`localUuid`;
keeps `instrumentationLog` + `attachments`):

```json
{
  "type": "object",
  "properties": {
    "actionType":  { "type": "string" },
    "id":          { "type": "string" },
    "localUuid":   { "type": "string" },
    "data":        { "type": "object" },
    "instrumentationLog": {
      "type": "object",
      "properties": {
        "instrumentTagNumber":  { "type": "string" },
        "instrumentDescription":{ "type": "string" },
        "status":               { "type": "string" },
        "date":                 { "type": "string" },
        "time":                 { "type": "string" },
        "name":                 { "type": "string" },
        "comment":              { "type": "string" }
      }
    },
    "attachments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "fileName":      { "type": "string" },
          "contentType":   { "type": "string" },
          "base64Content": { "type": "string" }
        }
      }
    }
  },
  "required": [ "actionType" ]
}
```

## Switch cases — final set

Keyed on `@{triggerBody()?['actionType']}`.

### Remove
`create`, `save`, `delete`, `authenticate`, `getAll` — and any user-only actions (`instruments` SP
lookups aside). If a case is shared, keep only the instrument behavior.

### Keep (already built)
- **`getAllInstruments`** — returns all instruments (the existing `instruments → Select → Response`
  branch). Ensure the Response body is `{ "success": true, "data": [ …instruments… ] }` (see contract).
- **`addInstrumentationLog`** — the existing `instrumentation log scope` (Get Inst By Tag → Create Log
  Item → attachments Apply-to-each). Unchanged.

### Add — build steps

> **Where the values live:** inside this flow `triggerBody()` **is the payload**. The register sends its
> fields **under `data`**, so every field is `triggerBody()?['data']?['…']`. (The log case reads
> `triggerBody()?['instrumentationLog']?['…']` instead.) Action references use the action name with spaces
> as underscores — rename below if your actions are named differently.

#### Case `addInstrument`

1. On the Switch, **Add case** → **Equals** value `addInstrument` (must match the PWA's actionType exactly).
2. Action **SharePoint → Create item**, pointed at the Instruments list. Set each field to the fx
   expression below (replace any auto-picked dynamic-content chips with these exact expressions):

   | Column | Expression |
   |--------|-----------|
   | Tag Number | `triggerBody()?['data']?['Tag_x0020_Number']` |
   | Description | `triggerBody()?['data']?['Description']` |
   | Vendor | `triggerBody()?['data']?['Vendor']` |
   | Location | `triggerBody()?['data']?['Location']` |
   | Type | `triggerBody()?['data']?['Type']` |
   | CurrentStatus | `triggerBody()?['data']?['CurrentStatus']` |
   | PwaId | `triggerBody()?['data']?['PwaId']` |
   | LastUpdatedDate / LastUpdatedTime / LastUpdatedBy / LastComment | leave blank (the PWA doesn't send them on create; optionally set LastUpdatedDate to `utcNow()`) |

3. Action **Request → Response** (or your flow's per-case Response): **Status Code** `200`, **Body**:
   ```json
   { "success": true, "id": "@{body('Create_item')?['ID']}" }
   ```
   (`createInstrument` reads `response.id` as the new SharePoint id. SharePoint returns the numeric `ID`.)

#### Case `getState`

Lightweight change-detector — the PWA stores `version` and refetches the list only when it changes.

1. On the Switch, **Add case** → value `getState`.
2. Action **SharePoint → Get items**, Instruments list. In the action:
   - **Order By** = `Modified desc`
   - **Top Count** = `5000` (or turn on pagination in *Settings*). Exact count isn't critical — a new or
     edited item changes `Modified`, so `version` changes regardless of the cap.
   - *(optional, faster)* **Limit Columns / $select** = `Id,Modified`.
3. Action **Request → Response**: **Status Code** `200`, **Body**:
   ```json
   {
     "success": true,
     "data": [
       {
         "itemCount": @{length(outputs('Get_items')?['body/value'])},
         "lastModified": "@{first(outputs('Get_items')?['body/value'])?['Modified']}",
         "version": "@{concat(string(length(outputs('Get_items')?['body/value'])), ':', coalesce(first(outputs('Get_items')?['body/value'])?['Modified'], 'none'))}"
       }
     ]
   }
   ```
   (`fetchInstrumentsState` reads `data[0].itemCount/lastModified/version`; it coerces types, so number-vs-string doesn't matter.)

> Test each case from the flow's **Testing** tab (or the PWA) with a body like
> `{ "actionType": "addInstrument", "data": { "Tag_x0020_Number": "PT-101", "Description": "x", "Vendor": "y", "Location": "Hall", "Type": "Pressure", "CurrentStatus": "Normal Operation", "PwaId": "test-uuid" } }`
> and `{ "actionType": "getState", "data": {} }`.

## Per-action contracts (what the PWA sends / expects)

The PWA reads `PaV2Response = { success, id?, data?, message? }`. `data` is always an **array**.

**`getState`** — request `{ "actionType": "getState", "data": {} }` →
response `{ "success": true, "data": [ { "itemCount", "lastModified", "version" } ] }`.
(`fetchInstrumentsState` reads `data[0].itemCount/lastModified/version` to decide whether to refetch.)

**`getAllInstruments`** — request `{ "actionType": "getAllInstruments", "data": {} }` →
response `{ "success": true, "data": [ instrument… ] }`, each instrument:
```json
{ "tagNumber": "", "description": "", "vendor": "", "location": "", "type": "",
  "currentStatus": "", "lastUpdatedDate": "", "lastUpdatedTime": "", "lastUpdatedBy": "",
  "lastComment": "", "sharepointId": "" }
```
(`fetchInstruments` casts `data` to the instrument list directly.)

**`addInstrument`** — request:
```json
{ "actionType": "addInstrument",
  "data": { "Tag_x0020_Number": "", "Description": "", "Vendor": "", "Location": "",
            "Type": "", "CurrentStatus": "Normal Operation", "PwaId": "<localUuid>" } }
```
→ response `{ "success": true, "id": "<new SharePoint item id>" }`.
(`createInstrument` reads `response.id` as the sharepointId. Note the SharePoint column is
`Tag_x0020_Number` — the x0020 is the encoded space in "Tag Number".)

**`addInstrumentationLog`** — request (built by `tryPaInstrumentLog` → `submitV2Raw`):
```json
{ "actionType": "addInstrumentationLog",
  "instrumentationLog": { "instrumentTagNumber": "", "instrumentDescription": "", "status": "",
                          "date": "", "time": "", "name": "", "comment": "" },
  "localUuid": "", "attachments": [ { "fileName", "contentType", "base64Content" } ] }
```
→ response `{ "success": true, "id": "<log item id>" }` (the PWA only checks the call succeeded).

## Gateway + PWA wiring (already done on the code side)

- The PWA sends a single target **`instrument`** for the whole flow (register *and* log — it demuxes on
  `actionType`), so the gateway needs just **one** `instrument` Switch case pointing at the flow URL
  `…/automations/direct/cu/23/workflows/832a87fa…&sig=CskQ…1M4`. See [pa-gateway.md](pa-gateway.md) step 4.
- `paFlowUrls.instrument` in `environment.ts` points at that URL, so the direct (pre-gateway) path also
  works. (The old separate `instrumentLog` target/env entry was removed — it's all `instrument` now.)
- `tryPaInstrumentLog` now routes through `submitV2Raw('instrument', …)` (was legacy V1 `submitForm`),
  forwarding the identical body — so the `addInstrumentationLog` case is unchanged.

## PWA cleanup once the user cases are removed

Removing the flow's user cases breaks `browser/ng-ui/src/app/auth/user/user-api.service.ts`
(`createUser`/`updateUser`/`deleteUser`/`authenticateUser`/`getUsers`), which is still wired into
`user-state.service.ts` → `user-form.component`. That path is superseded by dual-auth. **Decide:**
delete `UserApiService` + the `user-state` PA calls (recommended), or confirm the `user-form` admin
screen is dead. Until then, those specific calls will fail against the refactored flow (they are not on
the instrument path, so instrument submissions are unaffected).
