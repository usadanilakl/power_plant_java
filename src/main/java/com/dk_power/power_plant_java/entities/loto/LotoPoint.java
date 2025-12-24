package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.*;
import java.util.stream.Collectors;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
@Where(clause = "deleted=false")
public class LotoPoint extends BaseAuditEntity implements Referenceable {
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
    @ManyToOne()
    @JoinColumn(name = "isoPos_id")
    private Value isoPos;
    @ManyToOne()
    @JoinColumn(name = "normPos_id")
    private Value normPos;

//    @ManyToMany(mappedBy = "lotoPoints")
//    private Set<Loto> lotos = new HashSet<>();
    @ManyToMany(mappedBy = "lotoPoints")
    @JsonIgnore
    private Set<Equipment> equipmentList;
    @ManyToMany(mappedBy = "lotoPoints")
    private Set<LotoStandard> lotoStandards = new HashSet<>();
    private String conflictStatus;
    private String conflictId;
    @Column(columnDefinition = "TEXT")
    private String zeroEnergyMethod;
    @ManyToOne
    @JoinColumn(name = "zero_energy_id")
    private ZeroEnergy zeroEnergy;
    @ManyToOne()
    @JoinColumn(name = "location_id")
    private Value location;
    @ManyToOne()
    @JoinColumn(name = "eq_type_id")
    private Value eqType;
    @Column(columnDefinition = "TEXT")
    private String relatedLotoPointIds; // e.g., "123,456,789"

//    public void addLoto(Loto entity) {
//        lotos.add(entity);
//    }

    /**
     * Gets IDs of related LOTO points that always go together.
     */
    @Transient
    public Set<Long> getRelatedLotoPointIds() {
        if (relatedLotoPointIds == null || relatedLotoPointIds.isEmpty()) {
            return new HashSet<>();
        }
        return Arrays.stream(relatedLotoPointIds.split(","))
                .map(String::trim)
                .map(Long::parseLong)
                .collect(Collectors.toSet());
    }
    
        /**
     * Sets related LOTO point IDs from a Set.
     */
    public void setRelatedLotoPointIds(Set<Long> pointIds) {
        if (pointIds == null || pointIds.isEmpty()) {
            this.relatedLotoPointIds = null;
        } else {
            this.relatedLotoPointIds = String.join(",", pointIds.stream().map(String::valueOf).toArray(String[]::new));
        }
    }

    /**
     * Adds a related LOTO point ID.
     */
    public void addRelatedLotoPointId(Long pointId) {
        if (pointId == null) return;
        Set<Long> ids = getRelatedLotoPointIds();
        ids.add(pointId);
        this.relatedLotoPointIds = String.join(",", ids.stream().map(String::valueOf).toArray(String[]::new));
    }

    /**
     * Removes a related LOTO point ID.
     */
    public void removeRelatedLotoPointId(Long pointId) {
        if (pointId == null) return;
        Set<Long> ids = getRelatedLotoPointIds();
        ids.remove(pointId);
        this.relatedLotoPointIds = ids.isEmpty() ? null : String.join(",", ids.stream().map(String::valueOf).toArray(String[]::new));
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

//    public void removeLoto(Loto loto) {
//        if (loto != null && this.lotos != null) {
//            this.lotos.remove(loto);
//            loto.getLotoPoints().remove(this);
//        }
//    }

    public List<String> getFileLinks() {
        if (this.equipmentList == null || this.equipmentList.isEmpty()) return new ArrayList<>();
        Set<String> links = new HashSet<>();
        for (Equipment eq : this.equipmentList) {
            if (eq.getMainFile() != null) links.add(eq.getMainFile().getFileLink());
            if (eq.getFiles() != null) links.addAll(eq.getFiles().stream().map(FileObject::getFileLink).toList());
        }
        return new ArrayList<>(links);
    }

    public void addLotoStandard(LotoStandard lotoStandard) {
        if (this.lotoStandards == null) {
            this.lotoStandards = new HashSet<>();
        }
        this.lotoStandards.add(lotoStandard);
    }

    public void removeStandard(LotoStandard standard) {
        if(this.lotoStandards!=null){
            this.lotoStandards.remove(standard);
        }
    }
}
