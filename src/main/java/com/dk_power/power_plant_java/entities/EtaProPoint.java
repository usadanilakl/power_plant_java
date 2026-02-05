package com.dk_power.power_plant_java.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@Entity
public class EtaProPoint {
    @Id
    @GeneratedValue
    private Long id;
    private String name;
    private String tagNumber;
    @ElementCollection
    @CollectionTable(name = "etapro_point_data", joinColumns = @JoinColumn(name = "etapro_point_id"))
    @MapKeyColumn(name = "date_time")
    @Column(name = "\"value\"")
    private Map<LocalDateTime, Long> data;
}
