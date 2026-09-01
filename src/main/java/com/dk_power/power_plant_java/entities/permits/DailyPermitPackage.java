package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.pojo.PackageModification;
import com.dk_power.power_plant_java.entities.permits.pojo.PersonnelSignEntry;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Where;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@BatchSize(size = 50)
// Re-declared, NOT inherited. @Where on a @MappedSuperclass does not apply to the entities that
// extend it, so BaseAuditEntity's filter never covered this table and soft-deleted rows came back
// from findAll() — showing up in menus and, worse, being counted by closeJob() as packages still
// open. Keep the parent's exact clause so a null 'deleted' is treated as not-deleted.
@Where(clause = "deleted IS NOT TRUE")
public class DailyPermitPackage extends BaseAuditEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_log_id")
    private JobLog jobLog;

    /**
     * The requests this package was built from.
     *
     * <p>Deliberately NOT {@code cascade = ALL, orphanRemoval = true}, unlike the permit
     * collections below. A Safe Work permit is created for its package and dies with it; a work
     * request is a contractor's own document that existed before any package and outlives it.
     *
     * <p>With the owning cascade in place, removing a package from a job orphan-removed the package
     * and cascaded REMOVE straight through to its work requests - a hard DELETE (these entities are
     * soft-deleted everywhere else), which then replicated the deletion to every peer. Detaching
     * now just clears the FK and hands the request back to the operator queue.
     */
    @OneToMany(mappedBy = "dailyPermitPackage", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @BatchSize(size = 50)
    private Set<WorkRequest> workRequests = new HashSet<>();

    @OneToMany(mappedBy = "dailyPermitPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<SafeWork> safeWorks = new HashSet<>();

    @OneToMany(mappedBy = "dailyPermitPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<HotWork> hotWorks = new HashSet<>();

    @OneToMany(mappedBy = "dailyPermitPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<ConfinedSpace> confinedSpaces = new HashSet<>();

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "daily_permit_package_lotos",
            joinColumns = @JoinColumn(name = "daily_permit_package_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_id")
    )
    @BatchSize(size = 50)
    private Set<Loto> lotos = new HashSet<>();

    @OneToMany(mappedBy = "dailyPermitPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<EnergizedWorkPermit> energizedWorkPermits = new HashSet<>();

    @OneToMany(mappedBy = "dailyPermitPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<ExcavationPermit> excavationPermits = new HashSet<>();

    @OneToMany(mappedBy = "dailyPermitPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private Set<VentingPermit> ventingPermits = new HashSet<>();

    String companyName;
    String personName;
    String date;
    String time;
    String permitNumber;

    @ManyToOne
    @JoinColumn(name = "package_status_id")
    private Value packageStatus;

    private Boolean workCompleted;
    @Column(columnDefinition = "TEXT")
    private String closureComments;
    private Boolean scopeChanged;
    @Column(columnDefinition = "TEXT")
    private String closureScopeDetails;
    private String continueDate;
    private String continueTime;
    private Boolean foremanCloseOutCompleted;
    private Integer modificationCount;

    @Column(columnDefinition = "TEXT")
    private String modificationsJson;

    @Column(columnDefinition = "TEXT")
    private String activationSnapshotJson;

    @Column(columnDefinition = "TEXT")
    private String personnelJson;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public List<PackageModification> getModifications() {
        if (modificationsJson == null || modificationsJson.isEmpty() || "null".equals(modificationsJson.trim())) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(modificationsJson, new TypeReference<List<PackageModification>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public void setModifications(List<PackageModification> modifications) {
        try {
            this.modificationsJson = objectMapper.writeValueAsString(modifications);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize modifications", e);
        }
    }

    public void addModification(PackageModification mod) {
        List<PackageModification> mods = getModifications();
        mods.add(mod);
        setModifications(mods);
    }

    // --- Personnel JSON ---

    public List<PersonnelSignEntry> getPersonnel() {
        if (personnelJson == null || personnelJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(personnelJson, new TypeReference<List<PersonnelSignEntry>>() {});
        } catch (Exception e) { return new ArrayList<>(); }
    }

    public void setPersonnel(List<PersonnelSignEntry> personnel) {
        try { this.personnelJson = objectMapper.writeValueAsString(personnel); }
        catch (JsonProcessingException e) { throw new RuntimeException("Cannot serialize personnel", e); }
    }

    public void signOnPerson(String name, String role, String company, String performedBy, boolean isForeman) {
        List<PersonnelSignEntry> list = getPersonnel();
        PersonnelSignEntry entry = new PersonnelSignEntry();
        entry.setPersonName(name);
        entry.setPersonRole(role);
        entry.setCompany(company);
        entry.setSignOnTime(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        entry.setPerformedBy(performedBy);
        entry.setForeman(isForeman);
        list.add(entry);
        setPersonnel(list);
    }

    public boolean signOffPerson(String name, String performedBy, String comments) {
        List<PersonnelSignEntry> list = getPersonnel();
        for (PersonnelSignEntry entry : list) {
            if (entry.getPersonName() != null && entry.getPersonName().equals(name) && entry.getSignOffTime() == null) {
                entry.setSignOffTime(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                entry.setSignOffComments(comments);
                setPersonnel(list);
                return true;
            }
        }
        return false;
    }

    public List<PersonnelSignEntry> getSignedOnPersonnel() {
        return getPersonnel().stream().filter(e -> e.getSignOffTime() == null).collect(java.util.stream.Collectors.toList());
    }

    public boolean hasForemanSignedOn() {
        return getPersonnel().stream().anyMatch(e -> e.isForeman() && e.getSignOffTime() == null);
    }

    public void setWorkRequests(Set<WorkRequest> workRequests) {
        new HashSet<>(this.workRequests).forEach(this::removeWorkRequest);
        if (workRequests != null) {
            workRequests.forEach(this::addWorkRequest);
        }
    }

    public void addWorkRequest(WorkRequest workRequest) {
        if (workRequest == null) return;
        workRequests.add(workRequest);
        workRequest.setDailyPermitPackage(this);
    }

    public void removeWorkRequest(WorkRequest workRequest) {
        if (workRequest == null) return;
        workRequests.remove(workRequest);
        if (owns(workRequest.getDailyPermitPackage())) {
            workRequest.setDailyPermitPackage(null);
        }
    }

    /**
     * Is that association pointing at THIS package?
     *
     * <p>Compares ids, not references. {@code WorkRequest.dailyPermitPackage} is
     * {@code FetchType.LAZY}, so the getter hands back a Hibernate proxy that is never the same
     * object as {@code this} — a {@code ==} check is therefore always false, and the owning-side FK
     * silently never gets cleared. That went unnoticed for as long as this collection was
     * {@code cascade = ALL, orphanRemoval = true}: the work requests were deleted outright, so
     * nobody needed the FK nulled. With the cascade removed the bug surfaced immediately as a
     * foreign-key violation when a package was deleted while a request still referenced it.
     *
     * <p>{@code getId()} on an uninitialised proxy does not trigger a load, so this stays cheap.
     */
    private boolean owns(DailyPermitPackage other) {
        if (other == null) return false;
        if (other == this) return true;
        return this.getId() != null && this.getId().equals(other.getId());
    }

    public void setSafeWorks(Set<SafeWork> safeWorks) {
        new HashSet<>(this.safeWorks).forEach(this::removeSafeWork);
        if (safeWorks != null) {
            safeWorks.forEach(this::addSafeWork);
        }
    }

    public void addSafeWork(SafeWork safeWork) {
        if (safeWork == null) return;
        safeWorks.add(safeWork);
        safeWork.setDailyPermitPackage(this);
    }

    public void removeSafeWork(SafeWork safeWork) {
        if (safeWork == null) return;
        safeWorks.remove(safeWork);
        if (safeWork.getDailyPermitPackage() == this) {
            safeWork.setDailyPermitPackage(null);
        }
    }

    public void setHotWorks(Set<HotWork> hotWorks) {
        new HashSet<>(this.hotWorks).forEach(this::removeHotWork);
        if (hotWorks != null) {
            hotWorks.forEach(this::addHotWork);
        }
    }

    public void addHotWork(HotWork hotWork) {
        if (hotWork == null) return;
        hotWorks.add(hotWork);
        hotWork.setDailyPermitPackage(this);
    }

    public void removeHotWork(HotWork hotWork) {
        if (hotWork == null) return;
        hotWorks.remove(hotWork);
        if (hotWork.getDailyPermitPackage() == this) {
            hotWork.setDailyPermitPackage(null);
        }
    }

    public void setConfinedSpaces(Set<ConfinedSpace> confinedSpaces) {
        new HashSet<>(this.confinedSpaces).forEach(this::removeConfinedSpace);
        if (confinedSpaces != null) {
            confinedSpaces.forEach(this::addConfinedSpace);
        }
    }

    public void addConfinedSpace(ConfinedSpace confinedSpace) {
        if (confinedSpace == null) return;
        confinedSpaces.add(confinedSpace);
        confinedSpace.setDailyPermitPackage(this);
    }

    public void removeConfinedSpace(ConfinedSpace confinedSpace) {
        if (confinedSpace == null) return;
        confinedSpaces.remove(confinedSpace);
        if (confinedSpace.getDailyPermitPackage() == this) {
            confinedSpace.setDailyPermitPackage(null);
        }
    }

    public void setEnergizedWorkPermits(Set<EnergizedWorkPermit> energizedWorkPermits) {
        new HashSet<>(this.energizedWorkPermits).forEach(this::removeEnergizedWorkPermit);
        if (energizedWorkPermits != null) {
            energizedWorkPermits.forEach(this::addEnergizedWorkPermit);
        }
    }

    public void addEnergizedWorkPermit(EnergizedWorkPermit permit) {
        if (permit == null) return;
        energizedWorkPermits.add(permit);
        permit.setDailyPermitPackage(this);
    }

    public void removeEnergizedWorkPermit(EnergizedWorkPermit permit) {
        if (permit == null) return;
        energizedWorkPermits.remove(permit);
        if (permit.getDailyPermitPackage() == this) {
            permit.setDailyPermitPackage(null);
        }
    }

    public void setExcavationPermits(Set<ExcavationPermit> excavationPermits) {
        new HashSet<>(this.excavationPermits).forEach(this::removeExcavationPermit);
        if (excavationPermits != null) {
            excavationPermits.forEach(this::addExcavationPermit);
        }
    }

    public void addExcavationPermit(ExcavationPermit permit) {
        if (permit == null) return;
        excavationPermits.add(permit);
        permit.setDailyPermitPackage(this);
    }

    public void removeExcavationPermit(ExcavationPermit permit) {
        if (permit == null) return;
        excavationPermits.remove(permit);
        if (permit.getDailyPermitPackage() == this) {
            permit.setDailyPermitPackage(null);
        }
    }

    public void setVentingPermits(Set<VentingPermit> ventingPermits) {
        new HashSet<>(this.ventingPermits).forEach(this::removeVentingPermit);
        if (ventingPermits != null) {
            ventingPermits.forEach(this::addVentingPermit);
        }
    }

    public void addVentingPermit(VentingPermit permit) {
        if (permit == null) return;
        ventingPermits.add(permit);
        permit.setDailyPermitPackage(this);
    }

    public void removeVentingPermit(VentingPermit permit) {
        if (permit == null) return;
        ventingPermits.remove(permit);
        if (permit.getDailyPermitPackage() == this) {
            permit.setDailyPermitPackage(null);
        }
    }
}
