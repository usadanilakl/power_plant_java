package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.enums.PermitType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PermitNumbers {
    @Enumerated(EnumType.STRING)
    @Id
    PermitType permitType;
    Long number;
}
