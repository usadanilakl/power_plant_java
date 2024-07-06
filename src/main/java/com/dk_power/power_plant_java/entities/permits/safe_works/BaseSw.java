package com.dk_power.power_plant_java.entities.permits.safe_works;


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
public class BaseSw extends BasePermit {
    {this.setType(PermitType.SAFE_WORK);}
}

