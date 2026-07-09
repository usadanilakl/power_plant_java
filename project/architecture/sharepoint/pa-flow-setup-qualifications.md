# Power Automate Flow Setup: Employees Qualifications

The qualifications feature uses two SharePoint lists:

- **Qualification Catalog**: the reusable qualification definitions admins maintain.
- **Employees Qualifications**: one assignment row per user per qualification, including issued/expiration details.

The QR fallback only needs **Employees Qualifications** because assignment rows copy the catalog name, code, and type. Catalog actions are optional Power Automate fallback support for management CRUD when the Java server is running but certificate access fails.

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

## Step 2: Flow Schema

Create or update the **Employees Qualifications V2** flow with an HTTP trigger. Use this sample payload to generate the schema:

```json
{
  "actionType": "create",
  "id": null,
  "data": {
    "Title": "Jane Smith - Confined Space Entrant",
    "PwaId": "a4a83d13-4544-44ee-bf7a-8e9e16ac5c8e",
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
    "IssuedDate": "2026-07-09",
    "ExpirationDate": "2027-07-09",
    "CredentialNumber": "CS-1234",
    "Issuer": "Training Department",
    "Notes": "Annual refresher complete."
  },
  "attachments": []
}
```

The same flow URL is used by Java and the PWA:

```properties
pa.flow.qualifications-url=<your-flow-url>
```

```ts
paFlowUrls: {
  qualifications: '<your-flow-url>'
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

Assignment cases:

- `create`
- `getAll`
- `getByUser`
- `getByPwaId`
- `update`
- `delete`

Optional catalog cases:

- `catalogCreate`
- `catalogGetAll`
- `catalogGetByPwaId`
- `catalogUpdate`
- `catalogDelete`

---

## Assignment Cases

### `create`

Use **SharePoint > Create item** against **Employees Qualifications**. Map:

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

Set `responseId` to:

```text
string(body('Create_item')?['ID'])
```

### `getAll`

Use **SharePoint > Get items** against **Employees Qualifications**, Top Count `5000`, then Select:

| Key | Value |
|-----|-------|
| ID | `string(item()?['ID'])` |
| Title | `item()?['Title']` |
| PwaId | `item()?['PwaId']` |
| UserId | `item()?['UserId']` |
| UserName | `item()?['UserName']` |
| UserEmail | `item()?['UserEmail']` |
| WindowsUsername | `item()?['WindowsUsername']` |
| Role | `item()?['Role']` |
| QualificationId | `item()?['QualificationId']` |
| QualificationCode | `item()?['QualificationCode']` |
| QualificationName | `item()?['QualificationName']` |
| QualificationType | `item()?['QualificationType']` |
| Status | `item()?['Status']` |
| IssuedDate | `item()?['IssuedDate']` |
| ExpirationDate | `item()?['ExpirationDate']` |
| CredentialNumber | `item()?['CredentialNumber']` |
| Issuer | `item()?['Issuer']` |
| Notes | `item()?['Notes']` |
| Modified | `item()?['Modified']` |

Set `responseData` to the Select output.

### `getByUser`

Same as `getAll`, but add this Filter Query expression:

```text
concat('UserId eq ''', triggerBody()?['data']?['UserId'], '''')
```

This is the case used by QR scan fallback.

### `getByPwaId`

Same as `getAll`, Top Count `1`, with this Filter Query expression:

```text
concat('PwaId eq ''', triggerBody()?['data']?['PwaId'], '''')
```

### `update`

Use **SharePoint > Update item** against **Employees Qualifications**. Id:

```text
triggerBody()?['id']
```

Map the same fields as `create`, then set `responseId` to `triggerBody()?['id']`.

### `delete`

Use **SharePoint > Delete item** against **Employees Qualifications**. Id:

```text
triggerBody()?['id']
```

Set `responseId` to `triggerBody()?['id']`.

---

## Optional Catalog Cases

Use these if you want Java's catalog CRUD to fall back to the same Power Automate flow.

### Catalog Select Mapping

For `catalogGetAll` and `catalogGetByPwaId`, use **Qualification Catalog** and Select:

| Key | Value |
|-----|-------|
| ID | `string(item()?['ID'])` |
| Title | `item()?['Title']` |
| PwaId | `item()?['PwaId']` |
| QualificationCode | `item()?['QualificationCode']` |
| QualificationName | `item()?['QualificationName']` |
| QualificationType | `item()?['QualificationType']` |
| Description | `item()?['Description']` |
| RequiresExpiration | `item()?['RequiresExpiration']` |
| DefaultValidityMonths | `item()?['DefaultValidityMonths']` |
| IsActive | `item()?['IsActive']` |
| SortOrder | `item()?['SortOrder']` |
| Notes | `item()?['Notes']` |
| Modified | `item()?['Modified']` |

`catalogGetByPwaId` filter:

```text
concat('PwaId eq ''', triggerBody()?['data']?['PwaId'], '''')
```

### Catalog Create/Update Mapping

Use **Qualification Catalog** and map:

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

Use **Create item** for `catalogCreate`, **Update item** for `catalogUpdate`, and **Delete item** for `catalogDelete`.

---

## Response and Error Handling

Inside the Scope, after the Switch, add **Response - Success**:

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

## Test

QR fallback lookup:

```bash
curl -X POST "<flow-url>" -H "Content-Type: application/json" -d '{
  "actionType": "getByUser",
  "id": "42",
  "data": { "UserId": "42" }
}'
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
      "UserName": "Test User",
      "QualificationId": "qualification-plant-role",
      "QualificationName": "Plant Role",
      "Status": "Active"
    }
  ],
  "message": ""
}
```

## Common Pitfalls

1. Use internal column names exactly, especially `QualificationId`, `UserId`, `PwaId`, and `QualificationName`.
2. Keep `getByUser` on **Employees Qualifications**; QR fallback does not query the catalog.
3. Set Top Count to `5000` for assignment and catalog list reads.
4. The Filter Query for text fields needs single quotes around the value.
5. Configure both `pa.flow.qualifications-url` and `paFlowUrls.qualifications`; the backend and PWA direct fallback use different config files.
