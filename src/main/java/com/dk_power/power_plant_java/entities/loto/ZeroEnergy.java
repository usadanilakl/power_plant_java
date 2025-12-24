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
    
    @ManyToOne
    @JoinColumn(name = "template_loto_point_id")
    private LotoPoint templateLotoPoint;
    
    /**
     * Builds the resolved zero energy method from template and loto point reference.
     * Template placeholders like [tag] are replaced with actual values.
     */
    @Transient
    public String getMethod() {
        if (zeroEnergyTemplate == null || zeroEnergyTemplate.getName() == null) {
            return null;
        }
        
        String template = zeroEnergyTemplate.getName();
        
        if (templateLotoPoint != null && templateLotoPoint.getTagNumber() != null) {
            template = template.replace("[tag]", templateLotoPoint.getTagNumber());
        }
        
        return template;
    }
}