package com.dk_power.power_plant_java.model.permits;

import com.dk_power.power_plant_java.model.SuperModel;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Builder
@AllArgsConstructor
@Data
public class Loto extends SuperModel {
    private String description;
    private String system;



}
