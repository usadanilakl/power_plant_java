# verify-jwt Edge Function

Dual-authority JWT verifier for **Power Automate** flows. A PA flow receives a bearer token from the
PWA/desktop and needs to confirm it is genuine before acting. This function verifies a token signed
by **either** authority and returns its claims.

## Contract

`POST https://<project-ref>.supabase.co/functions/v1/verify-jwt`

Request body:

```json
{ "token": "<jwt>" }
```

Responses:

```json
200  { "valid": true,  "issuer": "hub",      "claims": { "sub": "...", "email": "...", ... } }
200  { "valid": true,  "issuer": "supabase", "claims": { "sub": "...", "role": "authenticated", ... } }
401  { "valid": false, "reason": "bad signature" }              // also: expired, unknown issuer, malformed
401  { "valid": false, "reason": "not a user token (role: anon)" } // Supabase anon / service_role rejected
400  { "valid": false, "reason": "missing token" }
```

> **Only real users pass.** A genuinely-signed Supabase token is accepted **only** when it represents a
> signed-in user (`role: "authenticated"`). The **anon key** (and `service_role`) are rejected: the anon
> key is inlined into the public PWA bundle, so accepting it would let anyone authenticate to callers
> that trust this function. Hub tokens are unaffected (they carry `roles: [...]`, not a GoTrue `role`).

The function reads the `iss` claim to choose the key:

| `iss` | Verified with | Source |
|-------|---------------|--------|
| `power-plant-hub` | Hub RS256 **public** key | secret `HUB_JWT_PUBLIC_KEY` |
| `…supabase.co…` / `…/auth/v1` / `supabase` | Supabase HS256 secret | secret `SB_JWT_SECRET` |

> **The Supabase JWT secret is NOT auto-injected.** The platform never exposes the project JWT secret
> to functions, and it *rejects* any custom secret whose name starts with `SUPABASE_`. So we set it
> under `SB_JWT_SECRET` (the code falls back to `SUPABASE_JWT_SECRET` if a future runtime ever provides
> it). Without it, Supabase-issued tokens return `401 {reason:"supabase secret not configured"}`.

## Secrets

Use the wrapper (handles the single-line flattening + reads the value from the secrets file):

```bash
project/architecture/supabase/manage.sh secret-hub-key   # HUB_JWT_PUBLIC_KEY  <- data/jwt-public.pem
project/architecture/supabase/manage.sh secret-sb-jwt    # SB_JWT_SECRET       <- supabase.jwt.secret
```

Raw equivalents (note: `HUB_JWT_PUBLIC_KEY` must be a **single line** — a multi-line PEM gets
truncated by the CLI, which yields `401 {reason:"verification error"}` on hub tokens):

```bash
supabase secrets set HUB_JWT_PUBLIC_KEY="$(grep -v -- '-----' data/jwt-public.pem | tr -d '\r\n')"
supabase secrets set SB_JWT_SECRET="<project JWT secret from Settings → API → JWT Settings>"
supabase secrets set HUB_JWT_ISSUER="power-plant-hub"   # optional; this is the default
```

## Deploy

```bash
project/architecture/supabase/manage.sh deploy
# = supabase functions deploy verify-jwt --no-verify-jwt
# --no-verify-jwt: PA calls this server-to-server without a user token, so GoTrue must not gate it.
```

**Status:** deployed to project `xvrtgccxtsjjwznqkznv` and validated live for a minted Supabase user
token and a minted hub RS256 token (both `200 {valid:true}`). **Redeploy needed** for the anon-key
rejection added since (the anon key must now return `401 {reason:"not a user token (role: anon)"}`).

## Power Automate usage

Add an **HTTP** action:

- Method: `POST`
- URI: `https://<project-ref>.supabase.co/functions/v1/verify-jwt`
- Headers: `Content-Type: application/json`
- Body: `{ "token": "@{triggerBody()?['token']}" }`

**Branching gotcha:** this function returns a **non-2xx** status (400/401) whenever the token is
invalid. Power Automate treats a non-2xx HTTP action as *failed* and stops the run, so a Condition
placed after it never evaluates on a bad token unless you let it. Set the Condition's **Configure run
after** to include both *is successful* and *has failed*, then gate on the status code:
`@equals(outputs('Verify_the_token')?['statusCode'], 200)` (this already implies `valid:true`).
CORS headers are returned so the function can also be called from a browser context if ever needed.
See `project/architecture/supabase/pa-gateway.md` for the full gateway-flow build.

## Rotating the hub key

Re-run `supabase secrets set HUB_JWT_PUBLIC_KEY=…` with the new public key. See
`project/features/users/dual-auth.md` → "Rotating keys".
