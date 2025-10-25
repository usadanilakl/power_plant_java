package com.dk_power.power_plant_java.entities.permits;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String sharepointId;
    private String space;
    private String status;
    private String co;
    private String oxygen;
    private String lel;
    private String h2s;
    private String nh3;
    private String testerName;
    private String lastStatusChange;
    private String meterSerialNumber;
}
