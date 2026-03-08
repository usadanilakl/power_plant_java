package com.dk_power.power_plant_java.entities.instrumentation;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "instrument")
@Getter
@Setter
@Audited
@Where(clause = "deleted IS NOT TRUE")
public class Instrument extends BaseAuditEntity {
    @Column(unique = true)
    private String tagNumber;
    private String description;
    private String vendor;
    private String location;
    private String type;
    private String currentStatus;
    private String lastUpdatedDate;
    private String lastUpdatedTime;
    private String lastUpdatedBy;
    @Column(length = 4000)
    private String lastComment;
    private String sharepointId;
    private String localUuid;
}
