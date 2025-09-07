package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Audited
public class JobLog extends BaseAuditEntity {

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "job_log_id") // FK in DailyPermitPackage table
    private Set<DailyPermitPackage> packages = new HashSet<>();
}
