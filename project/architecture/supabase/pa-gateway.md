# Power Automate auth gateway (centralized JWT verification)

**Goal:** the PWA talks to **one** Power Automate flow (the *gateway*). The gateway verifies the user's
JWT, then forwards the request to the real target flow (work-request, jha, …). The target flows stay
URL-gated (SAS `sig=`), but their URLs live **only in the gateway**, never in the PWA bundle — so a
leaked target URL is no longer possible, and every submission is tied to an authenticated user.

This is the intended use of the [`verify-jwt`](../../../supabase/functions/verify-jwt/) edge function:
it's the piece the gateway calls to check the token (works even when the hub is down, and accepts both
hub- and Supabase-issued tokens).

```
PWA ──{target, token, payload}──▶ Gateway flow ──{token}──▶ verify-jwt edge fn ──▶ 200 {valid, claims}
                                       │ valid?
                                       └──{payload}──▶ target flow (work-request / jha / …) ──▶ SharePoint
```

## Contract (already implemented on the PWA side)

`PowerAutomateService.submitV2()` posts to `environment.paGatewayUrl` when it's set, otherwise directly
to `paFlowUrls[entityType]` as before (non-breaking — blank gateway = today's behavior). Gateway body:

```json
{
  "target":  "workRequest | jha | confinedSpace | instrumentLog | fieldList | inventory | sds | qualifications",
  "token":   "<the user's JWT (hub- or Supabase-issued)>",
  "payload": { "actionType": "create", "data": { … }, "attachments": [ … ] }
}
```

Gateway response = the target flow's response (`{ success, id?, data?, message? }`), passed straight
back.

## Build the gateway flow (Power Automate designer)

1. **Trigger:** *When an HTTP request is received* → gives you the gateway URL (put this in
   `environment.paGatewayUrl`). Set the request-body JSON schema to the contract above.
2. **Verify the token** — *HTTP* action:
   - Method `POST`, URI `https://<ref>.supabase.co/functions/v1/verify-jwt`
   - Header `Content-Type: application/json`
   - Body `{ "token": @{triggerBody()?['token']} }`
3. **Condition:** `@equals(body('Verify_the_token')?['valid'], true)`
   - *If no* → **Response** `401` `{ "success": false, "message": "Unauthorized" }`. Stop.
   - *(optional)* also check claims, e.g. require a role:
     `@contains(string(body('Verify_the_token')?['claims']?['roles']), 'ROLE_PLANT')`.
4. **If yes → Switch** on `@{triggerBody()?['target']}`. One case per entity type; each case is an
   *HTTP* `POST` to that target flow's SAS URL with body `@{triggerBody()?['payload']}`.
   - Store the target URLs as **environment variables** / secure inputs in the flow — **not** anywhere
     client-visible.
5. **Response:** return the target HTTP action's `@{body('...')}` and status code.

## Cutover (after the gateway works)

1. Set `environment.paGatewayUrl` (dev + prod) to the gateway trigger URL and rebuild the PWA.
2. Confirm submissions succeed end-to-end (they now carry the JWT and route through the gateway).
3. **Remove the target URLs from the bundle**: blank out `paFlowUrls` in `environment*.ts` (the
   gateway holds them now). This is the security payoff — the client no longer ships any target URL.
4. Deploy the edge function if you haven't: `manage.sh deploy` + `manage.sh secret-hub-key`.

## Caveats

- **Submissions now require a signed-in user.** `submitV2` returns *"Sign in required to submit"* when
  there's no token. If any flow today accepts **anonymous** submissions (e.g. a contractor work request
  with no PWA account), either keep that one direct (leave its `paFlowUrls` entry and don't route it),
  or have the gateway allow a tokenless path for that specific `target`.
- **Two hops** (PWA → gateway → target) adds minor latency; fine for form submissions.
- The gateway URL itself is in the bundle, but that's safe: it's useless without a valid JWT.
- Other direct `paFlowUrls` callers (feature api services) should also go through `submitV2` to be fully
  centralized; audit `grep -r paFlowUrls browser/ng-ui/src` before blanking the URLs.
