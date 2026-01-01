package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;


@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
@Where(clause = "deleted=false")
public class ZeroEnergy extends BaseAuditEntity {

    @ManyToOne
    @JoinColumn(name = "zero_energy_template_id")
    private Value zeroEnergyTemplate;

    @Column(name = "template_loto_point_ids", columnDefinition = "TEXT")
    private String templateEquipmentIds; // Comma-separated equipment IDs: "123,456,789"

    @Column(name = "method", columnDefinition = "TEXT")
    private String method; // Resolved zero energy method with equipment tag numbers substituted

    /**
     * Builds the resolved zero energy method from template and equipment references.
     * Template placeholders like [tag1], [tag2], etc. are replaced with actual tag numbers.
     */
//    @Transient
//    public String getMethod() {
//        if (zeroEnergyTemplate == null || zeroEnergyTemplate.getAlias() == null) {
//            return null;
//        }
//
//        try {
//            // Parse the phrase data from the template's alias field
//            String phraseJson = zeroEnergyTemplate.getAlias();
//            // You would parse JSON here and replace placeholders
//            // For now, return the raw text from the phrase
//            // This will be enhanced by the service layer with actual substitutions
//            return phraseJson; // Temporary - should parse and substitute
//        } catch (Exception e) {
//            return null;
//        }
//    }

    /**
     * Gets template equipment IDs as a Set.
     */
    @Transient
    public java.util.Set<Long> getTemplateEquipmentIds() {
        if (templateEquipmentIds == null || templateEquipmentIds.isEmpty()) {
            return new java.util.HashSet<>();
        }
        return java.util.Arrays.stream(templateEquipmentIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(java.util.stream.Collectors.toSet());
    }

    /**
     * Sets template equipment IDs from a Set.
     */
    public void setTemplateEquipmentIds(java.util.Set<Long> equipmentIds) {
        if (equipmentIds == null || equipmentIds.isEmpty()) {
            this.templateEquipmentIds = null;
        } else {
            this.templateEquipmentIds = equipmentIds.stream()
                    .map(String::valueOf)
                    .collect(java.util.stream.Collectors.joining(","));
        }
    }

    /**
     * Sets template equipment IDs from a List.
     */
    public void setTemplateEquipmentIdsList(java.util.List<Long> equipmentIds) {
        if (equipmentIds == null || equipmentIds.isEmpty()) {
            this.templateEquipmentIds = null;
        } else {
            this.templateEquipmentIds = equipmentIds.stream()
                    .map(String::valueOf)
                    .collect(java.util.stream.Collectors.joining(","));
        }
    }

    /**
     * Normalizes and sorts equipment IDs for consistent storage and comparison.
     * This ensures [1,2,3] and [3,2,1] are stored and compared the same way.
     *
     * @param equipmentIds List of equipment IDs (may contain nulls or zeros)
     */
    public void setNormalizedEquipmentIds(java.util.List<Long> equipmentIds) {
        if (equipmentIds == null || equipmentIds.isEmpty()) {
            this.templateEquipmentIds = null;
        } else {
            // Filter out nulls and zeros, then sort
            this.templateEquipmentIds = equipmentIds.stream()
                    .filter(id -> id != null && id > 0)
                    .sorted()
                    .map(String::valueOf)
                    .collect(java.util.stream.Collectors.joining(","));
        }
    }

    /**
     * Gets a hash/signature of this ZeroEnergy for deduplication.
     * Used to find identical ZeroEnergy items.
     *
     * @return Unique signature based on template and equipment IDs
     */
    @Transient
    public String getSignature() {
        Long templateId = (zeroEnergyTemplate != null) ? zeroEnergyTemplate.getId() : null;
        String equipIds = (templateEquipmentIds != null) ? templateEquipmentIds : "";
        return templateId + "|" + equipIds;
    }
}
