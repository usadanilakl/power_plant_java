package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseEquipment;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
@Where(clause = "deleted=false")
public class HeatTrace extends BaseEquipment {
    /***********************************Breaker*********************************************/
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "breaker_id")
    @JsonManagedReference
    private HtBreaker breaker;
    /***************************************************************************************/

    /************************************Equipment***************************************************/
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(
            name = "ht_equipment",
            joinColumns = @JoinColumn(name = "ht_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "eq_id", referencedColumnName = "id")
    )
    @JsonManagedReference
    private List<Equipment> equipmentList;
    /***************************************************************************************/

    /***************************************Isometric Drawing************************************************/
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "iso_id")
    private FileObject htIso;
    /***************************************************************************************/

    /****************************************P&ID***********************************************/
    @JsonManagedReference
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(
            name = "ht_pid",
            joinColumns = @JoinColumn(name = "ht_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "pid_id", referencedColumnName = "id")
    )
    private List<FileObject> pid = new ArrayList<>();
    /***************************************************************************************/

    private String tempEquipment;
    private String tempPids;
    private String tempIso;

    public void setTempEquipment(String name){
        if(tempEquipment==null) tempEquipment = name;
        else tempEquipment += tempEquipment+","+name;
    }
    public void setTempPids(String name){
        if(tempPids==null) tempPids = name;
        else tempPids += tempPids+","+name;
    }
    public void setTempIso(String name){
        if(tempIso==null) tempIso = name;
        else tempIso += tempIso+","+name;
    }
}
