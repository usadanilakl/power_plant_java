package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.enums.PermitTypes;
import jakarta.persistence.*;
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
    PermitTypes permitType;
    Long number;
}
