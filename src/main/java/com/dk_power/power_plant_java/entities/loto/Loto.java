package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.enums.PermitType;
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
    {
        this.setType(PermitType.LOTO);
    }
    public Integer boxNumber(){
        return this.getBox().getNumber();
    }

    @OneToOne(mappedBy = "loto")
    private Box box;
    @OneToMany(mappedBy = "loto")
    private List<Lock> locks;
    @JsonIgnore
    @ManyToMany(mappedBy = "lotos")
    private List<LotoPoint> lotoPoints;

    public void addLotoPoint(LotoPoint p) {
        lotoPoints.add(p);
    }

    public Box getBox() {
        if(box!=null)return box;
        else return new Box();
    }



}
