package com.dk_power.power_plant_java.entities.plant;

import com.dk_power.power_plant_java.entities.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@MappedSuperclass
public class Group extends BaseEntity {
    @JsonIgnore
    private String name;

    public Group(String name) {
        this.name = name;
    }
}
