package com.dk_power.power_plant_java.entities.permits.lotos;

import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.entities.equipment.RevisedExcelPoints;
import com.dk_power.power_plant_java.entities2.loto.Box;
import com.dk_power.power_plant_java.entities2.loto.Lock;
import com.dk_power.power_plant_java.enums.PermitType;
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
public class BaseLoto extends BasePermit {
    {
        this.setType(PermitType.LOTO);
    }

    @Transient
    private List<Lock> locks;
    //@OneToOne(mappedBy = "baseLoto")
    @Transient
    private Box box;
    @Transient
    private List<RevisedExcelPoints> lotoPoints;



}

