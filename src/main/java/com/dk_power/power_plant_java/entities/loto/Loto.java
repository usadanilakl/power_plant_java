package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

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
//    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
//    @JoinTable(
//            name = "loto_loto_point",
//            joinColumns = @JoinColumn(name = "loto_id"),
//            inverseJoinColumns = @JoinColumn(name = "loto_point_id")
//    )
//    private Set<LotoPoint> lotoPoints = new HashSet<>();

    @Transient
    private Set<LotoPoint> lotoPoints = new HashSet<>();

//    public void addLotoPoint(LotoPoint lotoPoint) {
//        this.lotoPoints.add(lotoPoint);
//        lotoPoint.getLotos().add(this);
//    }
//
//    public void removeLotoPoint(LotoPoint lotoPoint) {
//        this.lotoPoints.remove(lotoPoint);
//        lotoPoint.getLotos().remove(this);
//    }


    public LotoBox getLotoBox() {
        if (lotoBox != null) return lotoBox;
        else return lotoBox;
    }

}

