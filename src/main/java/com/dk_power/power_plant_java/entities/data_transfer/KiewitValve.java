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
public class KiewitValve extends BaseIdEntity {
    private String tagNumber;
    private String description;
    private String lineNumber;
    private String sizeIn;
    private String valveType;
    private String system;
    private String pipeSpec;
    private String workingFluid;
    private String rating;
    private String endPrep1;
    private String endPrep2;
    private String designPressPsig;
    private String designTempF;
    private String valveSchedule;
    private String insulationThickness;
    private String heatTraced;
    private String purchaseSpec;
    private String comments;
    private String originalId;
    private String pid;
}
