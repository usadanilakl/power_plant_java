# Power Automate Flow Setup: JHA (Job Hazard Analysis)

Step-by-step guide to create the JHA SharePoint list and Power Automate flow.
Follows the same pattern as the Work Request flow (see `pa-flow-setup-work-request.md`).

---

## Step 1: Create SharePoint List "JHA"

Go to your SharePoint site > **Site contents** > **+ New** > **List** > **Blank list**

Name: **JHA**

Add these columns (all PascalCase internal names):

| Internal Name | Display Name | Type | Settings |
|--------------|-------------|------|----------|
| PwaId | PWA ID | Single line of text | UUID from PWA client |
| JobName | Job Name | Single line of text | Required |
| Applicability | Applicability | Single line of text | |
| AnalysisBy | Analysis By | Single line of text | |
| ReviewedBy | Reviewed By | Single line of text | |
| ApprovedBy | Approved By | Single line of text | |
| Date | Date | Single line of text | Stored as ISO date string (e.g. `2026-02-11`) |
| PPE | PPE | Multiple lines of text | Plain text |
| LOTO | LOTO | Multiple lines of text | Plain text |
| ConfinedSpace | Confined Space | Multiple lines of text | Plain text |
| HazCom | HazCom | Multiple lines of text | Plain text |
| HandAndPowerTools | Hand And Power Tools | Multiple lines of text | Plain text |
| SpecialTools | Special Tools | Multiple lines of text | Plain text |
| JobSteps | Job Steps | Multiple lines of text | Plain text — stores JSON array |
| WorkRequestSharepointId | Work Request ID | Single line of text | SharePoint ID of parent WR |
| SubmitterName | Submitter Name | Single line of text | |
| SubmitterEmail | Submitter Email | Single line of text | |
| SubmitterPhone | Submitter Phone | Single line of text | |
| SubmitterCompany | Submitter Company | Single line of text | |
| TimeSubmitted | Time Submitted | Single line of text | Stores ISO 8601 timestamp |
| Status | Status | Choice | Choices: `Active`, `Closed`, `Archived`, `Revoked`. Default: `Active` |

**Notes:**
- The built-in `Title` column will be auto-filled with `JobName` in the flow.
- `Date` is stored as a text field (not Date and Time) because it comes from the PWA as a simple `YYYY-MM-DD` string without a time component.
- `JobSteps` stores a JSON array: `[{"sequence":1,"description":"...","hazard":"...","safetyMeasures":"..."}]`
- `WorkRequestSharepointId` links this JHA to its parent Work Request list item. This is a string reference, not a lookup column.

---

## Step 2: Create the Flow

1. Go to **Power Automate** > **My flows** > **+ New flow** > **Instant cloud flow**
2. Name: **JHA V2**
3. Trigger: **When an HTTP request is received**
4. Click **Use sample payload to generate schema** and paste:

```json
{
  "actionType": "create",
  "id": null,
  "data": {
    "PwaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "JobName": "Replace Circuit Panel",
    "Applicability": "Electrical Maintenance",
    "AnalysisBy": "D. West",
    "ReviewedBy": "R. Cole",
    "ApprovedBy": "M. Brooks",
    "Date": "2026-02-11",
    "PPE": "Hard hat, gloves, safety glasses",
    "LOTO": "Yes",
    "ConfinedSpace": "No",
    "HazCom": "Yes",
    "HandAndPowerTools": "Insulated screwdrivers, torque wrench",
    "SpecialTools": "Multimeter, thermal camera",
    "JobSteps": "[{\"sequence\":1,\"description\":\"Lockout panel\",\"hazard\":\"Electrical shock\",\"safetyMeasures\":\"Apply LOTO\"}]",
    "WorkRequestSharepointId": "42",
    "SubmitterName": "DK",
    "SubmitterEmail": "dk@company.com",
    "SubmitterPhone": "555-1234",
    "SubmitterCompany": "DK Power",
    "TimeSubmitted": "2026-02-11T03:40:54Z",
    "Status": "Active"
  },
  "attachments": [
    {
      "fileName": "JHA-form.png",
      "contentType": "image/png",
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

Add these actions right after the trigger (same as Work Request flow):

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
3. List Name: **JHA**
4. Map each field from the trigger body `data` object:

| List Column (display name) | Expression / Dynamic Content |
|-------------|------------------------------|
| Title | `triggerBody()?['data']?['JobName']` |
| PWA ID | `triggerBody()?['data']?['PwaId']` |
| Job Name | `triggerBody()?['data']?['JobName']` |
| Applicability | `triggerBody()?['data']?['Applicability']` |
| Analysis By | `triggerBody()?['data']?['AnalysisBy']` |
| Reviewed By | `triggerBody()?['data']?['ReviewedBy']` |
| Approved By | `triggerBody()?['data']?['ApprovedBy']` |
| Date | `triggerBody()?['data']?['Date']` |
| PPE | `triggerBody()?['data']?['PPE']` |
| LOTO | `triggerBody()?['data']?['LOTO']` |
| Confined Space | `triggerBody()?['data']?['ConfinedSpace']` |
| HazCom | `triggerBody()?['data']?['HazCom']` |
| Hand And Power Tools | `triggerBody()?['data']?['HandAndPowerTools']` |
| Special Tools | `triggerBody()?['data']?['SpecialTools']` |
| Job Steps | `triggerBody()?['data']?['JobSteps']` |
| Work Request ID | `triggerBody()?['data']?['WorkRequestSharepointId']` |
| Submitter Name | `triggerBody()?['data']?['SubmitterName']` |
| Submitter Email | `triggerBody()?['data']?['SubmitterEmail']` |
| Submitter Phone | `triggerBody()?['data']?['SubmitterPhone']` |
| Submitter Company | `triggerBody()?['data']?['SubmitterCompany']` |
| Time Submitted | `triggerBody()?['data']?['TimeSubmitted']` |
| Status | `triggerBody()?['data']?['Status']` |

**Tip:** The Status Choice column values must match exactly: `Active`, `Closed`, `Archived`, `Revoked`.

### 5b. Set `responseId`

After the Create item action:
- Add **Set variable**: `responseId` = `string(body('Create_item')?['ID'])`

### 5c. Process Attachments (if any)

1. Add a **Condition**: `length(triggerBody()?['attachments'])` is greater than `0`
2. If **Yes**:
   - Add **Apply to each** over `triggerBody()?['attachments']`
   - Inside the loop, add **SharePoint > Add attachment**:
     - Site Address: (your site)
     - List Name: **JHA**
     - Id: `body('Create_item')?['ID']`
     - File Name: `items('Apply_to_each')?['fileName']`
     - File Content: `base64ToBinary(items('Apply_to_each')?['base64Content'])`

### 5d. (Optional) Also attach JHA image to the parent Work Request

If `WorkRequestSharepointId` is not empty, you can add the form image to the WR too:

1. After the JHA attachment loop, add a **Condition**: `not(empty(triggerBody()?['data']?['WorkRequestSharepointId']))`
2. If **Yes**:
   - Add **Apply to each** over `triggerBody()?['attachments']`
   - Inside: **SharePoint > Add attachment**:
     - List Name: **Work Requests**
     - Id: `triggerBody()?['data']?['WorkRequestSharepointId']`
     - File Name: `concat('JHA-', items('Apply_to_each_2')?['fileName'])`
     - File Content: `base64ToBinary(items('Apply_to_each_2')?['base64Content'])`

**Note:** This step is optional. It can be added later if cross-attachment is needed.

---

## Step 6: Implement `getAll` Case

### 6a. Get items from SharePoint

1. Inside the `getAll` case, add **SharePoint > Get items**
2. Site Address: (your site)
3. List Name: **JHA**
4. Filter Query: `Status ne 'Archived'`
5. Top Count: 5000

### 6b. Build response data array

1. Add **Select** action:
   - From: `body('Get_items')?['value']`
   - Use **Map mode** (key/value pairs):

| Key | Value |
|-----|-------|
| ID | `string(item()?['ID'])` |
| PwaId | `item()?['PwaId']` |
| JobName | `item()?['JobName']` |
| Applicability | `item()?['Applicability']` |
| AnalysisBy | `item()?['AnalysisBy']` |
| ReviewedBy | `item()?['ReviewedBy']` |
| ApprovedBy | `item()?['ApprovedBy']` |
| Date | `item()?['Date']` |
| PPE | `item()?['PPE']` |
| LOTO | `item()?['LOTO']` |
| ConfinedSpace | `item()?['ConfinedSpace']` |
| HazCom | `item()?['HazCom']` |
| HandAndPowerTools | `item()?['HandAndPowerTools']` |
| SpecialTools | `item()?['SpecialTools']` |
| JobSteps | `item()?['JobSteps']` |
| WorkRequestSharepointId | `item()?['WorkRequestSharepointId']` |
| SubmitterName | `item()?['SubmitterName']` |
| SubmitterEmail | `item()?['SubmitterEmail']` |
| SubmitterPhone | `item()?['SubmitterPhone']` |
| SubmitterCompany | `item()?['SubmitterCompany']` |
| TimeSubmitted | `item()?['TimeSubmitted']` |
| Status | `item()?['Status']?['Value']` |

**Note:** Status is a Choice column — use `?['Value']` to extract the string. All other columns are text, so no `?['Value']` needed.

2. Add **Set variable**: `responseData` = `body('Select')`

---

## Step 7: Implement `update` Case

1. Inside the `update` case, add **SharePoint > Update item**
2. Site Address: (your site)
3. List Name: **JHA**
4. Id: `triggerBody()?['id']`
5. Map the same fields as in Step 5a, all from `triggerBody()?['data']`
6. Set variable: `responseId` = `triggerBody()?['id']`

**Usage examples:**
- Full update: `{ "actionType": "update", "id": "15", "data": { "JobName": "...", "Status": "Active", ... } }`
- Revoke: `{ "actionType": "update", "id": "15", "data": { "Status": "Revoked" } }`
- Archive: `{ "actionType": "update", "id": "15", "data": { "Status": "Archived" } }`

---

## Step 8: Implement `addAttachment` Case

1. Inside the `addAttachment` case, add **Apply to each** over `triggerBody()?['attachments']`
2. Inside the loop, add **SharePoint > Add attachment**:
   - Site Address: (your site)
   - List Name: **JHA**
   - Id: `triggerBody()?['id']`
   - File Name: `items('Apply_to_each_3')?['fileName']`
   - File Content: `base64ToBinary(items('Apply_to_each_3')?['base64Content'])`
3. After the loop, set variable: `responseId` = `triggerBody()?['id']`

**Note:** Check the auto-generated loop name (`Apply_to_each_3`, etc.) — PA increments the suffix for each Apply to each in the flow.

---

## Step 9: Add Error Handling (Optional — Can Add Later)

Same pattern as Work Request flow. Wrap each case in a Scope, add a parallel failure branch that sets `responseSuccess = false` and `responseMessage = result('Scope_-_CaseName')...`.

See `pa-flow-setup-work-request.md` Step 9 for the detailed walkthrough.

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

## Step 11: Save and Configure URLs

### 11a. Save the flow
Click **Save** in Power Automate.

### 11b. Copy the trigger URL
Go back to the trigger step > copy the HTTP POST URL.

### 11c. Update configuration

Update these locations with the new flow URL:

| Location | File | Property |
|----------|------|----------|
| PWA dev | `browser/ng-ui/src/environments/environment.ts` | `paFlowUrls.jha` |
| PWA prod | `browser/ng-ui/src/environments/environment.prod.ts` | `paFlowUrls.jha` |
| Java | `src/main/resources/application.properties` | `pa.flow.jha-url` |

---

## Step 12: Test

### 12a. Test `create` with curl

```bash
curl -X POST "<your-flow-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "create",
    "id": null,
    "data": {
      "PwaId": "test-jha-uuid-1234",
      "JobName": "Test JHA - Replace Panel",
      "Applicability": "Electrical",
      "AnalysisBy": "Test User",
      "ReviewedBy": "Reviewer",
      "ApprovedBy": "Approver",
      "Date": "2026-02-11",
      "PPE": "Hard hat, gloves",
      "LOTO": "Yes - lockout required",
      "ConfinedSpace": "No",
      "HazCom": "Yes",
      "HandAndPowerTools": "Screwdrivers",
      "SpecialTools": "Multimeter",
      "JobSteps": "[{\"sequence\":1,\"description\":\"Lock out\",\"hazard\":\"Shock\",\"safetyMeasures\":\"LOTO\"}]",
      "WorkRequestSharepointId": "",
      "SubmitterName": "Test User",
      "SubmitterEmail": "test@example.com",
      "SubmitterPhone": "555-0000",
      "SubmitterCompany": "Test Co",
      "TimeSubmitted": "2026-02-11T15:20:54Z",
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

### 12b. Test `getAll`

```bash
curl -X POST "<your-flow-url>" \
  -H "Content-Type: application/json" \
  -d '{"actionType": "getAll"}'
```

### 12c. Test from the PWA

1. Run: `cd browser/ng-ui && ng serve`
2. Open the app > navigate to JHA
3. Select a work request, fill out the form, submit
4. Check browser console for `[Orchestrator]` logs
5. Verify the item appears in the SharePoint JHA list

---

## Flow Structure Summary

```
Trigger: When an HTTP request is received
|
+-- Initialize variable: responseSuccess (Boolean = true)
+-- Initialize variable: responseId (String = "")
+-- Initialize variable: responseMessage (String = "")
+-- Initialize variable: responseData (Array = [])
|
+-- Switch (actionType)
|   |
|   +-- Case: create
|   |   +-- Scope - Create
|   |   |   +-- Create item (SharePoint - JHA list)
|   |   |   +-- Set variable: responseId
|   |   |   +-- Condition: has attachments?
|   |   |       +-- Yes: Apply to each -> Add attachment (to JHA item)
|   |   |       +-- (Optional) Condition: WorkRequestSharepointId not empty?
|   |   |           +-- Yes: Apply to each -> Add attachment (to WR item too)
|   |   +-- [On failure] Set responseSuccess=false, responseMessage=error
|   |
|   +-- Case: getAll
|   |   +-- Scope - GetAll
|   |   |   +-- Get items (SharePoint, filter: Status ne 'Archived')
|   |   |   +-- Select (map fields to response schema)
|   |   |   +-- Set variable: responseData
|   |   +-- [On failure] Set responseSuccess=false, responseMessage=error
|   |
|   +-- Case: update
|   |   +-- Scope - Update
|   |   |   +-- Update item (SharePoint)
|   |   |   +-- Set variable: responseId
|   |   +-- [On failure] Set responseSuccess=false, responseMessage=error
|   |
|   +-- Case: addAttachment
|       +-- Scope - AddAttachment
|       |   +-- Apply to each -> Add attachment
|       |   +-- Set variable: responseId
|       +-- [On failure] Set responseSuccess=false, responseMessage=error
|
+-- Response (200, JSON body with success/id/data/message)
```

---

## Differences from Work Request Flow

| Aspect | Work Request | JHA |
|--------|-------------|-----|
| List name | Work Requests | JHA |
| Column count | 18 data columns | 21 data columns |
| Choice columns | IsLOTORequired, IsHotWorkRequired, IsConfinedSpaceEntryRequired, Status | Status only |
| Date column | DateOfWork (Date and Time type) | Date (text — ISO date only, no time) |
| JobSteps | N/A | JSON text column |
| WorkRequestSharepointId | N/A | Links JHA to parent WR |
| Cross-attachment | N/A | Optional: attach JHA form image to WR too |
| `getAll` Choice extraction | 4 columns need `?['Value']` | 1 column needs `?['Value']` (Status) |

---

## Common Pitfalls

1. **JobSteps is a string, not an object.** The client serializes `jobSteps` to a JSON string before sending. The flow stores it as-is in a Multiple lines of text column. Do NOT use a JSON column type.

2. **Status choice must match exactly.** Valid values: `Active`, `Closed`, `Archived`, `Revoked`. Case matters.

3. **Date is text, not Date and Time.** Unlike Work Requests (which use a DateTime column), JHA Date is a plain text field storing `YYYY-MM-DD`. This avoids timezone conversion issues.

4. **Apply to each loop naming.** With multiple loops (create attachments, optional WR cross-attach, addAttachment case), PA auto-names them `Apply_to_each`, `Apply_to_each_2`, `Apply_to_each_3`. Double-check expressions reference the correct loop.

5. **Title column.** Auto-fill with `JobName`. SharePoint requires Title — you can hide it from views after.

6. **WorkRequestSharepointId may be empty.** If a JHA is submitted without a parent work request, this field will be an empty string. The optional cross-attachment step (5d) should handle this with a condition check.
