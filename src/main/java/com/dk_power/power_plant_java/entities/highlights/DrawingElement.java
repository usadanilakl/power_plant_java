package com.dk_power.power_plant_java.entities.highlights;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.List;
import java.util.Set;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "entity_type")
@Getter
@Setter
@Where(clause = "deleted=false")
@Audited
@NoArgsConstructor
public class DrawingElement extends BaseAuditEntity {
    String objectType;
//    @OneToMany(mappedBy = "drawingElement")
//    @JsonBackReference
//    private List<Highlight> highlight;
}