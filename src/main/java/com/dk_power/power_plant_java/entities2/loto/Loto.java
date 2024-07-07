package com.dk_power.power_plant_java.entities2.loto;

import com.dk_power.power_plant_java.dto.permits.BasePermitDto;
import com.dk_power.power_plant_java.entities.equipment.RevisedExcelPoints;
import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.tickets.BaseTicket;
import com.dk_power.power_plant_java.entities2.equipment.LotoPoint;
import com.dk_power.power_plant_java.entities2.loto.Box;
import com.dk_power.power_plant_java.entities2.loto.Lock;
import com.dk_power.power_plant_java.enums.PermitType;
import com.dk_power.power_plant_java.enums.Status;
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
public class Loto extends BaseLoto {
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
    private String workScope;
    private String system;
    private String equipment;
    private String requestor;
    private String controlAuthority;
    @Enumerated(EnumType.STRING)
    private PermitType type;
    private Long docNum;
    private Status status;
    @ManyToMany(mappedBy = "permits")
    private List<BaseTicket> tickets;
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
