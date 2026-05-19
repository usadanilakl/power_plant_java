package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.entities.loto.LotoStandardPendingChange;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Flat projection of {@link LotoStandardPendingChange} for wire transport.
 * Does NOT expose the back-reference to {@code LotoStandard} (which would
 * cycle into points and back) — only the standard's id.
 */
@Data
@AllArgsConstructor
public class LotoStandardPendingChangeDto {

    private Long id;
    private Long standardId;
    private Long lotoPointId;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private String editedBy;
    private LocalDateTime editedAt;
    private String resolution;
    private String resolvedBy;
    private LocalDateTime resolvedAt;

    public static LotoStandardPendingChangeDto from(LotoStandardPendingChange c) {
        return new LotoStandardPendingChangeDto(
                c.getId(),
                c.getStandard() != null ? c.getStandard().getId() : null,
                c.getLotoPointId(),
                c.getFieldName(),
                c.getOldValue(),
                c.getNewValue(),
                c.getEditedBy(),
                c.getEditedAt(),
                c.getResolution() != null ? c.getResolution().name() : null,
                c.getResolvedBy(),
                c.getResolvedAt()
        );
    }
}
