package com.dk_power.power_plant_java.sevice.logging.ai;

public enum AiDiagnosticsSort {
    ASC,
    DESC;

    public static AiDiagnosticsSort parse(String value) {
        if (value == null || value.isBlank() || "desc".equalsIgnoreCase(value)) {
            return DESC;
        }
        if ("asc".equalsIgnoreCase(value)) {
            return ASC;
        }
        throw new IllegalArgumentException("sort must be asc or desc");
    }
}
