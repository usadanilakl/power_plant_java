package com.dk_power.power_plant_java.entities.etapro;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class EtaProReport extends BaseAuditEntity {

    private String description;

    private String category;

    private int definitionVersion = 1;

    /** Report rules — points, trigger event, measurements, aggregations. */
    @Column(columnDefinition = "TEXT")
    private String definitionJson;

    /** Default runtime parameters (maxInstances, searchBackwards, etc.). */
    @Column(columnDefinition = "TEXT")
    private String defaultParamsJson;

    /** Chart/table display preferences. */
    @Column(columnDefinition = "TEXT")
    private String outputConfigJson;
}
