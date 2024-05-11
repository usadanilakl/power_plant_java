package com.dk_power.power_plant_java.entities.permits.lotos;

import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.enums.PermitType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

import java.util.List;

import static org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED;

@Entity
@Data
@NoArgsConstructor
@Audited(targetAuditMode = NOT_AUDITED)
public class BaseLoto extends BasePermit {
    {
        this.setType(PermitType.LOTO);
    }
    @OneToOne(mappedBy = "loto")
    private Box box;
    @OneToMany(mappedBy = "loto")
    private List<Lock> locks;

    public Box getBox() {
        if(box!=null)return box;
        else return new Box();
    }
}

