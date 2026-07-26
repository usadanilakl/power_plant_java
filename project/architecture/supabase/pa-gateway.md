# Power Automate auth gateway (centralized JWT verification)

**Goal:** the PWA talks to **one** Power Automate flow (the *gateway*). The gateway verifies the user's
JWT (via the `verify-jwt` Supabase edge function), then forwards the request to the real target flow
(work-request, jha, …). The target flow URLs live **only in the gateway** (server-side), never in the
PWA bundle — so a leaked target URL is no longer possible, and every submission is tied to an
authenticated user.

```
PWA ──{target, token, payload}──▶ Gateway flow ──{token}──▶ verify-jwt edge fn ──▶ 200 {valid, issuer, claims}
                                       │ statusCode == 200 ?
                                       │  yes └──Switch(target)──▶ target flow (payload) ──▶ SharePoint ──▶ Response
                                       │  no  └──────────────────────────────────────────────▶ Response 401
```

## Status — what is already done and verified

- The **PWA side is implemented**: `PowerAutomateService.submitV2()` posts `{ target, token, payload }`
  to `environment.paGatewayUrl` when it is set, otherwise directly to `paFlowUrls[target]` (today's
  behavior). Blank gateway URL = non-breaking. Token comes from `AuthService.getToken()`; with no token
  it errors *"Sign in required to submit"*.
- The **`verify-jwt` edge function is deployed and validated** on project `xvrtgccxtsjjwznqkznv`
  (`manage.sh deploy`, with `--no-verify-jwt`). Secrets `HUB_JWT_PUBLIC_KEY` and `SB_JWT_SECRET` are set.
  Live-tested `200 {valid:true}` for a hub RS256 token **and** a Supabase HS256 token.
- **Not done yet (your part):** build the gateway flow in the Power Automate designer (below), then set
  `environment.paGatewayUrl` and rebuild the PWA.

## The request contract (this is what the gateway trigger receives)

`submitV2` sends exactly this. `payload` is the flat object each target flow already accepts today
(same shape the backend's `PaRequestDto` posts). **Note `payload` includes `id` and `entity`** — `id`
is required for update/delete/getAttachments/changeStatus, `entity` routes multi-list flows (inventory
`item`/`usage`, sds `chemical`/`audit`). Do not drop them.

A **valid** JSON sample you can paste into the trigger's *"Use sample payload to generate schema"*
(the old doc pasted `…` and `a | b | c` placeholders — that is not valid JSON and is why the designer
rejected it):

```json
{
  "target": "workRequest",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwb3dlci1wbGFudC1odWIifQ.abc",
  "payload": {
    "actionType": "create",
    "entity": "",
    "id": "",
    "data": { "Title": "Sample", "WorkScope": "Sample scope" },
    "attachments": [ { "fileName": "a.pdf", "contentType": "application/pdf", "base64Content": "AAAA" } ]
  }
}
```

Gateway response = the target flow's response, passed straight back:
`{ "success": true, "id": "123", "data": [ … ], "message": "" }` (`data` is an **array** of objects).

---

## Part A — build the gateway flow (Power Automate designer)

### 1. Trigger — *When an HTTP request is received*

- Method: **POST**.
- **Request Body JSON Schema**: click *Use sample payload to generate schema* and paste the **valid**
  sample above. (Saving the flow reveals the trigger URL → this becomes `environment.paGatewayUrl`.)

### 2. HTTP action — name it exactly **`Verify the token`**

(The name matters: expressions below reference `outputs('Verify_the_token')`, i.e. the name with spaces
turned into underscores. If you name it differently, adjust the expressions.)

- Method: **POST**
- URI (real value — the old doc left `<ref>` unresolved, which the designer rejects):
  ```
  https://xvrtgccxtsjjwznqkznv.supabase.co/functions/v1/verify-jwt
  ```
- Headers: `Content-Type` = `application/json`
  - The function was deployed with `--no-verify-jwt`, so **no apikey is required**. If you ever
    redeploy it *without* that flag, add header `apikey` = the Supabase **anon** key (public), otherwise
    Supabase's gateway returns `401 Missing authorization header`.
- Body (valid JSON — the expression **must be quoted**; the old doc left it unquoted):
  ```json
  { "token": "@{triggerBody()?['token']}" }
  ```

### 3. Condition — **`Token valid?`**  ⚠ set *Configure run after*

`verify-jwt` returns **401/400 on an invalid token**, and PA treats a non-2xx HTTP action as *failed*,
which by default aborts the run before this Condition. So:

1. On the **Condition** step → **⋯ → Configure run after** → tick **both** *"is successful"* **and**
   *"has failed"*. (Now the Condition runs whether the token was accepted or rejected.)
2. Condition expression (Edit in advanced mode):
   ```
   @equals(outputs('Verify_the_token')?['statusCode'], 200)
   ```
   `statusCode == 200` already means `valid:true` (the function only returns 200 when the token is
   genuine and unexpired), so you don't also need to test `body(...)?['valid']`.

   *Optional role gate* — plant-only submissions. Roles live in **different** claims per issuer (hub:
   top-level `roles`; Supabase: `user_metadata.roles`), so you must OR both. Wrap the condition as:
   ```
   @and(
     equals(outputs('Verify_the_token')?['statusCode'], 200),
     or(
       contains(string(body('Verify_the_token')?['claims']?['roles']), 'ROLE_PLANT'),
       contains(string(body('Verify_the_token')?['claims']?['user_metadata']?['roles']), 'ROLE_PLANT')
     )
   )
   ```
   (`roles` is a JSON array in both; `string()` + `contains` is a loose substring match — fine here.
   There is **no** `authorities` claim, and Supabase's top-level `role` is `"authenticated"`, not an app
   role — don't use those.)

- **If no** → **Response** action: Status Code `401`, Body
  `{ "success": false, "message": "Unauthorized" }`. Stop.
- **If yes** → continue to the Switch (step 4).

### 4. Switch — on `@{triggerBody()?['target']}`

Add one **Case** per target. Every case's HTTP action is identical **except the URI**:

- Method: **POST**
- Headers: `Content-Type` = `application/json`
- **Body — pass the object, not a string.** In the Body field use the **expression**
  `triggerBody()?['payload']` (add via *fx*), **not** `@{triggerBody()?['payload']}` in the text box —
  the `@{…}` string form would send the payload as a quoted JSON *string* and the target flow can't read
  its fields.
- **URI** — the target flow's SAS URL, per the case below.

#### Cases to build now (Switch case value → HTTP action URI)

These targets flow through `submitV2` **and** have a real target URL (`workRequest`, `jha`, `fieldList`,
`inventory`, `sds`, `qualifications`, plus `instrument` — one case fronts both the instrument register
and the instrument log).

**Case `workRequest`:**
```
https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0b5c62d6db654dffb887e4f6b81f1cf3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UG09p5mlwthFNeQ_tndR4esVZctOfH0WHrIhYyl_lRM
```

**Case `jha`:**
```
https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f5fd7de804c1461e82a22c274a4f4dac/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=M6uJ_xAu7gvpHYzxqmRRJvKZHpQvGNlMOY4jBY3O8kc
```

**Case `fieldList`:**
```
https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e0bad99434cc416eb14e7f1e6049b18f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lpx4Wm2gB8rap8XYk3MwAD97LaZg52oTuDKjwHoEw5k
```

**Case `inventory`:**
```
https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms
```

**Case `sds`:**
```
https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/609426ab3c174235af5ade023ffee19c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vzhAO-xxW7xXdWZ0CuolI5zRNzcUKV0uSXd9Rjn8dZU
```

**Case `qualifications`:** (note the extra `/cu/18/` segment — keep it verbatim)
```
https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/18/workflows/fa8c206fc2d14bb49ee427ddceb4761e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Kcgp5jGtyk9ov8pee-Y96x9WfvHytldvg8QDKYQOO4w
```

**Case `instrument`** — one case fronts the whole instrument flow (it demuxes on `actionType`:
`addInstrumentationLog` for the log; `getState`/`getAllInstruments`/`addInstrument` for the register). The
PWA sends `target: 'instrument'` for both. This flow is being refactored to be instrument-only — see
[instrument-flow-refactor.md](instrument-flow-refactor.md).
```
https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/832a87fa6bd042459fbb042c2163f25a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CskQMxLQfynMFCI7AxUQtQWVIzVmkTydg9dxDN1-1M4
```

> **These are SAS `sig=` secrets.** They already live in the repo (`environment.ts`), so keeping a copy
> here is no extra exposure for a private repo — but the *authoritative* copy after cutover (Part C) is
> inside the gateway flow. If you regenerate a flow's trigger URL, update it in the gateway flow **and**
> here. These are the current values as of 2026-07-26.

#### Case you can't wire yet (documented for completeness)

- **`confinedSpace`** — blank URL; confined-space submissions use their own hard-coded flow in
  `space-api.service.ts`, bypassing both `submitV2` and `paFlowUrls`. Route it through `submitV2` and
  give it a flow before adding a case.

**Default case** → **Response** `400 { "success": false, "message": "Unknown target" }`.

### 5. Response — return the target flow's result

After each target HTTP action (or once, shared via the Switch's after-branch), add a **Response**:

- Status Code: `@{outputs('HTTP_<caseName>')?['statusCode']}` (or just `200`)
- Body: expression `body('HTTP_<caseName>')` (the target flow's `{success,id,data,message}` passed
  through unchanged).

> Tip: if wiring a Response inside every case is tedious, have each case set a variable to the target
> action name / body and put a single Response after the Switch — but the per-case Response is simplest
> to get right first.

### 6. Error path — return the REAL error, not a hardcoded string

The recommended shape wraps steps 2–4 in a **Scope**, then puts a single error **Response** *after* the
Scope with **Configure run after** = *has failed* + *is skipped* + *has timed out* (and **not** *is
successful*, so it never double-responds on the happy path). The Scope can fail for different reasons
(bad token → `Verify the token` 401; target-flow error → `Trigger PA flow`), so surface the actual
message rather than always saying "Unauthorized". A failed action's `outputs` are still readable.

Error Response — **Status Code**:
```
@{if(equals(outputs('Verify_the_token')?['statusCode'], 200), coalesce(outputs('Trigger_PA_flow')?['statusCode'], 500), outputs('Verify_the_token')?['statusCode'])}
```
Error Response — **Body**:
```json
{
  "success": false,
  "message": "@{coalesce(outputs('Verify_the_token')?['body']?['reason'], outputs('Trigger_PA_flow')?['body']?['message'], 'Request failed')}"
}
```
- `verify-jwt` returns `{ valid:false, reason }` → `body.reason` ("bad signature" / "token expired" / …).
- a target flow returns `{ success:false, message }` → `body.message`.

**Fully generic alternative** (surfaces whichever action failed, useful if the Scope grows): add a
**Filter array** before the error Response — From `@{result('Scope')}`, keep items where
`item()?['status']` **is equal to** `Failed` — then:
```
Status: @{coalesce(first(body('Filter_array'))?['outputs']?['statusCode'], 500)}
Body message: @{coalesce(first(body('Filter_array'))?['outputs']?['body']?['reason'], first(body('Filter_array'))?['outputs']?['body']?['message'], first(body('Filter_array'))?['error']?['message'], 'Request failed')}
```
(`result('Scope')` returns the Scope's direct children; if you nest the target call inside a Condition,
also union in `result('<ConditionName>')` to catch it.)

---

## Part B — gotchas the old guide missed

- **4xx short-circuit** (step 3) — the single most common reason a gateway "does nothing" on bad
  tokens. Must use *Configure run after* + `statusCode` check.
- **Payload must be forwarded as an object** (step 4) — `@{…}` stringifies it; use the raw expression.
- **`payload` carries `id` and `entity`** — the trigger schema must keep them (use the sample above).
- **Role claim asymmetry** — hub vs Supabase store roles in different places (step 3 optional gate).
- **Target coverage** — these still **bypass `submitV2`** today, so the gateway won't cover them until
  the PWA is refactored to route them through `submitV2`:
  - `instrumentLog` — sent via the legacy `submitForm` (V1) path (`tryPaInstrumentLog`).
  - confined space — `space-api.service.ts` posts to its own hard-coded flow URL.
  - `instrument` — goes through `submitV2` but has **no** `paFlowUrls` entry (blank), so there's no
    target URL to route to yet.
  Leave those on their current direct path for now (don't blank their URLs in step "cutover 3").
- **Attachments** travel as inline base64 inside `payload`; the extra hop doubles the transfer. Large
  files may hit PA/HTTP size limits — fine for typical form attachments.

## Part C — cutover

**Status: DONE in code (2026-07-26).** `paGatewayUrl` is set (both env files); `powerAutomateUrl` + all
`paFlowUrls` are blanked; the dead V1 direct-PA code was deleted (the confined-space feature, the
work-request/jha api services, `PowerAutomateService.submitForm`, the `PowerAutomateRequest` model).
Verified: the production bundle contains **only** the gateway URL — none of the 8 target SAS URLs.
Gateway validated end-to-end via curl (auth failure modes → correct status/message; all 7 target cases
route). **Remaining: redeploy `docs/` to GitHub Pages** so the public site drops the old URLs.

The steps, for reference / rollback:
1. Set `environment.paGatewayUrl` (both files) to the gateway trigger URL; rebuild.
2. Submit one of each type end-to-end; confirm SharePoint + PWA `success`.
3. Blank `powerAutomateUrl` + all `paFlowUrls` in both `environment*.ts`; rebuild. (Rollback = restore a
   target URL and blank `paGatewayUrl` → `submitV2` reverts to that direct URL.)
4. Redeploy the PWA to GitHub Pages.

**Independent follow-ups (target-flow fixes, not blocking cutover):** the `instrument` flow's
`getAllInstruments` Select must emit camelCase keys (see instrument-flow-refactor.md), and the
`inventory` flow's `getAll` currently returns HTTP 400.

## Appendix — verify-jwt ops (already done; here to re-run / rotate)

```bash
project/architecture/supabase/manage.sh deploy          # deploy verify-jwt --no-verify-jwt
project/architecture/supabase/manage.sh secret-hub-key  # HUB_JWT_PUBLIC_KEY (single-line) <- data/jwt-public.pem
project/architecture/supabase/manage.sh secret-sb-jwt   # SB_JWT_SECRET <- supabase.jwt.secret
```

Smoke-test the deployed function (expects `200 {valid:true}` / `401 {valid:false,...}`):

```bash
curl -sS -X POST https://xvrtgccxtsjjwznqkznv.supabase.co/functions/v1/verify-jwt \
  -H "Content-Type: application/json" -d '{"token":"<a real hub- or supabase-issued jwt>"}'
```

See `supabase/functions/verify-jwt/README.md` for the function contract and the
`HUB_JWT_PUBLIC_KEY` single-line requirement (a multi-line PEM gets truncated by the CLI and yields
`401 {reason:"verification error"}` on hub tokens).
