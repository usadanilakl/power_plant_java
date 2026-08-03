package com.dk_power.power_plant_java.config.diagnostics;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiDiagnosticsApiKeyFilterTest {

    private static final String SERVICE_KEY =
        "fedcba9876543210fedcba9876543210fedcba9876543210";

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void disabledFeatureReturnsNotFoundWithoutCallingChain() throws Exception {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        AiDiagnosticsApiKeyFilter filter = filter(properties);
        MockHttpServletRequest request = request();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilter(request, response, (req, res) -> called.set(true));

        assertEquals(404, response.getStatus());
        assertFalse(called.get());
        assertEquals("no-store", response.getHeader("Cache-Control"));
        assertEquals("no-cache", response.getHeader("Pragma"));
    }

    @Test
    void rejectsQueryStringCredential() throws Exception {
        AiDiagnosticsProperties properties = enabledProperties(SERVICE_KEY);
        AiDiagnosticsApiKeyFilter filter = filter(properties);
        MockHttpServletRequest request = request();
        request.setParameter("token", SERVICE_KEY);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> { });

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("QUERY_CREDENTIAL_REJECTED"));
        assertEquals("no-store", response.getHeader("Cache-Control"));
    }

    @Test
    void exposesServiceAuthenticationOnlyForDurationOfRequest() throws Exception {
        AiDiagnosticsProperties properties = enabledProperties(SERVICE_KEY);
        AiDiagnosticsApiKeyFilter filter = filter(properties);
        MockHttpServletRequest request = request();
        request.addHeader("Authorization", "Bearer " + SERVICE_KEY);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<Object> principalDuringChain = new AtomicReference<>();
        AtomicReference<Set<String>> authoritiesDuringChain = new AtomicReference<>();

        filter.doFilter(request, response, (req, res) -> {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            principalDuringChain.set(authentication.getPrincipal());
            authoritiesDuringChain.set(authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority()).collect(java.util.stream.Collectors.toSet()));
        });

        assertEquals("diagnostic-agent", ((AiDiagnosticsPrincipal) principalDuringChain.get()).identity());
        assertEquals(Set.of("SCOPE_logs:read"), authoritiesDuringChain.get());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    private AiDiagnosticsApiKeyFilter filter(AiDiagnosticsProperties properties) {
        return new AiDiagnosticsApiKeyFilter(
            properties, new AiDiagnosticsApiKeyAuthenticator(properties), new ObjectMapper());
    }

    private AiDiagnosticsProperties enabledProperties(String rawKey) throws Exception {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        properties.setEnabled(true);
        AiDiagnosticsProperties.ApiKey apiKey = new AiDiagnosticsProperties.ApiKey();
        apiKey.setIdentity("diagnostic-agent");
        apiKey.setSha256(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
            .digest(rawKey.getBytes(StandardCharsets.UTF_8))));
        apiKey.setScopes(Set.of("logs:read"));
        properties.setApiKeys(List.of(apiKey));
        return properties;
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/ng/ai-diagnostics/v1/events");
        request.setRequestURI("/ng/ai-diagnostics/v1/events");
        return request;
    }
}
