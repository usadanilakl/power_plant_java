package com.dk_power.power_plant_java.dto.permits.loto_standard;

/**
 * A single "this point on this drawing" descriptor for the mobile file viewer: which file to load, and — when
 * the point's equipment has a drawn shape on it — the original pixel size + highlight rectangle. The rectangle
 * fields are null when the drawing is linked but no shape was drawn (still shown, just without a highlight).
 */
public record PointDrawingDto(
        Long pointId,
        Long fileId,
        String fileName,
        Double imageWidth,
        Double imageHeight,
        Double x,
        Double y,
        Double width,
        Double height
) {}
