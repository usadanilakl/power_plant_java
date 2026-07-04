package com.dk_power.power_plant_java.dto.physical;

import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import lombok.Data;

/**
 * Flat wire representation of a {@link PhysicalObject} node — {@code parentId} + {@code hasChildren} let the
 * frontend assemble the tree without serializing the lazy {@code parent} proxy or entity graph.
 */
@Data
public class PhysicalObjectDto {
    private Long id;
    private String name;
    private String type;
    private String tagNumber;
    private String description;
    private String specificLocation;
    private String maximoSiteid;
    private String maximoLocation;
    private String maximoAssetnum;
    private String maximoType;
    private Long parentId;
    private Integer floorIndex;
    private Long diagramId;
    private boolean hasChildren;
    /** True for hand-built (local) nodes; false for pure Maximo-seeded hierarchy nodes. Partitions the plant
     *  map (local only) from the Maximo-location browser (Maximo only). */
    private boolean local;
    /** True when linked to a Maximo asset/location (its WO/SR + PM data is available). */
    private boolean maximoLinked;

    public static PhysicalObjectDto from(PhysicalObject e, boolean hasChildren) {
        PhysicalObjectDto d = new PhysicalObjectDto();
        d.setId(e.getId());
        d.setName(e.getName());
        d.setType(e.getType() != null ? e.getType().name() : null);
        d.setTagNumber(e.getTagNumber());
        d.setDescription(e.getDescription());
        d.setSpecificLocation(e.getSpecificLocation());
        d.setMaximoSiteid(e.getMaximoSiteid());
        d.setMaximoLocation(e.getMaximoLocation());
        d.setMaximoAssetnum(e.getMaximoAssetnum());
        d.setMaximoType(e.getMaximoType());
        d.setParentId(e.getParent() != null ? e.getParent().getId() : null); // getId() on a lazy proxy — no init
        d.setFloorIndex(e.getFloorIndex());
        d.setDiagramId(e.getDiagramId());
        d.setHasChildren(hasChildren);
        d.setLocal(e.getLocalUuid() != null && !e.getLocalUuid().isBlank());
        d.setMaximoLinked((e.getMaximoAssetnum() != null && !e.getMaximoAssetnum().isBlank())
                || (e.getMaximoLocation() != null && !e.getMaximoLocation().isBlank()));
        return d;
    }
}
