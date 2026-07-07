package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.entities.users.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;

@Service
@Slf4j
public class JwtService {

    /** Known-weak/default secrets that must never sign production tokens. */
    private static final Set<String> REJECTED_SECRETS = Set.of(
            "YOUR_256_BIT_HEX_SECRET_HERE",                                     // shipped example placeholder
            "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"  // retired dev placeholder
    );

    /** Primary key: signs new tokens and is tried first on verify. */
    private final SecretKey key;
    /** Optional previous key: verify-only, to accept still-valid tokens during a secret rotation. */
    private final SecretKey previousKey;
    private final long expirationMs;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.secret-previous:}") String previousSecret,
                      @Value("${jwt.expiration-hours:72}") long expirationHours) {
        validateSecretStrength(secret);
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.previousKey = (previousSecret != null && !previousSecret.isBlank())
                ? Keys.hmacShaKeyFor(previousSecret.getBytes(StandardCharsets.UTF_8))
                : null;
        this.expirationMs = expirationHours * 3600 * 1000;
    }

    /** Fail fast at startup rather than sign tokens with a blank, short, or placeholder key. */
    private static void validateSecretStrength(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("jwt.secret is not configured.");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "jwt.secret must be at least 32 bytes (256-bit). Generate one with: openssl rand -hex 32");
        }
        if (REJECTED_SECRETS.contains(secret)) {
            throw new IllegalStateException(
                    "jwt.secret is still a default/placeholder value — rotate it. Generate one with: openssl rand -hex 32");
        }
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("roles", user.getRoles())
                .claim("permissionLevel", user.getPermissionLevel())
                .claim("pwaUserUuid", user.getPwaUserUuid())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims validateToken(String token) {
        try {
            return parseWith(key, token);
        } catch (SignatureException primaryFailure) {
            // Signature didn't match the current key. During a secret rotation the token may
            // have been signed with the previous key — accept it (expiry is still enforced).
            if (previousKey != null) {
                return parseWith(previousKey, token);
            }
            throw primaryFailure;
        }
    }

    private Claims parseWith(SecretKey signingKey, String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return validateToken(token).getSubject();
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }
}
