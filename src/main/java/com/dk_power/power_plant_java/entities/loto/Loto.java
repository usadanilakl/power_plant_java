package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class Loto extends BasePermitEntity {

    public Integer boxNumber(){
        return this.getLotoBox().getNumber();
    }

    @OneToOne(mappedBy = "loto")
    private LotoBox lotoBox;
    @OneToMany(mappedBy = "loto")
    private List<Lock> locks;
    @JsonIgnore
    @ManyToMany(mappedBy = "lotos")
    private List<LotoPoint> lotoPoints;

    public void addLotoPoint(LotoPoint p) {
        lotoPoints.add(p);
    }

    public LotoBox getLotoBox() {
        if(lotoBox !=null)return lotoBox;
        else return new LotoBox();
    }

}

