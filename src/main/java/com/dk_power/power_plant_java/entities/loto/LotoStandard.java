package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

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

        List<LotoPoint> reorderedPoints = new ArrayList<>();
        for (Long id : orderedLotoPointIds) {
            lotoPoints.stream()
                    .filter(point -> point.getId().equals(id))
                    .findFirst()
                    .ifPresent(reorderedPoints::add);
        }
        this.lotoPoints = reorderedPoints;
    }

    public Map<Long, Integer> getLotoPointOrderMap() {
        Map<Long, Integer> orderMap = new LinkedHashMap<>();
        int order = 1;
        for (LotoPoint point : lotoPoints) {
            orderMap.put(point.getId(), order++);
        }
        return orderMap;
    }


}
