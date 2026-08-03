package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.pojo.PersonnelSignEntry;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Entity
@Table(name = "loto", indexes = {
        // SharePoint poll fires every 30s on the hub, hitting findFirstBySharepointIdOrderByIdAsc
        // once per row — full table scan without this index.
        @Index(name = "idx_loto_sharepoint_id", columnList = "sharepoint_id"),
        // findActiveWithBox filters on permit_status.name (Building/Active/Test); the join uses
        // the FK column.
        @Index(name = "idx_loto_permit_status_id", columnList = "permit_status_id"),
        // findByPermitNumber-style lookups (SharePoint dedup, log linking) — cheap unique index
        // also functions as a soft "should be unique" backstop for the permit_number generator.
        @Index(name = "idx_loto_permit_number", columnList = "permit_number"),
        // Assignment / box-swap paths query by box number.
        @Index(name = "idx_loto_box_number", columnList = "box_number"),
})
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_standard_id")
    private LotoStandard sourceStandard;

    @Column(columnDefinition = "TEXT")
    private String personnelJson;

    private String equipmentSystem;
    private String lotoRequestor;
    private String date;
    private Integer boxNumber;

    /** Flipped to true any time a LOTO point is added or removed while permitStatus is Active or Test. */
    @Column(name = "was_modified_during_active")
    private Boolean wasModifiedDuringActive = Boolean.FALSE;

    /**
     * Computed at Close-time. One of:
     *   READY_FOR_APPROVAL — no modifications during Active; the source standard is a candidate to advance.
     *   NEEDS_REVIEW       — modifications happened during Active; standard may need rework.
     */
    @Column(name = "close_disposition", length = 32)
    private String closeDisposition;


    /*********************************************************************************************************************
     * TRANSIENT FIELDS
     ******************************************************************************************************************/
    @Transient
    private Set<LotoPointIdDto> lotoPoints = new HashSet<>();
    @Transient
    private boolean isMutable = true;
    @Transient
    private boolean isArchived = false;

    /*********************************************************************************************************************
     * LOTO POINT ORDERING
     ******************************************************************************************************************/

    @Lob
    @Column(columnDefinition = "TEXT")
    private String lotoPointOrder;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Getter
    public Map<String, Integer> getLotoPointOrder() {
        if (lotoPointOrder == null || lotoPointOrder.isEmpty()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(lotoPointOrder, new TypeReference<Map<String, Integer>>() {
            });
        } catch (IOException e) {
            e.printStackTrace();
            return new LinkedHashMap<>();
        }
    }

    // Setter
    public void setLotoPointOrder(Map<String, Integer> orderMap) {
        try {
            this.lotoPointOrder = objectMapper.writeValueAsString(orderMap);
        } catch (IOException e) {
            e.printStackTrace();
            this.lotoPointOrder = "{}";
        }
    }

    public void reorderLotoPoints(List<Long> orderedLotoPointIds) {
        if (orderedLotoPointIds == null || orderedLotoPointIds.isEmpty()) {
            throw new IllegalArgumentException("Ordered LOTO point IDs list cannot be null or empty");
        }

        Set<Long> existingIds = getLotoPoints().stream().map(LotoPointIdDto::getId).collect(Collectors.toSet());
        if (!existingIds.containsAll(orderedLotoPointIds)) {
            throw new IllegalArgumentException("Some provided LOTO point IDs do not exist in this standard");
        }

        Map<String, Integer> newOrder = new LinkedHashMap<>();
        int order = 1;
        for (Long id : orderedLotoPointIds) {
            newOrder.put(id.toString(), order++);
        }

        setLotoPointOrder(newOrder);

        // Reorder the lotoPoints list based on the new order
        List<LotoPointIdDto> reorderedPoints = new ArrayList<>(getLotoPoints());
        reorderedPoints.sort(Comparator.comparingInt(point -> newOrder.getOrDefault(point.getId().toString(), Integer.MAX_VALUE)));
        this.setLotoPoints(new HashSet<>(reorderedPoints));
    }

    public Map<Long, Integer> getLotoPointOrderMap() {
        Map<String, Integer> stringOrderMap = getLotoPointOrder();
        Map<Long, Integer> longOrderMap = new LinkedHashMap<>();

        for (Map.Entry<String, Integer> entry : stringOrderMap.entrySet()) {
            try {
                Long key = Long.parseLong(entry.getKey());
                longOrderMap.put(key, entry.getValue());
            } catch (NumberFormatException e) {
                // Log the error or handle it as appropriate for your application
                System.err.println("Invalid key in lotoPointOrder: " + entry.getKey());
            }
        }

        // If the order map is empty or incomplete, fall back to the list order
        if (longOrderMap.size() != lotoPoints.size()) {
            int order = 1;
            for (LotoPointIdDto point : lotoPoints) {
                if (!longOrderMap.containsKey(point.getId())) {
                    longOrderMap.put(point.getId(), order);
                }
                order++;
            }
        }

        return longOrderMap;
    }


    /*********************************************************************************************************************
     * INITIATION METHOD
     ******************************************************************************************************************/
    @PostLoad
    private void initializeFields(){
        if (getPermitStatus() == null || getPermitStatus().getName() == null) {
            this.isArchived = false;
            this.isMutable = true;
        } else if (getPermitStatus().getName().equals("Closed")) {
            this.isArchived = true;
            this.isMutable = false;
        } else if (getPermitStatus().getName().equals("Active")) {
            this.isArchived = false;
            this.isMutable = false;
        }else{
            this.isArchived = false;
            this.isMutable = true;
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
        touchForSync(currentSnapshot);
        return currentSnapshot;
    }

    /**
     * The permit's points live in {@code LotoSnapshot.lotoPointsData}, an {@code @ElementCollection}. Mutating ONLY a
     * collection does not dirty the owner row, so Hibernate issues no UPDATE, {@code @PostUpdate} never fires, and the
     * FieldChangeEntityListener emits nothing — i.e. a points-only edit would silently never sync (the same hazard
     * documented for PhysicalObject's system membership). Touching dateModified dirties the row so the change emits.
     */
    private void touchForSync(LotoSnapshot snapshot) {
        if (snapshot != null) snapshot.setDateModified(java.time.LocalDateTime.now());
    }

    private LotoSnapshot duplicateLatestSnapshot() {
        LotoSnapshot latestSnapshot = this.getLatestSnapshot();
        LotoSnapshot newSnapshot = null;
        try {
            newSnapshot = (LotoSnapshot) latestSnapshot.clone();
            newSnapshot.setId(null);
            newSnapshot.setDateCreated(java.time.LocalDateTime.now());
            newSnapshot.setLoto(this);
            newSnapshot.clearLifecycleEventFields();
            newSnapshot.setSnapshotSeq(nextSnapshotSeq());
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
        // Also purge the point from every per-point map + prereq graph so orphan entries
        // don't survive to trip enforcePrerequisitesForHang / unmark-* predecessor checks.
        currentSnapshot.forgetPoint(pointId);
        touchForSync(currentSnapshot);
        return currentSnapshot;
    }

    /*******************************************************************************************************************
     * MODIFIED GETTERS AND SETTERS
     ******************************************************************************************************************/

    public List<LotoPointIdDto> getLotoPoints() {
        Map<Long, Integer> lotoPointOrderMap = getLotoPointOrderMap();
        // Legacy permits created before Loto.lotoPointOrder got seeded from the
        // standard have an empty map here — fall back to the snapshot's own
        // lotoPointOrder JSON string so those permits still render in the
        // authored order instead of shuffling every render.
        if (lotoPointOrderMap.isEmpty()) {
            lotoPointOrderMap = readOrderFromLatestSnapshot();
        }
        List<LotoPointIdDto> sortedList = new ArrayList<>(this.getLotoPointDtos());
        final Map<Long, Integer> orderMap = lotoPointOrderMap;
        // Tiebreak on point ID so ties (or missing entries) don't shuffle across
        // successive queries — a stable ID-ascending fallback is fine because
        // IDs monotonically increase in the standard's authored order.
        sortedList.sort(Comparator
                .<LotoPointIdDto>comparingInt(point -> orderMap.getOrDefault(point.getId(), Integer.MAX_VALUE))
                .thenComparing(point -> point.getId() == null ? Long.MAX_VALUE : point.getId()));
        return sortedList;
    }

    private Map<Long, Integer> readOrderFromLatestSnapshot() {
        try {
            LotoSnapshot latest = getLatestSnapshot();
            if (latest == null || latest.getLotoPointOrder() == null || latest.getLotoPointOrder().isEmpty()) {
                return new LinkedHashMap<>();
            }
            Map<String, Integer> raw = objectMapper.readValue(latest.getLotoPointOrder(),
                    new TypeReference<Map<String, Integer>>() {});
            Map<Long, Integer> out = new LinkedHashMap<>();
            for (Map.Entry<String, Integer> e : raw.entrySet()) {
                try {
                    out.put(Long.parseLong(e.getKey()), e.getValue());
                } catch (NumberFormatException ignore) { /* skip bad keys */ }
            }
            return out;
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    public LotoSnapshot setLotoPoints(Set<LotoPointIdDto> lotoPoints) {
        if (this.isArchived) throw new RuntimeException("Loto is archived and can't be modified");
        if(lotoPoints == null) lotoPoints = new HashSet<>();
        this.lotoPoints = lotoPoints;
//        this.reorderLotoPoints(lotoPoints.stream().map(LotoPointIdDto::getId).collect(Collectors.toList()));
        this.getLatestSnapshot().setLotoPointDtos(lotoPoints);
        return this.getLatestSnapshot();
    }

    /**
     * The snapshot holding current state. NOTE: for historical reasons this getter CREATES one when there is none —
     * convenient for the authoring flows, but a landmine during sync.
     *
     * <p><b>Sync guard:</b> while an inbound sync apply is in flight we must NOT manufacture a snapshot. The sync
     * order applies {@code Loto} BEFORE {@code LotoSnapshot}, so at that moment the permit legitimately has zero
     * snapshots; creating one here (with {@code dateCreated = now()} and an EMPTY point set) produced a phantom that
     * then won {@code max(dateCreated)} and shadowed the real snapshot — the permit rendered with no LOTO points
     * while its approval/hang/verify history still showed. Returning null lets the real snapshots land first.</p>
     */
    @Transient
    public LotoSnapshot getLatestSnapshot() {
        if (this.getSnapshots() == null || this.getSnapshots().isEmpty()) {
            if (com.dk_power.power_plant_java.sevice.sync.SyncContext.isSyncingThread()) return null;
            return createNewSnapshot();
        }
        // Order by the synced monotonic snapshotSeq (deterministic across devices regardless of
        // apply order); fall back to dateCreated only for legacy rows that predate the field.
        return this.getSnapshots().stream()
                .max(Comparator
                        .comparing((LotoSnapshot s) -> s.getSnapshotSeq() == null ? Integer.MIN_VALUE : s.getSnapshotSeq())
                        .thenComparing(s -> s.getDateCreated() == null ? java.time.LocalDateTime.MIN : s.getDateCreated()))
                .orElse(null);
    }

    /** Next per-permit snapshot sequence number: max existing seq + 1 (0 for the first). */
    private int nextSnapshotSeq() {
        if (this.snapshots == null) return 0;
        return this.snapshots.stream()
                .map(LotoSnapshot::getSnapshotSeq)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .map(m -> m + 1)
                .orElse(0);
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
        newSnapshot.setSnapshotSeq(nextSnapshotSeq());
        this.snapshots.add(newSnapshot);
        return newSnapshot;
    }

    @Transient
    public Set<LotoPointIdDto> getLotoPointDtos() {
        if (this.getLatestSnapshot() == null) this.createNewSnapshot();
        return this.getLatestSnapshot().getLotoPointDtos();
    }

    /*********************************************************************************************************************
     * LIFECYCLE EVENTS — each writes a (user, timestamp) pair into the latest snapshot
     * (or a duplicated one when the LOTO is no longer mutable).
     ******************************************************************************************************************/

    private LotoSnapshot lifecycleSnapshot() {
        if (this.isArchived) throw new RuntimeException("Loto is archived and can't be modified");
        return this.isMutable ? this.getLatestSnapshot() : this.duplicateLatestSnapshot();
    }

    public LotoSnapshot recordCaApprovedForHanging(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setCaApprovedForHangingBy(user);
        s.setCaApprovedForHangingAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordCaActivated(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setCaActivatedBy(user);
        s.setCaActivatedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordHung(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setHungBy(user);
        s.setHungAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot markPointHung(Long pointId, String user, String notes) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setPointHungBy(pointId, user, notes);
        return s;
    }

    public LotoSnapshot unmarkPointHung(Long pointId) {
        LotoSnapshot s = lifecycleSnapshot();
        s.clearPointHung(pointId);
        return s;
    }

    public LotoSnapshot markPointVerified(Long pointId, String user, String notes) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setPointVerifiedBy(pointId, user, notes);
        return s;
    }

    public LotoSnapshot unmarkPointVerified(Long pointId) {
        LotoSnapshot s = lifecycleSnapshot();
        s.clearPointVerified(pointId);
        return s;
    }

    public LotoSnapshot markPointWalkdown(Long pointId, String user, String notes) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setPointWalkdownBy(pointId, user, notes);
        return s;
    }

    public LotoSnapshot unmarkPointWalkdown(Long pointId) {
        LotoSnapshot s = lifecycleSnapshot();
        s.clearPointWalkdown(pointId);
        return s;
    }

    public LotoSnapshot markPointRemoved(Long pointId, String user, String notes) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setPointRemovedBy(pointId, user, notes);
        return s;
    }

    public LotoSnapshot unmarkPointRemoved(Long pointId) {
        LotoSnapshot s = lifecycleSnapshot();
        s.clearPointRemoved(pointId);
        return s;
    }

    public LotoSnapshot recordVerified(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setVerifiedBy(user);
        s.setVerifiedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordActivated(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setActivatedBy(user);
        s.setActivatedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordTestStarted(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setTestStartedBy(user);
        s.setTestStartedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordReactivated(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setReactivatedBy(user);
        s.setReactivatedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordTransferred(String fromUser, String toUser) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setTransferredFrom(fromUser);
        s.setTransferredTo(toUser);
        s.setTransferredAt(java.time.LocalDateTime.now());
        // NOTE: lotoRequestor is NOT flipped until the recipient explicitly accepts
        // (see recordAccepted). Until acceptance the transfer is "pending".
        return s;
    }

    public LotoSnapshot recordAccepted(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setAcceptedBy(user);
        s.setAcceptedAt(java.time.LocalDateTime.now());
        // Flip the lotoRequestor on acceptance. The acceptor's identity equals the
        // pending transferredTo (enforced by the service-layer gate before this call).
        this.setLotoRequestor(user);
        return s;
    }

    /** Clear a pending transfer on the latest snapshot. lotoRequestor remains unchanged. */
    public LotoSnapshot cancelTransfer() {
        LotoSnapshot s = lifecycleSnapshot();
        s.setTransferredFrom(null);
        s.setTransferredTo(null);
        s.setTransferredAt(null);
        return s;
    }

    public LotoSnapshot recordRequestorReleased(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setRequestorReleasedBy(user);
        s.setRequestorReleasedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordControlAuthorityReleased(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setControlAuthorityReleasedBy(user);
        s.setControlAuthorityReleasedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordLocksRemoved(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setLocksRemovedBy(user);
        s.setLocksRemovedAt(java.time.LocalDateTime.now());
        return s;
    }

    public LotoSnapshot recordClosed(String user) {
        LotoSnapshot s = lifecycleSnapshot();
        s.setClosedBy(user);
        s.setClosedAt(java.time.LocalDateTime.now());
        return s;
    }

    /*********************************************************************************************************************
     * PERSONNEL SIGN-ON / SIGN-OFF
     ******************************************************************************************************************/

    public List<PersonnelSignEntry> getPersonnel() {
        if (personnelJson == null || personnelJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(personnelJson, new TypeReference<List<PersonnelSignEntry>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public void setPersonnel(List<PersonnelSignEntry> personnel) {
        try {
            this.personnelJson = objectMapper.writeValueAsString(personnel);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize personnel", e);
        }
    }

    public void signOnPerson(String name, String role, String company, String performedBy) {
        List<PersonnelSignEntry> list = getPersonnel();
        PersonnelSignEntry entry = new PersonnelSignEntry();
        entry.setPersonName(name);
        entry.setPersonRole(role);
        entry.setCompany(company);
        entry.setSignOnTime(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        entry.setPerformedBy(performedBy);
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
        return getPersonnel().stream()
                .filter(e -> e.getSignOffTime() == null)
                .collect(Collectors.toList());
    }
}

