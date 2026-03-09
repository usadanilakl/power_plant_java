# Power Automate Flow Modifications — Instrumentation

This document describes all changes needed to the existing **Instrumentation Log** Power Automate flow. The same flow handles log creation, instrument management (get all / create), attachments, and PwaId tracking.

## Flow Architecture

The flow uses a **Switch** on `actionType` to handle multiple operations:

| `actionType` | Purpose |
|---|---|
| `addInstrumentationLog` | Create a log entry + upsert instrument + upload attachments |
| `getAllInstruments` | Return all instruments from the "Instrumentation" SP list |
| `addInstrument` | Create a new instrument in the "Instrumentation" SP list |

---

## Updated Trigger Schema

The trigger must accept all action types. Extend your existing schema to include `data` (for instrument management actions) alongside the existing fields:

```json
{
  "type": "object",
  "additionalProperties": {
    "type": "string"
  },
  "properties": {
    "actionType": {
      "type": "string"
    },
    "localUuid": {
      "type": "string"
    },
    "user": {
      ...existing user schema...
    },
    "instrumentationLog": {
      "type": "object",
      "properties": {
        "instrumentTagNumber": { "type": "string" },
        "instrumentDescription": { "type": "string" },
        "status": { "type": "string" },
        "date": { "type": "string", "format": "date-time" },
        "time": { "type": "string" },
        "name": { "type": "string" },
        "comment": { "type": "string" }
      },
      "required": ["instrumentTagNumber", "status", "date", "time", "name", "comment"]
    },
    "attachments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "fileName": { "type": "string" },
          "contentType": { "type": "string" },
          "base64Content": { "type": "string" }
        }
      }
    },
    "data": {
      "type": "object",
      "properties": {
        "Tag_x0020_Number": { "type": "string" },
        "Description": { "type": "string" },
        "Vendor": { "type": "string" },
        "Location": { "type": "string" },
        "Type": { "type": "string" },
        "CurrentStatus": { "type": "string" },
        "PwaId": { "type": "string" }
      }
    }
  },
  "required": ["actionType"]
}
```

---

## Switch Control

After the trigger, add a **Switch** control:
- **On:** `triggerBody()?['actionType']`

Three cases + default:

---

## Case: `addInstrumentationLog`

This is the existing log creation flow, now extended with attachments and instrument upsert.

### Step 1: Create Log Item in "Instrumentation Log" List

Use **SharePoint — Create item** action:
- **List Name:** `Instrumentation Log`
- Map all fields from `triggerBody()?['instrumentationLog']`
- **PwaId** column → `triggerBody()?['localUuid']`

### Step 2: Upload Attachments

1. **Condition:** `length(triggerBody()?['attachments'])` **is greater than** `0`

2. **Apply to each:** Loop over `triggerBody()?['attachments']`

3. Inside the loop, use **SharePoint — Add attachment** action:
   - **List Name:** `Instrumentation Log`
   - **Id:** The ID from the "Create item" step output
   - **File Name:** `items('Apply_to_each')?['fileName']`
   - **File Content:** `base64ToBinary(items('Apply_to_each')?['base64Content'])`

### Step 3: Upsert the "Instrumentation" List

After log creation and attachments, update (or create) the instrument master record.

#### 3a. Look Up Existing Instrument

Use **SharePoint — Get items** action:
- **List Name:** `Instrumentation`
- **Filter Query:** `Tag_x0020_Number eq 'triggerBody()?['instrumentationLog']?['instrumentTagNumber']'`
- **Top Count:** `1`

#### 3b. Condition: Instrument Found?

- Expression: `length(body('Get_items_-_Instrumentation')?['value'])` **is greater than** `0`

#### 3c. If Yes — Update Existing Instrument

Use **SharePoint — Update item** action:
- **List Name:** `Instrumentation`
- **Id:** `first(body('Get_items_-_Instrumentation')?['value'])?['ID']`
- **CurrentStatus:** `triggerBody()?['instrumentationLog']?['status']`
- **LastUpdatedDate:** `triggerBody()?['instrumentationLog']?['date']`
- **LastUpdatedTime:** `triggerBody()?['instrumentationLog']?['time']`
- **LastUpdatedBy:** `triggerBody()?['instrumentationLog']?['name']`
- **LastComment:** `triggerBody()?['instrumentationLog']?['comment']`
- **Description:** `triggerBody()?['instrumentationLog']?['instrumentDescription']`

#### 3d. If No — Create New Instrument

Use **SharePoint — Create item** action:
- **List Name:** `Instrumentation`
- **Tag_x0020_Number:** `triggerBody()?['instrumentationLog']?['instrumentTagNumber']`
- **Description:** `triggerBody()?['instrumentationLog']?['instrumentDescription']`
- **CurrentStatus:** `triggerBody()?['instrumentationLog']?['status']`
- **LastUpdatedDate:** `triggerBody()?['instrumentationLog']?['date']`
- **LastUpdatedTime:** `triggerBody()?['instrumentationLog']?['time']`
- **LastUpdatedBy:** `triggerBody()?['instrumentationLog']?['name']`
- **LastComment:** `triggerBody()?['instrumentationLog']?['comment']`
- **PwaId:** `triggerBody()?['localUuid']`

---

## Case: `getAllInstruments`

Returns all instruments from the "Instrumentation" SP list. Used by the PWA as a fallback when the server is down.

### Step 1: Get Items from SharePoint

Use **SharePoint — Get items** action:
- **List Name:** `Instrumentation`
- **Top Count:** `5000` (or leave blank for default)

### Step 2: Build Response Array

Use **Select** action to map each item to a clean JSON object:
- **From:** `body('Get_items_-_All_Instruments')?['value']`
- **Map:**
  - `sharepointId` → `item()?['ID']`
  - `tagNumber` → `item()?['Tag_x0020_Number']`
  - `description` → `item()?['Description']`
  - `vendor` → `item()?['Vendor']`
  - `location` → `item()?['Location']`
  - `type` → `item()?['Type']`
  - `currentStatus` → `item()?['CurrentStatus']`
  - `lastUpdatedDate` → `item()?['LastUpdatedDate']`
  - `lastUpdatedTime` → `item()?['LastUpdatedTime']`
  - `lastUpdatedBy` → `item()?['LastUpdatedBy']`
  - `lastComment` → `item()?['LastComment']`
  - `localUuid` → `item()?['PwaId']`

### Step 3: Return Response

Use **Response** action:
- **Status Code:** `200`
- **Body:**
```json
{
  "success": true,
  "data": @{body('Select')}
}
```

---

## Case: `addInstrument`

Creates a new instrument in the "Instrumentation" SP list. Used by the PWA when adding a new instrument while the server is down.

### Step 1: Create Item in SharePoint

Use **SharePoint — Create item** action:
- **List Name:** `Instrumentation`
- **Tag_x0020_Number:** `triggerBody()?['data']?['Tag_x0020_Number']`
- **Description:** `triggerBody()?['data']?['Description']`
- **Vendor:** `triggerBody()?['data']?['Vendor']`
- **Location:** `triggerBody()?['data']?['Location']`
- **Type:** `triggerBody()?['data']?['Type']`
- **CurrentStatus:** `triggerBody()?['data']?['CurrentStatus']`
- **PwaId:** `triggerBody()?['data']?['PwaId']`

### Step 2: Return Response

Use **Response** action:
- **Status Code:** `200`
- **Body:**
```json
{
  "success": true,
  "id": "@{body('Create_item_-_New_Instrument')?['ID']}"
}
```

---

## Default Case

Return an error response:
- **Status Code:** `400`
- **Body:** `{ "success": false, "message": "Unknown actionType" }`

---

## PWA Configuration

Since all actions use the **same flow URL**, the PWA environment config should point both `instrumentLog` and `instrument` to the same URL:

```typescript
paFlowUrls: {
  instrumentLog: '<THIS_FLOW_URL>',
  instrument: '<THIS_FLOW_URL>',   // same URL, different actionType
}
```

## Summary

1. Update trigger schema to accept `actionType`, `data`, `localUuid`, `instrumentationLog`, `attachments`
2. Add **Switch** on `actionType` with three cases
3. `addInstrumentationLog`: Create log → upload attachments → upsert instrument
4. `getAllInstruments`: Get all items from "Instrumentation" list → return as JSON array
5. `addInstrument`: Create new item in "Instrumentation" list → return SP ID
6. Test each action type independently, then test from PWA with server stopped
