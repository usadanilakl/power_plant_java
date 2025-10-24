package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.loto.Loto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Audited
public class DailyPermitPackage extends BaseAuditEntity {

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id") // FK in permit's table
    private Set<WorkRequest> workRequests = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id") // FK in permit's table
    private Set<SafeWork> safeWorks = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id")
    private Set<HotWork> hotWorks = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id")
    private Set<ConfinedSpace> confinedSpaces = new HashSet<>();

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "daily_permit_package_lotos",
            joinColumns = @JoinColumn(name = "daily_permit_package_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_id")
    )
    private Set<Loto> lotos = new HashSet<>();

    String companyName;
    String personName;
    String date;
    String time;

}
