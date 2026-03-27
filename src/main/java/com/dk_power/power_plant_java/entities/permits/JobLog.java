package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
public class JobLog extends BaseAuditEntity {

    @JsonIgnore
    @OneToMany(mappedBy = "jobLog", cascade = CascadeType.ALL, orphanRemoval = true)
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

    public void setPackages(Set<DailyPermitPackage> packages) {
        new HashSet<>(this.packages).forEach(this::removePackage);
        if (packages != null) {
            packages.forEach(this::addPackage);
        }
    }

    public void addPackage(DailyPermitPackage pkg) {
        if (pkg == null) return;
        packages.add(pkg);
        pkg.setJobLog(this);
    }

    public void removePackage(DailyPermitPackage pkg) {
        if (pkg == null) return;
        packages.remove(pkg);
        if (pkg.getJobLog() == this) {
            pkg.setJobLog(null);
        }
    }
}
