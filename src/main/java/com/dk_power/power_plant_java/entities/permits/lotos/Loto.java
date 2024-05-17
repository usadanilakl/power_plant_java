package com.dk_power.power_plant_java.entities.permits.lotos;

import com.dk_power.power_plant_java.entities.permits.BasePermit;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

@Entity
@Data
@NoArgsConstructor
@Audited
public class Loto extends BaseLoto {
    public Integer boxNumber(){
        return this.getBox().getNumber();
    }
    @OneToOne(mappedBy = "loto")
    private Box box;

    public Box getBox() {
        if(box!=null)return box;
        else return new Box();
    }

}
