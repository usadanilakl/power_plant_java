package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class Loto extends BasePermitEntity {

    public Integer boxNumber() {
        return this.getLotoBox().getNumber();
    }

    @OneToOne(mappedBy = "loto", cascade = CascadeType.ALL, orphanRemoval = true)
    private LotoBox lotoBox;
    @OneToMany(mappedBy = "loto")
    private List<Lock> locks;
    @OneToMany(mappedBy = "loto")
    private Set<LotoSnapshot> snapshots = new HashSet<>();


    @Transient
    private Set<LotoPoint> lotoPoints = new HashSet<>();
    @Transient
    private LotoSnapshot getLatestSnapshot() {
        return this.getSnapshots().stream().max(Comparator.comparing(LotoSnapshot::getDateCreated)).orElse(null);
    }
    @Transient
    public Set<LotoPointIdDto> getLotoPointDtos() {
        return this.getLatestSnapshot().getLotoPointDtos();
    }

    public static List<String> lightDtoFields = List.of("id", "lotoBox.number", "locks", "snapshots.id");



}

