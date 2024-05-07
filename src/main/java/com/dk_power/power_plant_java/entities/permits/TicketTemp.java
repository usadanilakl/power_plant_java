package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;

@Entity
@NoArgsConstructor
@Data
@EntityListeners(AuditingEntityListener.class)
public class TicketTemp {
    private String requestor, controlAuthority,  system, workScope, equipment;
    @CreatedBy
    @Id
    private String id;
    @CreatedBy
    private String createdBy;

    @ManyToMany
    @JoinTable(
            name="temp_ticket_loto",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="l_id")
    )
    private List<Loto> lotos;
    @ManyToMany
    @JoinTable(
            name="temp_ticket_temp_sw",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="sw_id")
    )
    private List<SwTemp> swTempList;
    @ManyToMany
    @JoinTable(
            name="temp_ticket_temp_loto",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="l_id")
    )
    private List<LotoTemp> lotosTemp;
    @ManyToMany
    @JoinTable(
            name="temp_ticket_sw",
            joinColumns = @JoinColumn(name="t_id"),
            inverseJoinColumns = @JoinColumn(name="sw_id")
    )
    private List<Sw> swList;

    public TicketTemp(String workScope, String system, String equipment, String requestor, String controlAuthority,List<Loto> lotos, List<Sw> swList) {
        super();
        this.workScope = workScope;
        this.system = system;
        this.equipment = equipment;
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        this.lotos = new ArrayList<>(lotos);
        this.swList = new ArrayList<>(swList);
    }
    public TicketTemp(String workScope, String system, String equipment, String requestor, String controlAuthority) {
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
        if(other.getLotos()!=null) this.lotos = new ArrayList<>(other.getLotos());
        if(other.getSwList()!=null) this.swList = new ArrayList<>(other.getSwList());
    }
    public void copy(Ticket other) {
        this.requestor = other.getRequestor();
        this.controlAuthority = other.getControlAuthority();
        this.system = other.getSystem();
        this.workScope = other.getWorkScope();
        this.equipment = other.getEquipment();
        this.lotos = new ArrayList<>(other.getLotos());
        this.swList = new ArrayList<>(other.getSwList());
    }
    public void addLoto(Loto loto){
        if(lotos == null) lotos = new ArrayList<>();
        lotos.add(loto);
        if(loto.getTicketsTemp()==null) loto.setTicketsTemp(new ArrayList<>());
        loto.getTicketsTemp().add(this);
    }
    public void removeLoto(Loto loto){
        if(lotos!=null)  lotos.removeIf(e->e.getId().equals(loto.getId()));
        if(loto.getTicketsTemp()!=null) loto.getTicketsTemp().remove(this);
    }
    public void addSw(Sw sw){
        if(swList == null) swList = new ArrayList<>();
        swList.add(sw);
        if(sw.getTicketsTemp()==null) sw.setTicketsTemp(new ArrayList<>());
        sw.getTicketsTemp().add(this);
    }
    public void removeSw(Sw sw){
        if(swList!=null) swList.removeIf(e->e.getId().equals(sw.getId()));
        if(sw.getTicketsTemp()!=null) sw.getTicketsTemp().remove(this);
    }
    public void addLotoTemp(LotoTemp loto){
        if(lotos == null) lotos = new ArrayList<>();
        lotosTemp.add(loto);
        if(loto.getTicketsTemp()==null) loto.setTicketsTemp(new ArrayList<>());
        loto.getTicketsTemp().add(this);
    }
    public void removeLotoTemp(LotoTemp loto){
        if(lotosTemp!=null)  lotosTemp.removeIf(e->e.getId().equals(loto.getId()));
        if(loto.getTicketsTemp()!=null) loto.getTicketsTemp().remove(this);
    }
    public void addSwTemp(SwTemp sw){
        if(swTempList == null) swTempList = new ArrayList<>();
        swTempList.add(sw);
        if(sw.getTicketsTemp()==null) sw.setTicketsTemp(new ArrayList<>());
        sw.getTicketsTemp().add(this);
    }
    public void removeSwTemp(SwTemp sw){
        if(swTempList!=null) swTempList.removeIf(e->e.getId().equals(sw.getId()));
        if(sw.getTicketsTemp()!=null) sw.getTicketsTemp().remove(this);
    }

}
