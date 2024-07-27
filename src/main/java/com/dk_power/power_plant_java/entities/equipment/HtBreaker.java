package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseBreaker;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Setter
@Getter
@NoArgsConstructor
public class HtBreaker extends BaseBreaker {
    @ManyToOne
    @JoinColumn(name = "panel_id")
    @JsonManagedReference
    private HtPanel panel;

    @OneToMany(mappedBy = "breaker")
    @JsonBackReference
    private List<HeatTrace> equipment;
}
