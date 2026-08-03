package com.dk_power.power_plant_java.sevice.logging.ai;

public record AiDiagnosticsBundleResult(
    byte[] content,
    int eventCount,
    boolean truncated,
    String nextCursor
) {
    public AiDiagnosticsBundleResult {
        content = content.clone();
    }
}
