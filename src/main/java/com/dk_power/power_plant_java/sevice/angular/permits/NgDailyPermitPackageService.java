package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.*;
import com.dk_power.power_plant_java.entities.permits.pojo.PackageModification;
import com.dk_power.power_plant_java.mappers.permits.ConfinedSpaceMapper;
import com.dk_power.power_plant_java.mappers.permits.DailyPermitPackageMapper;
import com.dk_power.power_plant_java.mappers.permits.HotWorkMapper;
import com.dk_power.power_plant_java.mappers.permits.SafeWorkMapper;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.repository.permits.JobLogRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.sikuli.script.FindFailed;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgDailyPermitPackageService implements NgCrudService<DailyPermitPackage, DailyPermitPackageDto, DailyPermitPackageRepo, DailyPermitPackageMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final DailyPermitPackageMapper dailyPermitPackageMapper;
    private final RedTagAutomationService redTagAutomationService;

    private final PermitNumberGenerator permitNumberGenerator;
    private final SafeWorkMapper safeWorkMapper;
    private final HotWorkMapper hotWorkMapper;
    private final ConfinedSpaceMapper confinedSpaceMapper;
    private final WorkRequestRepo workRequestRepo;
    private final NgValueService ngValueService;
    private final JobLogRepo jobLogRepo;

    @Override
    public DailyPermitPackageRepo getRepo() {
        return dailyPermitPackageRepo;
    }

    @Override
    public DailyPermitPackageMapper getMapper() {
        return dailyPermitPackageMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public DailyPermitPackageDto getDto() {
        return new DailyPermitPackageDto();
    }

    @Override
    public DailyPermitPackage getEntity() {
        return new DailyPermitPackage();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<DailyPermitPackage> getEntityClass() {
        return DailyPermitPackage.class;
    }

//    @Override
//    public DailyPermitPackage hardDelete(Long id) {
//        DailyPermitPackage entityById = getEntityById(id);
//        entityManager.remove(entityById);
//        return entityById;
//    }

    public DailyPermitPackageDto createDailyPermitPackage(DailyPermitPackageDto permitPackageDto) {
        // If the DTO has an existing ID, do an in-place update to avoid orphanRemoval issues
        if (permitPackageDto.getId() != 0) {
            return updateDailyPermitPackage(String.valueOf(permitPackageDto.getId()), permitPackageDto);
        }

        DailyPermitPackage dailyPermitPackage = dailyPermitPackageMapper.convertToEntity(permitPackageDto);
        DailyPermitPackage saved = dailyPermitPackageRepo.save(dailyPermitPackage);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = dailyPermitPackageRepo.save(saved);
        }
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    public DailyPermitPackageDto updateDailyPermitPackage(String id, DailyPermitPackageDto permitPackageDto) {
        Long packageId = Long.parseLong(id);
        DailyPermitPackage existing = dailyPermitPackageRepo.findById(packageId).orElse(null);
        if (existing == null) {
            throw new RuntimeException("DailyPermitPackage not found: " + id);
        }

        // Build the "incoming" entity for change detection only
        DailyPermitPackage incoming = dailyPermitPackageMapper.convertToEntity(permitPackageDto);

        // Detect modifications before applying changes
        List<PackageModification> mods = detectChanges(existing, incoming);
        List<PackageModification> allMods = existing.getModifications();
        allMods.addAll(mods);
        existing.setModifications(allMods);

        // Update scalar fields on the MANAGED entity (safe — no orphanRemoval risk)
        if (permitPackageDto.getName() != null) existing.setName(permitPackageDto.getName());
        if (permitPackageDto.getDate() != null) existing.setDate(permitPackageDto.getDate());
        if (permitPackageDto.getTime() != null) existing.setTime(permitPackageDto.getTime());
        if (permitPackageDto.getCompanyName() != null) existing.setCompanyName(permitPackageDto.getCompanyName());
        if (permitPackageDto.getPersonName() != null) existing.setPersonName(permitPackageDto.getPersonName());
        if (permitPackageDto.getPermitNumber() != null) existing.setPermitNumber(permitPackageDto.getPermitNumber());
        if (permitPackageDto.getPackageStatus() != null) existing.setPackageStatus(incoming.getPackageStatus());

        // Update child collections ONLY when explicitly provided (non-empty IDs or DTOs)
        // This prevents orphanRemoval from deleting children when stale/empty data is sent
        updateCollectionIfProvided(existing, permitPackageDto, incoming);

        DailyPermitPackage saved = dailyPermitPackageRepo.save(existing);
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    private void updateCollectionIfProvided(DailyPermitPackage existing, DailyPermitPackageDto dto, DailyPermitPackage incoming) {
        // Only replace a collection if the DTO explicitly provides IDs or nested DTOs
        if (hasCollectionData(dto.getWorkRequestIds(), dto.getWorkRequests())) {
            existing.getWorkRequests().clear();
            existing.getWorkRequests().addAll(incoming.getWorkRequests());
        }
        if (hasCollectionData(dto.getSafeWorkIds(), dto.getSafeWorks())) {
            existing.getSafeWorks().clear();
            existing.getSafeWorks().addAll(incoming.getSafeWorks());
        }
        if (hasCollectionData(dto.getHotWorkIds(), dto.getHotWorks())) {
            existing.getHotWorks().clear();
            existing.getHotWorks().addAll(incoming.getHotWorks());
        }
        if (hasCollectionData(dto.getConfinedSpaceIds(), dto.getConfinedSpaces())) {
            existing.getConfinedSpaces().clear();
            existing.getConfinedSpaces().addAll(incoming.getConfinedSpaces());
        }
        if (hasCollectionData(dto.getLotoIds(), dto.getLotos())) {
            existing.getLotos().clear();
            existing.getLotos().addAll(incoming.getLotos());
        }
        if (hasCollectionData(dto.getEnergizedWorkPermitIds(), dto.getEnergizedWorkPermits())) {
            existing.getEnergizedWorkPermits().clear();
            existing.getEnergizedWorkPermits().addAll(incoming.getEnergizedWorkPermits());
        }
        if (hasCollectionData(dto.getExcavationPermitIds(), dto.getExcavationPermits())) {
            existing.getExcavationPermits().clear();
            existing.getExcavationPermits().addAll(incoming.getExcavationPermits());
        }
        if (hasCollectionData(dto.getVentingPermitIds(), dto.getVentingPermits())) {
            existing.getVentingPermits().clear();
            existing.getVentingPermits().addAll(incoming.getVentingPermits());
        }
    }

    private boolean hasCollectionData(Set<Long> ids, List<?> dtos) {
        return (ids != null && !ids.isEmpty()) || (dtos != null && !dtos.isEmpty());
    }

    public String buildPermits(DailyPermitPackageDto dailyPermitPackageDto) throws FindFailed, IOException, InterruptedException {
        DailyPermitPackage entity = toEntity(dailyPermitPackageDto);
        redTagAutomationService.buildDailyPermitPackage(toDto(entity));
        return "Permits built successfully!";
    }

    public String buildPermitsById(String id, String whatToBuild, String permitId) throws FindFailed, IOException, InterruptedException {
        DailyPermitPackage entity = getEntityById(id);
        DailyPermitPackageDto dto = toDto(entity);
        switch (whatToBuild) {
            case "all":
                redTagAutomationService.buildDailyPermitPackage(dto);
                break;
            case "loto":
                redTagAutomationService.buildLotos(dto, Long.parseLong(permitId));
                break;
            case "safeWork":
                redTagAutomationService.buildSafeWorks(dto, Long.parseLong(permitId));
                break;
            case "hotWork":
                redTagAutomationService.buildHotWorks(dto, Long.parseLong(permitId));
                break;
            case "confinedSpace":
                redTagAutomationService.buildConfinedSpaces(dto, Long.parseLong(permitId));
                break;
            default:
        }
//        redTagAutomationService.buildDailyPermitPackage(dto);
        return "Permits built successfully!";
    }

    public DailyPermitPackageDto reissuePermits(String packageIdToReissue, String targetPackageId) {
        DailyPermitPackage packageToReissue = getEntityById(packageIdToReissue);
        DailyPermitPackage targetPackage = getEntityById(targetPackageId);
//        WorkRequest firstWr = new ArrayList<>(targetPackage.getWorkRequests()).getFirst();


        Set<SafeWorkDto> safeWorks = packageToReissue.getSafeWorks().stream()
                .map(safeWorkMapper::convertToDto)
                .map(sw->{
                    sw.setDate(targetPackage.getDate());
                    sw.setTime(targetPackage.getTime());
                    sw.setWorkScope(targetPackage.getName());
                    sw.setRedTagNum(null);
                    sw.setId(null);
                    return sw;
                })
                .collect(Collectors.toSet());

        Set<HotWorkDto> hotWorks = packageToReissue.getHotWorks().stream()
                .map(hotWorkMapper::convertToDto)
                .map(hw->{
                    hw.setDate(targetPackage.getDate());
                    hw.setWorkScope(targetPackage.getName());
                    hw.setRedTagNum(null);
                    hw.setId(null);
                    return hw;
                })
                .collect(Collectors.toSet());

        Set<ConfinedSpaceDto> confinedSpaces = packageToReissue.getConfinedSpaces().stream()
                .map(confinedSpaceMapper::convertToDto)
                .map(cs->{
                    cs.setDate(targetPackage.getDate());
                    cs.setTime(targetPackage.getTime());
                    cs.setWorkScope(targetPackage.getName());
                    cs.setRedTagNum(null);
                    cs.setId(null);
                    return cs;
                })
                .collect(Collectors.toSet());

        Set<Loto> lotos = packageToReissue.getLotos();

        DailyPermitPackageDto targetDto = dailyPermitPackageMapper.convertToDto(targetPackage);
        targetDto.setSafeWorks(new ArrayList<>(safeWorks));
        targetDto.setHotWorks(new ArrayList<>(hotWorks));
        targetDto.setConfinedSpaces(new ArrayList<>(confinedSpaces));

        DailyPermitPackage entity = dailyPermitPackageMapper.convertToEntity(targetDto);
        entity.setLotos(lotos);
        System.out.println("Saved lotos during reissue: " + entity.getLotos().size());
        DailyPermitPackage saved = dailyPermitPackageRepo.save(entity);
        return dailyPermitPackageMapper.convertToDto(saved);

    }

    public DailyPermitPackageDto reissuePermitsByWorkRequestId(String workRequestId) {
        DailyPermitPackage permPackage = getByWorkRequestId(workRequestId);
        if(permPackage == null) {
            throw new RuntimeException("DailyPermitPackage not found for work request: " + workRequestId);
        }
        DailyPermitPackageDto dto = toDto(permPackage);

        dto.getWorkRequests().forEach(wr ->{
            wr.setId(null);
            wr.setDateOfWorkToBePerformed(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });
        dto.getSafeWorks().forEach(sw -> {
            sw.setId(null);
            sw.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });
        dto.getHotWorks().forEach(hw -> {
            hw.setId(null);
            hw.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });
        dto.getConfinedSpaces().forEach(cs -> {
            cs.setId(null);
            cs.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });

        dto.setWorkRequestIds(new HashSet<>());
        dto.setSafeWorkIds(new HashSet<>());
        dto.setHotWorkIds(new HashSet<>());
        dto.setConfinedSpaceIds(new HashSet<>());

        DailyPermitPackage saved = dailyPermitPackageRepo.save(dailyPermitPackageMapper.convertToEntity(dto));
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    private DailyPermitPackage getByWorkRequestId(String workRequestId) {
        return dailyPermitPackageRepo.findByWorkRequestId(Long.parseLong(workRequestId))
                .orElseThrow(() -> new RuntimeException("DailyPermitPackage not found for work request: " + workRequestId));
    }

    // --- Status Lifecycle ---

    public DailyPermitPackageDto activatePackage(String id) {
        DailyPermitPackageDto result = changeStatus(id, "Active", Set.of("Building", "Test"));
        takeSnapshot(Long.parseLong(id));
        return getDtoById(id);
    }

    public DailyPermitPackageDto putPackageUnderTest(String id) {
        return changeStatus(id, "Test", Set.of("Active"));
    }

    public DailyPermitPackageDto closePackage(String id, Map<String, Object> closureData) {
        DailyPermitPackage pkg = getEntityById(id);
        if (closureData != null) {
            if (closureData.containsKey("workCompleted")) pkg.setWorkCompleted((Boolean) closureData.get("workCompleted"));
            if (closureData.containsKey("closureComments")) pkg.setClosureComments((String) closureData.get("closureComments"));
            if (closureData.containsKey("scopeChanged")) pkg.setScopeChanged((Boolean) closureData.get("scopeChanged"));
            if (closureData.containsKey("closureScopeDetails")) pkg.setClosureScopeDetails((String) closureData.get("closureScopeDetails"));
            if (closureData.containsKey("continueDate")) pkg.setContinueDate((String) closureData.get("continueDate"));
            dailyPermitPackageRepo.save(pkg);
        }
        return changeStatus(id, "Closed", Set.of("Active", "Test"));
    }

    private DailyPermitPackageDto changeStatus(String id, String targetStatus, Set<String> allowedFromStatuses) {
        DailyPermitPackage pkg = getEntityById(id);
        String currentStatus = pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : "Building";

        if (!allowedFromStatuses.contains(currentStatus)) {
            throw new RuntimeException("Cannot change status from '" + currentStatus + "' to '" + targetStatus + "'");
        }

        Value statusValue = ngValueService.createValue("Package Status", targetStatus);

        pkg.setPackageStatus(statusValue);
        cascadeStatusToPermits(pkg, targetStatus);

        // Log the status change
        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("STATUS_CHANGED");
        mod.setFieldName("packageStatus");
        mod.setOldValue(currentStatus);
        mod.setNewValue(targetStatus);
        mod.setPerformedBy(getCurrentUsername());
        mod.setDescription("Package status changed from " + currentStatus + " to " + targetStatus);
        pkg.addModification(mod);

        DailyPermitPackage saved = dailyPermitPackageRepo.save(pkg);
        updateParentJobStatus(saved);
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    private void cascadeStatusToPermits(DailyPermitPackage pkg, String status) {
        Value permitStatus = ngValueService.createValue("Permit Status", status);
        if (pkg.getSafeWorks() != null) pkg.getSafeWorks().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getHotWorks() != null) pkg.getHotWorks().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getConfinedSpaces() != null) pkg.getConfinedSpaces().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getEnergizedWorkPermits() != null) pkg.getEnergizedWorkPermits().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getExcavationPermits() != null) pkg.getExcavationPermits().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getVentingPermits() != null) pkg.getVentingPermits().forEach(p -> p.setPermitStatus(permitStatus));
    }

    private void updateParentJobStatus(DailyPermitPackage pkg) {
        try {
            JobLog job = jobLogRepo.findByPackageId(pkg.getId()).orElse(null);
            if (job == null) return;

            boolean anyActiveOrTest = job.getPackages().stream().anyMatch(p -> {
                String s = p.getPackageStatus() != null ? p.getPackageStatus().getName() : "Building";
                return s.equals("Active") || s.equals("Test");
            });
            boolean allClosed = job.getPackages().stream().allMatch(p -> {
                String s = p.getPackageStatus() != null ? p.getPackageStatus().getName() : "Building";
                return s.equals("Closed");
            });
            boolean allWorkCompleted = allClosed && job.getPackages().stream()
                    .allMatch(p -> Boolean.TRUE.equals(p.getWorkCompleted()));

            if (allWorkCompleted) {
                job.setJobStatus(ngValueService.createValue("Job Status", "Closed"));
            } else if (anyActiveOrTest) {
                job.setJobStatus(ngValueService.createValue("Job Status", "Active"));
            }
            jobLogRepo.save(job);
        } catch (Exception e) {
            // Don't fail the package status change if job update fails
            System.err.println("Warning: Could not update parent job status: " + e.getMessage());
        }
    }

    private void takeSnapshot(Long packageId) {
        try {
            DailyPermitPackage pkg = dailyPermitPackageRepo.findById(packageId).orElse(null);
            if (pkg == null) return;
            DailyPermitPackageDto dto = dailyPermitPackageMapper.convertToDto(pkg);
            ObjectMapper om = new ObjectMapper();
            pkg.setActivationSnapshotJson(om.writeValueAsString(dto));
            dailyPermitPackageRepo.save(pkg);
        } catch (Exception e) {
            throw new RuntimeException("Failed to take activation snapshot", e);
        }
    }

    // --- Modification Tracking ---

    public void logModification(Long packageId, PackageModification mod) {
        DailyPermitPackage pkg = dailyPermitPackageRepo.findById(packageId).orElse(null);
        if (pkg == null) return;
        pkg.addModification(mod);
        dailyPermitPackageRepo.save(pkg);
    }

    public void logPermitFieldChange(Long packageId, String permitType, Long permitId,
                                     String fieldName, String oldValue, String newValue) {
        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("FIELD_CHANGED");
        mod.setPermitType(permitType);
        mod.setPermitId(permitId);
        mod.setFieldName(fieldName);
        mod.setOldValue(truncate(oldValue));
        mod.setNewValue(truncate(newValue));
        mod.setPerformedBy(getCurrentUsername());
        mod.setDescription(permitType + " #" + permitId + ": " + fieldName + " changed");
        logModification(packageId, mod);
    }

    private List<PackageModification> detectChanges(DailyPermitPackage old, DailyPermitPackage updated) {
        List<PackageModification> mods = new ArrayList<>();
        String user = getCurrentUsername();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        // Field changes
        diffField(mods, now, user, "date", old.getDate(), updated.getDate());
        diffField(mods, now, user, "time", old.getTime(), updated.getTime());
        diffField(mods, now, user, "companyName", old.getCompanyName(), updated.getCompanyName());
        diffField(mods, now, user, "personName", old.getPersonName(), updated.getPersonName());
        diffField(mods, now, user, "name", old.getName(), updated.getName());

        // Status change
        String oldStatus = old.getPackageStatus() != null ? old.getPackageStatus().getName() : null;
        String newStatus = updated.getPackageStatus() != null ? updated.getPackageStatus().getName() : null;
        if (!Objects.equals(oldStatus, newStatus)) {
            PackageModification mod = new PackageModification();
            mod.setTimestamp(now);
            mod.setAction("STATUS_CHANGED");
            mod.setFieldName("packageStatus");
            mod.setOldValue(oldStatus);
            mod.setNewValue(newStatus);
            mod.setPerformedBy(user);
            mod.setDescription("Package status changed from " + oldStatus + " to " + newStatus);
            mods.add(mod);
        }

        // Permit collection changes
        detectPermitCollectionChanges(mods, now, user, "WorkRequest",
                getIds(old.getWorkRequests()), getIds(updated.getWorkRequests()));
        detectPermitCollectionChanges(mods, now, user, "SafeWork",
                getIds(old.getSafeWorks()), getIds(updated.getSafeWorks()));
        detectPermitCollectionChanges(mods, now, user, "HotWork",
                getIds(old.getHotWorks()), getIds(updated.getHotWorks()));
        detectPermitCollectionChanges(mods, now, user, "ConfinedSpace",
                getIds(old.getConfinedSpaces()), getIds(updated.getConfinedSpaces()));
        detectPermitCollectionChanges(mods, now, user, "Loto",
                getIds(old.getLotos()), getIds(updated.getLotos()));
        detectPermitCollectionChanges(mods, now, user, "EnergizedWorkPermit",
                getIds(old.getEnergizedWorkPermits()), getIds(updated.getEnergizedWorkPermits()));
        detectPermitCollectionChanges(mods, now, user, "ExcavationPermit",
                getIds(old.getExcavationPermits()), getIds(updated.getExcavationPermits()));
        detectPermitCollectionChanges(mods, now, user, "VentingPermit",
                getIds(old.getVentingPermits()), getIds(updated.getVentingPermits()));

        return mods;
    }

    private void diffField(List<PackageModification> mods, String now, String user,
                           String fieldName, String oldVal, String newVal) {
        if (!Objects.equals(oldVal, newVal)) {
            PackageModification mod = new PackageModification();
            mod.setTimestamp(now);
            mod.setAction("FIELD_CHANGED");
            mod.setFieldName(fieldName);
            mod.setOldValue(truncate(oldVal));
            mod.setNewValue(truncate(newVal));
            mod.setPerformedBy(user);
            mod.setDescription("Package " + fieldName + " changed");
            mods.add(mod);
        }
    }

    private void detectPermitCollectionChanges(List<PackageModification> mods, String now, String user,
                                                String permitType, Set<Long> oldIds, Set<Long> newIds) {
        Set<Long> added = new HashSet<>(newIds);
        added.removeAll(oldIds);
        Set<Long> removed = new HashSet<>(oldIds);
        removed.removeAll(newIds);

        for (Long id : added) {
            PackageModification mod = new PackageModification();
            mod.setTimestamp(now);
            mod.setAction("PERMIT_ADDED");
            mod.setPermitType(permitType);
            mod.setPermitId(id);
            mod.setPerformedBy(user);
            mod.setDescription(permitType + " #" + id + " added");
            mods.add(mod);
        }
        for (Long id : removed) {
            PackageModification mod = new PackageModification();
            mod.setTimestamp(now);
            mod.setAction("PERMIT_REMOVED");
            mod.setPermitType(permitType);
            mod.setPermitId(id);
            mod.setPerformedBy(user);
            mod.setDescription(permitType + " #" + id + " removed");
            mods.add(mod);
        }
    }

    private <T> Set<Long> getIds(Set<T> collection) {
        if (collection == null || collection.isEmpty()) return new HashSet<>();
        return collection.stream()
                .map(item -> {
                    if (item instanceof WorkRequest) return ((WorkRequest) item).getId();
                    if (item instanceof SafeWork) return ((SafeWork) item).getId();
                    if (item instanceof HotWork) return ((HotWork) item).getId();
                    if (item instanceof ConfinedSpace) return ((ConfinedSpace) item).getId();
                    if (item instanceof Loto) return ((Loto) item).getId();
                    if (item instanceof EnergizedWorkPermit) return ((EnergizedWorkPermit) item).getId();
                    if (item instanceof ExcavationPermit) return ((ExcavationPermit) item).getId();
                    if (item instanceof VentingPermit) return ((VentingPermit) item).getId();
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) auth.getPrincipal()).getName();
            }
        } catch (Exception ignored) {}
        return "system";
    }

    private String truncate(String value) {
        if (value == null) return null;
        return value.length() > 200 ? value.substring(0, 200) + "..." : value;
    }
}
