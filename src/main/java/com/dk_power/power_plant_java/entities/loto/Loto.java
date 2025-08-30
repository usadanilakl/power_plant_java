package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class Loto extends BasePermitEntity {
    {
        if(this.getPermitStatus()==null || this.getPermitStatus().getName() == null){
            this.isArchived = false;
            this.isMutable = true;
        }else if(this.getPermitStatus().getName().equals("Closed")){
            this.isArchived = true;
            this.isMutable = false;
        }else if(this.getPermitStatus().getName().equals("Active")){
            this.isArchived = false;
            this.isMutable = false;
        }
    }

    /*********************************************************************************************************************
     * PRESISTED FIELDS
     ******************************************************************************************************************/
    @OneToOne(mappedBy = "loto", cascade = CascadeType.ALL, orphanRemoval = true)
    private LotoBox lotoBox;
    @OneToMany(mappedBy = "loto")
    private List<Lock> locks;
    @OneToMany(mappedBy = "loto")
    private Set<LotoSnapshot> snapshots = new HashSet<>();

    /*********************************************************************************************************************
     * TRANSIENT FIELDS
     ******************************************************************************************************************/
    @Transient
    private Set<LotoPointIdDto> lotoPoints = new HashSet<>();
    @Transient
    private boolean isMutable = false;
    private boolean isArchived = true;

    /*********************************************************************************************************************
     * HELPER METHODS
     ******************************************************************************************************************/

    public static List<String> lightDtoFields = List.of("id", "lotoBox.number", "locks", "snapshots.id", "workScope");


    public void addLotoPoint(LotoPointIdDto dto) {
        LotoSnapshot newSnapShot = this.duplicateLatestSnapshot();
        if (newSnapShot == null) {
            newSnapShot = new LotoSnapshot();
            newSnapShot.setLoto(this);
            this.snapshots.add(newSnapShot);
        }
        Set<LotoPointIdDto> lotoPointDtos = newSnapShot.getLotoPointDtos();
        if (lotoPointDtos == null) lotoPointDtos = new HashSet<>();
        lotoPointDtos.add(dto);
        newSnapShot.setLotoPointDtos(lotoPointDtos);

    }

    private LotoSnapshot duplicateLatestSnapshot() {
        LotoSnapshot latestSnapshot = this.getLatestSnapshot();
        LotoSnapshot newSnapshot = null;
        try {
            newSnapshot = (LotoSnapshot) latestSnapshot.clone();
            newSnapshot.setId(null);
            newSnapshot.setDateCreated(java.time.LocalDateTime.now());
            newSnapshot.setLoto(this);
            this.snapshots.add(newSnapshot);
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
        }
        return newSnapshot;
    }

    public void removeLotoPoint(Long pointId) {
        LotoSnapshot newSnapShot = this.duplicateLatestSnapshot();
        if (newSnapShot == null) return;
        Set<LotoPointIdDto> lotoPointDtos = newSnapShot.getLotoPointDtos();
        if (lotoPointDtos == null) return;
        lotoPointDtos.removeIf(p ->{
            return p.getId().equals(pointId);
        });

        newSnapShot.setLotoPointDtos(lotoPointDtos);


    }

    /*******************************************************************************************************************
     * MODIFIED GETTERS AND SETTERS
     ******************************************************************************************************************/

    public Set<LotoPointIdDto> getLotoPoints() {
        return this.getLotoPointDtos();
    }

    public void setLotoPoints(Set<LotoPointIdDto> lotoPoints) {
        this.lotoPoints = lotoPoints;
        this.getLatestSnapshot().setLotoPointDtos(lotoPoints);
    }

    @Transient
    public LotoSnapshot getLatestSnapshot() {
        return this.getSnapshots().stream().max(Comparator.comparing(LotoSnapshot::getDateCreated)).orElse(new LotoSnapshot());
    }

    @Transient
    public Set<LotoPointIdDto> getLotoPointDtos() {
        if (this.getLatestSnapshot() == null) {
            LotoSnapshot snapShot = new LotoSnapshot();
            snapShot.setLoto(this);
            this.snapshots.add(snapShot);
            this.getLatestSnapshot().setLotoPointDtos(new HashSet<>());
        }
        return this.getLatestSnapshot().getLotoPointDtos();
    }
}

