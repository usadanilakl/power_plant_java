package com.dk_power.power_plant_java.entities.loto;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class LotoSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "loto_id")
    private Loto loto;

    @Column(columnDefinition = "TEXT")
    private String lotoData;

    @ElementCollection
    @CollectionTable(name = "loto_snapshot_points", joinColumns = @JoinColumn(name = "loto_snapshot_id"))
    @Column(name = "loto_point_data", columnDefinition = "TEXT")
    private Set<String> lotoPointsData = new HashSet<>();

    private LocalDateTime snapshotTime;
}