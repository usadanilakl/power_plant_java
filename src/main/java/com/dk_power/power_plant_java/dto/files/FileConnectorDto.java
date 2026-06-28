package com.dk_power.power_plant_java.dto.files;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response DTO for {@link com.dk_power.power_plant_java.entities.files.FileConnector}.
 * File references emitted as IDs + display-friendly resolved fields ({@code sourceFileNumber} /
 * {@code targetFileNumber} / {@code targetFileName}) so the viewer can render
 * the connector label without an extra round-trip per connector.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileConnectorDto extends BaseDto {

    private Long sourceFileId;
    private Long targetFileId;
    /** Resolved at map time so the viewer doesn't need to fetch the source file. */
    private String sourceFileNumber;
    /** Resolved at map time so the connector label can render without another fetch. */
    private String targetFileNumber;
    private String targetFileName;

    private String coordinates;
    private String originalPictureSize;
    private Double rotation;
    private String symbolId;
    private String svgPath;

    private Long counterpartConnectorId;

    /** Optional user override. Frontend computes a default from targetFileNumber when null. */
    private String label;

    /** Whether the viewer should draw the label inside the connector shape.
     *  Nullable Boolean — null treated as false (default for legacy rows). */
    private Boolean showLabel;
}
