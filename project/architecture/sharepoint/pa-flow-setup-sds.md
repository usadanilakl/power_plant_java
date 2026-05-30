# Power Automate Flow Setup: SDS

One flow serves **both** SDS SharePoint lists. The request carries an
`entity` discriminator (`"chemical"` or `"audit"`) that routes to the correct list.

- `entity: "chemical"` → **SDS** list (the chemicals)
- `entity: "audit"` → **SDS Audit** list (append-only audit records)

> **PA flows for SDS are optional.** The certificate path + the hub's
> `SdsOutboundSharePointSync` sweep handle SP push for desktop/hub records.
> Configure this flow only if you want the PWA-offline fallback (PWA submits
> directly to SP when the hub is unreachable).

---

## Step 1: SharePoint Lists

Both lists are auto-provisioned via Admin > SharePoint tab. Verify columns.

### List "SDS"

| Internal Name | Display Name | Type |
|--------------|-------------|------|
| PwaId | PWA ID | Single line of text |
| Names | Names | Multiple lines of text |
| Locations | Locations | Multiple lines of text |
| Status | Status | Single line of text |
| BookNumber | Book Number | Single line of text |
| Section | Section | Single line of text |
| Notes | Notes | Multiple lines of text |
| ProcessedByName | Processed By Name | Single line of text |
| ProcessedByEmail | Processed By Email | Single line of text |
| SubmitterName | Submitter Name | Single line of text |
| SubmitterEmail | Submitter Email | Single line of text |
| SubmitterPhone | Submitter Phone | Single line of text |

`Title` (built-in) = the chemical's primary name (first line of `Names`).
Attachments hold the SDS PDF.

### List "SDS Audit"

| Internal Name | Display Name | Type |
|--------------|-------------|------|
| PwaId | PWA ID | Single line of text |
| ChemicalSpId | Chemical SP Id | Single line of text |
| ChemicalLocalUuid | Chemical Local UUID | Single line of text |
| ChemicalName | Chemical Name | Single line of text |
| Action | Action | Single line of text |
| OldSnapshot | Old Snapshot | Multiple lines of text |
| AuditedByName | Audited By Name | Single line of text |
| AuditedByEmail | Audited By Email | Single line of text |
| AuditedAt | Audited At | Single line of text |
| Comments | Comments | Multiple lines of text |
| Campaign | Campaign | Single line of text |

`Title` (built-in) = the chemical's name (a human-readable summary).
Append-only — `Action` is `Confirmed` or `Edited`; `OldSnapshot` is JSON for `Edited`.
Hide `OldSnapshot` from the default view (Library Settings → Modify View).

---

## Step 2: Create the Flow

1. **Power Automate** > **My flows** > **+ New flow** > **Instant cloud flow**
2. Name: **SDS V2**
3. Trigger: **When an HTTP request is received**
4. **Use sample payload to generate schema**, paste:

```json
{
  "actionType": "create",
  "entity": "chemical",
  "id": null,
  "data": {
    "Title": "Sodium Hypochlorite 12.5%",
    "PwaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "Names": "Sodium Hypochlorite 12.5%\nBleach",
    "Locations": "RO Building",
    "Status": "Filed",
    "BookNumber": "1",
    "Section": "4",
    "Notes": "",
    "ProcessedByName": "John Smith",
    "ProcessedByEmail": "john@company.com",
    "SubmitterName": "John Smith",
    "SubmitterEmail": "john@company.com",
    "SubmitterPhone": "555-1234",
    "ChemicalSpId": "42",
    "ChemicalLocalUuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ChemicalName": "Sodium Hypochlorite 12.5%",
    "Action": "Confirmed",
    "OldSnapshot": "",
    "AuditedByName": "Jane Doe",
    "AuditedByEmail": "jane@company.com",
    "AuditedAt": "2026-05-29T14:30:00Z",
    "Comments": "Verified in place",
    "Campaign": "Initial Audit"
  },
  "attachments": [
    { "fileName": "sds.pdf", "contentType": "application/pdf", "base64Content": "JVBERi0xLjQK..." }
  ]
}
```

> The sample payload merges all fields from both lists so the generated schema
> accepts either. The flow only reads the fields relevant to the chosen `entity`.

5. Method: `POST`. Copy the **HTTP POST URL** — this is the single SDS flow URL.

---

## Step 3: Initialize Variables

Add **four Initialize variable** actions immediately after the trigger, one per variable
(Power Automate requires every variable to be initialized at the top of the flow, before
any conditional/scoped use):

| Name | Type | Initial Value |
|---|---|---|
| `responseSuccess` | Boolean | `true` |
| `responseId` | String | (empty) |
| `responseMessage` | String | (empty) |
| `responseData` | Array | `[]` |

If you implement the `getAttachments` action (Step 5f) you'll add one more here:

| Name | Type | Initial Value |
|---|---|---|
| `tempAttachments` | Array | `[]` |

---

## Step 4: Top-Level Switch on `entity`

1. Add a **Control > Switch** action *after* the Initialize-variable actions from Step 3.
   - Rename it `Switch entity` (right-click → Rename).
   - **On** = (expression) `triggerBody()?['entity']`

2. Inside the Switch action, two **Case** branches will already be present (`Case` and `Default`).
   - Set the first case's **Equals** value to `chemical`.
   - Click **+ Add an action → Switch case** (the small `+` next to the existing case) to add a
     second case, and set its **Equals** to `audit`.

3. Leave the **Default** branch empty (or add a Set variable that puts `"unknown entity"`
   into `responseMessage` — the Scope in Step 7 will catch it anyway).

Inside **each** case (`chemical`, `audit`) you'll add a **nested Switch** on `actionType`
in Steps 5 and 6 below.

---

## Step 5: Case `chemical` — Nested Switch on actionType

**Inside the `chemical` branch** of the top-level Switch:

1. Add a **Control > Switch** action.
   - Rename it `Switch chemical actionType`.
   - **On** = (expression) `triggerBody()?['actionType']`

2. Add six **Case** branches with Equals values: `create`, `getAll`, `update`, `delete`,
   `addAttachment`, `getAttachments`. (Use the `+` between cases to add more.)

Each sub-section below (5a–5f) describes what goes inside one of those cases.

### 5a. `create`

1. Add **SharePoint > Create item**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - For each column, set its value from `triggerBody()?['data']?['<Field>']`:
     `Title`, `PwaId`, `Names`, `Locations`, `Status`, `BookNumber`, `Section`,
     `Notes`, `ProcessedByName`, `ProcessedByEmail`,
     `SubmitterName`, `SubmitterEmail`, `SubmitterPhone`

2. Add **Set variable**.
   - Name = `responseId`
   - Value = `string(body('Create_item')?['ID'])`

3. Add **Condition** to attach files only if any were sent.
   - Left = `length(triggerBody()?['attachments'])`
   - Operator = is greater than
   - Right = `0`

4. **In the "If yes" branch of the Condition**, add **Apply to each**.
   - Select an output from previous steps = `triggerBody()?['attachments']`

5. **Inside the Apply to each**, add **SharePoint > Add attachment**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - Id = `body('Create_item')?['ID']`
   - File Name = `items('Apply_to_each')?['fileName']`
   - File Content = `base64ToBinary(items('Apply_to_each')?['base64Content'])`

### 5b. `getAll`

1. Add **SharePoint > Get items**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - Advanced options → **Top Count** = `5000` (default is 100 — easy to miss)

2. Add **Data Operation > Select**.
   - From = `body('Get_items')?['value']`
   - Map = switch to **Text mode** (the `T` icon top-right) and paste:
```json
{
  "ID": "@{item()?['ID']}",
  "Title": "@{item()?['Title']}",
  "PwaId": "@{item()?['PwaId']}",
  "Names": "@{item()?['Names']}",
  "Locations": "@{item()?['Locations']}",
  "Status": "@{item()?['Status']}",
  "BookNumber": "@{item()?['BookNumber']}",
  "Section": "@{item()?['Section']}",
  "Notes": "@{item()?['Notes']}",
  "ProcessedByName": "@{item()?['ProcessedByName']}",
  "ProcessedByEmail": "@{item()?['ProcessedByEmail']}",
  "SubmitterName": "@{item()?['SubmitterName']}",
  "SubmitterEmail": "@{item()?['SubmitterEmail']}",
  "SubmitterPhone": "@{item()?['SubmitterPhone']}",
  "Modified": "@{item()?['Modified']}"
}
```

3. Add **Set variable**.
   - Name = `responseData`
   - Value = `body('Select')`

### 5c. `update`

1. Add **SharePoint > Update item**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - Id = `triggerBody()?['id']`
   - Map the **same column set as `create`** (Step 5a) — all values from `triggerBody()?['data']?['<Field>']`.

2. Add **Set variable**.
   - Name = `responseId`
   - Value = `triggerBody()?['id']`

### 5d. `delete`

1. Add **SharePoint > Delete item**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - Id = `triggerBody()?['id']`

2. Add **Set variable**.
   - Name = `responseId`
   - Value = `triggerBody()?['id']`

### 5e. `addAttachment`

1. Add **Apply to each**.
   - Select an output from previous steps = `triggerBody()?['attachments']`

2. **Inside the Apply to each**, add **SharePoint > Add attachment**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - Id = `triggerBody()?['id']`
   - File Name = `items('Apply_to_each')?['fileName']`
   - File Content = `base64ToBinary(items('Apply_to_each')?['base64Content'])`

3. **After the Apply to each**, add **Set variable**.
   - Name = `responseId`
   - Value = `triggerBody()?['id']`

### 5f. `getAttachments`

1. Add **Initialize variable** *before the Switch* (top of the flow, alongside the other
   Initialize variable actions in Step 3).
   - Name = `tempAttachments`
   - Type = Array
   - Value = `[]`

2. Add **SharePoint > Get attachments**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - Id = `triggerBody()?['id']`

3. Add **Apply to each**.
   - Select an output from previous steps = `body('Get_attachments')`
   - (This iterates over the metadata for each attachment — DisplayName, AbsoluteUri, etc.
     Each item does **not** include the bytes yet.)

4. **Inside the Apply to each**, add **SharePoint > Get attachment content**.
   - Site Address = your SharePoint site
   - List Name = **SDS**
   - Id = `triggerBody()?['id']`
   - File Identifier = `items('Apply_to_each')?['Id']`

5. **Inside the Apply to each, after Get attachment content**, add **Append to array variable**.
   - Name = `tempAttachments`
   - Value (paste in code view):
```json
{
  "fileName": "@{items('Apply_to_each')?['DisplayName']}",
  "contentType": "application/pdf",
  "base64Content": "@{base64(body('Get_attachment_content'))}"
}
```

6. **After the Apply to each**, add **Set variable**.
   - Name = `responseData`
   - Value = `variables('tempAttachments')`

> The two SharePoint actions are both needed: "Get attachments" returns metadata only;
> "Get attachment content" returns the binary bytes for a single attachment, which we
> base64-encode and pack into the shape the backend's `PaAttachmentDto` expects.

---

## Step 6: Case `audit` — Nested Switch on actionType

**Inside the `audit` branch** of the top-level Switch:

1. Add a **Control > Switch** action.
   - Rename it `Switch audit actionType`.
   - **On** = (expression) `triggerBody()?['actionType']`

2. Add two **Case** branches with Equals values: `create`, `getAll`.
   *(No `update`/`delete` cases — audit records are append-only.
   No attachment cases — audit records don't carry files.)*

### 6a. `create`

1. Add **SharePoint > Create item**. **Rename this action to `Create_item_Audit`**
   *(right-click → Rename — important; otherwise Power Automate auto-names it `Create_item_2`
   and the body expression below won't match)*.
   - Site Address = your SharePoint site
   - List Name = **SDS Audit**
   - For each column, set its value from `triggerBody()?['data']?['<Field>']`:
     `Title`, `PwaId`, `ChemicalSpId`, `ChemicalLocalUuid`, `ChemicalName`,
     `Action`, `OldSnapshot`, `AuditedByName`, `AuditedByEmail`, `AuditedAt`,
     `Comments`, `Campaign`

2. Add **Set variable**.
   - Name = `responseId`
   - Value = `string(body('Create_item_Audit')?['ID'])`

### 6b. `getAll`

1. Add **SharePoint > Get items**. **Rename this action to `Get_items_Audit`**.
   - Site Address = your SharePoint site
   - List Name = **SDS Audit**
   - Advanced options → **Top Count** = `5000`

2. Add **Data Operation > Select**. **Rename this action to `Select_Audit`**.
   - From = `body('Get_items_Audit')?['value']`
   - Map = switch to **Text mode** (`T` icon) and paste:
```json
{
  "ID": "@{item()?['ID']}",
  "Title": "@{item()?['Title']}",
  "PwaId": "@{item()?['PwaId']}",
  "ChemicalSpId": "@{item()?['ChemicalSpId']}",
  "ChemicalLocalUuid": "@{item()?['ChemicalLocalUuid']}",
  "ChemicalName": "@{item()?['ChemicalName']}",
  "Action": "@{item()?['Action']}",
  "OldSnapshot": "@{item()?['OldSnapshot']}",
  "AuditedByName": "@{item()?['AuditedByName']}",
  "AuditedByEmail": "@{item()?['AuditedByEmail']}",
  "AuditedAt": "@{item()?['AuditedAt']}",
  "Comments": "@{item()?['Comments']}",
  "Campaign": "@{item()?['Campaign']}",
  "Modified": "@{item()?['Modified']}"
}
```

3. Add **Set variable**.
   - Name = `responseData`
   - Value = `body('Select_Audit')`

> **About action names.** Power Automate auto-suffixes duplicate action names
> (`Create_item`, `Create_item_2`, `Get_items_2`, `Select_2`, …). All `body('…')` /
> `outputs('…')` expressions in the rest of this guide assume the renames in 6a/6b.
> If you skipped the renames, replace those names with whatever PA actually generated
> (click each action → see its name at the top of the panel).

---

## Step 7: Scope + Error Handling

The goal: any failure inside the Switch is caught and returns a structured `success:false`
JSON response (instead of a raw 500 from Power Automate, which the backend can't parse).

1. Add a **Scope** action and rename it `Try`.
2. **Move the `Switch entity` action inside the `Try` Scope** (drag it in, or cut-and-paste
   inside the Scope's body).
3. Add a **Response** action **inside the `Try` Scope, after the Switch**. Rename it
   `Response Success`.
   - Status Code = `200`
   - Headers: `Content-Type` = `application/json`
   - Body (code view):
```json
{
  "success": @{variables('responseSuccess')},
  "id": "@{variables('responseId')}",
  "data": @{variables('responseData')},
  "message": "@{variables('responseMessage')}"
}
```

4. **After the `Try` Scope** (at the same level, not inside it), add a second **Scope** action
   and rename it `Catch`.

5. Open `Catch`'s **Settings → Configure run after** and tick **only** "has failed"
   (uncheck "is successful"). This makes the Catch run only when something inside `Try` errored.

6. **Inside the `Catch` Scope**, add three actions in order:

   a. **Set variable**
      - Name = `responseSuccess`
      - Value = `false`

   b. **Set variable**
      - Name = `responseMessage`
      - Value (expression) = `coalesce(result('Try')?[0]?['error']?['message'], 'Unknown flow error')`

   c. **Response** — rename it `Response Failed`.
      - Status Code = `200` (must be 200, not 500 — the backend reads `success` from the body)
      - Headers: `Content-Type` = `application/json`
      - Body: **same JSON as Response Success** (copy-paste)

> Why 200 on failure? Power Automate flows return 202/500 on uncaught errors, which the
> backend `PowerAutomateV2Client` treats as a transport failure. Returning a 200 with
> `success:false` lets the backend read `responseMessage` and decide what to do
> (log, fall back to email, etc.) instead of throwing.

---

## Step 8: Save and Configure

### 8a. Save, copy the trigger URL.

### 8b. Backend — `application.properties`:
```properties
pa.flow.sds-url=<your-flow-url>
```

### 8c. PWA — `environment.ts` and `environment.prod.ts`:
```ts
paFlowUrls: { ..., sds: '<your-flow-url>' }
```

Only **one** URL — used for both chemicals and audit records.

### 8d. Test with curl

**Create a chemical:**
```bash
curl -X POST "<flow-url>" -H "Content-Type: application/json" -d '{
  "actionType": "create", "entity": "chemical",
  "data": { "Title": "Test Chemical", "PwaId": "test-sds-1",
    "Names": "Test Chemical", "Status": "Pending",
    "BookNumber": "4", "Section": "41" }
}'
```

**Record an audit:**
```bash
curl -X POST "<flow-url>" -H "Content-Type: application/json" -d '{
  "actionType": "create", "entity": "audit",
  "data": { "Title": "Test Chemical", "PwaId": "test-audit-1",
    "ChemicalSpId": "42", "ChemicalName": "Test Chemical",
    "Action": "Confirmed", "AuditedByName": "Tester",
    "AuditedAt": "2026-05-29T14:30:00Z", "Campaign": "Initial Audit" }
}'
```

**List all chemicals:**
```bash
curl -X POST "<flow-url>" -H "Content-Type: application/json" -d '{
  "actionType": "getAll", "entity": "chemical"
}'
```

All return `{ "success": true, "id": "...", "data": [...], "message": "" }`.

---

## Flow Structure Summary

```
Trigger: When an HTTP request is received (POST)
│
├── Initialize: responseSuccess, responseId, responseMessage, responseData
│
├── Scope
│   └── Switch entity (triggerBody.entity)
│       ├── Case "chemical"
│       │   └── Switch actionType
│       │       ├── create         → Create item (SDS) → responseId → attachments
│       │       ├── getAll         → Get items (SDS) → Select → responseData
│       │       ├── update         → Update item (SDS) → responseId
│       │       ├── delete         → Delete item (SDS) → responseId
│       │       ├── addAttachment  → Apply to each → Add attachment → responseId
│       │       └── getAttachments → Get attachments → contents → responseData
│       │
│       └── Case "audit"
│           └── Switch actionType
│               ├── create → Create item (SDS Audit) → responseId
│               └── getAll → Get items (SDS Audit) → Select → responseData
│   └── Response Success (200, JSON)
│
└── [Failure branch — run after Scope "has failed"]
    ├── responseSuccess = false
    ├── responseMessage = Scope error
    └── Response Failed (200, JSON)
```

## Common Pitfalls

1. **`entity` must be top-level**, not inside `data` — the Switch reads `triggerBody()?['entity']`.
2. **Column internal names** — if Select returns null, check List Settings → column → `Field=` URL param.
   In particular: the section column is `Section` (not `SectionNumber`).
3. **Get items default limit is 100** — set Top Count to 5000.
4. **base64ToBinary** for attachments — not `decodeBase64`. SDS PDFs are large; the SP attachment
   size limit is 250 MB, but the PA HTTP trigger limit is much smaller (~50 MB request body).
5. **Duplicate action names** — `Create_item` vs `Create_item_2`; verify the name used in `body('...')` expressions.
6. **Audit is append-only** — do NOT add `update` or `delete` cases in the `audit` switch; the backend never calls them.
7. **`OldSnapshot` carries JSON** — escape it client-side and don't show it in default views (it's a hidden audit field).
8. **Response must be last** — after the Switch, inside the Scope.
