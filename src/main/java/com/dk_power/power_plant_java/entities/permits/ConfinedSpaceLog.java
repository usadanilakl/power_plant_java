package com.dk_power.power_plant_java.entities.permits;

import com.azure.core.annotation.Get;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "confined_space_log")
public class ConfinedSpaceLog {

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

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "space_id")
//    private Space space;
}

