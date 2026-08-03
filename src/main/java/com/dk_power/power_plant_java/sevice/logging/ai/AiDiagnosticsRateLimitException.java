package com.dk_power.power_plant_java.sevice.logging.ai;

public class AiDiagnosticsRateLimitException extends RuntimeException {

    private final long retryAfterSeconds;

    public AiDiagnosticsRateLimitException(long retryAfterSeconds) {
        super("Diagnostics request rate limit exceeded");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
