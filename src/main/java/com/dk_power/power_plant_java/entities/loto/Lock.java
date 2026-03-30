package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@Getter
@Setter
public class Lock extends BaseAuditEntity {
    private Integer number = 0;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name="loto_accessory_status_id")
    private Value lotoAccessoryStatus;
    @ManyToOne
    @JoinColumn(name = "loto_id")
    private Loto loto;

    private String tagLabel;
    private Long assignedLotoPointId;
    private String lockType; // "LOCK" or "ZIPTIE"
    private Integer homeBoxNumber; // Box this lock belongs to when not in use (null for single locks)
    private Boolean isSingleLock = false; // true for singles (200-399), false for set locks
}
