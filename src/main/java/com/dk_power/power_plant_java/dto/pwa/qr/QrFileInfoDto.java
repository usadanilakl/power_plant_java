package com.dk_power.power_plant_java.dto.pwa.qr;

import java.util.List;

/**
 * A drawing the viewer is about to show, plus the off-page references drawn on it.
 *
 * <p>Served both for the files a scanned tag landed on and for any file reached by tapping a
 * connector, so drawing-to-drawing navigation needs no separate endpoint.</p>
 */
public record QrFileInfoDto(
        Long fileId,
        String fileName,
        String fileNumber,
        List<QrConnectorDto> connectors
) {}
