package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.enums.PermitTypes;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Data
public class PermitNumbers {
    @Id
    @GeneratedValue
    Long id;
    String permitType;
    Long number;
}
