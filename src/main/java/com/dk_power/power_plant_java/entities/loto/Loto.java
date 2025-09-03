package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import jakarta.persistence.*;
import jdk.swing.interop.SwingInterOpUtils;
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
    @Transient
    private boolean isArchived = true;


    /*********************************************************************************************************************
     * INITIATION METHOD
     ******************************************************************************************************************/
    @PostLoad
    private void initializeFields(){
        if (getPermitStatus() == null || getPermitStatus().getName() == null) {
            System.out.println(getPermitStatus());
            this.isArchived = false;
            this.isMutable = true;
            System.out.println("Permit status is null or permit status name is null, setting mutable to true and archived to false");
        } else if (getPermitStatus().getName().equals("Closed")) {
            this.isArchived = true;
            this.isMutable = false;
            System.out.println("Permit status is 'Closed', setting mutable to false and archived to true");
        } else if (getPermitStatus().getName().equals("Active")) {
            this.isArchived = false;
            this.isMutable = false;
            System.out.println("Permit status is 'Active', setting mutable to false and archived to false");
        }

//        System.out.println("isMutable: " + isMutable + ", isArchived: " + isArchived);
    }

    /*********************************************************************************************************************
     * HELPER METHODS
     ******************************************************************************************************************/

    public static List<String> lightDtoFields = List.of("id", "lotoBox.number", "locks", "snapshots.id", "workScope");


    public LotoSnapshot addLotoPoint(LotoPointIdDto dto) {
        if (this.isArchived) throw new RuntimeException("Loto is archived and can't be modified");
        LotoSnapshot currentSnapshot;
        if (this.isMutable) currentSnapshot = this.getLatestSnapshot();
        else currentSnapshot = this.duplicateLatestSnapshot();
        Set<LotoPointIdDto> lotoPointDtos = currentSnapshot.getLotoPointDtos();
        if (lotoPointDtos == null) lotoPointDtos = new HashSet<>();
        lotoPointDtos.add(dto);
        currentSnapshot.setLotoPointDtos(lotoPointDtos);
        return currentSnapshot;
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

    public LotoSnapshot removeLotoPoint(Long pointId) {
        if (this.isArchived) throw new RuntimeException("Loto is archived and can't be modified");
        LotoSnapshot currentSnapshot;
        if (this.isMutable) currentSnapshot = this.getLatestSnapshot();
        else currentSnapshot = this.duplicateLatestSnapshot();
        Set<LotoPointIdDto> lotoPointDtos = currentSnapshot.getLotoPointDtos();
        if (lotoPointDtos == null) throw new RuntimeException("LotoPoint not found with id: " + pointId);
        lotoPointDtos.removeIf(p -> {
            return p.getId().equals(pointId);
        });

        currentSnapshot.setLotoPointDtos(lotoPointDtos);
        return currentSnapshot;


    }

    /*******************************************************************************************************************
     * MODIFIED GETTERS AND SETTERS
     ******************************************************************************************************************/

    public Set<LotoPointIdDto> getLotoPoints() {
        return this.getLotoPointDtos();
    }

    public LotoSnapshot setLotoPoints(Set<LotoPointIdDto> lotoPoints) {
        this.lotoPoints = lotoPoints;
        this.getLatestSnapshot().setLotoPointDtos(lotoPoints);
        return this.getLatestSnapshot();
    }

    @Transient
    public LotoSnapshot getLatestSnapshot() {
        if (this.getSnapshots() == null || this.getSnapshots().isEmpty()) {
            return createNewSnapshot();
        }
        return this.getSnapshots().stream()
                .max(Comparator.comparing(LotoSnapshot::getDateCreated))
                .orElseGet(this::createNewSnapshot);
    }

    @Transient
    public LotoSnapshot createNewSnapshot() {
        LotoSnapshot newSnapshot = new LotoSnapshot();
        newSnapshot.setLoto(this);
        newSnapshot.setDateCreated(java.time.LocalDateTime.now());
        newSnapshot.setLotoPointDtos(new HashSet<>());
        if (this.snapshots == null) {
            this.snapshots = new HashSet<>();
        }
        this.snapshots.add(newSnapshot);
        return newSnapshot;
    }

    @Transient
    public Set<LotoPointIdDto> getLotoPointDtos() {
        if (this.getLatestSnapshot() == null) this.createNewSnapshot();
        return this.getLatestSnapshot().getLotoPointDtos();
    }
}

