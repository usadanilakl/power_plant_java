package com.dk_power.power_plant_java.entities.plant;

import com.dk_power.power_plant_java.entities.BaseEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Vendor extends BaseEntity {
    private String name;
}
