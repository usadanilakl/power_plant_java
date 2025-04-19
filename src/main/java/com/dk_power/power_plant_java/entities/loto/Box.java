package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Audited

public class Box extends BaseAuditEntity {
    private Integer number = 0;
    @OneToOne
    @JoinColumn(name = "loto")
    private Loto loto;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name="loto_accessory_status_id")
    private Value lotoAccessoryStatus;

}
