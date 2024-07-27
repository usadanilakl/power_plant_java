package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseElectricalPanel;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
@Entity
@Setter
@Getter
@NoArgsConstructor
public class HtPanel extends BaseElectricalPanel {
    @OneToMany(mappedBy = "panel")
    @JsonBackReference
    private List<HtBreaker> htBreakers = new ArrayList<>();
}
