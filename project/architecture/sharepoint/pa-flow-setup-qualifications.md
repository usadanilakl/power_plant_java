# Power Automate Flow Setup: Employees Qualifications

This feature is set up for **one Power Automate flow URL**.

That single flow handles two SharePoint lists:

- **Qualification Catalog**: the reusable qualification definitions admins maintain.
- **Employees Qualifications**: one assignment row per employee per qualification, including issued/expiration details.

The PWA and Java backend both use the same config key:

```properties
pa.flow.qualifications-url=<your-one-flow-url>
```

```ts
paFlowUrls: {
  qualifications: '<your-one-flow-url>'
}
```

How the app uses that one flow:

- Public QR fallback calls `getByUser` only.
- Backend assignment fallback calls `create`, `getAll`, `getByUser`, `getByPwaId`, `update`, `delete`.
- Backend catalog fallback calls `catalogCreate`, `catalogGetAll`, `catalogGetByPwaId`, `catalogUpdate`, `catalogDelete`.
- PWA management normally writes through the Java server; if the server is unreachable, it can use this same flow for catalog and assignment CRUD.

---

## Step 1: SharePoint Lists

Run the PWA management page action **Provision Lists** or the SharePoint provisioning admin action.

### Qualification Catalog

| Internal Name | Display Name | Type |
|--------------|--------------|------|
| PwaId | PWA ID | Single line of text |
| QualificationCode | Qualification Code | Single line of text |
| QualificationName | Qualification Name | Single line of text |
| QualificationType | Qualification Type | Single line of text |
| Description | Description | Multiple lines of text |
| RequiresExpiration | Requires Expiration | Yes/No |
| DefaultValidityMonths | Default Validity Months | Single line of text |
| IsActive | Is Active | Yes/No |
| SortOrder | Sort Order | Single line of text |
| Notes | Notes | Multiple lines of text |

### Employees Qualifications

| Internal Name | Display Name | Type |
|--------------|--------------|------|
| PwaId | PWA ID | Single line of text |
| UserId | User ID | Single line of text |
| UserName | User Name | Single line of text |
| UserEmail | User Email | Single line of text |
| WindowsUsername | Windows Username | Single line of text |
| Role | Role | Single line of text |
| QualificationId | Qualification ID | Single line of text |
| QualificationCode | Qualification Code | Single line of text |
| QualificationName | Qualification Name | Single line of text |
| QualificationType | Qualification Type | Single line of text |
| Status | Status | Single line of text |
| IssuedDate | Issued Date | Single line of text |
| ExpirationDate | Expiration Date | Single line of text |
| CredentialNumber | Credential Number | Single line of text |
| Issuer | Issuer | Single line of text |
| Notes | Notes | Multiple lines of text |

`Title` is the built-in SharePoint title field and is set to a readable summary.

---

## Step 2: HTTP Trigger

Create or update one flow named **Employees Qualifications V2**.

Trigger: **When an HTTP request is received**.

Click **Use sample payload to generate schema** and paste this example payload. It is intentionally a superset, so Power Automate detects both employee assignment fields and catalog fields.

```json
{
  "actionType": "create",
  "id": "123",
  "data": {
    "Title": "Jane Smith - Confined Space Entrant",
    "PwaId": "assignment-jane-smith-cse",
    "UserId": "42",
    "UserName": "Jane Smith",
    "UserEmail": "jane.smith@example.com",
    "WindowsUsername": "jsmith",
    "Role": "ROLE_PLANT",
    "QualificationId": "qualification-confined-space-entrant",
    "QualificationCode": "CSE",
    "QualificationName": "Confined Space Entrant",
    "QualificationType": "Safety",
    "Status": "Active",
    "IssuedDate": "2026-07-14",
    "ExpirationDate": "2027-07-14",
    "CredentialNumber": "CS-1234",
    "Issuer": "Training Department",
    "Description": "Allows employee to enter confined spaces.",
    "RequiresExpiration": true,
    "DefaultValidityMonths": "12",
    "IsActive": true,
    "SortOrder": "10",
    "Notes": "Annual refresher complete."
  },
  "attachments": []
}
```

If you prefer to paste the schema manually instead of using the parser, paste this into **Request Body JSON Schema**:

```json
{
  "type": "object",
  "properties": {
    "actionType": {
      "type": "string"
    },
    "id": {
      "type": [
        "string",
        "null"
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "Title": {
          "type": [
            "string",
            "null"
          ]
        },
        "PwaId": {
          "type": [
            "string",
            "null"
          ]
        },
        "UserId": {
          "type": [
            "string",
            "null"
          ]
        },
        "UserName": {
          "type": [
            "string",
            "null"
          ]
        },
        "UserEmail": {
          "type": [
            "string",
            "null"
          ]
        },
        "WindowsUsername": {
          "type": [
            "string",
            "null"
          ]
        },
        "Role": {
          "type": [
            "string",
            "null"
          ]
        },
        "QualificationId": {
          "type": [
            "string",
            "null"
          ]
        },
        "QualificationCode": {
          "type": [
            "string",
            "null"
          ]
        },
        "QualificationName": {
          "type": [
            "string",
            "null"
          ]
        },
        "QualificationType": {
          "type": [
            "string",
            "null"
          ]
        },
        "Status": {
          "type": [
            "string",
            "null"
          ]
        },
        "IssuedDate": {
          "type": [
            "string",
            "null"
          ]
        },
        "ExpirationDate": {
          "type": [
            "string",
            "null"
          ]
        },
        "CredentialNumber": {
          "type": [
            "string",
            "null"
          ]
        },
        "Issuer": {
          "type": [
            "string",
            "null"
          ]
        },
        "Description": {
          "type": [
            "string",
            "null"
          ]
        },
        "RequiresExpiration": {
          "type": [
            "boolean",
            "string",
            "null"
          ]
        },
        "DefaultValidityMonths": {
          "type": [
            "string",
            "null"
          ]
        },
        "IsActive": {
          "type": [
            "boolean",
            "string",
            "null"
          ]
        },
        "SortOrder": {
          "type": [
            "string",
            "null"
          ]
        },
        "Notes": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "additionalProperties": true
    },
    "attachments": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "required": [
    "actionType"
  ],
  "additionalProperties": true
}
```

---

## Step 3: Variables and Switch

Initialize these variables:

| Variable | Type | Initial value |
|----------|------|---------------|
| responseSuccess | Boolean | `true` |
| responseId | String | empty |
| responseMessage | String | empty |
| responseData | Array | `[]` |

Inside a Scope, add a Switch on:

```text
triggerBody()?['actionType']
```

Add these cases to the same Switch:

- `create`
- `getAll`
- `getByUser`
- `getByPwaId`
- `update`
- `delete`
- `catalogCreate`
- `catalogGetAll`
- `catalogGetByPwaId`
- `catalogUpdate`
- `catalogDelete`

---

## Employee Assignment Cases

These cases use the **Employees Qualifications** SharePoint list.

### `create`

Add **SharePoint > Create item**.

- Site Address: JG SharePoint site.
- List Name: **Employees Qualifications**.

Map fields:

| SharePoint field | Expression |
|------------------|------------|
| Title | `triggerBody()?['data']?['Title']` |
| PWA ID | `triggerBody()?['data']?['PwaId']` |
| User ID | `triggerBody()?['data']?['UserId']` |
| User Name | `triggerBody()?['data']?['UserName']` |
| User Email | `triggerBody()?['data']?['UserEmail']` |
| Windows Username | `triggerBody()?['data']?['WindowsUsername']` |
| Role | `triggerBody()?['data']?['Role']` |
| Qualification ID | `triggerBody()?['data']?['QualificationId']` |
| Qualification Code | `triggerBody()?['data']?['QualificationCode']` |
| Qualification Name | `triggerBody()?['data']?['QualificationName']` |
| Qualification Type | `triggerBody()?['data']?['QualificationType']` |
| Status | `triggerBody()?['data']?['Status']` |
| Issued Date | `triggerBody()?['data']?['IssuedDate']` |
| Expiration Date | `triggerBody()?['data']?['ExpirationDate']` |
| Credential Number | `triggerBody()?['data']?['CredentialNumber']` |
| Issuer | `triggerBody()?['data']?['Issuer']` |
| Notes | `triggerBody()?['data']?['Notes']` |

Then set `responseId`:

```text
string(body('Create_item')?['ID'])
```

### `getAll`

Add **SharePoint > Get items**.

- List Name: **Employees Qualifications**.
- Top Count: `5000`.

Then add **Data Operations > Select**.

- From: `body('Get_items')?['value']`
- In the Select map, switch to text mode and paste:

```json
{
  "ID": "@{string(item()?['ID'])}",
  "Title": "@{item()?['Title']}",
  "PwaId": "@{item()?['PwaId']}",
  "UserId": "@{item()?['UserId']}",
  "UserName": "@{item()?['UserName']}",
  "UserEmail": "@{item()?['UserEmail']}",
  "WindowsUsername": "@{item()?['WindowsUsername']}",
  "Role": "@{item()?['Role']}",
  "QualificationId": "@{item()?['QualificationId']}",
  "QualificationCode": "@{item()?['QualificationCode']}",
  "QualificationName": "@{item()?['QualificationName']}",
  "QualificationType": "@{item()?['QualificationType']}",
  "Status": "@{item()?['Status']}",
  "IssuedDate": "@{item()?['IssuedDate']}",
  "ExpirationDate": "@{item()?['ExpirationDate']}",
  "CredentialNumber": "@{item()?['CredentialNumber']}",
  "Issuer": "@{item()?['Issuer']}",
  "Notes": "@{item()?['Notes']}",
  "Modified": "@{item()?['Modified']}"
}
```

Set `responseData` to:

```text
body('Select')
```

### `getByUser`

Same as `getAll`, but on **Get items** add this Filter Query expression:

```text
concat('UserId eq ''', triggerBody()?['data']?['UserId'], '''')
```

This is the case used by public QR scan fallback.

### `getByPwaId`

Same as `getAll`, but:

- Top Count: `1`
- Filter Query expression:

```text
concat('PwaId eq ''', triggerBody()?['data']?['PwaId'], '''')
```

### `update`

Add **SharePoint > Update item**.

- List Name: **Employees Qualifications**.
- Id: `triggerBody()?['id']`.

Map the same fields as `create`.

Then set `responseId`:

```text
triggerBody()?['id']
```

### `delete`

Add **SharePoint > Delete item**.

- List Name: **Employees Qualifications**.
- Id: `triggerBody()?['id']`.

Then set `responseId`:

```text
triggerBody()?['id']
```

---

## Catalog Cases

These cases use the **Qualification Catalog** SharePoint list in the same flow.

### `catalogCreate`

Add **SharePoint > Create item**.

- List Name: **Qualification Catalog**.

Map fields:

| SharePoint field | Expression |
|------------------|------------|
| Title | `triggerBody()?['data']?['Title']` |
| PWA ID | `triggerBody()?['data']?['PwaId']` |
| Qualification Code | `triggerBody()?['data']?['QualificationCode']` |
| Qualification Name | `triggerBody()?['data']?['QualificationName']` |
| Qualification Type | `triggerBody()?['data']?['QualificationType']` |
| Description | `triggerBody()?['data']?['Description']` |
| Requires Expiration | `triggerBody()?['data']?['RequiresExpiration']` |
| Default Validity Months | `triggerBody()?['data']?['DefaultValidityMonths']` |
| Is Active | `triggerBody()?['data']?['IsActive']` |
| Sort Order | `triggerBody()?['data']?['SortOrder']` |
| Notes | `triggerBody()?['data']?['Notes']` |

Then set `responseId`:

```text
string(body('Create_item')?['ID'])
```

### `catalogGetAll`

Add **SharePoint > Get items**.

- List Name: **Qualification Catalog**.
- Top Count: `5000`.

Then add **Data Operations > Select**.

- From: `body('Get_items')?['value']`
- In the Select map, switch to text mode and paste:

```json
{
  "ID": "@{string(item()?['ID'])}",
  "Title": "@{item()?['Title']}",
  "PwaId": "@{item()?['PwaId']}",
  "QualificationCode": "@{item()?['QualificationCode']}",
  "QualificationName": "@{item()?['QualificationName']}",
  "QualificationType": "@{item()?['QualificationType']}",
  "Description": "@{item()?['Description']}",
  "RequiresExpiration": "@{item()?['RequiresExpiration']}",
  "DefaultValidityMonths": "@{item()?['DefaultValidityMonths']}",
  "IsActive": "@{item()?['IsActive']}",
  "SortOrder": "@{item()?['SortOrder']}",
  "Notes": "@{item()?['Notes']}",
  "Modified": "@{item()?['Modified']}"
}
```

Set `responseData` to:

```text
body('Select')
```

### `catalogGetByPwaId`

Same as `catalogGetAll`, but:

- Top Count: `1`
- Filter Query expression:

```text
concat('PwaId eq ''', triggerBody()?['data']?['PwaId'], '''')
```

### `catalogUpdate`

Add **SharePoint > Update item**.

- List Name: **Qualification Catalog**.
- Id: `triggerBody()?['id']`.

Map the same fields as `catalogCreate`.

Then set `responseId`:

```text
triggerBody()?['id']
```

### `catalogDelete`

Add **SharePoint > Delete item**.

- List Name: **Qualification Catalog**.
- Id: `triggerBody()?['id']`.

Then set `responseId`:

```text
triggerBody()?['id']
```

---

## Response and Error Handling

Inside the Scope, after the Switch, add **Response - Success**.

- Status Code: `200`
- Header: `Content-Type` = `application/json`
- Body:

```json
{
  "success": @{variables('responseSuccess')},
  "id": "@{variables('responseId')}",
  "data": @{variables('responseData')},
  "message": "@{variables('responseMessage')}"
}
```

After the Scope, add a failure branch that runs only when the Scope has failed:

1. Set `responseSuccess` = `false`.
2. Set `responseMessage` = `result('Scope')?[0]?['error']?['message']`.
3. Add **Response - Failed** with the same JSON body and status `200`.

---

## Test Payloads

### Create Catalog Item

```json
{
  "actionType": "catalogCreate",
  "id": null,
  "data": {
    "Title": "Confined Space Entrant",
    "PwaId": "qualification-confined-space-entrant",
    "QualificationCode": "CSE",
    "QualificationName": "Confined Space Entrant",
    "QualificationType": "Safety",
    "Description": "Allows employee to enter confined spaces.",
    "RequiresExpiration": true,
    "DefaultValidityMonths": "12",
    "IsActive": true,
    "SortOrder": "10",
    "Notes": ""
  },
  "attachments": []
}
```

### Create Employee Assignment

```json
{
  "actionType": "create",
  "id": null,
  "data": {
    "Title": "Jane Smith - Confined Space Entrant",
    "PwaId": "assignment-jane-smith-cse",
    "UserId": "42",
    "UserName": "Jane Smith",
    "UserEmail": "jane.smith@example.com",
    "WindowsUsername": "jsmith",
    "Role": "ROLE_PLANT",
    "QualificationId": "qualification-confined-space-entrant",
    "QualificationCode": "CSE",
    "QualificationName": "Confined Space Entrant",
    "QualificationType": "Safety",
    "Status": "Active",
    "IssuedDate": "2026-07-14",
    "ExpirationDate": "2027-07-14",
    "CredentialNumber": "CS-1234",
    "Issuer": "Training Department",
    "Notes": "Annual refresher complete."
  },
  "attachments": []
}
```

### QR Fallback Lookup

```json
{
  "actionType": "getByUser",
  "id": "42",
  "data": {
    "UserId": "42"
  },
  "attachments": []
}
```

Expected response shape:

```json
{
  "success": true,
  "id": "",
  "data": [
    {
      "ID": "1",
      "UserId": "42",
      "UserName": "Jane Smith",
      "QualificationId": "qualification-confined-space-entrant",
      "QualificationCode": "CSE",
      "QualificationName": "Confined Space Entrant",
      "QualificationType": "Safety",
      "Status": "Active",
      "IssuedDate": "2026-07-14",
      "ExpirationDate": "2027-07-14"
    }
  ],
  "message": ""
}
```

## Common Pitfalls

1. This is **one flow**, not two flows.
2. Use **Employees Qualifications** for assignment cases and **Qualification Catalog** for catalog cases.
3. Include `QualificationId` and `QualificationCode` in create/update/select for employee assignments.
4. Keep `getByUser` on **Employees Qualifications**; QR fallback does not query the catalog.
5. Set Top Count to `5000` for assignment and catalog list reads.
6. The Filter Query for text fields needs single quotes around the value.
7. Configure both `pa.flow.qualifications-url` and `paFlowUrls.qualifications`; they should point to the same flow URL.
