package com.dk_power.power_plant_java.dto.permits.loto_point;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyIdDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Identity is the entity's primary key. Deserialized copies of the same LOTO point
 * (e.g. one built when the standard was flipped into a permit and another built by
 * a subsequent snapshot re-parse) must collapse into a single Set element, otherwise
 * the {@code Set<LotoPointIdDto>} stored on {@code LotoSnapshot} grows every time
 * something round-trips through the DB, and — worse — the sort in
 * {@code Loto.getLotoPoints()} shuffles because two equal-order-key entries hash
 * to different bucket positions on each JVM.
 * <p>
 * Manual override rather than {@code @EqualsAndHashCode(of = "id")} because {@code id}
 * lives on {@link BaseDto} and Lombok's declared-fields-only lookup can't see it.
 */
@NoArgsConstructor
@Getter
@Setter
public class LotoPointIdDto extends BaseDto {
    private String unit;
    private String tagged;
    private String tagNumber;
    private String description;
    private Long isoPos;
    private Long normPos;
    private String specificLocation;
    private String standard;
    private String generalLocation;
    private List<Long> equipmentIdList;
    private String normalPosition;
    private String isolatedPosition;
    private String characteristicsJson;
    private List<Long> lotos;
    private Set<Long> equipmentList;
    private String oldId;
    private String objectType;
    private Long isUpdated;
    private String fileIds ;
    private String conflictStatus;
    private String zeroEnergyMethod;
    private Long zeroEnergyId;
    private ZeroEnergyIdDto zeroEnergy; // Nested object for creating/updating ZeroEnergy inline
    private Long location;
    private Long eqType;
    private Set<Long> relatedLotoPointIds;
    private Long counterpartId;
    private Long modelFileId;
    private Boolean isLabeled = false;
    private Boolean isLockable = false;
    private Boolean isProcessed = false;
    private Long processingStatus;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LotoPointIdDto other)) return false;
        // Equal iff both have the same non-null id. Two "new" (id == null) instances
        // are only equal if they're the same object — keeps unsaved drafts distinct.
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }
}
