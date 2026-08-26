package com.dk_power.power_plant_java.dto.pwa.finder;

/**
 * One row of Equipment Finder results.
 *
 * <p>{@code type} is {@code "lotoPoint"} or {@code "equipment"} — the same vocabulary the QR resolver
 * uses, so tapping a row can hand the pair straight to {@code /api/pwa/secured/qr/item/{type}/{id}}
 * for its drawings. Equipment only ever appears here when no LOTO point references it.</p>
 *
 * <p>{@code hasDrawing} lets the list show which rows will actually open a P&amp;ID. It is resolved in
 * one query per type rather than per row.</p>
 */
public record FinderItemDto(
        String type,
        Long id,
        String tagNumber,
        String description,
        String location,
        String eqType,
        String specificLocation,
        boolean hasDrawing
) {}
