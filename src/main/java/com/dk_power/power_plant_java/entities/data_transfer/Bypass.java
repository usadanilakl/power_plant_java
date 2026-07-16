package com.dk_power.power_plant_java.entities.data_transfer;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@com.dk_power.power_plant_java.sevice.sync.LocalOnlyEntity(reason = "one-time data-import staging; never synced across the cluster")
public class Bypass extends BaseIdEntity {
    private String standard;
    private String originalId;
    private String tagNumber;
    private String description;
    private String location;
}
