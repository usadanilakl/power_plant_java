package com.dk_power.power_plant_java.dto.maximo;

import java.util.List;

/**
 * Bulk-assign one LOTO to many outage work orders. Each target carries both the {@code wonum} (stored on the
 * LOTO's {@code linkedWonums}) and the Maximo {@code href} (needed to post the "Covered by LOTO: …" worklog to
 * that WO without a lookup round-trip).
 */
public record AssignLotoRequest(
        Long lotoId,
        List<Target> targets
) {
    public record Target(String wonum, String href) {}
}
