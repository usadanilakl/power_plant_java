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
        List<PointDrawingDto> drawings,
        /**
         * Attachment (photo/document) count for the entity behind the match, so the PWA can render
         * a "📸 3" chip on the actions pill without an extra round-trip. LOTO points use the same
         * {@code loto_point_picture} M2M the desktop form's Pictures cell reads; equipment is
         * counted as 0 for now (Equipment carries its main-file / files M2M in a different shape
         * that the QR actions panel does not yet render).
         */
        int photoCount,
        /**
         * Comment count on the entity — polymorphic {@code Comment} rows with
         * {@code entityType="LotoPoint"}. Zero for equipment for the same reason as
         * {@link #photoCount}.
         */
        int commentCount
) {}
