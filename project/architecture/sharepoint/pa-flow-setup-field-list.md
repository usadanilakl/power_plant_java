# Power Automate Flow Setup: Field Lists

Step-by-step guide to create the Field Lists flow in Power Automate.

---

## Step 1: SharePoint List "Field Lists"

The list is auto-provisioned via Admin > SharePoint tab (`SharePointListProvisioner`). Verify these columns exist:

| Internal Name | Display Name | Type | Settings |
|--------------|-------------|------|----------|
| PwaId | PWA ID | Single line of text | UUID from PWA client |
| ListType | List Type | Single line of text | e.g. "Insulation Removal", "Leaks", "Winterization" |
| Status | Status | Single line of text | "Open", "In Progress", "Resolved", "Closed" |
| Location | Location | Single line of text | |
| SpecificLocation | Specific Location | Single line of text | |
| Notes | Notes | Multiple lines of text | Plain text |
| DateObserved | Date Observed | Date and Time | Include time = **Yes**. Combined date+time like WR's DateOfWork |
| EquipmentTag | Equipment Tag | Single line of text | Tag number — server resolves to LotoPoint (preferred) or Equipment |
| SubmitterName | Submitter Name | Single line of text | |
| SubmitterEmail | Submitter Email | Single line of text | |
| SubmitterPhone | Submitter Phone | Single line of text | |

**Note:** The built-in `Title` column will be auto-filled with the item's `title` field.

---

## Step 2: Create the Flow

1. Go to **Power Automate** > **My flows** > **+ New flow** > **Instant cloud flow**
2. Name: **Field List V2**
3. Trigger: **When an HTTP request is received**
4. Click **Use sample payload to generate schema** and paste:

```json
{
  "actionType": "create",
  "id": null,
  "data": {
    "Title": "Removed insulation from valve V-101",
    "PwaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ListType": "Insulation Removal",
    "Status": "Open",
    "Location": "Turbine Hall",
    "SpecificLocation": "Level 3, Column A5",
    "Notes": "Removed 2 inch insulation wrap from valve. Pipe exposed for inspection.",
    "DateObserved": "2026-03-15T09:30:00",
    "EquipmentTag": "V-101",
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
3. Create these cases: `create`, `getAll`, `update`, `addAttachment`

---

## Step 5: Implement `create` Case

### 5a. Create item in SharePoint

1. Inside the `create` case, add **SharePoint > Create item**
2. Site Address: (your SharePoint site)
3. List Name: **Field Lists**
4. Map each field from the trigger body `data` object:

| List Column (display name) | Expression / Dynamic Content |
|-------------|------------------------------|
| Title | `triggerBody()?['data']?['Title']` |
| PWA ID | `triggerBody()?['data']?['PwaId']` |
| List Type | `triggerBody()?['data']?['ListType']` |
| Status | `triggerBody()?['data']?['Status']` |
| Location | `triggerBody()?['data']?['Location']` |
| Specific Location | `triggerBody()?['data']?['SpecificLocation']` |
| Notes | `triggerBody()?['data']?['Notes']` |
| Date Observed | `triggerBody()?['data']?['DateObserved']` |
| Equipment Tag | `triggerBody()?['data']?['EquipmentTag']` |
| Submitter Name | `triggerBody()?['data']?['SubmitterName']` |
| Submitter Email | `triggerBody()?['data']?['SubmitterEmail']` |
| Submitter Phone | `triggerBody()?['data']?['SubmitterPhone']` |

### 5b. Set `responseId`

After the Create item action:
- Add **Set variable**: `responseId` = `string(body('Create_item')?['ID'])`

### 5c. Process Attachments (if any)

1. Add a **Condition**: `length(triggerBody()?['attachments'])` is greater than `0`
2. If **Yes**:
   - Add **Apply to each** over `triggerBody()?['attachments']`
   - Inside the loop, add **SharePoint > Add attachment**:
     - Site Address: (your site)
     - List Name: **Field Lists**
     - Id: `body('Create_item')?['ID']`
     - File Name: `items('Apply_to_each')?['fileName']`
     - File Content: `base64ToBinary(items('Apply_to_each')?['base64Content'])`

**Important:** `base64ToBinary()` is a built-in PA function that converts base64 to binary for SharePoint attachments.

---

## Step 6: Implement `getAll` Case

### 6a. Get items from SharePoint

1. Inside the `getAll` case, add **SharePoint > Get items**
2. Site Address: (your site)
3. List Name: **Field Lists**
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
| ListType | `item()?['ListType']` |
| Status | `item()?['Status']` |
| Location | `item()?['Location']` |
| SpecificLocation | `item()?['SpecificLocation']` |
| Notes | `item()?['Notes']` |
| DateObserved | `item()?['DateObserved']` |
| EquipmentTag | `item()?['EquipmentTag']` |
| SubmitterName | `item()?['SubmitterName']` |
| SubmitterEmail | `item()?['SubmitterEmail']` |
| SubmitterPhone | `item()?['SubmitterPhone']` |
| Modified | `item()?['Modified']` |

**Note:** All columns are plain text (no Choice columns), so no `?['Value']` extraction needed — simpler than Work Requests.

2. Add **Set variable**: `responseData` = `body('Select')`

---

## Step 7: Implement `update` Case

1. Inside the `update` case, add **SharePoint > Update item**
2. Site Address: (your site)
3. List Name: **Field Lists**
4. Id: `triggerBody()?['id']`
5. Map the same fields as in the `create` step (Step 5a), all from `triggerBody()?['data']`
6. Set variable: `responseId` = `triggerBody()?['id']`

---

## Step 8: Implement `addAttachment` Case

1. Inside the `addAttachment` case, add **Apply to each** over `triggerBody()?['attachments']`
2. Inside the loop, add **SharePoint > Add attachment**:
   - Site Address: (your site)
   - List Name: **Field Lists**
   - Id: `triggerBody()?['id']`
   - File Name: `items('Apply_to_each_2')?['fileName']`
   - File Content: `base64ToBinary(items('Apply_to_each_2')?['base64Content'])`
3. After the loop, set variable: `responseId` = `triggerBody()?['id']`

---

## Step 9: Add Scope with Error Handling

Wrap the Switch block in a Scope. The success Response goes inside the Scope (after Switch). The failure path runs only when the Scope fails.

### 9a. Create the Scope

1. Add a **Scope** action, name it `Scope`
2. Move the **Switch** action inside the Scope

### 9b. Add success response inside the Scope

After the Switch (still inside the Scope), add:

1. **Set variable**: `responseMessage` = (empty string, or a success message)
2. **Response — Success** action:
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

### 9c. Add failure branch after the Scope

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
Add to `application.properties` (alongside the other `pa.flow.*` URLs):
```properties
pa.flow.field-list-url=<your-flow-url>
```

### 11d. Test with curl

**Test `create`:**
```bash
curl -X POST "<your-flow-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "create",
    "id": null,
    "data": {
      "Title": "Removed insulation from valve V-101",
      "PwaId": "test-uuid-field-list-1234",
      "ListType": "Insulation Removal",
      "Status": "Open",
      "Location": "Turbine Hall",
      "SpecificLocation": "Level 3, Column A5",
      "Notes": "Removed 2 inch insulation wrap from valve.",
      "DateObserved": "2026-03-15T09:30:00",
      "EquipmentTag": "V-101",
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
│   ├── Switch (actionType, 4 Cases)
│   │   ├── Case: create
│   │   │   ├── Create item (SharePoint → "Field Lists")
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
│   │   └── Case: addAttachment
│   │       ├── Apply to each → Add attachment
│   │       └── Set variable: responseId
│   │
│   ├── SetResponseMessage
│   └── Response Success (200, JSON)
│
└── [Failure branch — Configure run after: Scope "has failed"]
    ├── SetResponseSuccess = false
    ├── SetResponseMessage2 = error detail
    └── Response Failed (200, JSON)
```

---

## Key Differences from Other Flows

1. **No Choice columns** — ListType and Status are plain text fields, not SharePoint Choice columns. This simplifies the flow (no `?['Value']` extraction in getAll Select).
2. **DateObserved is DateTime** — Combined date+time in one SP DateTime column (same pattern as WR's DateOfWork). The backend splits it into separate date/time strings internally using `fromSharePointDateTime()`.
3. **Single EquipmentTag column** — One column for both equipment and loto point tags. The Java backend resolves the tag to a LotoPoint (preferred) or Equipment entity server-side.
4. **ListType as discriminator** — All list types (Insulation Removal, Leaks, Winterization) share one list. Users can filter in SharePoint views by the ListType column.

## Common Pitfalls

1. **Column internal names.** If your Select expressions return null, the internal name may differ. Check via List Settings > click column > URL parameter `Field=`.
2. **Get items default limit.** Default Top Count is 100. Set it to 5000 to get all items.
3. **base64ToBinary expression.** For attachments, always use `base64ToBinary()` — not `decodeBase64`.
4. **Apply to each naming.** If you have loops in multiple cases, PA auto-names them `Apply_to_each`, `Apply_to_each_2`, etc. Verify the correct name in expressions.
5. **HTTP Response must be last.** Place the Response action after the Switch, not inside a case.
