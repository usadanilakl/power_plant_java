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
200  { "valid": true,  "issuer": "supabase", "claims": { "sub": "...", "email": "...", ... } }
401  { "valid": false, "reason": "bad signature" }        // also: expired, unknown issuer, malformed
400  { "valid": false, "reason": "missing token" }
```

The function reads the `iss` claim to choose the key:

| `iss` | Verified with | Source |
|-------|---------------|--------|
| `power-plant-hub` | Hub RS256 **public** key | secret `HUB_JWT_PUBLIC_KEY` |
| `…supabase.co…` / `…/auth/v1` | Supabase HS256 secret | env `SUPABASE_JWT_SECRET` (auto-injected) |

## Secrets

```bash
# Hub public key (never the private one). After the hub has generated data/jwt-public.pem:
supabase secrets set HUB_JWT_PUBLIC_KEY="$(cat ../../data/jwt-public.pem)"

# SUPABASE_JWT_SECRET is injected by the platform — nothing to set.
# Optional: override the hub issuer string (defaults to power-plant-hub).
supabase secrets set HUB_JWT_ISSUER="power-plant-hub"
```

## Deploy

```bash
# --no-verify-jwt: PA calls this server-to-server without a user token, so GoTrue must not gate it.
supabase functions deploy verify-jwt --no-verify-jwt
```

## Power Automate usage

Add an **HTTP** action:

- Method: `POST`
- URI: `https://<project-ref>.supabase.co/functions/v1/verify-jwt`
- Headers: `Content-Type: application/json`
- Body: `{ "token": "@{triggerBody()?['token']}" }`

Then branch on `@{body('HTTP')?['valid']}`. CORS headers are returned so the function can also be
called from a browser context if ever needed.

## Rotating the hub key

Re-run `supabase secrets set HUB_JWT_PUBLIC_KEY=…` with the new public key. See
`project/features/users/dual-auth.md` → "Rotating keys".
