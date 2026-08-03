package com.dk_power.power_plant_java.config.diagnostics;

import java.util.Arrays;
import java.util.Optional;

public enum AiDiagnosticsScope {
    LOGS_READ("logs:read"),
    LOGS_STREAM("logs:stream"),
    DIAGNOSTICS_BUNDLE("diagnostics:bundle");

    private final String value;

    AiDiagnosticsScope(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public String authority() {
        return "SCOPE_" + value;
    }

    public static Optional<AiDiagnosticsScope> fromValue(String value) {
        return Arrays.stream(values())
            .filter(scope -> scope.value.equals(value))
            .findFirst();
    }
}
