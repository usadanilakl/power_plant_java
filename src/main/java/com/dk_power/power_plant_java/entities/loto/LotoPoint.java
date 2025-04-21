package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
@Where(clause = "deleted=false")
public class LotoPoint extends BaseAuditEntity {
    private String unit;
    private String tagged;
    private String tagNumber;
    private String description;
    private String specificLocation;
    private String standard;
    private String generalLocation;
    private String equipment;
    private String extraInfo;
    private String type;
    private String system;
    private String normalPosition;
    private String isolatedPosition;
    private String fluid;
    private String size;
    private String electricalCheckStatus;
    private String redTagId;
    private Boolean inUse = false;
    private String oldId;
    private Long isUpdated;
    private Boolean isProcessed;
    private String fileIds;
    @ManyToOne
    @JoinColumn(name = "isoPos_id")
    private Value isoPos;
    @ManyToOne
    @JoinColumn(name = "normPos_id")
    private Value normPos;

    @ManyToMany(mappedBy = "lotoPoints")
    private Set<Loto> lotos = new HashSet<>();
    @ManyToMany(mappedBy = "lotoPoints")
    @JsonIgnore
    private Set<Equipment> equipmentList;
    private String conflictStatus;
    private String conflictId;

    public void addLoto(Loto entity) {
        lotos.add(entity);
    }

    public void addEquipment(Equipment equipment) {
        if (equipmentList == null) equipmentList = new HashSet<>();
        if (equipment != null) {
            equipmentList.add(equipment);
        }

    }

    public void removeEquipment(Equipment entity) {
        equipmentList.removeIf(e -> e.getId() == entity.getId());
    }

    public void addConflictId(Long id) {
        if (conflictId == null) {
            conflictId = "";
        }
        conflictId += "," + id;
    }

    public void removeLoto(Loto loto) {
        if (loto != null && this.lotos != null) {
            this.lotos.remove(loto);
            loto.getLotoPoints().remove(this);
        }
    }
}
