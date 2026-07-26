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

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .issuer(hubIssuer)
                .subject(user.getEmail())
                .claim("email", user.getEmail())
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
