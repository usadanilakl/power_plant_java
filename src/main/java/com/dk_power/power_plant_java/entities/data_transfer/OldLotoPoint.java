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
public class OldLotoPoint extends BaseIdEntity {
    private String recId;
    private String status;
    private String isolationDeviceDescription;
    private String isolationDevicePnId;
    private String isolationDeviceLocation;
    private String defaultIsolatedPosition;
    private String normalPosition;
}
