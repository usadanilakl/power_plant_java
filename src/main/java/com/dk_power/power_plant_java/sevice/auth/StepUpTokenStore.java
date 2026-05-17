package com.dk_power.power_plant_java.sevice.auth;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory store of short-lived single-use step-up tokens.
 *
 * <p>A step-up token authorizes ONE upstream request to run under a specific
 * user's identity, regardless of the current SecurityContext. Tokens are bound
 * to a username, expire ~90 seconds after issuance, and are consumed (removed)
 * on first use.
 *
 * <p>Process-local — fine for the desktop/hub topology where each Spring Boot
 * instance has its own request flow. If we ever move auth to multi-instance,
 * swap this for a Redis or short-TTL DB-backed store.
 */
@Component
public class StepUpTokenStore {

    /** Default TTL. Long enough for a one-retry network blip, short enough that a walked-away tablet doesn't matter. */
    public static final Duration DEFAULT_TTL = Duration.ofSeconds(90);

    public record Token(String token, String username, Instant expiresAt) {
        public boolean isExpired() { return Instant.now().isAfter(expiresAt); }
    }

    private final ConcurrentHashMap<String, Token> tokens = new ConcurrentHashMap<>();

    /** Mint a new token for {@code username} with the default TTL. */
    public Token issue(String username) {
        return issue(username, DEFAULT_TTL);
    }

    public Token issue(String username, Duration ttl) {
        String value = UUID.randomUUID().toString();
        Token t = new Token(value, username, Instant.now().plus(ttl));
        tokens.put(value, t);
        return t;
    }

    /**
     * Atomically consume a token. Returns the bound username if the token
     * existed and had not expired, else empty. The token is always removed
     * on lookup (success or expired) — single-use.
     */
    public java.util.Optional<String> consume(String token) {
        if (token == null || token.isBlank()) return java.util.Optional.empty();
        Token t = tokens.remove(token);
        if (t == null || t.isExpired()) return java.util.Optional.empty();
        return java.util.Optional.of(t.username());
    }

    /** Drop expired tokens. Called periodically; cheap when the map is small. */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60_000)
    public void cleanup() {
        Instant now = Instant.now();
        tokens.values().removeIf(t -> now.isAfter(t.expiresAt));
    }
}
