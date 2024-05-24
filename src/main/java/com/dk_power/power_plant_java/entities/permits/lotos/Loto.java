package com.dk_power.power_plant_java.entities.permits.lotos;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class Loto extends BaseLoto {
    public Integer boxNumber(){
        return this.getBox().getNumber();
    }

    @OneToOne(mappedBy = "loto")
    private Box box;
    @OneToMany(mappedBy = "loto")
    private List<Lock> locks;

    public Box getBox() {
        if(box!=null)return box;
        else return new Box();
    }


}
