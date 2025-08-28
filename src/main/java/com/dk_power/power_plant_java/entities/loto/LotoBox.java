package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Audited
@Table(name = "loto_boxes")
public class LotoBox extends BaseAuditEntity {
    private Integer number = 0;
//    @OneToOne
//    @JoinColumn(name = "loto")
//    private Loto loto;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name="loto_accessory_status_id")
    private Value lotoAccessoryStatus;

}
