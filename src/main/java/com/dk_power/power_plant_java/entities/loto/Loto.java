package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

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

    private String equipmentSystem;
    private String lotoRequestor;
    private String date;
    private Integer boxNumber;


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
        }else{
            this.isArchived = false;
            this.isMutable = true;
            System.out.println("Permit status is not 'Closed' or 'Active', setting mutable to true and archived to false");
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

    public List<LotoPointIdDto> getLotoPoints() {
        Map<Long, Integer> lotoPointOrderMap = getLotoPointOrderMap();
        List<LotoPointIdDto> sortedList = new ArrayList<>(this.getLotoPointDtos());
        sortedList.sort(Comparator.comparingInt(point -> lotoPointOrderMap.getOrDefault(point.getId(), Integer.MAX_VALUE)));
        return sortedList;
    }

    public LotoSnapshot setLotoPoints(Set<LotoPointIdDto> lotoPoints) {
        if (this.isArchived) throw new RuntimeException("Loto is archived and can't be modified");
        if(lotoPoints == null) lotoPoints = new HashSet<>();
        this.lotoPoints = lotoPoints;
//        this.reorderLotoPoints(lotoPoints.stream().map(LotoPointIdDto::getId).collect(Collectors.toList()));
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

