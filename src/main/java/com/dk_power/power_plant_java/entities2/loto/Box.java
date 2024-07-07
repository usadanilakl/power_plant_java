package com.dk_power.power_plant_java.entities2.loto;

import com.dk_power.power_plant_java.entities2.BaseEntity;
import com.dk_power.power_plant_java.entities.permits.lotos.TestLoto;
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

public class Box extends BaseEntity {
    private Integer number = 0;
    @OneToOne
    @JoinColumn(name = "loto")
    private Loto loto;
    private Status status;
    private String equipment = "Available";

    @OneToOne
    @JoinColumn(name = "test_loto")
    private TestLoto testLoto;

    @PostPersist
    public void setEquipment(){
        if(this.loto == null) this.equipment = "Available";
        else this.equipment = this.loto.getEquipment();
    }


//    @OneToOne
//    @JoinColumn(name = "base_loto")
//    private BaseLoto baseLoto;
}
