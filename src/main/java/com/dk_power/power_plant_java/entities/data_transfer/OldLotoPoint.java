package com.dk_power.power_plant_java.entities.data_transfer;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@com.dk_power.power_plant_java.sevice.sync.LocalOnlyEntity(reason = "one-time data-import staging; never synced across the cluster")
public class OldLotoPoint extends BaseIdEntity {
    private String recId;
    private String status;
    private String isoPos;
    private String tagNumber;
    private String location;
    private String defaultIsolatedPosition;
    private String normalPos;
}
