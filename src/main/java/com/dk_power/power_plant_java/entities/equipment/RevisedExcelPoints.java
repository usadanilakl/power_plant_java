package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.List;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
public class RevisedExcelPoints {
    @Id
    @GeneratedValue
    Long id;
    String unit;
    String tagged;
    String label;
    String description;
    String location;
    String standard;
    String generalLocation;
    String equipment;
    String extraInfo;
    String type;
    String system;
    String normalPosition;
    String isolatedPosition;
    String fluid;
    String size;
    String electricalCheckStatus;
    String redTagId;
    @Column(nullable = true)
    Boolean inUse = false;
    @ManyToMany
    @JoinTable(name = "loto_point",
            joinColumns = @JoinColumn(name = "loto_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"))
    //@JsonIgnore
    private List<TempLoto> lotos;

    @ManyToMany
    @JoinTable(name = "permLoto_point",
            joinColumns = @JoinColumn(name = "loto_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"))
    //@JsonIgnore
    private List<Loto> permLotos;

    public void addLoto(TempLoto entity) {
        lotos.add(entity);
    }

    public void addPermLoto(Loto entity) {
        permLotos.add(entity);
    }
}
