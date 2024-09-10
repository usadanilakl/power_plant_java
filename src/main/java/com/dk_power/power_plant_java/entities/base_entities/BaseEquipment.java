package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.entities.highlights.DrawingElement;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
public class BaseEquipment extends BaseAuditEntity {
    private String tagNumber;
    private String description;
}
