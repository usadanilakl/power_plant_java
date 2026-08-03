package com.dk_power.power_plant_java.config.diagnostics;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/** Authenticates opaque service keys against configured SHA-256 hashes. */
@Component
public class AiDiagnosticsApiKeyAuthenticator {

    private static final Pattern SHA_256_HEX = Pattern.compile("^[0-9a-fA-F]{64}$");
    private static final Pattern SAFE_IDENTITY = Pattern.compile("^[A-Za-z0-9._:@/-]{1,128}$");
    private static final int MIN_API_KEY_LENGTH = 32;

    private final int maxApiKeyLength;
    private final List<Credential> credentials;

    public AiDiagnosticsApiKeyAuthenticator(AiDiagnosticsProperties properties) {
        maxApiKeyLength = Math.max(32, properties.getMaxApiKeyLength());
        credentials = loadCredentials(properties);
    }

    public Optional<AiDiagnosticsPrincipal> authenticate(String rawApiKey) {
        if (rawApiKey == null || rawApiKey.isBlank() || rawApiKey.length() < MIN_API_KEY_LENGTH
            || rawApiKey.length() > maxApiKeyLength) {
            return Optional.empty();
        }

        byte[] candidateHash = sha256(rawApiKey);
        Credential matched = null;

        // Compare every configured credential. Do not reveal which key position matched.
        for (Credential credential : credentials) {
            if (MessageDigest.isEqual(candidateHash, credential.sha256())) {
                matched = credential;
            }
        }

        if (matched == null) {
            return Optional.empty();
        }
        if (matched.expiresAt() != null && !Instant.now().isBefore(matched.expiresAt())) {
            return Optional.empty();
        }
        return Optional.of(new AiDiagnosticsPrincipal(matched.identity(), matched.scopes()));
    }

    private List<Credential> loadCredentials(AiDiagnosticsProperties properties) {
        if (!properties.isEnabled()) {
            return List.of();
        }

        List<Credential> loaded = new ArrayList<>();
        Set<String> identities = new HashSet<>();
        Set<String> hashes = new HashSet<>();

        for (AiDiagnosticsProperties.ApiKey configured : properties.getApiKeys()) {
            if (configured == null || !configured.isEnabled()) {
                continue;
            }

            String identity = configured.getIdentity() == null ? "" : configured.getIdentity().trim();
            String hash = configured.getSha256() == null ? "" : configured.getSha256().trim().toLowerCase();
            if (!SAFE_IDENTITY.matcher(identity).matches()) {
                throw new IllegalStateException(
                    "AI diagnostics API key identity must be 1-128 safe identifier characters");
            }
            if (!SHA_256_HEX.matcher(hash).matches()) {
                throw new IllegalStateException("AI diagnostics API key '" + identity
                    + "' must contain a 64-character SHA-256 hex hash");
            }
            if (!identities.add(identity)) {
                throw new IllegalStateException("Duplicate AI diagnostics API key identity: " + identity);
            }
            if (!hashes.add(hash)) {
                throw new IllegalStateException("Duplicate AI diagnostics API key hash configured");
            }

            EnumSet<AiDiagnosticsScope> scopes = EnumSet.noneOf(AiDiagnosticsScope.class);
            for (String configuredScope : configured.getScopes()) {
                String scopeValue = configuredScope == null ? "" : configuredScope.trim();
                AiDiagnosticsScope scope = AiDiagnosticsScope.fromValue(scopeValue)
                    .orElseThrow(() -> new IllegalStateException(
                        "Unknown AI diagnostics scope '" + scopeValue + "' for identity " + identity));
                scopes.add(scope);
            }
            if (scopes.isEmpty()) {
                throw new IllegalStateException("AI diagnostics API key '" + identity + "' has no scopes");
            }

            loaded.add(new Credential(identity, HexFormat.of().parseHex(hash), scopes, configured.getExpiresAt()));
        }

        if (loaded.isEmpty()) {
            throw new IllegalStateException(
                "AI diagnostics is enabled but no enabled, valid service API keys are configured");
        }
        return List.copyOf(loaded);
    }

    private byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("JVM does not provide SHA-256", e);
        }
    }

    private record Credential(
        String identity,
        byte[] sha256,
        Set<AiDiagnosticsScope> scopes,
        Instant expiresAt
    ) {
        private Credential {
            sha256 = sha256.clone();
            scopes = Set.copyOf(scopes);
        }
    }
}
