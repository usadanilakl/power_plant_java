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

After the trigger:
- `responseSuccess` (Boolean = true)
- `responseId` (String = "")
- `responseMessage` (String = "")
- `responseData` (Array = [])

---

## Step 4: Top-Level Switch on `entity`

1. Add a **Switch** action, name it `Switch entity`
2. On: `triggerBody()?['entity']`
3. Two cases: `chemical`, `audit`

Inside **each** case you'll add a **nested Switch** on `actionType`.

---

## Step 5: Case `chemical` — Nested Switch on actionType

Inside the `chemical` case, add **Switch** on `triggerBody()?['actionType']` with cases
`create`, `getAll`, `update`, `delete`, `addAttachment`, `getAttachments`.

### 5a. `create`
1. **SharePoint > Create item** on list **SDS**
2. Map each column from `triggerBody()?['data']?['<Field>']`:
   `Title`, `PwaId`, `Names`, `Locations`, `Status`, `BookNumber`, `Section`,
   `Notes`, `ProcessedByName`, `ProcessedByEmail`,
   `SubmitterName`, `SubmitterEmail`, `SubmitterPhone`
3. **Set variable** `responseId` = `string(body('Create_item')?['ID'])`
4. **Condition** `length(triggerBody()?['attachments'])` > `0`:
   - Yes → **Apply to each** `triggerBody()?['attachments']` → **Add attachment**
     (Id = `body('Create_item')?['ID']`, File Content = `base64ToBinary(items('Apply_to_each')?['base64Content'])`)

### 5b. `getAll`
1. **SharePoint > Get items** on **SDS**, Top Count 5000
2. **Select** — map all columns:

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

3. **Set variable** `responseData` = `body('Select')`

### 5c. `update`
1. **SharePoint > Update item** on **SDS**, Id = `triggerBody()?['id']`
2. Map the same columns as `create`
3. **Set variable** `responseId` = `triggerBody()?['id']`

### 5d. `delete`
1. **SharePoint > Delete item** on **SDS**, Id = `triggerBody()?['id']`
2. **Set variable** `responseId` = `triggerBody()?['id']`

### 5e. `addAttachment`
1. **Apply to each** `triggerBody()?['attachments']` → **Add attachment** on **SDS**
   (Id = `triggerBody()?['id']`, File Content = `base64ToBinary(items('Apply_to_each')?['base64Content'])`)
2. **Set variable** `responseId` = `triggerBody()?['id']`

### 5f. `getAttachments`
1. **SharePoint > Get attachments** on **SDS**, Id = `triggerBody()?['id']`
2. **Apply to each** → **Get attachment content** → append
   `{ "fileName": @{items('Apply_to_each')?['DisplayName']}, "contentType": "application/pdf",
   "base64Content": @{base64(body('Get_attachment_content'))} }` to a temp array
3. **Set variable** `responseData` = the temp array

---

## Step 6: Case `audit` — Nested Switch on actionType

Inside the `audit` case, add **Switch** on `triggerBody()?['actionType']` with cases
`create`, `getAll`. (No update/delete — audit records are append-only; no attachments either.)

### 6a. `create`
1. **SharePoint > Create item** on list **SDS Audit**
2. Map columns from `triggerBody()?['data']?['<Field>']`:
   `Title`, `PwaId`, `ChemicalSpId`, `ChemicalLocalUuid`, `ChemicalName`,
   `Action`, `OldSnapshot`, `AuditedByName`, `AuditedByEmail`, `AuditedAt`,
   `Comments`, `Campaign`
3. **Set variable** `responseId` = `string(body('Create_item_Audit')?['ID'])`

### 6b. `getAll`
1. **SharePoint > Get items** on **SDS Audit**, Top Count 5000
2. **Select** — map all columns:

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

3. **Set variable** `responseData` = `body('Select_Audit')`

> **Tip:** Power Automate auto-suffixes duplicate action names. The two
> "Create item" actions will be `Create_item` and `Create_item_2` (or rename
> the audit one to `Create_item_Audit` for clarity). Verify names in expressions.

---

## Step 7: Scope + Error Handling

1. Add a **Scope** action; move the top-level `Switch entity` inside it.
2. After the Switch (inside the Scope): **Response — Success**
   - Status `200`, Header `Content-Type: application/json`, Body:
```json
{
  "success": @{variables('responseSuccess')},
  "id": "@{variables('responseId')}",
  "data": @{variables('responseData')},
  "message": "@{variables('responseMessage')}"
}
```
3. Parallel branch after the Scope, **Configure run after → only "has failed"**:
   - Set `responseSuccess` = false
   - Set `responseMessage` = `result('Scope')?[0]?['error']?['message']`
   - **Response — Failed** (200, same JSON body)

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
