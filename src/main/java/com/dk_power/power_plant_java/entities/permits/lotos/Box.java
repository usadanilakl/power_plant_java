package com.dk_power.power_plant_java.entities.permits.lotos;

import com.dk_power.power_plant_java.entities.BaseEntity;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Audited

public class Box extends BaseEntity {
    private Integer number = 0;
    @OneToOne
    @JoinColumn(name = "loto_id")
    private Loto loto;
    private Status status;


}
