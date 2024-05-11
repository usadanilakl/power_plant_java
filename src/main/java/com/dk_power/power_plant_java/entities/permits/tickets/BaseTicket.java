package com.dk_power.power_plant_java.entities.permits.tickets;

import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.enums.PermitType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Audited
public class BaseTicket extends BasePermit {
    {this.setType(PermitType.TICKET);}
    @ManyToMany
    @JoinTable(
            name="ticket_permit",
            joinColumns = @JoinColumn(name="ticket_id"),
            inverseJoinColumns = @JoinColumn(name="permit_id")
    )
    private List<BasePermit> permits;
}
