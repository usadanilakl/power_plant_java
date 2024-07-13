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
public class KiewitPipeIso extends BaseIdEntity {
    private String tagNumber;
    private String description;
    private String sortableSize;
    private String system;
    private String pipeSpec;
    private String workingFluid;
    private String unit;
    private String designPressPsig;
    private String designTempF;
    private String schedule;
    private String maxOpPressPsig;
    private String normOpPressPsig;
    private String minOpPressPsig;
    private String testPressPsig;
    private String testMedium;
    private String maxOpTempF;
    private String normOpTempF;
    private String minOpTempF;
    private String insulationSpec;
    private String insulationThickness;
    private String heatTraced;
    private String cathodicProtection;
    private String comments;
    private String purchaseSpec;
    private String originalId;
    private String pid;
}
