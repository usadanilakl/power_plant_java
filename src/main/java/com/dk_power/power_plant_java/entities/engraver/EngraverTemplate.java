package com.dk_power.power_plant_java.entities.engraver;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "engraver_template")
@NoArgsConstructor
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class EngraverTemplate extends BaseAuditEntity {
    private String name;
    private String description;
    private String tagSize;
    private String dataStructure;
    private Integer batchSize;
    private String filename;
    private Boolean isDefault = false;
}
