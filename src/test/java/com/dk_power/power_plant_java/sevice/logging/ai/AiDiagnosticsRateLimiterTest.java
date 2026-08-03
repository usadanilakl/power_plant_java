package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiDiagnosticsRateLimiterTest {

    @Test
    void springSelectsTheProductionConstructor() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(AiDiagnosticsProperties.class);
            context.register(AiDiagnosticsRateLimiter.class);
            context.refresh();

            assertNotNull(context.getBean(AiDiagnosticsRateLimiter.class));
        }
    }

    @Test
    void limitsEachIdentityAndOperationAndCleansExpiredWindows() {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        properties.setEnabled(true);
        properties.getRateLimit().setHistoricalRequestsPerMinute(1);
        MutableClock clock = new MutableClock(Instant.parse("2026-08-02T12:00:00Z"));
        AiDiagnosticsRateLimiter limiter = new AiDiagnosticsRateLimiter(properties, clock);

        assertTrue(limiter.check("agent-a", AiDiagnosticsRateLimiter.Operation.HISTORICAL).allowed());
        var denied = limiter.check("agent-a", AiDiagnosticsRateLimiter.Operation.HISTORICAL);
        assertFalse(denied.allowed());
        assertTrue(denied.retryAfterSeconds() > 0);
        assertTrue(limiter.check("agent-b", AiDiagnosticsRateLimiter.Operation.HISTORICAL).allowed());
        assertTrue(limiter.check("agent-a", AiDiagnosticsRateLimiter.Operation.BUNDLE).allowed());
        assertEquals(3, limiter.bucketCount());

        clock.set(Instant.parse("2026-08-02T14:00:00Z"));
        limiter.cleanupExpiredBuckets();
        assertEquals(0, limiter.bucketCount());
    }

    private static final class MutableClock extends Clock {
        private final AtomicReference<Instant> instant;

        private MutableClock(Instant initial) {
            instant = new AtomicReference<>(initial);
        }

        private void set(Instant value) {
            instant.set(value);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant.get();
        }
    }
}
