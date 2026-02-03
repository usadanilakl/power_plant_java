package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
public class Comment extends BaseAuditEntity implements Referenceable {

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_type")
    private String entityType;

    @ManyToOne
    @JoinColumn(name = "comment_type_id")
    private Value commentType;

    private Boolean needsAttention = false;

    private Boolean isResolved = false;
}
