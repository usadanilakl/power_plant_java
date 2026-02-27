package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class ExcavationTypeOfWork {
    private boolean excavation;
    private boolean boring;
    private boolean drilling;
    private boolean cutting;
    private boolean blindPenetration;
}
