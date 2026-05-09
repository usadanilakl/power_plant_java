# Power Automate Flow Setup: Inventory

Step-by-step guide to create the Inventory flow in Power Automate.

---

## Step 1: SharePoint List "Inventory"

The list is auto-provisioned via Admin > SharePoint tab (`SharePointListProvisioner`). Verify these columns exist:

| Internal Name | Display Name | Type | Settings |
|--------------|-------------|------|----------|
| PwaId | PWA ID | Single line of text | UUID from PWA client |
| ItemType | Item Type | Single line of text | e.g. "Tools", "Safety Equipment", "Spare Parts" |
| Status | Status | Single line of text | "Available", "Checked Out", "Missing", "Retired" |
| Location | Location | Single line of text | Home location of the item |
| SerialNumber | Serial Number | Single line of text | |
| Manufacturer | Manufacturer | Single line of text | |
| Model | Model | Single line of text | |
| Description | Description | Multiple lines of text | Plain text |
| QrToken | QR Token | Single line of text | Server-generated unique token (12 chars) |
| CurrentLocation | Current Location | Single line of text | Where the item currently is |
| CurrentHolderName | Current Holder Name | Single line of text | Who has it now (if checked out) |
| CurrentHolderEmail | Current Holder Email | Single line of text | |
| SubmitterName | Submitter Name | Single line of text | |
| SubmitterEmail | Submitter Email | Single line of text | |
| SubmitterPhone | Submitter Phone | Single line of text | |

**Note:** The built-in `Title` column will be auto-filled with the item's `title` field (e.g. "Fluke 87V Multimeter").

---

## Step 2: Create the Flow

1. Go to **Power Automate** > **My flows** > **+ New flow** > **Instant cloud flow**
2. Name: **Inventory V2**
3. Trigger: **When an HTTP request is received**
4. Click **Use sample payload to generate schema** and paste:

```json
{
  "actionType": "create",
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
    "Description": "Industrial multimeter with True RMS",
    "QrToken": "a1b2c3d4e5f6",
    "CurrentLocation": "Tool Crib B",
    "CurrentHolderName": "",
    "CurrentHolderEmail": "",
    "SubmitterName": "John Smith",
    "SubmitterEmail": "john@company.com",
    "SubmitterPhone": "555-1234"
  },
  "attachments": [
    {
      "fileName": "photo1.jpg",
      "contentType": "image/jpeg",
      "base64Content": "iVBORw0KGgo..."
    }
  ]
}
```

5. Click **Done** — the schema will be generated automatically
6. Set **Method** to `POST`
7. Copy the **HTTP POST URL** — this is your flow trigger URL

---

## Step 3: Initialize Variables

Add these actions right after the trigger:

### 3a. Initialize `responseSuccess` (Boolean)
- Name: `responseSuccess`
- Type: Boolean
- Value: `true`

### 3b. Initialize `responseId` (String)
- Name: `responseId`
- Type: String
- Value: (empty)

### 3c. Initialize `responseMessage` (String)
- Name: `responseMessage`
- Type: String
- Value: (empty)

### 3d. Initialize `responseData` (Array)
- Name: `responseData`
- Type: Array
- Value: `[]`

---

## Step 4: Add the Switch (actionType Router)

1. Add a **Switch** action
2. On: `triggerBody()?['actionType']`
3. Create these cases: `create`, `getAll`, `update`, `addAttachment`, `getAttachments`

---

## Step 5: Implement `create` Case

### 5a. Create item in SharePoint

1. Inside the `create` case, add **SharePoint > Create item**
2. Site Address: (your SharePoint site)
3. List Name: **Inventory**
4. Map each field from the trigger body `data` object:

| List Column (display name) | Expression / Dynamic Content |
|-------------|------------------------------|
| Title | `triggerBody()?['data']?['Title']` |
| PWA ID | `triggerBody()?['data']?['PwaId']` |
| Item Type | `triggerBody()?['data']?['ItemType']` |
| Status | `triggerBody()?['data']?['Status']` |
| Location | `triggerBody()?['data']?['Location']` |
| Serial Number | `triggerBody()?['data']?['SerialNumber']` |
| Manufacturer | `triggerBody()?['data']?['Manufacturer']` |
| Model | `triggerBody()?['data']?['Model']` |
| Description | `triggerBody()?['data']?['Description']` |
| QR Token | `triggerBody()?['data']?['QrToken']` |
| Current Location | `triggerBody()?['data']?['CurrentLocation']` |
| Current Holder Name | `triggerBody()?['data']?['CurrentHolderName']` |
| Current Holder Email | `triggerBody()?['data']?['CurrentHolderEmail']` |
| Submitter Name | `triggerBody()?['data']?['SubmitterName']` |
| Submitter Email | `triggerBody()?['data']?['SubmitterEmail']` |
| Submitter Phone | `triggerBody()?['data']?['SubmitterPhone']` |

### 5b. Set `responseId`

After the Create item action:
- **Set variable**: `responseId` = `string(body('Create_item')?['ID'])`

### 5c. Process Attachments (if any)

1. Add a **Condition**: `length(triggerBody()?['attachments'])` is greater than `0`
2. If **Yes**:
   - Add **Apply to each** over `triggerBody()?['attachments']`
   - Inside the loop, add **SharePoint > Add attachment**:
     - Site Address: (your site)
     - List Name: **Inventory**
     - Id: `body('Create_item')?['ID']`
     - File Name: `items('Apply_to_each')?['fileName']`
     - File Content: `base64ToBinary(items('Apply_to_each')?['base64Content'])`

---

## Step 6: Implement `getAll` Case

### 6a. Get items from SharePoint

1. Inside the `getAll` case, add **SharePoint > Get items**
2. Site Address: (your site)
3. List Name: **Inventory**
4. Top Count: 5000

### 6b. Build response data array

1. Add **Select** action:
   - From: `body('Get_items')?['value']`
   - Use **Map mode** (key → value pairs):

| Key | Value |
|-----|-------|
| ID | `string(item()?['ID'])` |
| Title | `item()?['Title']` |
| PwaId | `item()?['PwaId']` |
| ItemType | `item()?['ItemType']` |
| Status | `item()?['Status']` |
| Location | `item()?['Location']` |
| SerialNumber | `item()?['SerialNumber']` |
| Manufacturer | `item()?['Manufacturer']` |
| Model | `item()?['Model']` |
| Description | `item()?['Description']` |
| QrToken | `item()?['QrToken']` |
| CurrentLocation | `item()?['CurrentLocation']` |
| CurrentHolderName | `item()?['CurrentHolderName']` |
| CurrentHolderEmail | `item()?['CurrentHolderEmail']` |
| SubmitterName | `item()?['SubmitterName']` |
| SubmitterEmail | `item()?['SubmitterEmail']` |
| SubmitterPhone | `item()?['SubmitterPhone']` |
| Modified | `item()?['Modified']` |

2. Add **Set variable**: `responseData` = `body('Select')`

---

## Step 7: Implement `update` Case

1. Inside the `update` case, add **SharePoint > Update item**
2. Site Address: (your site)
3. List Name: **Inventory**
4. Id: `triggerBody()?['id']`
5. Map the same fields as in the `create` step (Step 5a), all from `triggerBody()?['data']`
6. Set variable: `responseId` = `triggerBody()?['id']`

---

## Step 8: Implement `addAttachment` Case

1. Inside the `addAttachment` case, add **Apply to each** over `triggerBody()?['attachments']`
2. Inside the loop, add **SharePoint > Add attachment**:
   - Site Address: (your site)
   - List Name: **Inventory**
   - Id: `triggerBody()?['id']`
   - File Name: `items('Apply_to_each_2')?['fileName']`
   - File Content: `base64ToBinary(items('Apply_to_each_2')?['base64Content'])`
3. After the loop, set variable: `responseId` = `triggerBody()?['id']`

---

## Step 9: Implement `getAttachments` Case

1. Inside the `getAttachments` case, add **SharePoint > Get attachments**
   - Site Address: (your site)
   - List Name: **Inventory**
   - Id: `triggerBody()?['id']`
2. Add **Apply to each** over `body('Get_attachments')`
3. Inside the loop, add **SharePoint > Get attachment content**:
   - Site Address: (your site)
   - List Name: **Inventory**
   - Id: `triggerBody()?['id']`
   - File Identifier: `items('Apply_to_each_3')?['Id']`
4. After download, append to a temporary array variable with shape:
   ```json
   { "fileName": ..., "contentType": ..., "base64Content": "base64(...)" }
   ```
5. Set variable: `responseData` = the array of attachment objects

---

## Step 10: Add Scope with Error Handling

Wrap the Switch block in a Scope. Success Response goes inside the Scope. Failure Response runs only when the Scope fails.

### 10a. Create the Scope

1. Add a **Scope** action, name it `Scope`
2. Move the **Switch** action inside the Scope

### 10b. Add success response inside the Scope

After the Switch (still inside the Scope), add:

1. **Response — Success** action:
   - Status Code: `200`
   - Headers: `Content-Type` = `application/json`
   - Body:
```json
{
  "success": @{variables('responseSuccess')},
  "id": "@{variables('responseId')}",
  "data": @{variables('responseData')},
  "message": "@{variables('responseMessage')}"
}
```

### 10c. Add failure branch after the Scope

1. Click the `+` below the Scope → **Add a parallel branch**
2. Click the **⋯** on the branch → **Configure run after** → check only **"has failed"** (uncheck "is successful")
3. Add these actions sequentially in the failure branch:
   - **Set variable**: `responseSuccess` = `false`
   - **Set variable**: `responseMessage` = `result('Scope')?[0]?['error']?['message']`
   - **Response — Failed** action:
     - Status Code: `200`
     - Headers: `Content-Type` = `application/json`
     - Body: (same JSON structure as success response — variables now hold error values)

---

## Step 11: Save and Configure

### 11a. Save the flow

Click **Save** in Power Automate.

### 11b. Copy the trigger URL

Go back to the trigger step → copy the HTTP POST URL.

### 11c. Configure the URL in the application

The URL is already configured in `application.properties`:
```properties
pa.flow.inventory-url=https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms
```

Same URL is configured in PWA `environment.ts` and `environment.prod.ts` under `paFlowUrls.inventory`.

### 11d. Test with curl

**Test `create`:**
```bash
curl -X POST "<your-flow-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "create",
    "id": null,
    "data": {
      "Title": "Fluke 87V Multimeter",
      "PwaId": "test-uuid-inventory-1234",
      "ItemType": "Test Equipment",
      "Status": "Available",
      "Location": "Tool Crib B",
      "SerialNumber": "12345678",
      "Manufacturer": "Fluke",
      "Model": "87V",
      "Description": "Industrial multimeter",
      "QrToken": "abc123def456",
      "CurrentLocation": "Tool Crib B",
      "CurrentHolderName": "",
      "CurrentHolderEmail": "",
      "SubmitterName": "Test User",
      "SubmitterEmail": "test@example.com",
      "SubmitterPhone": "555-0000"
    },
    "attachments": []
  }'
```

Expected response:
```json
{
  "success": true,
  "id": "1",
  "data": [],
  "message": ""
}
```

**Test `getAll`:**
```bash
curl -X POST "<your-flow-url>" \
  -H "Content-Type: application/json" \
  -d '{"actionType": "getAll"}'
```

---

## Flow Structure Summary

```
Trigger: When an HTTP request is received (manual)
│
├── InitializeResponseSuccess (Boolean = true)
├── InitializeResponseId (String = "")
├── InitializeResponseMessage (String = "")
├── InitializeResponseData (Array = [])
│
├── Scope
│   ├── Switch (actionType, 5 Cases)
│   │   ├── Case: create
│   │   │   ├── Create item (SharePoint → "Inventory")
│   │   │   ├── Set variable: responseId
│   │   │   └── Condition: has attachments?
│   │   │       └── Yes: Apply to each → Add attachment
│   │   │
│   │   ├── Case: getAll
│   │   │   ├── Get items (SharePoint, top 5000)
│   │   │   ├── Select (map all fields)
│   │   │   └── Set variable: responseData
│   │   │
│   │   ├── Case: update
│   │   │   ├── Update item (SharePoint)
│   │   │   └── Set variable: responseId
│   │   │
│   │   ├── Case: addAttachment
│   │   │   ├── Apply to each → Add attachment
│   │   │   └── Set variable: responseId
│   │   │
│   │   └── Case: getAttachments
│   │       ├── Get attachments (SharePoint)
│   │       ├── Apply to each → Get attachment content → append to temp array
│   │       └── Set variable: responseData
│   │
│   └── Response Success (200, JSON)
│
└── [Failure branch — Configure run after: Scope "has failed"]
    ├── SetResponseSuccess = false
    ├── SetResponseMessage = error detail
    └── Response Failed (200, JSON)
```

---

## Key Differences from Field Lists Flow

1. **No DateTime column** — Inventory uses `lastCheckedOutAt` internally (Instant) but it's not exposed to SharePoint. All timestamps managed via `Modified` column.
2. **More columns (15 vs 11)** — Inventory has serial/manufacturer/model/QR token + holder tracking fields.
3. **`getAttachments` action** — included so the hub can pull SP-uploaded attachments back into local DB (matches Field List, JHA, Work Request pattern).
4. **No special discriminator** — `ItemType` is just a category, not a hard discriminator like FieldList types are.

## Common Pitfalls

1. **Column internal names.** If your Select expressions return null, the internal name may differ. Check via List Settings > click column > URL parameter `Field=`.
2. **Get items default limit.** Default Top Count is 100. Set it to 5000 to get all items.
3. **base64ToBinary expression.** For attachments, always use `base64ToBinary()` — not `decodeBase64`.
4. **Apply to each naming.** PA auto-names them `Apply_to_each`, `Apply_to_each_2`, `Apply_to_each_3`. Verify the correct name in expressions.
5. **HTTP Response must be last.** Place the Response action after the Switch, not inside a case.

---

# Power Automate Flow Setup: Inventory Usage

This is the **second** Inventory flow — a separate list and separate flow that tracks every checkout/checkin event for inventory items.

## Step 1: SharePoint List "Inventory Usage"

Auto-provisioned via Admin > SharePoint tab. Verify columns:

| Internal Name | Display Name | Type | Settings |
|--------------|-------------|------|----------|
| PwaId | PWA ID | Single line of text | UUID from PWA client |
| InventoryItemId | Inventory Item Id | Single line of text | Numeric ID of the inventory item (stringified) |
| QrToken | QR Token | Single line of text | Mirror of the item's QR token for cross-reference |
| UserName | User Name | Single line of text | Who scanned/checked out |
| UserEmail | User Email | Single line of text | |
| Location | Location | Single line of text | Where it's being taken / returned to |
| Purpose | Purpose | Single line of text | What it's being used for |
| Comments | Comments | Multiple lines of text | Optional notes |
| EventType | Event Type | Single line of text | "checkout" or "checkin" |
| ScannedAt | Scanned At | Single line of text | ISO 8601 timestamp |
| ReturnedAt | Returned At | Single line of text | ISO 8601 timestamp (optional) |

The built-in `Title` column is auto-filled with a summary like `"abc123def456 — checkout by John Smith"`.

---

## Step 2: Create the Flow

1. **Power Automate** > **My flows** > **+ New flow** > **Instant cloud flow**
2. Name: **Inventory Usage V2**
3. Trigger: **When an HTTP request is received**
4. Use sample payload:

```json
{
  "actionType": "create",
  "id": null,
  "data": {
    "Title": "abc123def456 — checkout by John Smith",
    "PwaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "InventoryItemId": "42",
    "QrToken": "abc123def456",
    "UserName": "John Smith",
    "UserEmail": "john@company.com",
    "Location": "Unit 1 Boiler",
    "Purpose": "Routine inspection",
    "Comments": "Will return by EOD",
    "EventType": "checkout",
    "ScannedAt": "2026-04-25T09:30:00Z",
    "ReturnedAt": ""
  }
}
```

5. Method: `POST`. Copy the trigger URL.

---

## Step 3: Initialize Variables

Same as the Inventory flow:
- `responseSuccess` (Boolean = true)
- `responseId` (String = "")
- `responseMessage` (String = "")
- `responseData` (Array = [])

---

## Step 4: Add Switch (actionType Router)

Cases: `create`, `getAll`, `update`

(No `addAttachment` / `getAttachments` cases — usage events don't carry attachments.)

---

## Step 5: Implement `create` Case

1. **SharePoint > Create item** on list **Inventory Usage**
2. Map all fields from `triggerBody()?['data']?[...]`
3. Set `responseId` = `string(body('Create_item')?['ID'])`

---

## Step 6: Implement `getAll` Case

1. **SharePoint > Get items** on **Inventory Usage**, Top Count 5000
2. **Select** action mapping each column to its key (mirror the `data` shape from the sample payload)
3. Set `responseData` = `body('Select')`

---

## Step 7: Implement `update` Case

1. **SharePoint > Update item** on **Inventory Usage**, Id = `triggerBody()?['id']`
2. Map fields from `triggerBody()?['data']?[...]`
3. Set `responseId` = `triggerBody()?['id']`

---

## Step 8: Add Scope + Error Handling

Wrap the Switch in a Scope. Same pattern as the Inventory flow:
- Inside Scope (after Switch): Response — Success (200, JSON body with the 4 variables)
- Parallel branch with "run after Scope has failed": set `responseSuccess=false`, set `responseMessage` from the Scope error, Response — Failed

---

## Step 9: Save and Configure

### 9a. Save the flow.

### 9b. Copy the trigger URL.

### 9c. Configure in `application.properties`:

```properties
pa.flow.inventory-usage-url=<your-trigger-url>
```

Also paste the same URL in PWA `environment.ts` and `environment.prod.ts` under `paFlowUrls.inventoryUsage`.

### 9d. Test with curl

```bash
curl -X POST "<your-flow-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "create",
    "data": {
      "Title": "test — checkout by Test User",
      "PwaId": "test-uuid-usage-1234",
      "InventoryItemId": "42",
      "QrToken": "abc123def456",
      "UserName": "Test User",
      "UserEmail": "test@example.com",
      "Location": "Unit 1 Boiler",
      "Purpose": "Inspection",
      "Comments": "Test comment",
      "EventType": "checkout",
      "ScannedAt": "2026-04-25T09:30:00Z",
      "ReturnedAt": ""
    }
  }'
```

---

## Flow Structure Summary (Inventory Usage)

```
Trigger: When an HTTP request is received (manual)
│
├── InitializeResponseSuccess (Boolean = true)
├── InitializeResponseId (String = "")
├── InitializeResponseMessage (String = "")
├── InitializeResponseData (Array = [])
│
├── Scope
│   ├── Switch (actionType, 3 Cases)
│   │   ├── Case: create
│   │   │   ├── Create item (SharePoint → "Inventory Usage")
│   │   │   └── Set variable: responseId
│   │   ├── Case: getAll
│   │   │   ├── Get items (SharePoint, top 5000)
│   │   │   ├── Select (map all fields)
│   │   │   └── Set variable: responseData
│   │   └── Case: update
│   │       ├── Update item (SharePoint)
│   │       └── Set variable: responseId
│   │
│   └── Response Success (200, JSON)
│
└── [Failure branch — Configure run after: Scope "has failed"]
    ├── SetResponseSuccess = false
    ├── SetResponseMessage = error detail
    └── Response Failed (200, JSON)
```

## Notes

- **No attachments** — usage events are pure data records. Photos belong on the parent inventory item, not on individual scan events.
- **Cross-reference via `InventoryItemId` + `QrToken`** — both columns are populated to make manual SharePoint reporting easier without requiring a lookup column.
- **Hub auto-pushes** — when a desktop client records a usage via `/ng/inventory-items/{id}/usage`, the hub also creates the SP row best-effort.
- **PWA fallback chain** — server first → Power Automate (`inventoryUsage` URL) → email-as-last-resort.
