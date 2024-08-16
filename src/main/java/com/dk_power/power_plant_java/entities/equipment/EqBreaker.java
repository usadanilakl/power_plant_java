package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseBreaker;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

import static org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited(targetAuditMode = NOT_AUDITED)
public class EqBreaker extends BaseBreaker {

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "panel_id")
    @JsonManagedReference
    private ElectricalPanel panel;

    @ManyToMany(cascade = CascadeType.ALL)
    @JsonManagedReference
    @JoinTable(
            name = "breaker_eq",
            joinColumns = @JoinColumn(name = "br_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "eq_id", referencedColumnName = "id")
    )
    private List<Equipment> equipmentList = new ArrayList<>();

    private String description;



    public void addEquipment(Equipment equipment){
        if(equipment!=null){
            if(!equipmentList.contains(equipment)) equipmentList.add(equipment);
        }
    }

}
