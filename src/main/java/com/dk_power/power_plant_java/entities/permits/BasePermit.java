package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.dto.permits.BasePermitDto;
import com.dk_power.power_plant_java.entities.BaseEntity;
import com.dk_power.power_plant_java.entities.permits.tickets.BaseTicket;
import com.dk_power.power_plant_java.enums.PermitType;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.util.List;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Audited
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public class BasePermit extends BaseEntity {
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

    public <T extends BasePermitDto> void copy(T other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
    }
    public <T extends BasePermit> void copy(T other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
    }
//    public BasePermitDto toDto(){
//        return new BasePermitDto(this.workScope, this.system,this.equipment,this.requestor, this.controlAuthority, this.type, this.docNum, this.status, this.tickets,this.getCreatedBy());
//    }
}
