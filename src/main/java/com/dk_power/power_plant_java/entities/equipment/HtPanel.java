package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseElectricalPanel;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;

import java.util.ArrayList;
import java.util.List;

public class HtPanel extends BaseElectricalPanel {
    @OneToMany(mappedBy = "panel", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Breaker> breakers = new ArrayList<>();
}
