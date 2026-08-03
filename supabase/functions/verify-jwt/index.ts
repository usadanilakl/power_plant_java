// Supabase Edge Function: verify-jwt
//
// Dual-authority JWT verifier for Power Automate flows. PA posts a bearer token it received from the
// PWA/desktop; this function tells PA whether the token is genuine and returns its claims. The token
// may have been signed by EITHER authority:
//   • iss === "power-plant-hub"  → verify with the hub RS256 PUBLIC key  (secret HUB_JWT_PUBLIC_KEY)
//   • a Supabase issuer          → verify with the Supabase HS256 secret (env  SUPABASE_JWT_SECRET)
//
// Request:  POST { "token": "<jwt>" }
// Response: 200 { "valid": true,  "issuer": "hub|supabase", "claims": {...} }
//           401 { "valid": false, "reason": "..." }
//
// Authorization note: a genuinely-signed Supabase token is only accepted when it represents a real
// signed-in user (role "authenticated"). The public *anon* key (and service_role) are rejected — they
// are not users and the anon key is shipped publicly in the client bundle.
//
// Deploy (PA calls it server-to-server with no user JWT of its own):
//   supabase functions deploy verify-jwt --no-verify-jwt
//
// Secrets:
//   HUB_JWT_PUBLIC_KEY   – the hub's RS256 public key, PEM (-----BEGIN PUBLIC KEY-----). Set with:
//                            manage.sh secret-hub-key   (supabase secrets set HUB_JWT_PUBLIC_KEY=…)
//   SB_JWT_SECRET        – the project's HS256 JWT secret (Settings → API → JWT Settings). Set with:
//                            manage.sh secret-sb-jwt    (supabase secrets set SB_JWT_SECRET=…)
//                          NB: the platform does NOT auto-inject the JWT secret, and it REJECTS any
//                          custom secret whose name starts with "SUPABASE_" — so we use SB_JWT_SECRET.
// Optional:
//   HUB_JWT_ISSUER       – defaults to "power-plant-hub".

const HUB_ISSUER = Deno.env.get('HUB_JWT_ISSUER') ?? 'power-plant-hub';
const HUB_PUBLIC_KEY_PEM = Deno.env.get('HUB_JWT_PUBLIC_KEY') ?? '';
// SB_JWT_SECRET is the one we set; fall back to SUPABASE_JWT_SECRET in case a future runtime exposes it.
const SUPABASE_JWT_SECRET = Deno.env.get('SB_JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? '';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  try {
    const { token } = await req.json().catch(() => ({ token: undefined }));
    if (!token || typeof token !== 'string') {
      return json(400, { valid: false, reason: 'missing token' });
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return json(401, { valid: false, reason: 'malformed token' });
    }
    const header = decodeJson(parts[0]);
    const payload = decodeJson(parts[1]);
    const iss: string | undefined = payload?.iss;
    const issuerKind = classifyIssuer(iss);
    if (!issuerKind) {
      return json(401, { valid: false, reason: `unknown issuer: ${iss ?? '(none)'}` });
    }

    // Bind the signing algorithm to the issuer (defense-in-depth vs algorithm-confusion / "alg":"none").
    // Key selection is already issuer-based, but reject any header alg that doesn't match the expectation.
    const alg: string | undefined = header?.alg;
    const expectedAlg = issuerKind === 'hub' ? 'RS256' : 'HS256';
    if (alg !== expectedAlg) {
      return json(401, { valid: false, reason: `unexpected alg: ${alg ?? '(none)'}` });
    }

    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = b64urlToBytes(parts[2]);

    let ok = false;
    if (issuerKind === 'hub') {
      if (!HUB_PUBLIC_KEY_PEM) return json(401, { valid: false, reason: 'hub public key not configured' });
      const key = await importRsaPublicKey(HUB_PUBLIC_KEY_PEM);
      ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signingInput);
    } else {
      if (!SUPABASE_JWT_SECRET) return json(401, { valid: false, reason: 'supabase secret not configured' });
      const key = await importHmacKey(SUPABASE_JWT_SECRET);
      ok = await crypto.subtle.verify('HMAC', key, signature, signingInput);
    }
    if (!ok) {
      return json(401, { valid: false, reason: 'bad signature' });
    }

    // Time-based claims (seconds since epoch). Require a finite numeric exp so an authentically
    // signed but non-expiring / malformed token can't be accepted indefinitely.
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || !isFinite(payload.exp)) {
      return json(401, { valid: false, reason: 'missing exp' });
    }
    if (now >= payload.exp) {
      return json(401, { valid: false, reason: 'token expired' });
    }
    if (payload.nbf !== undefined && (typeof payload.nbf !== 'number' || now < payload.nbf)) {
      return json(401, { valid: false, reason: 'token not yet valid' });
    }

    // Reject Supabase *service* tokens (role "anon" / "service_role"). These are NOT users: the anon key
    // ships publicly in the PWA bundle (inlined by the Angular build), so accepting it would let anyone
    // with the public bundle authenticate to callers that trust this function (e.g. the PA gateway's
    // protected ops). Only real signed-in Supabase users — role "authenticated" — are genuine principals.
    // Hub tokens are unaffected (they carry `roles: [...]`, not a top-level GoTrue `role`).
    if (issuerKind === 'supabase' && payload.role !== 'authenticated') {
      return json(401, { valid: false, reason: `not a user token (role: ${payload.role ?? 'none'})` });
    }

    return json(200, { valid: true, issuer: issuerKind, claims: payload });
  } catch (e) {
    console.error('verify-jwt error', e);
    return json(401, { valid: false, reason: 'verification error' });
  }
});

function classifyIssuer(iss: string | undefined): 'hub' | 'supabase' | null {
  if (!iss) return null;
  if (iss === HUB_ISSUER) return 'hub';
  if (iss.includes('.supabase.co') || iss.endsWith('/auth/v1') || iss.includes('supabase')) return 'supabase';
  return null;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function decodeJson(b64url: string): any {
  const bytes = b64urlToBytes(b64url);
  return JSON.parse(new TextDecoder().decode(bytes));
}

function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  // b64urlToBytes also accepts standard base64 (the '+'/'/' replaces are no-ops here).
  const der = b64urlToBytes(body);
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}
