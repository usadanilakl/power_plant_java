package com.dk_power.power_plant_java.entities.permits.hot_works;


import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.enums.PermitType;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

@Entity
@Data
@NoArgsConstructor
@Audited
public class BaseHw extends BasePermit {
    {this.setType(PermitType.HOT_WORK);}
}
