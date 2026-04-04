package com.dk_power.power_plant_java.entities.field_list;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.Instant;

@Entity
@Table(name = "field_list_item", indexes = {
        @Index(name = "idx_fli_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_fli_local_uuid", columnList = "localUuid"),
        @Index(name = "idx_fli_list_type", columnList = "list_type_id")
})
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class FieldListItem extends BaseAuditEntity {

    @ManyToOne
    @JoinColumn(name = "list_type_id")
    private Value listType;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private Value status;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Value location;

    private String specificLocation;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String dateObserved;

    private String timeObserved;

    @ManyToOne
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @ManyToOne
    @JoinColumn(name = "loto_point_id")
    private LotoPoint lotoPoint;

    private String sharepointId;

    private String localUuid;

    private Instant spModifiedTime;

    private String submitterName;

    private String submitterEmail;

    private String submitterPhone;
}
