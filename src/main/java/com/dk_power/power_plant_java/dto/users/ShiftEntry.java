package com.dk_power.power_plant_java.dto.users;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftEntry {
    private String name;
    private String group;
    private Long userId;
    private Double matchConfidence;
}
