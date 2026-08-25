package com.dk_power.power_plant_java.dto.pwa.qr;

import java.util.List;

/**
 * Result of resolving a scanned tag. An empty {@code matches} list is a normal 200 response, not an
 * error — the viewer renders "nothing found for this tag" and the client can cache that answer.
 */
public record QrTagResultDto(
        String tagNumber,
        List<QrMatchDto> matches
) {}
