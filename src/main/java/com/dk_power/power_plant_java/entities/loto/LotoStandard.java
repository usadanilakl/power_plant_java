package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Entity
@Getter
@Setter
@Audited
@Where(clause = "deleted=false")
public class LotoStandard extends BaseAuditEntity {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "loto_standard_loto_point",
            joinColumns = @JoinColumn(name = "loto_standard_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_point_id")
    )
    private List<LotoPoint> lotoPoints = new ArrayList<>();

    private String description;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String lotoPointOrder;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "loto_standard_groups",
            joinColumns = @JoinColumn(name = "loto_standard_id"),
            inverseJoinColumns = @JoinColumn(name = "value_id")
    )
    private Set<Value> groups = new HashSet<>();


    private static final ObjectMapper objectMapper = new ObjectMapper();


    // Getter
    public Map<String, Integer> getLotoPointOrder() {
        if (lotoPointOrder == null || lotoPointOrder.isEmpty()) {
            return new LinkedHashMap<>();
        }
        try {
            String json = lotoPointOrder;
            // Fix double-serialized JSON (escaped quotes stored in DB)
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {
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


    public void addLotoPoint(LotoPoint lotoPoint) {
        if (this.lotoPoints == null) {
            this.lotoPoints = new ArrayList<>();
        }
        this.lotoPoints.add(lotoPoint);
    }

    public void removeLotoPoint(LotoPoint lotoPoint) {
        if (this.lotoPoints != null) {
            this.lotoPoints.remove(lotoPoint);
        }
    }

    public void reorderLotoPoints(List<Long> orderedLotoPointIds) {
        if (orderedLotoPointIds == null || orderedLotoPointIds.isEmpty()) {
            throw new IllegalArgumentException("Ordered LOTO point IDs list cannot be null or empty");
        }

        Set<Long> existingIds = lotoPoints.stream().map(BaseIdEntity::getId).collect(Collectors.toSet());
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
        List<LotoPoint> reorderedPoints = new ArrayList<>(lotoPoints);
        reorderedPoints.sort(Comparator.comparingInt(point -> newOrder.getOrDefault(point.getId().toString(), Integer.MAX_VALUE)));
        this.lotoPoints = reorderedPoints;
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
            for (LotoPoint point : lotoPoints) {
                if (!longOrderMap.containsKey(point.getId())) {
                    longOrderMap.put(point.getId(), order);
                }
                order++;
            }
        }

        return longOrderMap;
    }

    public List<LotoPoint> getLotoPoints() {
        Map<Long, Integer> orderMap = getLotoPointOrderMap();
        List<LotoPoint> orderedPoints = new ArrayList<>(lotoPoints);
        orderedPoints.sort(Comparator.comparingInt(point -> orderMap.getOrDefault(point.getId(), Integer.MAX_VALUE)));
        return orderedPoints;
    }



}
