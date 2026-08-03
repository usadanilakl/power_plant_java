package com.dk_power.power_plant_java.sevice.logging.ai;

/**
 * Boundary between the agent API and the sanitized diagnostics store. Every
 * implementation must return already-redacted events.
 */
public interface AiDiagnosticsEventSource {
    AiDiagnosticsEventPage query(AiDiagnosticsQuery query);
}
