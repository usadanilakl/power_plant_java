# Power Automate Flow Setup: Venting Permit

Step-by-step guide to create the Venting Permit flow in Power Automate.

---

## Step 1: SharePoint List "Venting Permits"

Create (or verify) a list called **Venting Permits** with PascalCase internal names. Verify these columns exist:

| Internal Name | Display Name | Type | Settings |
|--------------|-------------|------|----------|
| PwaId | PWA ID | Single line of text | UUID from PWA client |
| Date | Date | Single line of text | ISO date string |
| Time | Time | Single line of text | |
| LocationOfWork | Location Of Work | Single line of text | |
| IssuedTo | Issued To | Single line of text | |
| PlantName | Plant Name | Single line of text | |
| SystemName | System Name | Single line of text | |
| RequestingIndividual | Requesting Individual | Single line of text | |
| Purpose | Purpose | Multiple lines of text | Plain text |
| TimeCommence | Time Commence | Single line of text | |
| TimeConclude | Time Conclude | Single line of text | |
| GasType | Gas Type | Single line of text | |
| LEL | LEL | Single line of text | |
| UEL | UEL | Single line of text | |
| CalculatedVolume | Calculated Volume | Single line of text | |
| Pressure | Pressure | Single line of text | |
| GasIndicatorModel | Gas Indicator Model | Single line of text | |
| GasIndicatorSerial | Gas Indicator Serial | Single line of text | |
| CalibrationDate | Calibration Date | Single line of text | |
| Status | Status | Choice | Choices: `Active`, `Closed`, `Archived`. Default: `Active` |

**Note:** The built-in `Title` column will be left as-is (SharePoint requires it). We'll auto-fill it with `WorkScope` in the flow.

---

## Step 2: Create the Flow

1. Go to **Power Automate** > **My flows** > **+ New flow** > **Instant cloud flow**
2. Name: **Venting V2**
3. Trigger: **When an HTTP request is received**
4. Click **Use sample payload to generate schema** and paste:

```json
{
  "actionType": "create",
  "id": null,
  "data": {
    "PwaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "Date": "2026-03-03",
    "Time": "08:00",
    "LocationOfWork": "Turbine Hall",
    "IssuedTo": "John Smith",
    "PlantName": "Plant A",
    "SystemName": "Steam System",
    "RequestingIndividual": "DK",
    "Purpose": "Vent steam line for maintenance",
    "TimeCommence": "08:00",
    "TimeConclude": "16:00",
    "GasType": "Natural Gas",
    "LEL": "5.0",
    "UEL": "15.0",
    "CalculatedVolume": "250",
    "Pressure": "30",
    "GasIndicatorModel": "MSA Altair 5X",
    "GasIndicatorSerial": "SN-12345",
    "CalibrationDate": "2026-01-15",
    "Status": "Active"
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
3. List Name: **Venting Permits**
4. Map each field from the trigger body `data` object:

| List Column (display name) | Expression / Dynamic Content |
|-------------|------------------------------|
| Title | `triggerBody()?['data']?['Purpose']` |
| PWA ID | `triggerBody()?['data']?['PwaId']` |
| Date | `triggerBody()?['data']?['Date']` |
| Time | `triggerBody()?['data']?['Time']` |
| Location Of Work | `triggerBody()?['data']?['LocationOfWork']` |
| Issued To | `triggerBody()?['data']?['IssuedTo']` |
| Plant Name | `triggerBody()?['data']?['PlantName']` |
| System Name | `triggerBody()?['data']?['SystemName']` |
| Requesting Individual | `triggerBody()?['data']?['RequestingIndividual']` |
| Purpose | `triggerBody()?['data']?['Purpose']` |
| Time Commence | `triggerBody()?['data']?['TimeCommence']` |
| Time Conclude | `triggerBody()?['data']?['TimeConclude']` |
| Gas Type | `triggerBody()?['data']?['GasType']` |
| LEL | `triggerBody()?['data']?['LEL']` |
| UEL | `triggerBody()?['data']?['UEL']` |
| Calculated Volume | `triggerBody()?['data']?['CalculatedVolume']` |
| Pressure | `triggerBody()?['data']?['Pressure']` |
| Gas Indicator Model | `triggerBody()?['data']?['GasIndicatorModel']` |
| Gas Indicator Serial | `triggerBody()?['data']?['GasIndicatorSerial']` |
| Calibration Date | `triggerBody()?['data']?['CalibrationDate']` |
| Status | `triggerBody()?['data']?['Status']` |

**Tip:** For the Choice column (Status), the value must match one of the defined choices exactly (e.g. `Active`, `Closed`, `Archived`). Ensure the client always sends valid values.

### 5b. Set `responseId`

After the Create item action:
- Add **Set variable**: `responseId` = `string(body('Create_item')?['ID'])`

### 5c. Process Attachments (if any)

1. Add a **Condition**: `length(triggerBody()?['attachments'])` is greater than `0`
2. If **Yes**:
   - Add **Apply to each** over `triggerBody()?['attachments']`
   - Inside the loop, add **SharePoint > Add attachment**:
     - Site Address: (your site)
     - List Name: **Venting Permits**
     - Id: `body('Create_item')?['ID']`
     - File Name: `items('Apply_to_each')?['fileName']`
     - File Content: `base64ToBinary(items('Apply_to_each')?['base64Content'])`

**Important:** `base64ToBinary()` is a built-in PA function that converts base64 to binary for SharePoint attachments.

---

## Step 6: Implement `getAll` Case

### 6a. Get items from SharePoint

1. Inside the `getAll` case, add **SharePoint > Get items**
2. Site Address: (your site)
3. List Name: **Venting Permits**
4. Filter Query: `Status ne 'Archived'`
5. Top Count: 5000 (default is 100)

### 6b. Build response data array

1. Add **Select** action:
   - From: `body('Get_items')?['value']`
   - Use **Map mode** (key → value pairs):

| Key | Value |
|-----|-------|
| ID | `string(item()?['ID'])` |
| PwaId | `item()?['PwaId']` |
| Date | `item()?['Date']` |
| Time | `item()?['Time']` |
| LocationOfWork | `item()?['LocationOfWork']` |
| IssuedTo | `item()?['IssuedTo']` |
| PlantName | `item()?['PlantName']` |
| SystemName | `item()?['SystemName']` |
| RequestingIndividual | `item()?['RequestingIndividual']` |
| Purpose | `item()?['Purpose']` |
| TimeCommence | `item()?['TimeCommence']` |
| TimeConclude | `item()?['TimeConclude']` |
| GasType | `item()?['GasType']` |
| LEL | `item()?['LEL']` |
| UEL | `item()?['UEL']` |
| CalculatedVolume | `item()?['CalculatedVolume']` |
| Pressure | `item()?['Pressure']` |
| GasIndicatorModel | `item()?['GasIndicatorModel']` |
| GasIndicatorSerial | `item()?['GasIndicatorSerial']` |
| CalibrationDate | `item()?['CalibrationDate']` |
| Status | `item()?['Status']?['Value']` |

**Note:** The Status Choice column returns an object like `{"Value": "Active"}`. Use `?['Value']` to extract the string.

2. Add **Set variable**: `responseData` = `body('Select')`

---

## Step 7: Implement `update` Case

1. Inside the `update` case, add **SharePoint > Update item**
2. Site Address: (your site)
3. List Name: **Venting Permits**
4. Id: `triggerBody()?['id']`
5. Map the same fields as in the `create` step (Step 5a), all from `triggerBody()?['data']`
6. Set variable: `responseId` = `triggerBody()?['id']`

**Note:** `update` handles all modifications — field changes, status changes, archiving. Examples:
- Full update: `{ "actionType": "update", "id": "42", "data": { "Purpose": "...", "Status": "Active" } }`
- Archive: `{ "actionType": "update", "id": "42", "data": { "Status": "Archived" } }`
- Change status: `{ "actionType": "update", "id": "42", "data": { "Status": "Closed" } }`

---

## Step 8: Implement `addAttachment` Case

1. Inside the `addAttachment` case, add **Apply to each** over `triggerBody()?['attachments']`
2. Inside the loop, add **SharePoint > Add attachment**:
   - Site Address: (your site)
   - List Name: **Venting Permits**
   - Id: `triggerBody()?['id']`
   - File Name: `items('Apply_to_each_2')?['fileName']`
   - File Content: `base64ToBinary(items('Apply_to_each_2')?['base64Content'])`
3. After the loop, set variable: `responseId` = `triggerBody()?['id']`

**Note:** This is for adding attachments to an existing item (e.g. user adds photos after initial submission). Normal `create` already handles attachments in one go.

---

## Step 9: Add Error Handling (Optional — Can Add Later)

Wrap **each individual case** in its own Scope (not the whole Switch). This gives you specific error messages per action type and independent error handling.

### 9a. Wrap each case in a Scope

For each case (create, getAll, update, addAttachment):

1. Select all actions inside the case
2. Click **Add an action** > search **Scope** > add it
3. Drag the existing actions into the Scope
4. Name the Scope clearly: `Scope - Create`, `Scope - GetAll`, `Scope - Update`, `Scope - AddAttachment`

### 9b. Add failure branch for each Scope

After each Scope:

1. Click the **+** below the Scope → **Add a parallel branch**
2. Click the **...** on the parallel branch → **Configure run after** → check only **"has failed"** (uncheck "is successful")
3. Inside the failure branch, add two **Set variable** actions:
   - `responseSuccess` = `false`
   - `responseMessage` = error expression (see table below)

### 9c. Error message expressions per case

| Case | Scope Name | `responseMessage` Expression |
|------|-----------|------------------------------|
| create | Scope - Create | `result('Scope_-_Create')?[0]?['error']?['message']` |
| getAll | Scope - GetAll | `result('Scope_-_GetAll')?[0]?['error']?['message']` |
| update | Scope - Update | `result('Scope_-_Update')?[0]?['error']?['message']` |
| addAttachment | Scope - AddAttachment | `result('Scope_-_AddAttachment')?[0]?['error']?['message']` |

**Note:** The Scope name in the expression must match exactly (with underscores replacing spaces and hyphens). Check the action name in the designer if unsure.

### 9d. Example: `create` case with Scope

```
Case: create
├── Scope - Create
│   ├── Create item (SharePoint)
│   ├── Set variable: responseId
│   └── Condition: has attachments?
│       └── Yes: Apply to each → Add attachment
│
└── [Parallel branch — runs only on failure]
    ├── Set variable: responseSuccess = false
    └── Set variable: responseMessage = result('Scope_-_Create')...
```

Repeat this pattern for all four cases.

**Simplified alternative:** Skip Scopes initially. If a SharePoint action fails, the flow will return an error automatically (PA's default behavior). Get the happy path working first, then add Scopes later for cleaner error messages.

---

## Step 10: Add the HTTP Response

After the Switch block (at the very bottom of the flow):

1. Add **Response** action
2. Status Code: `200`
3. Headers: `Content-Type` = `application/json`
4. Body:
```json
{
  "success": @{variables('responseSuccess')},
  "id": "@{variables('responseId')}",
  "data": @{variables('responseData')},
  "message": "@{variables('responseMessage')}"
}
```

---

## Step 11: Save and Test

### 11a. Save the flow
Click **Save** in Power Automate.

### 11b. Copy the trigger URL
Go back to the trigger step → copy the HTTP POST URL.

### 11c. Update URLs if changed
If the URL changed from what's currently configured, update:
- **Java:** `src/main/resources/application.properties` → `pa.flow.venting-url`

### 11d. Test with Postman or curl

**Test `create`:**
```bash
curl -X POST "<your-flow-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "create",
    "id": null,
    "data": {
      "PwaId": "test-uuid-1234",
      "Date": "2026-03-03",
      "Time": "08:00",
      "LocationOfWork": "Turbine Hall",
      "IssuedTo": "John Smith",
      "PlantName": "Plant A",
      "SystemName": "Steam System",
      "RequestingIndividual": "DK",
      "Purpose": "Vent steam line for maintenance",
      "TimeCommence": "08:00",
      "TimeConclude": "16:00",
      "GasType": "Natural Gas",
      "LEL": "5.0",
      "UEL": "15.0",
      "CalculatedVolume": "250",
      "Pressure": "30",
      "GasIndicatorModel": "MSA Altair 5X",
      "GasIndicatorSerial": "SN-12345",
      "CalibrationDate": "2026-01-15",
      "Status": "Active"
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

Expected response:
```json
{
  "success": true,
  "id": "",
  "data": [
    {
      "ID": "1",
      "PwaId": "test-uuid-1234",
      "Date": "2026-03-03",
      "Time": "08:00",
      "LocationOfWork": "Turbine Hall",
      "IssuedTo": "John Smith",
      "PlantName": "Plant A",
      "SystemName": "Steam System",
      "RequestingIndividual": "DK",
      "Purpose": "Vent steam line for maintenance",
      "..."
    }
  ],
  "message": ""
}
```

### 11e. Test from the PWA
1. Run the Angular app
2. Open the app, go to Venting Permits
3. Fill out a form and submit
4. Verify the item appears in the SharePoint List

---

## Flow Structure Summary

```
Trigger: When an HTTP request is received
│
├── Initialize variable: responseSuccess (Boolean = true)
├── Initialize variable: responseId (String = "")
├── Initialize variable: responseMessage (String = "")
├── Initialize variable: responseData (Array = [])
│
├── Switch (actionType)
│   │
│   ├── Case: create
│   │   ├── Scope - Create
│   │   │   ├── Create item (SharePoint)
│   │   │   ├── Set variable: responseId
│   │   │   └── Condition: has attachments?
│   │   │       └── Yes: Apply to each → Add attachment
│   │   └── [On failure] Set responseSuccess=false, responseMessage=error
│   │
│   ├── Case: getAll
│   │   ├── Scope - GetAll
│   │   │   ├── Get items (SharePoint, filter: Status ne 'Archived')
│   │   │   ├── Select (map fields to schema)
│   │   │   └── Set variable: responseData
│   │   └── [On failure] Set responseSuccess=false, responseMessage=error
│   │
│   ├── Case: update
│   │   ├── Scope - Update
│   │   │   ├── Update item (SharePoint)
│   │   │   └── Set variable: responseId
│   │   └── [On failure] Set responseSuccess=false, responseMessage=error
│   │
│   └── Case: addAttachment
│       ├── Scope - AddAttachment
│       │   ├── Apply to each → Add attachment
│       │   └── Set variable: responseId
│       └── [On failure] Set responseSuccess=false, responseMessage=error
│
└── Response (200, JSON body with success/id/data/message)
```

---

## Common Pitfalls

1. **Choice columns require exact match.** If you send `"active"` (lowercase) to a Choice column defined as `Active`, it will fail. Always send exact case-matched values.

2. **base64ToBinary expression.** This is a built-in PA function. Don't use `decodeBase64` or other names — the correct one is `base64ToBinary()`.

3. **Get items returns max 5000.** The default Top Count for "Get items" is 100. Increase it to 5000 if needed.

4. **Apply to each naming.** When you have multiple loops (one in create, one in addAttachment), PA auto-names them `Apply_to_each`, `Apply_to_each_2`, etc. Make sure expressions reference the correct loop name.

5. **Title column.** SharePoint requires the Title column. Auto-fill it with `Purpose`. You can hide it from views.

6. **HTTP Response must be last.** The Response action should be at the very bottom after the Switch, not inside a case.

7. **Column internal names.** If your Select expressions in getAll return null for a field, the internal name likely doesn't match. Check the column's internal name in List Settings > click column > look at the URL parameter `Field=`.

8. **Properties config key.** The Java application properties key for this flow URL is `pa.flow.venting-url`. Make sure this matches what `SharepointAccessService` or `PowerAutomateAccess` expects.
