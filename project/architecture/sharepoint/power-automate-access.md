## Functionality

PowerAutomateAccess wraps existing PowerAutomateClient to communicate with SharePoint via Power Automate HTTP-triggered flows.

## Implementation - DONE

`PowerAutomateAccess` is a thin adapter that delegates to `PowerAutomateClient`. It implements the `SharePointAccess` interface so the facade can use it as a fallback.

- `isAvailable()` always returns true (it's the always-available fallback)
- No changes to `PowerAutomateClient` itself — it still has the flow URLs and HTTP logic

## Remaining Issues

- Flow trigger URLs are hardcoded with SAS tokens in `PowerAutomateClient` — these expire and need to be configurable
- Consider moving URLs to `application.properties` or database config
