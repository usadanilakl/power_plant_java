package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
@Table(name = "work_area_map_shape")
@Where(clause = "deleted IS NOT TRUE")
public class WorkAreaMapShape extends BaseAuditEntity {

    @Column(columnDefinition = "TEXT")
    private String coordinates;

    private String originalPictureSize;

    private String label;
}
