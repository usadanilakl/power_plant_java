package com.dk_power.power_plant_java.dto.files;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Create/update payload for {@link com.dk_power.power_plant_java.entities.files.FileConnector}.
 * Files referenced by ID only — caller is responsible for ensuring both files
 * exist; the service rejects unresolvable IDs.
 *
 * <p>{@code counterpartConnectorId} accepted here for completeness but the
 * canonical way to link counterparts is the dedicated link/unlink endpoints
 * — they enforce the bidirectional invariants (atomic save, no self-link,
 * opposite side cleared).
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileConnectorIdDto extends BaseDto {

    private Long sourceFileId;
    private Long targetFileId;

    private String coordinates;
    private String originalPictureSize;
    private Double rotation;
    private String symbolId;
    private String svgPath;

    private Long counterpartConnectorId;
    private String label;
}
