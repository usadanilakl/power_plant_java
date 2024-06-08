package com.dk_power.power_plant_java.entities.plant;

import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class Syst extends Group {
    public Syst(String name) {
        super(name);
    }
}
