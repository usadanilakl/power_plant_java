package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.entities.base_entities.BaseEntity;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
public class Lock extends BaseEntity {
    private Integer number = 0;
    private Status status;
    @ManyToOne
    @JoinColumn(name = "loto_id")
    private Loto loto;
}
