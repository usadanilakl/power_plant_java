package com.dk_power.power_plant_java.dto.pwa.qr;

/**
 * An off-page reference drawn on a P&ID, packaged for the mobile QR viewer.
 *
 * <p>Unlike the desktop shape pipeline (which re-derives everything from the raw
 * {@code coordinates} / {@code originalPictureSize} strings and a symbol catalog), the rectangle
 * here is already <b>normalised to fractions of the source image</b> — {@code fx}/{@code fy} is the
 * top-left corner and {@code fw}/{@code fh} the span, each in 0..1. The phone viewer can therefore
 * position a connector purely in percentages, with no knowledge of the image's pixel size and no
 * dependency on the drawn-at size matching the served JPG's size.</p>
 *
 * <p>{@code label} is resolved server-side (explicit override → target file number → target file
 * name → a "#id" fallback) so the client never has to fetch the target file just to draw a chip.</p>
 */
public record QrConnectorDto(
        Long id,
        Long targetFileId,
        String label,
        Double fx,
        Double fy,
        Double fw,
        Double fh
) {}
