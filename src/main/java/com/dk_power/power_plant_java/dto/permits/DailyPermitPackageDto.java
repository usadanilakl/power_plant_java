package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.permits.pojo.PackageModification;
import com.dk_power.power_plant_java.entities.permits.pojo.PersonnelSignEntry;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.*;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
@NoArgsConstructor
public class DailyPermitPackageDto extends BaseDto {
    private List<NgWorkRequestDto> workRequests = new ArrayList<>();
    private List<SafeWorkDto> safeWorks = new ArrayList<>();
    private List<HotWorkDto> hotWorks = new ArrayList<>();
    private List<ConfinedSpaceDto> confinedSpaces = new ArrayList<>();
    private List<LotoDto> lotos = new ArrayList<>();
    private List<EnergizedWorkPermitDto> energizedWorkPermits = new ArrayList<>();
    private List<ExcavationPermitDto> excavationPermits = new ArrayList<>();
    private List<VentingPermitDto> ventingPermits = new ArrayList<>();

    private Set<Long> safeWorkIds = new HashSet<>();
    private Set<Long> hotWorkIds = new HashSet<>();
    private Set<Long> confinedSpaceIds = new HashSet<>();
    private Set<Long> lotoIds = new HashSet<>();
    private Set<Long> workRequestIds = new HashSet<>();
    private Set<Long> energizedWorkPermitIds = new HashSet<>();
    private Set<Long> excavationPermitIds = new HashSet<>();
    private Set<Long> ventingPermitIds = new HashSet<>();

    String companyName;
    String personName;
    String date;
    String time;
    String permitNumber;

    private ValueDto packageStatus;
    private Boolean workCompleted;
    private String closureComments;
    private Boolean scopeChanged;
    private String closureScopeDetails;
    private String continueDate;
    private List<PackageModification> modifications = new ArrayList<>();
    private List<PersonnelSignEntry> personnel = new ArrayList<>();
    private String activationSnapshotJson;

    @JsonIgnore
    private boolean workRequestsProvided;
    @JsonIgnore
    private boolean safeWorksProvided;
    @JsonIgnore
    private boolean hotWorksProvided;
    @JsonIgnore
    private boolean confinedSpacesProvided;
    @JsonIgnore
    private boolean lotosProvided;
    @JsonIgnore
    private boolean energizedWorkPermitsProvided;
    @JsonIgnore
    private boolean excavationPermitsProvided;
    @JsonIgnore
    private boolean ventingPermitsProvided;
    @JsonIgnore
    private boolean workRequestIdsProvided;
    @JsonIgnore
    private boolean safeWorkIdsProvided;
    @JsonIgnore
    private boolean hotWorkIdsProvided;
    @JsonIgnore
    private boolean confinedSpaceIdsProvided;
    @JsonIgnore
    private boolean lotoIdsProvided;
    @JsonIgnore
    private boolean energizedWorkPermitIdsProvided;
    @JsonIgnore
    private boolean excavationPermitIdsProvided;
    @JsonIgnore
    private boolean ventingPermitIdsProvided;

    @JsonSetter("workRequests")
    public void setWorkRequests(List<NgWorkRequestDto> workRequests) {
        this.workRequests = workRequests != null ? workRequests : new ArrayList<>();
        this.workRequestsProvided = true;
    }

    @JsonSetter("safeWorks")
    public void setSafeWorks(List<SafeWorkDto> safeWorks) {
        this.safeWorks = safeWorks != null ? safeWorks : new ArrayList<>();
        this.safeWorksProvided = true;
    }

    @JsonSetter("hotWorks")
    public void setHotWorks(List<HotWorkDto> hotWorks) {
        this.hotWorks = hotWorks != null ? hotWorks : new ArrayList<>();
        this.hotWorksProvided = true;
    }

    @JsonSetter("confinedSpaces")
    public void setConfinedSpaces(List<ConfinedSpaceDto> confinedSpaces) {
        this.confinedSpaces = confinedSpaces != null ? confinedSpaces : new ArrayList<>();
        this.confinedSpacesProvided = true;
    }

    @JsonSetter("lotos")
    public void setLotos(List<LotoDto> lotos) {
        this.lotos = lotos != null ? lotos : new ArrayList<>();
        this.lotosProvided = true;
    }

    @JsonSetter("energizedWorkPermits")
    public void setEnergizedWorkPermits(List<EnergizedWorkPermitDto> energizedWorkPermits) {
        this.energizedWorkPermits = energizedWorkPermits != null ? energizedWorkPermits : new ArrayList<>();
        this.energizedWorkPermitsProvided = true;
    }

    @JsonSetter("excavationPermits")
    public void setExcavationPermits(List<ExcavationPermitDto> excavationPermits) {
        this.excavationPermits = excavationPermits != null ? excavationPermits : new ArrayList<>();
        this.excavationPermitsProvided = true;
    }

    @JsonSetter("ventingPermits")
    public void setVentingPermits(List<VentingPermitDto> ventingPermits) {
        this.ventingPermits = ventingPermits != null ? ventingPermits : new ArrayList<>();
        this.ventingPermitsProvided = true;
    }

    @JsonSetter("workRequestIds")
    public void setWorkRequestIds(Set<Long> workRequestIds) {
        this.workRequestIds = workRequestIds != null ? workRequestIds : new HashSet<>();
        this.workRequestIdsProvided = true;
    }

    @JsonSetter("safeWorkIds")
    public void setSafeWorkIds(Set<Long> safeWorkIds) {
        this.safeWorkIds = safeWorkIds != null ? safeWorkIds : new HashSet<>();
        this.safeWorkIdsProvided = true;
    }

    @JsonSetter("hotWorkIds")
    public void setHotWorkIds(Set<Long> hotWorkIds) {
        this.hotWorkIds = hotWorkIds != null ? hotWorkIds : new HashSet<>();
        this.hotWorkIdsProvided = true;
    }

    @JsonSetter("confinedSpaceIds")
    public void setConfinedSpaceIds(Set<Long> confinedSpaceIds) {
        this.confinedSpaceIds = confinedSpaceIds != null ? confinedSpaceIds : new HashSet<>();
        this.confinedSpaceIdsProvided = true;
    }

    @JsonSetter("lotoIds")
    public void setLotoIds(Set<Long> lotoIds) {
        this.lotoIds = lotoIds != null ? lotoIds : new HashSet<>();
        this.lotoIdsProvided = true;
    }

    @JsonSetter("energizedWorkPermitIds")
    public void setEnergizedWorkPermitIds(Set<Long> energizedWorkPermitIds) {
        this.energizedWorkPermitIds = energizedWorkPermitIds != null ? energizedWorkPermitIds : new HashSet<>();
        this.energizedWorkPermitIdsProvided = true;
    }

    @JsonSetter("excavationPermitIds")
    public void setExcavationPermitIds(Set<Long> excavationPermitIds) {
        this.excavationPermitIds = excavationPermitIds != null ? excavationPermitIds : new HashSet<>();
        this.excavationPermitIdsProvided = true;
    }

    @JsonSetter("ventingPermitIds")
    public void setVentingPermitIds(Set<Long> ventingPermitIds) {
        this.ventingPermitIds = ventingPermitIds != null ? ventingPermitIds : new HashSet<>();
        this.ventingPermitIdsProvided = true;
    }

    @JsonIgnore
    public boolean hasWorkRequestsPayload() {
        return workRequestsProvided || workRequestIdsProvided;
    }

    @JsonIgnore
    public boolean hasSafeWorksPayload() {
        return safeWorksProvided || safeWorkIdsProvided;
    }

    @JsonIgnore
    public boolean hasHotWorksPayload() {
        return hotWorksProvided || hotWorkIdsProvided;
    }

    @JsonIgnore
    public boolean hasConfinedSpacesPayload() {
        return confinedSpacesProvided || confinedSpaceIdsProvided;
    }

    @JsonIgnore
    public boolean hasLotosPayload() {
        return lotosProvided || lotoIdsProvided;
    }

    @JsonIgnore
    public boolean hasEnergizedWorkPermitsPayload() {
        return energizedWorkPermitsProvided || energizedWorkPermitIdsProvided;
    }

    @JsonIgnore
    public boolean hasExcavationPermitsPayload() {
        return excavationPermitsProvided || excavationPermitIdsProvided;
    }

    @JsonIgnore
    public boolean hasVentingPermitsPayload() {
        return ventingPermitsProvided || ventingPermitIdsProvided;
    }
}
