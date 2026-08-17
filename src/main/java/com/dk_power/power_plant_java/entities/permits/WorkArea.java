package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Where;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "work_area")
@Where(clause = "deleted IS NOT TRUE")
@BatchSize(size = 50)
public class WorkArea extends BaseAuditEntity {

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String constantHazardsJson;

    @Column(columnDefinition = "TEXT")
    private String constantHotWorkMeasuresJson;

    @Column(columnDefinition = "TEXT")
    private String constantConfinedSpaceHazardsJson;

    @ManyToOne
    @JoinColumn(name = "area_type_id")
    private Value areaType;

    @ManyToOne
    @JoinColumn(name = "shape_id")
    private WorkAreaMapShape shape;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "work_area_loto_standard",
            joinColumns = @JoinColumn(name = "work_area_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_standard_id")
    )
    private Set<LotoStandard> constantLotos = new HashSet<>();

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "work_area_location",
            joinColumns = @JoinColumn(name = "work_area_id"),
            inverseJoinColumns = @JoinColumn(name = "location_id")
    )
    private Set<Value> locations = new HashSet<>();

    /**
     * Per-location unit filter — JSON map {@code {locationId: "01"|"02"}}.
     *
     * <p>Location Values are unit-agnostic on purpose (one "Duct Burner" serves both units;
     * LOTO points disambiguate themselves through their tag-number prefix — {@code 01*} = Unit 1,
     * {@code 02*} = Unit 2). A work area, however, IS unit-specific, so the link from a work area
     * to a location can pin which unit's equipment that area should surface. Consumers (the PWA
     * equipment picker) narrow a location's points to the pinned prefix.
     *
     * <p>A location with no entry — or an entry that is blank / not a known unit — means BOTH
     * units, so existing rows keep today's behaviour. Stored as a JSON map on the owner rather
     * than as columns on an association entity, mirroring {@code LotoStandard.lotoPointOrder}:
     * it keeps the {@code locations} @ManyToMany (and its OR-Set membership sync) untouched.
     */
    @Column(columnDefinition = "TEXT")
    private String locationUnitFiltersJson;

    /**
     * Soft link to the plant tree — the {@code PhysicalObject} node this work area is anchored to (plain Long FK,
     * NOT @ManyToOne — mirrors {@code FileObject.physicalObjectId}). Lets the plant map + node binder surface work
     * areas and their safety profile on the canonical place. Nullable; sync-tracked (remapped in FieldSyncService
     * when the target PhysicalObject is deduplicated).
     */
    @Column(name = "physical_object_id")
    private Long physicalObjectId;

    private static final ObjectMapper mapper = new ObjectMapper();

    /** Unit prefixes a location link may be pinned to. Anything else means "both units". */
    public static final String UNIT_1 = "01";
    public static final String UNIT_2 = "02";

    /**
     * Per-location unit filter as a mutable map keyed by location id (as String, so it survives a
     * JSON round-trip). Never null; entries whose value is not {@link #UNIT_1} / {@link #UNIT_2}
     * are dropped so callers can treat "present" as "filtered".
     */
    public Map<String, String> getLocationUnitFilters() {
        if (locationUnitFiltersJson == null || locationUnitFiltersJson.isBlank()
                || "null".equals(locationUnitFiltersJson.trim())) {
            return new LinkedHashMap<>();
        }
        try {
            String json = locationUnitFiltersJson;
            // Tolerate double-serialized JSON (escaped quotes stored in the DB) — same defence
            // LotoStandard.getLotoPointOrder() carries for its JSON map column.
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            Map<String, String> parsed = mapper.readValue(json, new TypeReference<Map<String, String>>() {});
            Map<String, String> cleaned = new LinkedHashMap<>();
            parsed.forEach((locationId, unit) -> {
                if (isKnownUnit(unit)) {
                    cleaned.put(locationId, unit.trim());
                }
            });
            return cleaned;
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    public void setLocationUnitFilters(Map<String, String> filters) {
        if (filters == null || filters.isEmpty()) {
            this.locationUnitFiltersJson = null;
            return;
        }
        Map<String, String> cleaned = new LinkedHashMap<>();
        filters.forEach((locationId, unit) -> {
            if (locationId != null && isKnownUnit(unit)) {
                cleaned.put(locationId, unit.trim());
            }
        });
        try {
            this.locationUnitFiltersJson = cleaned.isEmpty() ? null : mapper.writeValueAsString(cleaned);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize location unit filters", e);
        }
    }

    private static boolean isKnownUnit(String unit) {
        if (unit == null) return false;
        String trimmed = unit.trim();
        return UNIT_1.equals(trimmed) || UNIT_2.equals(trimmed);
    }

    public SwHazards getConstantHazards() {
        if (constantHazardsJson == null || constantHazardsJson.isEmpty() || "null".equals(constantHazardsJson.trim())) {
            return new SwHazards();
        }
        try {
            return mapper.readValue(constantHazardsJson, SwHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize constantHazardsJson", e);
        }
    }

    public void setConstantHazards(SwHazards hazards) {
        try {
            this.constantHazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize constant hazards", e);
        }
    }

    public HotWorkMeasures getConstantHotWorkMeasures() {
        if (constantHotWorkMeasuresJson == null || constantHotWorkMeasuresJson.isEmpty() || "null".equals(constantHotWorkMeasuresJson.trim())) {
            return new HotWorkMeasures();
        }
        try {
            return mapper.readValue(constantHotWorkMeasuresJson, HotWorkMeasures.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize constantHotWorkMeasuresJson", e);
        }
    }

    public void setConstantHotWorkMeasures(HotWorkMeasures measures) {
        try {
            this.constantHotWorkMeasuresJson = mapper.writeValueAsString(measures);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize constant hot work measures", e);
        }
    }

    public ConfinedSpaceHazards getConstantConfinedSpaceHazards() {
        if (constantConfinedSpaceHazardsJson == null || constantConfinedSpaceHazardsJson.isEmpty() || "null".equals(constantConfinedSpaceHazardsJson.trim())) {
            return new ConfinedSpaceHazards();
        }
        try {
            return mapper.readValue(constantConfinedSpaceHazardsJson, ConfinedSpaceHazards.class);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize constantConfinedSpaceHazardsJson", e);
        }
    }

    public void setConstantConfinedSpaceHazards(ConfinedSpaceHazards hazards) {
        try {
            this.constantConfinedSpaceHazardsJson = mapper.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize constant confined space hazards", e);
        }
    }
}
