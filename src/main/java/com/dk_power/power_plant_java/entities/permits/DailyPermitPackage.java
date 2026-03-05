package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.pojo.PackageModification;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Audited
public class DailyPermitPackage extends BaseAuditEntity {

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id")
    private Set<WorkRequest> workRequests = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id")
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

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id")
    private Set<EnergizedWorkPermit> energizedWorkPermits = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id")
    private Set<ExcavationPermit> excavationPermits = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "daily_permit_package_id")
    private Set<VentingPermit> ventingPermits = new HashSet<>();

    String companyName;
    String personName;
    String date;
    String time;
    String permitNumber;

    @ManyToOne
    @JoinColumn(name = "package_status_id")
    private Value packageStatus;

    private Boolean workCompleted;
    @Column(columnDefinition = "TEXT")
    private String closureComments;
    private Boolean scopeChanged;
    @Column(columnDefinition = "TEXT")
    private String closureScopeDetails;
    private String continueDate;

    @Column(columnDefinition = "TEXT")
    private String modificationsJson;

    @Column(columnDefinition = "TEXT")
    private String activationSnapshotJson;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public List<PackageModification> getModifications() {
        if (modificationsJson == null || modificationsJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(modificationsJson, new TypeReference<List<PackageModification>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public void setModifications(List<PackageModification> modifications) {
        try {
            this.modificationsJson = objectMapper.writeValueAsString(modifications);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize modifications", e);
        }
    }

    public void addModification(PackageModification mod) {
        List<PackageModification> mods = getModifications();
        mods.add(mod);
        setModifications(mods);
    }
}
