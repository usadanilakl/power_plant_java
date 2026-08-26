package com.dk_power.power_plant_java.dto.permits;

import java.util.List;

/**
 * Lightweight LOTO shape for the WO↔LOTO linking pickers: identity + status + the equipment it isolates + which
 * WOs it's already linked to. Deliberately not the full {@link LotoDto} (no points/snapshots/locks).
 */
public record LotoLinkDto(
        Long id,
        String permitNumber,
        String status,           // permitStatus name: Building / Active / Test / Closed
        String equipmentSystem,
        String lotoRequestor,
        List<String> linkedWonums
) {}
