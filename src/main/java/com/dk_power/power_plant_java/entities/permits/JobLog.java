package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
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
    @JoinColumn(name = "job_log_id")
    private Set<DailyPermitPackage> packages = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String workScope;

    private String company;
    private String foreman;
    private String location;
    private String startDate;
    private String endDate;
    private String permitNumber;

    @ManyToOne
    @JoinColumn(name = "job_status_id")
    private Value jobStatus;

    @ManyToOne
    @JoinColumn(name = "originating_work_request_id")
    private WorkRequest originatingWorkRequest;

    @ManyToOne
    @JoinColumn(name = "work_area_id")
    private WorkArea workArea;

    @ManyToOne
    @JoinColumn(name = "work_category_id")
    private Value workCategory;
}
