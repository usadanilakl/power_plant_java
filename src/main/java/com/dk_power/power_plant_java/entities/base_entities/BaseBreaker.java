package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.poi.ss.formula.functions.T;

import java.util.List;

@MappedSuperclass
@Setter
@Getter
@NoArgsConstructor
public class BaseBreaker extends BaseIdEntity{

    private BaseElectricalPanel panel;
    private String tagNumber;
    private List equipmentList;

    public <E extends BaseEquipment> void setEquipmentList(List<E> equipmentList) {
        this.equipmentList = equipmentList;
    }
    public void addEquipment(BaseEquipment equipment){
        if(equipment!=null){
            if(!equipmentList.contains(equipment)) equipmentList.add(equipment);
        }
    }
}
