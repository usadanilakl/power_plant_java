package com.dk_power.power_plant_java.config.diagnostics;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiDiagnosticsApiKeyAuthenticatorTest {

    private static final String SERVICE_KEY =
        "0123456789abcdef0123456789abcdef0123456789abcdef";

    @Test
    void authenticatesOpaqueKeyAndMapsOnlyConfiguredScopes() throws Exception {
        AiDiagnosticsProperties properties = propertiesWithKey(
            "support-agent", SERVICE_KEY, Set.of("logs:read", "logs:stream"), null);

        var principal = new AiDiagnosticsApiKeyAuthenticator(properties)
            .authenticate(SERVICE_KEY)
            .orElseThrow();

        assertEquals("support-agent", principal.identity());
        assertTrue(principal.hasScope(AiDiagnosticsScope.LOGS_READ));
        assertTrue(principal.hasScope(AiDiagnosticsScope.LOGS_STREAM));
        assertFalse(principal.hasScope(AiDiagnosticsScope.DIAGNOSTICS_BUNDLE));
    }

    @Test
    void rejectsWrongAndExpiredKeys() throws Exception {
        AiDiagnosticsProperties properties = propertiesWithKey(
            "expired-agent", SERVICE_KEY, Set.of("logs:read"), Instant.now().minusSeconds(1));
        AiDiagnosticsApiKeyAuthenticator authenticator = new AiDiagnosticsApiKeyAuthenticator(properties);

        assertTrue(authenticator.authenticate("wrong-value").isEmpty());
        assertTrue(authenticator.authenticate(SERVICE_KEY).isEmpty());
    }

    @Test
    void disabledFeatureDoesNotRequireCredentials() {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();

        AiDiagnosticsApiKeyAuthenticator authenticator = new AiDiagnosticsApiKeyAuthenticator(properties);

        assertTrue(authenticator.authenticate("anything").isEmpty());
    }

    @Test
    void enabledFeatureFailsClosedForUnknownScope() throws Exception {
        AiDiagnosticsProperties properties = propertiesWithKey(
            "agent", SERVICE_KEY, Set.of("logs:write"), null);

        assertThrows(IllegalStateException.class,
            () -> new AiDiagnosticsApiKeyAuthenticator(properties));
    }

    @Test
    void rejectsConfiguredKeyThatIsTooShortForAServiceCredential() throws Exception {
        AiDiagnosticsProperties properties = propertiesWithKey(
            "agent", "short-key", Set.of("logs:read"), null);

        assertTrue(new AiDiagnosticsApiKeyAuthenticator(properties)
            .authenticate("short-key").isEmpty());
    }

    private AiDiagnosticsProperties propertiesWithKey(
        String identity,
        String rawKey,
        Set<String> scopes,
        Instant expiresAt
    ) throws Exception {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        properties.setEnabled(true);
        AiDiagnosticsProperties.ApiKey apiKey = new AiDiagnosticsProperties.ApiKey();
        apiKey.setIdentity(identity);
        apiKey.setSha256(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
            .digest(rawKey.getBytes(StandardCharsets.UTF_8))));
        apiKey.setScopes(scopes);
        apiKey.setExpiresAt(expiresAt);
        properties.setApiKeys(java.util.List.of(apiKey));
        return properties;
    }
}
