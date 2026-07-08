package com.dk_power.power_plant_java.dto.permits.loto_standard;

/**
 * A single "this point on this drawing" descriptor for the mobile file viewer: which file to load, its original
 * pixel size (for scaling), and the highlight rectangle in those original pixels. A point may have several.
 */
public record PointDrawingDto(
        Long pointId,
        Long fileId,
        String fileName,
        double imageWidth,
        double imageHeight,
        double x,
        double y,
        double width,
        double height
) {}
