package com.dk_power.power_plant_java.entities.equipment;

import com.azure.core.annotation.Get;
import com.dk_power.power_plant_java.entities.base_entities.BaseElectricalPanel;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jdk.jfr.Enabled;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.awt.*;

@Entity
@Setter
@Getter
@NoArgsConstructor
public class Breaker extends BaseIdEntity {
    @ManyToOne
    @JoinColumn(name = "panel_id")
    private HtPanel panel;

    @OneToOne
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;
}
