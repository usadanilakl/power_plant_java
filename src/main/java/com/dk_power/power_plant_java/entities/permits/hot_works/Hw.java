package com.dk_power.power_plant_java.entities.permits.hot_works;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@NoArgsConstructor
@Audited
@Getter
@Setter
public class Hw extends BaseHw {
}
