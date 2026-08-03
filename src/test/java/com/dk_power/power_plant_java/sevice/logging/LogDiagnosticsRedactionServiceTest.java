package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class LogDiagnosticsRedactionServiceTest {

    private final LogDiagnosticsRedactionService service = new LogDiagnosticsRedactionService();

    @Test
    void redactsSecretsResetLinksContextAndIpAddresses() {
        String jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdXBlci1zZWNyZXQifQ.signature12345";
        LogDiagnosticsEventDto raw = new LogDiagnosticsEventDto(
            Instant.parse("2026-08-02T12:00:00Z"),
            "ERROR",
            "Security",
            "power-plant-security.log",
            "example.Auth",
            "http-1",
            "auth.login.failed",
            "password=pw-secret api_key=api-secret sig=flow-secret code=business-code jwt=" + jwt
                + " email=Some.User@example.com remote=10.20.30.40 v6=2001:db8::1234",
            "Authorization: Bearer bearer-secret\nCookie: SESSION=cookie-secret\n"
                + "reset=https://example.test/password/reset?token=reset-secret",
            "token=request-secret",
            "Some.User@example.com",
            "machine-1",
            null,
            null,
            null,
            null,
            null,
            null,
            "GET",
            "/oauth/callback?access_token=path-secret&code=keep-code",
            "2001:db8::beef",
            401,
            12L,
            "opaque-event-id"
        );

        LogDiagnosticsEventDto redacted = service.redact(raw);
        String allText = String.join("\n", Stream.of(
                redacted.message(), redacted.details(), redacted.requestId(), redacted.userId(),
                redacted.path(), redacted.remoteIp()
            ).filter(value -> value != null).toList());

        assertThat(allText)
            .doesNotContain(
                "pw-secret", "api-secret", "flow-secret", "bearer-secret", "cookie-secret",
                "reset-secret", "request-secret", "path-secret", jwt, "10.20.30.40",
                "2001:db8::1234", "2001:db8::beef"
            )
            .doesNotContain("keep-code")
            .contains("[REDACTED]", "[IPV6:MASKED]", "code=business-code", "S***@example.com", "10.20.x.x");
        assertThat(redacted.eventId()).isEqualTo("opaque-event-id");
        assertThat(redacted.logicalEventId()).isEqualTo("opaque-event-id");
    }

    @Test
    void truncatesAfterRedactionWithoutSplittingASurrogatePair() {
        ReflectionTestUtils.setField(service, "maxMessageLength", 40);
        String secret = "secret-that-must-not-leak";
        LogDiagnosticsEventDto raw = event(
            "password=" + secret + " abcdefghijklmnopqrstuvwxyz-\uD83D\uDE00-tail"
        );

        String message = service.redact(raw).message();

        assertThat(message).doesNotContain(secret).endsWith("...[TRUNCATED]");
        assertThat(message.length()).isLessThanOrEqualTo(40);
        assertThat(message.codePoints().toArray()).doesNotContain(0xFFFD);
    }

    private LogDiagnosticsEventDto event(String message) {
        return new LogDiagnosticsEventDto(
            Instant.parse("2026-08-02T12:00:00Z"), "INFO", "Application",
            "power-plant-logger.log", "example.Logger", "main", "app.test", message,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, "opaque-event-id"
        );
    }
}
