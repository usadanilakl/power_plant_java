package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.entities.users.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Key;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Dual-authority JWT service.
 *
 * <p>Signs hub tokens with <b>RS256</b> (asymmetric) and stamps {@code iss:"power-plant-hub"}.
 * On verification it reads the {@code iss} claim <i>without</i> verifying, then picks the key:
 * hub tokens verify against the hub public key; Supabase tokens verify against the Supabase
 * public key (asymmetric signing keys) or, if the project is still on the default HS256 shared
 * secret, against that secret. Unknown issuers are rejected.
 *
 * <p>The private key lives at {@code jwt.private-key-path} (default {@code data/jwt-private.pem});
 * the matching public key at {@code jwt.public-key-path} is distributed to the PWA, the Supabase
 * Edge Function verifier, and desktop installs. If the private key file is missing at startup a
 * fresh RSA-2048 keypair is generated and written (dev bootstrap) with a warning — production must
 * ship a real, backed-up key.
 *
 * <p>Cutover note: the previous HS256 shared-secret tokens are NOT accepted — users get logged out
 * once and re-login to receive an RS256 token.
 */
@Service
@Slf4j
public class JwtService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Which authority signed a token. */
    public enum TokenIssuer { HUB, SUPABASE }

    private final PrivateKey hubPrivateKey;
    private final PublicKey hubPublicKey;
    /** Supabase asymmetric public key (RS/EC/EdDSA). Null when the project uses HS256. */
    private final PublicKey supabasePublicKey;
    /** Supabase HS256 shared secret. Null when the project uses asymmetric signing keys. */
    private final SecretKey supabaseHmacKey;

    private final String hubIssuer;
    private final String supabaseIssuer; // optional explicit match; may be blank
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.private-key-path:}") String privateKeyPath,
            @Value("${jwt.public-key-path:}") String publicKeyPath,
            @Value("${jwt.issuer:power-plant-hub}") String hubIssuer,
            @Value("${jwt.expiration-hours:72}") long expirationHours,
            @Value("${supabase.jwt.public-key-path:}") String supabasePublicKeyPath,
            @Value("${supabase.jwt.secret:}") String supabaseJwtSecret,
            @Value("${supabase.jwt.issuer:}") String supabaseIssuer,
            @Value("${jwt.allow-key-bootstrap:false}") boolean allowKeyBootstrap,
            @Value("${sync.role:}") String syncRole) {

        this.hubIssuer = hubIssuer;
        this.supabaseIssuer = supabaseIssuer == null ? "" : supabaseIssuer.trim();
        this.expirationMs = expirationHours * 3600 * 1000;

        Path privPath = resolvePath(privateKeyPath, "jwt-private.pem");
        Path pubPath = resolvePath(publicKeyPath, "jwt-public.pem");

        if (Files.exists(privPath)) {
            this.hubPrivateKey = JwtKeyLoader.loadPrivateKey(privPath);
            if (Files.exists(pubPath)) {
                this.hubPublicKey = JwtKeyLoader.loadPublicKey(pubPath);
            } else {
                this.hubPublicKey = JwtKeyLoader.derivePublicKey(this.hubPrivateKey);
                JwtKeyLoader.writePem(pubPath, "PUBLIC KEY", this.hubPublicKey.getEncoded());
                log.warn("[JWT] Public key was missing at {} — derived it from the private key and wrote it.", pubPath);
            }
        } else {
            // Only the HUB signs PWA tokens that OTHER parties (the Supabase edge function, and any
            // node the PWA might reach) must verify, so only the hub must ship a real, backed-up
            // keypair — refuse to silently mint one there. Every other node (desktops, dev) may
            // auto-generate a local throwaway key: it never leaves that node and is only used to verify
            // its own tokens, so it's harmless and lets desktops boot with ZERO key provisioning.
            if (isHubNode(syncRole) && !allowKeyBootstrap) {
                throw new IllegalStateException(
                        "Refusing to start the HUB: JWT private key missing at " + privPath
                        + ". Generate and back up a real RS256 keypair "
                        + "(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 …), or set "
                        + "jwt.allow-key-bootstrap=true to explicitly opt into generating one.");
            }
            var pair = JwtKeyLoader.generateAndWrite(privPath, pubPath);
            this.hubPrivateKey = pair.getPrivate();
            this.hubPublicKey = pair.getPublic();
            log.warn("[JWT] No private key at {} — generated a local RS256 keypair. On the hub, replace "
                    + "this with a real, backed-up key and distribute {} to the edge function. On a "
                    + "non-hub node this local key is fine (it only verifies this node's own tokens).",
                    privPath, pubPath);
        }

        // Supabase verification material (optional — hub works standalone without it).
        PublicKey spb = null;
        if (supabasePublicKeyPath != null && !supabasePublicKeyPath.isBlank()) {
            Path p = Paths.get(supabasePublicKeyPath.trim());
            if (Files.exists(p)) {
                spb = JwtKeyLoader.loadPublicKey(p);
                log.info("[JWT] Loaded Supabase public key from {}", p);
            } else {
                log.warn("[JWT] supabase.jwt.public-key-path={} does not exist — skipping.", p);
            }
        }
        this.supabasePublicKey = spb;

        SecretKey hmac = null;
        if (supabaseJwtSecret != null && !supabaseJwtSecret.isBlank()) {
            hmac = io.jsonwebtoken.security.Keys.hmacShaKeyFor(supabaseJwtSecret.getBytes(StandardCharsets.UTF_8));
            log.info("[JWT] Supabase HS256 verification enabled (shared secret configured).");
        }
        this.supabaseHmacKey = hmac;

        if (this.supabasePublicKey == null && this.supabaseHmacKey == null) {
            log.warn("[JWT] Supabase token verification is NOT configured "
                    + "(no supabase.jwt.public-key-path and no supabase.jwt.secret). "
                    + "Supabase-issued JWTs will be rejected until one is set.");
        }
    }

    // ── Signing (hub) ───────────────────────────────────────────────────────

    /** Audience/purpose that mark a hub token as an interactive-session credential. */
    public static final String SESSION_AUDIENCE = "pwa-session";
    public static final String PURPOSE_SESSION = SESSION_AUDIENCE;

    /**
     * True when a verified hub token is allowed to establish or refresh an interactive session.
     *
     * <p>A valid hub signature is NOT sufficient on its own: {@link #generateIcalToken} mints a
     * 90-day, RS256, {@code iss=power-plant-hub} token carrying the same {@code userId} claim, and
     * that one is deliberately handed to third parties (it is pasted into Google/Apple Calendar as a
     * {@code webcal://} URL). {@link #validateToken} sets no audience expectation, so without this
     * check anything that resolves a user from {@code userId} would happily promote a leaked
     * calendar link into a full session — and {@code /api/pwa/auth/refresh} would then reissue it as
     * a fresh 72-hour token beyond the reach of the iCal revocation nonce.
     *
     * <p>Non-hub (Supabase) tokens are governed by their own issuer and audience and pass through.
     */
    public boolean isSessionToken(Claims claims) {
        if (!isHubIssued(claims)) return true;
        Object purpose = claims.get("purpose");
        if (purpose instanceof String s && !s.isBlank()) return PURPOSE_SESSION.equals(s);
        // Minted before the purpose claim existed. Those carried no audience, while every scoped
        // hub token declares one — so "no audience" is the safe reading for a legacy session token.
        var audience = claims.getAudience();
        return audience == null || audience.isEmpty();
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        // Login accepts an email OR a username (UserDetailsServiceImpl), so an account can legitimately
        // have no email — and a JWT with a null `sub` is malformed. Fall back to the username.
        // NOTE: the subject is an identity LABEL only. Everything that resolves the account back from
        // a token keys on the userId claim below (see PwaTokenUserResolver) precisely because
        // username is not a unique column.
        String email = user.getEmail();
        String subject = (email == null || email.isBlank()) ? user.getUsername() : email;
        return Jwts.builder()
                .issuer(hubIssuer)
                .subject(subject)
                .audience().add(SESSION_AUDIENCE).and()
                .claim("email", user.getEmail())
                .claim("purpose", PURPOSE_SESSION)
                .claim("userId", user.getId())
                .claim("roles", user.getRoles())
                .claim("permissionLevel", user.getPermissionLevel())
                .claim("pwaUserUuid", user.getPwaUserUuid())
                .claim("supabaseUuid", user.getSupabaseUuid())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(hubPrivateKey, Jwts.SIG.RS256)
                .compact();
    }

    // ── Signing (Supabase-compatible, HS256 with the project's JWT secret) ──

    /** How long a hub-minted Supabase session token stays valid — short by design; refresh cheap. */
    private static final long SUPABASE_SESSION_TTL_MS = 60 * 60 * 1000L; // 1 hour

    /**
     * Mints a Supabase-verifiable JWT so an already-authenticated hub session (Electron desktop or
     * PWA) can talk directly to Supabase Realtime + RLS-protected tables without going through the
     * PWA Supabase-auth password flow. Signed with the Supabase project's JWT secret ({@code
     * supabase.jwt.secret}) so Supabase's own verifier accepts it.
     *
     * <p>Claim shape matches what Supabase RLS + Realtime expect:
     * {@code sub} = supabase user uuid, {@code aud} = {@code role} = "authenticated",
     * {@code user_metadata.roles} = the user's hub roles so RLS policies (like
     * {@code jwt_is_plant_group}) resolve. Used by the chat feature — see
     * {@code project/features/users/communication/plant-chat.md}.
     */
    public String generateSupabaseSessionToken(User user) {
        if (supabaseHmacKey == null) {
            throw new IllegalStateException(
                    "Cannot mint a Supabase session token: supabase.jwt.secret is not configured on this hub.");
        }
        if (user.getSupabaseUuid() == null || user.getSupabaseUuid().isBlank()) {
            throw new IllegalStateException(
                    "User " + user.getId() + " has no supabaseUuid — provision them in Supabase first "
                    + "(SupabaseUserProvisioningJob or SyncAtLoginService).");
        }
        Date now = new Date();
        Date expiry = new Date(now.getTime() + SUPABASE_SESSION_TTL_MS);
        Map<String, Object> userMetadata = new java.util.HashMap<>();
        userMetadata.put("roles", user.getRoles());
        userMetadata.put("hub_user_id", user.getId());
        if (user.getName() != null) userMetadata.put("name", user.getName());

        return Jwts.builder()
                .issuer(supabaseIssuer.isEmpty() ? "supabase" : supabaseIssuer)
                .subject(user.getSupabaseUuid())
                .audience().add("authenticated").and()
                .claim("role", "authenticated")
                .claim("email", user.getEmail())
                .claim("user_metadata", userMetadata)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(supabaseHmacKey, Jwts.SIG.HS256)
                .compact();
    }

    /** TTL (in seconds) advertised to clients — matches {@link #SUPABASE_SESSION_TTL_MS}. */
    public long getSupabaseSessionTtlSeconds() {
        return SUPABASE_SESSION_TTL_MS / 1000L;
    }

    // ── Signing (long-lived iCal subscription token) ────────────────────────
    //
    // Calendar subscription apps (Google Calendar, Apple Calendar, Outlook) can't send
    // Authorization headers on their poll requests, so the schedule .ics URL has to be
    // publicly accessible with the auth folded INTO the URL. We fold it in as a signed JWT.
    //
    // TTL = 90 days. Revocation has two layers: (1) hub-secret rotation invalidates every
    // outstanding iCal token for every user (blunt, fleet-wide); (2) the per-user
    // `tokenVersion` claim vs. User.icalTokenVersion lets a single user's link be revoked
    // ("regenerate my calendar link") by bumping their own version, without touching anyone
    // else's token or the hub key.

    private static final long ICAL_TOKEN_TTL_MS = 90L * 24 * 60 * 60 * 1000L; // 90 days
    private static final String ICAL_AUDIENCE = "schedule-ical";

    /** Mint a long-lived JWT to embed in the user's iCal subscription URL. Signed with the same
     *  hub key that mints session tokens, but tagged with {@code aud=schedule-ical} so the ical
     *  endpoint won't accept a plain session token, and vice versa. Stamps the user's current
     *  {@code icalTokenVersion} so a later bump (regenerate) invalidates this token. */
    public String generateIcalToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ICAL_TOKEN_TTL_MS);
        int tokenVersion = user.getIcalTokenVersion() == null ? 0 : user.getIcalTokenVersion();
        return Jwts.builder()
                .issuer(hubIssuer)
                .subject(String.valueOf(user.getId()))
                .audience().add(ICAL_AUDIENCE).and()
                .claim("userId", user.getId())
                .claim("purpose", "schedule-ical")
                .claim("tokenVersion", tokenVersion)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(hubPrivateKey, Jwts.SIG.RS256)
                .compact();
    }

    /** {@code userId} + {@code tokenVersion} claim extracted from a verified iCal JWT. {@code
     *  tokenVersion} defaults to 0 when the claim is absent (tokens minted before the per-user
     *  revocation nonce existed) — callers should treat a user's default/null
     *  {@code icalTokenVersion} the same way so those pre-existing links keep working. */
    public record IcalTokenClaims(Long userId, int tokenVersion) {}

    /**
     * Verify an iCal subscription JWT and return its claims. Throws {@link JwtException} on bad
     * signature / expired / wrong audience. The {@code aud=schedule-ical} check prevents a leaked
     * session token from being reused as an ical URL and vice versa. Does NOT check the
     * per-user revocation nonce itself (that requires loading the {@link User} row) — callers
     * must compare {@link IcalTokenClaims#tokenVersion()} against the user's current
     * {@code icalTokenVersion}.
     */
    public IcalTokenClaims verifyIcalTokenClaims(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(hubPublicKey)
                .requireAudience(ICAL_AUDIENCE)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Object uid = claims.get("userId");
        Long userId;
        if (uid instanceof Number n) userId = n.longValue();
        else if (uid instanceof String s) userId = Long.parseLong(s);
        else throw new IllegalArgumentException("iCal token has no userId claim");
        Object v = claims.get("tokenVersion");
        int tokenVersion = (v instanceof Number n) ? n.intValue() : 0;
        return new IcalTokenClaims(userId, tokenVersion);
    }

    /** @deprecated use {@link #verifyIcalTokenClaims(String)} — this overload only returns the
     *  {@code userId} and does not let the caller enforce the per-user revocation nonce. */
    @Deprecated
    public Long verifyIcalToken(String token) {
        return verifyIcalTokenClaims(token).userId();
    }

    // ── Verification (either issuer) ─────────────────────────────────────────

    /**
     * Verifies a token from either authority and returns its claims. Reads {@code iss} first to
     * pick the verification key. Throws {@link JwtException} on a bad signature, an expired token,
     * or an unknown/unsupported issuer.
     */
    public Claims validateToken(String token) {
        String iss = readIssuerUnverified(token);
        TokenIssuer type = resolveIssuer(iss);
        if (type == TokenIssuer.HUB) {
            return parseWith(hubPublicKey, token);
        }
        // Supabase — try each configured verifier (asymmetric first, then HMAC).
        List<Key> candidates = new ArrayList<>();
        if (supabasePublicKey != null) candidates.add(supabasePublicKey);
        if (supabaseHmacKey != null) candidates.add(supabaseHmacKey);
        if (candidates.isEmpty()) {
            throw new io.jsonwebtoken.security.SignatureException(
                    "Supabase token received but no Supabase verification key is configured");
        }
        JwtException last = null;
        for (Key k : candidates) {
            try {
                return parseWith(k, token);
            } catch (JwtException e) {
                last = e;
            }
        }
        throw last;
    }

    private Claims parseWith(Key key, String token) {
        // jjwt's verifyWith is overloaded for SecretKey and PublicKey (not the common Key supertype),
        // so branch explicitly.
        if (key instanceof SecretKey sk) {
            return Jwts.parser().verifyWith(sk).build().parseSignedClaims(token).getPayload();
        }
        return Jwts.parser().verifyWith((PublicKey) key).build().parseSignedClaims(token).getPayload();
    }

    /** HUB vs SUPABASE for the {@code iss} value; throws for anything unrecognized. */
    public TokenIssuer resolveIssuer(String iss) {
        if (iss == null || iss.isBlank()) {
            throw new io.jsonwebtoken.security.SignatureException("Token has no issuer (iss) claim");
        }
        if (iss.equals(hubIssuer)) return TokenIssuer.HUB;
        if (!supabaseIssuer.isEmpty() && iss.equals(supabaseIssuer)) return TokenIssuer.SUPABASE;
        if (iss.contains(".supabase.co") || iss.endsWith("/auth/v1") || iss.contains("supabase")) {
            return TokenIssuer.SUPABASE;
        }
        throw new io.jsonwebtoken.security.SignatureException("Unknown token issuer: " + iss);
    }

    /** Reads the {@code iss} claim from the payload segment without verifying the signature. */
    public String readIssuerUnverified(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) throw new IllegalArgumentException("Malformed JWT");
            byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode node = MAPPER.readTree(payload);
            JsonNode iss = node.get("iss");
            return iss == null ? null : iss.asText();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not read issuer from token: " + e.getMessage(), e);
        }
    }

    // ── Claim helpers ────────────────────────────────────────────────────────

    /** The user's email — hub tokens carry it as {@code sub}; Supabase tokens as the {@code email} claim. */
    public String extractEmail(String token) {
        return extractEmail(validateToken(token));
    }

    public String extractEmail(Claims claims) {
        Object email = claims.get("email");
        if (email instanceof String s && !s.isBlank()) return s;
        return claims.getSubject();
    }


    public boolean isHubIssued(Claims claims) {
        return hubIssuer.equals(claims.getIssuer());
    }

    public String getHubIssuer() {
        return hubIssuer;
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    private static Path resolvePath(String configured, String defaultName) {
        if (configured != null && !configured.isBlank()) return Paths.get(configured.trim());
        return Paths.get("data", defaultName);
    }

    /** True only on the central hub (sync.role=hub) — the one node that must ship a real signing key. */
    private static boolean isHubNode(String syncRole) {
        return syncRole != null && "hub".equalsIgnoreCase(syncRole.trim());
    }
}
