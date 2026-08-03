package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsPrincipal;
import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsScope;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiDiagnosticsStreamServiceTest {

    private AiDiagnosticsStreamService service;

    @AfterEach
    void stopService() {
        if (service != null) {
            service.stop();
        }
    }

    @Test
    void enforcesPerIdentityConnectionLimitAndRejectsInvalidResumeId() {
        AiDiagnosticsProperties properties = enabledProperties();
        service = new AiDiagnosticsStreamService(properties,
            query -> new AiDiagnosticsEventPage(java.util.List.of(), null, false, false),
            new AiDiagnosticsCursorCodec());
        service.start();
        AiDiagnosticsPrincipal principal = new AiDiagnosticsPrincipal(
            "agent", Set.of(AiDiagnosticsScope.LOGS_STREAM));

        service.subscribe(principal, null, null, null, null, null, null);

        assertEquals(1, service.activeConnections());
        assertThrows(AiDiagnosticsConnectionLimitException.class,
            () -> service.subscribe(principal, null, null, null, null, null, null));
        assertThrows(IllegalArgumentException.class,
            () -> service.subscribe(new AiDiagnosticsPrincipal(
                "other", Set.of(AiDiagnosticsScope.LOGS_STREAM)), "invalid", null, null, null, null, null));
    }

    private AiDiagnosticsProperties enabledProperties() {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        properties.setEnabled(true);
        properties.getStream().setPollInterval(Duration.ofSeconds(30));
        properties.getStream().setHeartbeatInterval(Duration.ofSeconds(30));
        properties.getStream().setMaxLifetime(Duration.ofMinutes(1));
        properties.getStream().setMaxConnections(2);
        properties.getStream().setMaxConnectionsPerIdentity(1);
        return properties;
    }
}
