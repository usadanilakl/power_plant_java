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
// Deploy (PA calls it server-to-server with no user JWT of its own):
//   supabase functions deploy verify-jwt --no-verify-jwt
//
// Secrets:
//   HUB_JWT_PUBLIC_KEY   – the hub's RS256 public key, PEM (-----BEGIN PUBLIC KEY-----). Set with:
//                            supabase secrets set HUB_JWT_PUBLIC_KEY="$(cat data/jwt-public.pem)"
//   SUPABASE_JWT_SECRET  – injected automatically by the platform (the project JWT secret).
// Optional:
//   HUB_JWT_ISSUER       – defaults to "power-plant-hub".

const HUB_ISSUER = Deno.env.get('HUB_JWT_ISSUER') ?? 'power-plant-hub';
const HUB_PUBLIC_KEY_PEM = Deno.env.get('HUB_JWT_PUBLIC_KEY') ?? '';
const SUPABASE_JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') ?? '';

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
    const payload = decodeJson(parts[1]);
    const iss: string | undefined = payload?.iss;
    const issuerKind = classifyIssuer(iss);
    if (!issuerKind) {
      return json(401, { valid: false, reason: `unknown issuer: ${iss ?? '(none)'}` });
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

    // Time-based claims (seconds since epoch).
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && now >= payload.exp) {
      return json(401, { valid: false, reason: 'token expired' });
    }
    if (typeof payload.nbf === 'number' && now < payload.nbf) {
      return json(401, { valid: false, reason: 'token not yet valid' });
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
