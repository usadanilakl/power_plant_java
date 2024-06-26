package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.SuperModel;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;

import java.util.ArrayList;
import java.util.List;


@Entity
@Audited
@Data
@NoArgsConstructor
@Table(name="tickets")
public class Ticket extends SuperModel {
    private String workScope;
    private String system;
    private String equipment;
    private String requestor;
    private String controlAuthority;
    private Long ticketNum;
    private Status status;
    @ManyToMany
    @JoinTable(
            name="ticket_loto",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="l_id")
    )
    private List<Loto> lotos;
    @ManyToMany
    @JoinTable(
            name="ticket_sw",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="sw_id")
    )
    private List<Sw> swList;
    @ManyToMany
    @JoinTable(
            name="ticket_temp_loto",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="l_id")
    )
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    private List<LotoTemp> lotosTemp;
    @ManyToMany
    @JoinTable(
            name="ticket_temp_sw",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="sw_id")
    )
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    private List<SwTemp> swTempList;

    public Ticket(String workScope, String system, String equipment, String requestor, String controlAuthority,List<Loto> lotos, List<Sw> swList) {
        super();
        this.workScope = workScope;
        this.system = system;
        this.equipment = equipment;
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        if(lotos!=null)this.lotos = new ArrayList<>(lotos);
        else this.lotos = new ArrayList<>();
        if(swList!=null)this.swList = new ArrayList<>(swList);
        else this.swList = new ArrayList<>();
    }
    public Ticket(String workScope, String system, String equipment, String requestor, String controlAuthority) {
        super();
        this.workScope = workScope;
        this.system = system;
        this.equipment = equipment;
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
    }
    public void copy(TicketDto other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
        this.lotos = new ArrayList<>(other.getLotos());
        this.swList = new ArrayList<>(other.getSwList());
    }
    public void copy(Ticket other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
        this.lotos = new ArrayList<>(other.getLotos());
        this.swList = new ArrayList<>(other.getSwList());
        this.status = other.status;
    }
    public void addLoto(Loto loto){
        if(lotos == null) lotos = new ArrayList<>();
        lotos.add(loto);
        if(loto.getTickets()==null) loto.setTickets(new ArrayList<>());
        loto.getTickets().add(this);
    }
    public void removeLoto(Loto loto){
        if(lotos!=null)  lotos.removeIf(e->e.getId().equals(loto.getId()));
        if(loto.getTickets()!=null) loto.getTickets().remove(this);
    }
    public void addSw(Sw sw){
        if(swList == null) swList = new ArrayList<>();
        swList.add(sw);
        if(sw.getTickets()==null) sw.setTickets(new ArrayList<>());
        sw.getTickets().add(this);
    }
    public void removeSw(Sw sw){
        if(swList!=null) swList.removeIf(e->e.getId().equals(sw.getId()));
        if(sw.getTickets()!=null) sw.getTickets().remove(this);
    }
    public void addLotoTemp(LotoTemp loto){
        if(lotosTemp == null) lotosTemp = new ArrayList<>();
        lotosTemp.add(loto);
        if(loto.getTickets()==null) loto.setTickets(new ArrayList<>());
        loto.getTickets().add(this);
    }
    public void removeLotoTemp(LotoTemp loto){
        if(lotosTemp!=null)  lotosTemp.removeIf(e->e.getId().equals(loto.getId()));
        if(loto.getTickets()!=null) loto.getTickets().remove(this);
    }
    public void addSw(SwTemp sw){
        if(swTempList == null) swTempList = new ArrayList<>();
        swTempList.add(sw);
        if(sw.getTickets()==null) sw.setTickets(new ArrayList<>());
        sw.getTickets().add(this);
    }
    public void removeSwTemp(Sw sw){
        if(swTempList!=null) swTempList.removeIf(e->e.getId().equals(sw.getId()));
        if(sw.getTickets()!=null) sw.getTickets().remove(this);
    }
}
