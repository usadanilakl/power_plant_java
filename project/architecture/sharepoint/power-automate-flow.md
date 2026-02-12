# Power Automate Flow Architecture

## Overview
Three separate PA flows, one per entity. Each flow connects to its own SharePoint List.
All flows share the same generic request/response schema with entity-specific `data` fields.

Old flows (Excel-based) remain untouched. Java and PWA switch entirely to new List-based flows.

## Flows
| Flow | SharePoint List | URL Property |
|------|----------------|--------------|
| WorkRequest | Work Requests | `pa.flow.work-request-url` |
| JHA | JHA | `pa.flow.jha-url` |
| ConfinedSpace | Confined Spaces | `pa.flow.confined-space-url` |

---

## Generic Request Schema

All flows accept the same top-level structure:

```json
{
  "actionType": "getAll | create | update | addAttachment",
  "id": null,
  "data": {},
  "attachments": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| actionType | string | yes | Determines which branch the flow executes |
| id | string | no | SharePoint list item ID. Used for update/addAttachment |
| data | object | no | Entity-specific fields. Used for create/update. For status changes, include `status` in data |
| attachments | array | no | File attachments for create/addAttachment |

### Attachment Object
```json
{
  "fileName": "photo1.jpg",
  "contentType": "image/jpeg",
  "base64Content": "iVBORw0KGgo..."
}
```

---

## Generic Response Schema

All flows return the same structure:

```json
{
  "success": true,
  "id": "42",
  "data": [],
  "message": ""
}
```

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | true on success, false on failure |
| id | string | Created/updated item's SharePoint ID (for create/update) |
| data | array | List of items (for getAll). Empty for mutations |
| message | string | Error description on failure, empty on success |

---

## WorkRequest Flow

### SharePoint List: "Work Requests"

### `data` Fields
```json
{
  "PwaId": "a1b2c3d4-e5f6-...",
  "DateOfWork": "2026-02-11T15:20:00",
  "WorkRequestedBy": "DK",
  "Company": "DK",
  "LocationOfWork": "Location",
  "AffectedEquipment": "Eq",
  "WorkScope": "Scope",
  "IsLOTORequired": "Yes",
  "IsHotWorkRequired": "No",
  "IsConfinedSpaceEntryRequired": "No",
  "ForemanName": "",
  "FireWatchName": "",
  "SpaceToBeEntered": "",
  "Status": "Active",
  "SubmitterName": "DK",
  "SubmitterEmail": "dk@company.com",
  "SubmitterPhone": "555-1234",
  "SubmitterCompany": "DK",
  "TimeSubmitted": "2026-02-11T03:40:54Z"
}
```

### SharePoint List Columns (Internal Name)
| Internal Name | Type | Notes |
|------------|------|-------|
| PwaId | Single line of text | UUID from PWA client. Allows status check without server |
| DateOfWork | Date and Time | ISO datetime, e.g. `2026-02-11T15:20:00`. App keeps date/time separate in UI, combines for SharePoint |
| WorkRequestedBy | Single line of text | Auto-populated from user setup name |
| Company | Single line of text | Auto-populated from user setup company |
| LocationOfWork | Single line of text | |
| AffectedEquipment | Single line of text | |
| WorkScope | Multiple lines of text | |
| IsLOTORequired | Choice (Yes/No) | |
| IsHotWorkRequired | Choice (Yes/No) | |
| IsConfinedSpaceEntryRequired | Choice (Yes/No) | |
| ForemanName | Single line of text | Conditional: when hotWork=Yes |
| FireWatchName | Single line of text | Conditional: when hotWork=Yes |
| SpaceToBeEntered | Single line of text | Conditional: when confinedSpace=Yes |
| Status | Choice | Active, Closed, Archived |
| SubmitterName | Single line of text | Contact info from first-time setup |
| SubmitterEmail | Single line of text | |
| SubmitterPhone | Single line of text | |
| SubmitterCompany | Single line of text | |
| TimeSubmitted | Single line of text | ISO 8601 timestamp |

---

## JHA Flow

### SharePoint List: "JHA"

### `data` Fields
```json
{
  "PwaId": "a1b2c3d4-e5f6-...",
  "WorkRequestId": 42,
  "JobName": "...",
  "Applicability": "...",
  "AnalysisBy": "...",
  "ReviewedBy": "...",
  "ApprovedBy": "...",
  "Date": "2026-02-11",
  "PPE": "...",
  "LOTO": "...",
  "ConfinedSpace": "...",
  "HazCom": "...",
  "HandAndPowerTools": "...",
  "SpecialTools": "...",
  "JobSteps": [
    {
      "sequence": 1,
      "description": "...",
      "hazard": "...",
      "safetyMeasures": "..."
    }
  ],
  "SubmitterName": "DK",
  "SubmitterEmail": "dk@company.com",
  "SubmitterPhone": "555-1234",
  "SubmitterCompany": "DK",
  "TimeSubmitted": "2026-02-11T03:40:54Z"
}
```

### SharePoint List Columns (Internal Name)
| Internal Name | Type | Notes |
|------------|------|-------|
| PwaId | Single line of text | UUID from PWA client. Allows status check without server |
| WorkRequestId | Lookup | References "Work Requests" list |
| JobName | Single line of text | |
| Applicability | Single line of text | |
| AnalysisBy | Single line of text | |
| ReviewedBy | Single line of text | |
| ApprovedBy | Single line of text | |
| Date | Single line of text | yyyy-MM-dd |
| PPE | Multiple lines of text | |
| LOTO | Multiple lines of text | |
| ConfinedSpace | Multiple lines of text | |
| HazCom | Multiple lines of text | |
| HandAndPowerTools | Multiple lines of text | |
| SpecialTools | Multiple lines of text | |
| JobSteps | Multiple lines of text | JSON serialized array |
| SubmitterName | Single line of text | |
| SubmitterEmail | Single line of text | |
| SubmitterPhone | Single line of text | |
| SubmitterCompany | Single line of text | |
| TimeSubmitted | Single line of text | ISO 8601 timestamp |

---

## Action Type Behavior

### getAll
- Request: `{ "actionType": "getAll" }`
- Response: `{ "success": true, "data": [ { ...item1 }, { ...item2 } ] }`
- Returns all non-archived items from the list

### create
- Request: `{ "actionType": "create", "data": { ...fields }, "attachments": [...] }`
- Response: `{ "success": true, "id": "42" }`
- Creates new list item, processes attachments

### update
- Request: `{ "actionType": "update", "id": "42", "data": { ...fields } }`
- Response: `{ "success": true, "id": "42" }`
- Updates existing list item by ID. Send only the fields that changed
- To archive: `{ "actionType": "update", "id": "42", "data": { "Status": "Archived" } }`
- To change status: `{ "actionType": "update", "id": "42", "data": { "Status": "Closed" } }`

### addAttachment
- Request: `{ "actionType": "addAttachment", "id": "42", "attachments": [...] }`
- Response: `{ "success": true, "id": "42" }`
- Adds file attachments to existing list item

---

## Attachment Handling in PA Flow

For `create` with attachments:
1. Create the list item first (get ID)
2. For each attachment in the array:
   - Decode base64Content
   - Use "Add attachment" SharePoint action with the item ID
   - Attach file with given fileName and contentType

For `addAttachment`:
1. Use provided `id` directly
2. Process attachments same as above

---

## SharePoint Column Naming Convention

SharePoint columns have two names:
- **Internal name** — set permanently at creation, used in REST API and OData filters
- **Display name** — can be renamed anytime, shown in UI and PA designer

Spaces in column names become `_x0020_` in the internal name (e.g. "Date Of Work" → `Date_x0020_Of_x0020_Work`).

**Our convention:** PascalCase internal names (e.g. `DateOfWork`, `IsLOTORequired`, `SubmitterName`).

**To get clean internal names:**
1. Create the column with a PascalCase name first (e.g. `DateOfWork`)
2. After creation, rename the display name to readable text (e.g. "Date Of Work")

**If columns already exist with spaces:** Delete them, recreate without spaces, then rename display names. Internal names cannot be changed after creation.
