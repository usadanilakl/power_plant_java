## Functionality

SharePointCertificateAccess uses PFX certificate to authenticate and call SharePoint REST API directly (read/write).

## Implementation - DONE

Ported from working setup: `C:\Users\usada\my_projects\forms\src\main\java\com\jg\forms\api\SharepointAppClient.java`

## Architecture

- `SharePointConfig` (@Configuration, @ConditionalOnProperty) produces `ClientCertificateCredential` bean + `RestTemplate` bean
- `SharePointCertificateAccess` uses credential to acquire bearer tokens, calls SharePoint REST API via RestTemplate
- Token management: auto-refresh with 5-minute expiration buffer
- On startup (@PostConstruct): authenticates + verifies connection via `/_api/web/title`
- If init fails: `available = false`, facade routes all calls to PowerAutomate fallback

## Key Details

- Scope: `https://jpowerusa.sharepoint.com/.default` (NOT graph.microsoft.com — different Azure AD permission set)
- Site URL: `https://jpowerusa.sharepoint.com/sites/JG`
- Headers: Bearer token + `Accept: application/json;odata=verbose`
- Response format: `d.results[]` (odata verbose)
- Updates use MERGE: `X-HTTP-Method: MERGE` + `IF-MATCH: *` headers via POST
- Field names: x0020 encoding for spaces (e.g., `Work_x0020_Scope`)

## Configuration (application-secrets.properties)

```
sharepoint.azure.client-id=...
sharepoint.azure.tenant-id=...
sharepoint.azure.pfx-path=${user.dir}/data/certificate.pfx
sharepoint.azure.pfx-password=...
sharepoint.azure.scopes=https://jpowerusa.sharepoint.com/.default
sharepoint.site.hostname=jpowerusa.sharepoint.com
sharepoint.site.path=/sites/JG
```

## Why Not Graph SDK?

Graph SDK 6.13.0 is in pom.xml but NOT used. The Azure AD app registration has SharePoint API permissions, not Microsoft Graph API permissions. These are separate permission sets — using Graph SDK would require adding `Sites.ReadWrite.All` under Microsoft Graph in Azure Portal + admin consent.
