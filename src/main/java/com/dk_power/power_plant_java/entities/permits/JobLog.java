package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@BatchSize(size = 50)
public class JobLog extends BaseAuditEntity {

    @JsonIgnore
    @OneToMany(mappedBy = "jobLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
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

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "job_log_lotos",
        joinColumns = @JoinColumn(name = "job_log_id"),
        inverseJoinColumns = @JoinColumn(name = "loto_id")
    )
    @BatchSize(size = 50)
    private Set<Loto> lotos = new HashSet<>();

    public void attachLoto(Loto loto) {
        if (loto != null) lotos.add(loto);
    }

    public void detachLoto(Loto loto) {
        if (loto != null) lotos.remove(loto);
    }

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
        if (owns(pkg.getJobLog())) {
            pkg.setJobLog(null);
        }
    }

    /**
     * Is that association pointing at THIS job? Compares ids, not references — see
     * {@code DailyPermitPackage.owns} for the full reasoning. {@code DailyPermitPackage.jobLog} is
     * {@code FetchType.LAZY}, so {@code ==} against a proxy is always false and the owning-side FK
     * would never be cleared.
     */
    private boolean owns(JobLog other) {
        if (other == null) return false;
        if (other == this) return true;
        return this.getId() != null && this.getId().equals(other.getId());
    }
}
