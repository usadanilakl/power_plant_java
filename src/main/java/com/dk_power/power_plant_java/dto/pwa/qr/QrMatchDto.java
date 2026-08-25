package com.dk_power.power_plant_java.dto.pwa.qr;

import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;

import java.util.List;

/**
 * One thing a scanned tag resolved to, with every drawing it appears on.
 *
 * <p>{@code type} is {@code "lotoPoint"} or {@code "equipment"} — LOTO points are searched first and
 * equipment is only a fallback (see {@code PwaQrService#resolveTag}), so a tag that is both resolves
 * as the LOTO point rather than showing the operator two near-identical choices.</p>
 *
 * <p>{@code drawings} carries <b>all</b> occurrences, not just the first: a point linked to several
 * Equipment appears on several P&amp;IDs, and each gets its own tab in the viewer.</p>
 */
public record QrMatchDto(
        String type,
        Long id,
        String tagNumber,
        String description,
        List<PointDrawingDto> drawings
) {}
