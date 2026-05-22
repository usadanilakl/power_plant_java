# Power Automate Flow Setup: Inventory

One flow serves **both** Inventory SharePoint lists. The request carries an
`entity` discriminator (`"item"` or `"usage"`) that routes to the correct list.

- `entity: "item"` → **Inventory** list (the assets)
- `entity: "usage"` → **Inventory Usage** list (checkout/checkin events)

---

## Step 1: SharePoint Lists

Both lists are auto-provisioned via Admin > SharePoint tab. Verify columns.

### List "Inventory"

| Internal Name | Display Name | Type |
|--------------|-------------|------|
| PwaId | PWA ID | Single line of text |
| ItemType | Item Type | Single line of text |
| Status | Status | Single line of text |
| Location | Location | Single line of text |
| SerialNumber | Serial Number | Single line of text |
| Manufacturer | Manufacturer | Single line of text |
| Model | Model | Single line of text |
| Description | Description | Multiple lines of text |
| QrToken | QR Token | Single line of text |
| CurrentLocation | Current Location | Single line of text |
| CurrentHolderName | Current Holder Name | Single line of text |
| CurrentHolderEmail | Current Holder Email | Single line of text |
| SubmitterName | Submitter Name | Single line of text |
| SubmitterEmail | Submitter Email | Single line of text |
| SubmitterPhone | Submitter Phone | Single line of text |

`Title` (built-in) = the item name.

### List "Inventory Usage"

| Internal Name | Display Name | Type |
|--------------|-------------|------|
| PwaId | PWA ID | Single line of text |
| InventoryItemId | Inventory Item Id | Single line of text |
| QrToken | QR Token | Single line of text |
| UserName | User Name | Single line of text |
| UserEmail | User Email | Single line of text |
| Location | Location | Single line of text |
| Purpose | Purpose | Single line of text |
| Comments | Comments | Multiple lines of text |
| EventType | Event Type | Single line of text |
| ScannedAt | Scanned At | Single line of text |
| ReturnedAt | Returned At | Single line of text |

`Title` (built-in) = a summary like `"abc123 — checkout by John Smith"`.

---

## Step 2: Create the Flow

1. **Power Automate** > **My flows** > **+ New flow** > **Instant cloud flow**
2. Name: **Inventory V2**
3. Trigger: **When an HTTP request is received**
4. **Use sample payload to generate schema**, paste:

```json
{
  "actionType": "create",
  "entity": "item",
  "id": null,
  "data": {
    "Title": "Fluke 87V Multimeter",
    "PwaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ItemType": "Test Equipment",
    "Status": "Available",
    "Location": "Tool Crib B",
    "SerialNumber": "12345678",
    "Manufacturer": "Fluke",
    "Model": "87V",
    "Description": "Industrial multimeter",
    "QrToken": "a1b2c3d4e5f6",
    "CurrentLocation": "Tool Crib B",
    "CurrentHolderName": "",
    "CurrentHolderEmail": "",
    "SubmitterName": "John Smith",
    "SubmitterEmail": "john@company.com",
    "SubmitterPhone": "555-1234",
    "InventoryItemId": "42",
    "UserName": "John Smith",
    "UserEmail": "john@company.com",
    "Purpose": "Inspection",
    "Comments": "Notes",
    "EventType": "checkout",
    "ScannedAt": "2026-04-25T09:30:00Z",
    "ReturnedAt": ""
  },
  "attachments": [
    { "fileName": "photo1.jpg", "contentType": "image/jpeg", "base64Content": "iVBORw0KGgo..." }
  ]
}
```

> The sample payload merges all fields from both lists so the generated schema
> accepts either. The flow only reads the fields relevant to the chosen `entity`.

5. Method: `POST`. Copy the **HTTP POST URL** — this is the single Inventory flow URL.

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
3. Two cases: `item`, `usage`

Inside **each** case you'll add a **nested Switch** on `actionType`.

---

## Step 5: Case `item` — Nested Switch on actionType

Inside the `item` case, add **Switch** on `triggerBody()?['actionType']` with cases
`create`, `getAll`, `update`, `addAttachment`, `getAttachments`.

### 5a. `create`
1. **SharePoint > Create item** on list **Inventory**
2. Map each column from `triggerBody()?['data']?['<Field>']`
3. **Set variable** `responseId` = `string(body('Create_item')?['ID'])`
4. **Condition** `length(triggerBody()?['attachments'])` > `0`:
   - Yes → **Apply to each** `triggerBody()?['attachments']` → **Add attachment**
     (Id = `body('Create_item')?['ID']`, File Content = `base64ToBinary(items('Apply_to_each')?['base64Content'])`)

### 5b. `getAll`
1. **SharePoint > Get items** on **Inventory**, Top Count 5000
2. **Select** — map `ID`, `Title`, `PwaId`, `ItemType`, `Status`, `Location`,
   `SerialNumber`, `Manufacturer`, `Model`, `Description`, `QrToken`,
   `CurrentLocation`, `CurrentHolderName`, `CurrentHolderEmail`,
   `SubmitterName`, `SubmitterEmail`, `SubmitterPhone`, `Modified`
3. **Set variable** `responseData` = `body('Select')`

### 5c. `update`
1. **SharePoint > Update item** on **Inventory**, Id = `triggerBody()?['id']`
2. Map the same columns as `create`
3. **Set variable** `responseId` = `triggerBody()?['id']`

### 5d. `addAttachment`
1. **Apply to each** `triggerBody()?['attachments']` → **Add attachment** on **Inventory**
   (Id = `triggerBody()?['id']`)
2. **Set variable** `responseId` = `triggerBody()?['id']`

### 5e. `getAttachments`
1. **SharePoint > Get attachments** on **Inventory**, Id = `triggerBody()?['id']`
2. **Apply to each** → **Get attachment content** → append `{fileName, contentType, base64Content}`
   to a temp array
3. **Set variable** `responseData` = the temp array

---

## Step 6: Case `usage` — Nested Switch on actionType

Inside the `usage` case, add **Switch** on `triggerBody()?['actionType']` with cases
`create`, `getAll`, `update`. (No attachment cases — usage events carry no files.)

### 6a. `create`
1. **SharePoint > Create item** on list **Inventory Usage**
2. Map columns: `Title`, `PwaId`, `InventoryItemId`, `QrToken`, `UserName`,
   `UserEmail`, `Location`, `Purpose`, `Comments`, `EventType`, `ScannedAt`, `ReturnedAt`
   — all from `triggerBody()?['data']?['<Field>']`
3. **Set variable** `responseId` = `string(body('Create_item_Usage')?['ID'])`

### 6b. `getAll`
1. **SharePoint > Get items** on **Inventory Usage**, Top Count 5000
2. **Select** — map all the columns above + `ID` + `Modified`
3. **Set variable** `responseData` = `body('Select_Usage')`

### 6c. `update`
1. **SharePoint > Update item** on **Inventory Usage**, Id = `triggerBody()?['id']`
2. Map the same columns as `create`
3. **Set variable** `responseId` = `triggerBody()?['id']`

> **Tip:** Power Automate auto-suffixes duplicate action names. The two
> "Create item" actions will be `Create_item` and `Create_item_2` (or rename
> the usage one to `Create_item_Usage` for clarity). Verify names in expressions.

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

### 8b. Backend — `application.properties` (already set):
```properties
pa.flow.inventory-url=<your-flow-url>
```

### 8c. PWA — `environment.ts` and `environment.prod.ts`:
```ts
paFlowUrls: { ..., inventory: '<your-flow-url>' }
```

Only **one** URL — used for both items and usage.

### 8d. Test with curl

**Create an item:**
```bash
curl -X POST "<flow-url>" -H "Content-Type: application/json" -d '{
  "actionType": "create", "entity": "item",
  "data": { "Title": "Test Multimeter", "PwaId": "test-item-1",
    "ItemType": "Test Equipment", "Status": "Available", "QrToken": "tok123" }
}'
```

**Record a usage event:**
```bash
curl -X POST "<flow-url>" -H "Content-Type: application/json" -d '{
  "actionType": "create", "entity": "usage",
  "data": { "Title": "tok123 — checkout by Tester", "PwaId": "test-usage-1",
    "InventoryItemId": "42", "QrToken": "tok123", "UserName": "Tester",
    "EventType": "checkout", "ScannedAt": "2026-04-25T09:30:00Z" }
}'
```

Both return `{ "success": true, "id": "...", "data": [], "message": "" }`.

---

## Flow Structure Summary

```
Trigger: When an HTTP request is received (POST)
│
├── Initialize: responseSuccess, responseId, responseMessage, responseData
│
├── Scope
│   └── Switch entity (triggerBody.entity)
│       ├── Case "item"
│       │   └── Switch actionType
│       │       ├── create        → Create item (Inventory) → responseId → attachments
│       │       ├── getAll        → Get items (Inventory) → Select → responseData
│       │       ├── update        → Update item (Inventory) → responseId
│       │       ├── addAttachment → Apply to each → Add attachment → responseId
│       │       └── getAttachments→ Get attachments → contents → responseData
│       │
│       └── Case "usage"
│           └── Switch actionType
│               ├── create → Create item (Inventory Usage) → responseId
│               ├── getAll → Get items (Inventory Usage) → Select → responseData
│               └── update → Update item (Inventory Usage) → responseId
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
3. **Get items default limit is 100** — set Top Count to 5000.
4. **base64ToBinary** for attachments — not `decodeBase64`.
5. **Duplicate action names** — `Create_item` vs `Create_item_2`; verify the name used in `body('...')` expressions.
6. **Response must be last** — after the Switch, inside the Scope.
