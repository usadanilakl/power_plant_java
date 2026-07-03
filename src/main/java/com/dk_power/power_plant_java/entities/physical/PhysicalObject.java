package com.dk_power.power_plant_java.entities.physical;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Where;

import java.util.HashSet;
import java.util.Set;

/**
 * The canonical record for a physical thing in the plant, forming the tree
 * {@code Plant → Section → System → Skid → Equipment → Location} via the self-referential {@link #parent}.
 *
 * <p>Every domain object (files, permits, LOTO, logs, live data, …) binds to a PhysicalObject by pointing
 * <em>into</em> it (a nullable {@code @ManyToOne physicalObject} FK on that entity) — PhysicalObject owns only
 * its own identity, never {@code @OneToMany} collections of domain data. See
 * {@code project/architecture/physical-object-maximo-integration.md}.
 *
 * <p><b>Authority = local-owned, Maximo-seeded.</b> The structure is seeded from Maximo — {@code mxapioperloc}
 * for the location hierarchy ({@link #maximoLocation}) and {@code mxasset} for equipment leaves
 * ({@link #maximoAssetnum}) — but the tree is locally owned: re-seeding upserts by {@link #maximoKey}, inserting
 * new Maximo nodes and refreshing descriptions, and never clobbers local edits or hand-added (non-Maximo) nodes.
 *
 * @see com.dk_power.power_plant_java.sevice.physical.PhysicalObjectMaximoSeeder
 */
@Entity
@Table(name = "physical_object",
       indexes = {
           @Index(name = "idx_physical_object_key", columnList = "maximo_key"),
           @Index(name = "idx_physical_object_parent", columnList = "parent_id"),
           @Index(name = "idx_physical_object_location", columnList = "maximo_location"),
           @Index(name = "idx_physical_object_assetnum", columnList = "maximo_assetnum")
       })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted IS NOT TRUE")
public class PhysicalObject extends BaseAuditEntity {

    /** Level in the plant hierarchy. */
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private PhysicalObjectType type;

    /** Parent node (self-reference); null for the plant root. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private PhysicalObject parent;

    /** Tag/identifier for this object (equipment tag, location code, …). */
    @Column(name = "tag_number")
    private String tagNumber;

    /** Human-readable description (Maximo {@code spi:description} for seeded nodes). */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Free-text physical whereabouts note (floor, room, area) beyond the tree position. */
    @Column(name = "specific_location")
    private String specificLocation;

    // ── Maximo binding ────────────────────────────────────────────────────────────────────────────

    /** Maximo site id (e.g. "JG"). */
    @Column(name = "maximo_siteid")
    private String maximoSiteid;

    /** Maximo operating-location code (e.g. "00-DMW-RO") for hierarchy nodes; null for equipment/local nodes. */
    @Column(name = "maximo_location")
    private String maximoLocation;

    /** Maximo asset number (e.g. "00-DWT-FLT-02A") for {@link PhysicalObjectType#EQUIPMENT} nodes. */
    @Column(name = "maximo_assetnum")
    private String maximoAssetnum;

    /** Maximo location/asset type code (informational; drives the {@link #type} mapping during seed). */
    @Column(name = "maximo_type")
    private String maximoType;

    /**
     * Stable dedupe/link key, always set on save (see {@link #keyFor}): {@code "{siteid}|AST:{assetnum}"} for
     * equipment, {@code "{siteid}|LOC:{location}"} for hierarchy nodes, or {@code "LOCAL:{localUuid}"} for
     * hand-added non-Maximo nodes. Mirrors {@code RecurringPm.pmKey}; the sole {@code DedupKeyResolver} key.
     */
    @Column(name = "maximo_key", length = 512)
    private String maximoKey;

    /** Client-generated uuid for nodes NOT sourced from Maximo (folded into {@link #maximoKey} as {@code LOCAL:…}). */
    @Column(name = "local_uuid")
    private String localUuid;

    // ── Representation (the node's canvas is a Diagram — see diagramId below; 3D deferred) ──

    /** Reference into an external 3D model (element/GUID); spatial relationships live inside the model. Deferred. */
    @Column(name = "model3d_ref")
    private String model3dRef;

    /** Ordering for the level selector among sibling floors/levels. */
    @Column(name = "floor_index")
    private Integer floorIndex;

    /**
     * Cross-cutting plant-system membership — the functional axis orthogonal to the spatial tree (a system
     * spans many locations; a location holds many systems). Reuses the shared {@code System} {@link Value}s
     * (same pattern as {@code FileObject.systems}); unidirectional {@code @ManyToMany}, no cascade. Tracked by
     * {@code FieldChangeEntityListener} for sync (serialized as a Value-id array, join rebuilt on the receiver).
     * NOTE: any write that changes this collection MUST touch a scalar (e.g. dateModified) so {@code @PostUpdate}
     * fires — a collection-only change does not dirty the parent, so sync would otherwise never emit it.
     */
    @BatchSize(size = 50)
    @ManyToMany
    @JoinTable(
        name = "physical_object_systems",
        joinColumns = @JoinColumn(name = "physical_object_id"),
        inverseJoinColumns = @JoinColumn(name = "value_id")
    )
    private Set<Value> systems = new HashSet<>();

    /**
     * The node's own blank schematic canvas — a {@code Diagram} id (plain FK, NOT @ManyToOne). Its children are
     * drawn on it as {@code DiagramPlacement}s linked via {@code sourceEntityType="PhysicalObject"}. Lazily
     * get-or-created; device-prefixed so it's the same synced Diagram on every desktop.
     */
    @Column(name = "diagram_id")
    private Long diagramId;

    /**
     * Compute the stable link/dedup key. Priority: asset → location → local uuid. Kept in sync on save so callers
     * (seeder, editors) never have to remember to set it; the sync listener emits it in {@code @PostPersist} which
     * runs after this, so inbound dedup always sees the value.
     */
    public static String keyFor(String siteid, String location, String assetnum, String localUuid) {
        String site = (siteid == null || siteid.isBlank()) ? "?" : siteid.trim();
        if (assetnum != null && !assetnum.isBlank()) return site + "|AST:" + assetnum.trim();
        if (location != null && !location.isBlank()) return site + "|LOC:" + location.trim();
        if (localUuid != null && !localUuid.isBlank()) return "LOCAL:" + localUuid.trim();
        return null;
    }

    @PrePersist
    @PreUpdate
    private void computeMaximoKey() {
        this.maximoKey = keyFor(maximoSiteid, maximoLocation, maximoAssetnum, localUuid);
    }
}
