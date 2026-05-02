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
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
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
import java.util.LinkedHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    private final com.dk_power.power_plant_java.sevice.email.EmailFacadeService emailFacadeService;
    private final com.dk_power.power_plant_java.repository.permits.WorkAreaRepo workAreaRepo;
    private final com.dk_power.power_plant_java.repository.loto.LotoRepo lotoRepo;
    private final WorkRequestSharePointAdapter workRequestSharePointAdapter;
    private final com.dk_power.power_plant_java.sevice.pwa.PwaSseService pwaSseService;
    private final ObjectMapper objectMapper;

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
        List<PackageModification> mods = detectChanges(existing, incoming, permitPackageDto);
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

        // Synchronize child collections with the DTO payload.
        // The daily package client sends the full package state, and removals must persist
        // even when a collection becomes empty.
        syncCollections(existing, incoming, permitPackageDto);
        syncSafeWorkGasMonitoring(existing);

        DailyPermitPackage saved = dailyPermitPackageRepo.save(existing);
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    public DailyPermitPackageDto removePermitFromPackage(String packageId, String permitType, String permitId) {
        Long pkgId = Long.parseLong(packageId);
        Long targetPermitId = Long.parseLong(permitId);

        DailyPermitPackage existing = dailyPermitPackageRepo.findById(pkgId)
                .orElseThrow(() -> new RuntimeException("DailyPermitPackage not found: " + packageId));

        boolean removed = switch (normalizePermitType(permitType)) {
            case "safeWorks" -> removeMatching(existing.getSafeWorks(), targetPermitId, existing::removeSafeWork);
            case "hotWorks" -> removeMatching(existing.getHotWorks(), targetPermitId, existing::removeHotWork);
            case "confinedSpaces" -> removeMatching(existing.getConfinedSpaces(), targetPermitId, existing::removeConfinedSpace);
            case "energizedWorkPermits" -> removeMatching(existing.getEnergizedWorkPermits(), targetPermitId, existing::removeEnergizedWorkPermit);
            case "excavationPermits" -> removeMatching(existing.getExcavationPermits(), targetPermitId, existing::removeExcavationPermit);
            case "ventingPermits" -> removeMatching(existing.getVentingPermits(), targetPermitId, existing::removeVentingPermit);
            case "workRequests" -> removeMatching(existing.getWorkRequests(), targetPermitId, existing::removeWorkRequest);
            case "lotos" -> existing.getLotos().removeIf(permit -> targetPermitId.equals(permit.getId()));
            default -> throw new RuntimeException("Unsupported permit type: " + permitType);
        };

        if (!removed) {
            throw new RuntimeException("Permit " + permitId + " not found in package " + packageId);
        }

        syncSafeWorkGasMonitoring(existing);
        existing.addModification(buildPermitRemovalModification(permitType, targetPermitId));

        dailyPermitPackageRepo.saveAndFlush(existing);
        entityManager.flush();
        entityManager.clear();

        DailyPermitPackage refreshed = dailyPermitPackageRepo.findById(pkgId)
                .orElseThrow(() -> new RuntimeException("DailyPermitPackage not found after update: " + packageId));
        return dailyPermitPackageMapper.convertToDto(refreshed);
    }

    public DailyPermitPackageDto applyDateTimeToPackagePermits(String packageId, String date, String time) {
        DailyPermitPackage pkg = getEntityById(packageId);
        if (pkg == null) {
            throw new RuntimeException("DailyPermitPackage not found: " + packageId);
        }
        if (date == null || date.isBlank()) {
            throw new RuntimeException("Date is required");
        }

        String previousDate = pkg.getDate();
        String previousTime = pkg.getTime();

        pkg.setDate(date);
        if (time != null && !time.isBlank()) {
            pkg.setTime(time);
        }

        if (pkg.getWorkRequests() != null) {
            pkg.getWorkRequests().forEach(wr -> {
                wr.setDateOfWorkToBePerformed(date);
                if (time != null && !time.isBlank()) {
                    wr.setTimeOfWorkToBePerformed(time);
                }
            });
        }
        if (pkg.getSafeWorks() != null) {
            pkg.getSafeWorks().forEach(sw -> {
                sw.setDate(date);
                if (time != null && !time.isBlank()) {
                    sw.setTime(time);
                }
            });
        }
        if (pkg.getHotWorks() != null) {
            pkg.getHotWorks().forEach(hw -> hw.setDate(date));
        }
        if (pkg.getConfinedSpaces() != null) {
            pkg.getConfinedSpaces().forEach(cs -> {
                cs.setDate(date);
                if (time != null && !time.isBlank()) {
                    cs.setTime(time);
                }
            });
        }
        if (pkg.getLotos() != null) {
            pkg.getLotos().forEach(loto -> loto.setDate(date));
        }
        if (pkg.getEnergizedWorkPermits() != null) {
            pkg.getEnergizedWorkPermits().forEach(permit -> {
                permit.setDate(date);
                if (time != null && !time.isBlank()) {
                    permit.setTime(time);
                }
            });
        }
        if (pkg.getExcavationPermits() != null) {
            pkg.getExcavationPermits().forEach(permit -> {
                permit.setDate(date);
                if (time != null && !time.isBlank()) {
                    permit.setTime(time);
                }
            });
        }
        if (pkg.getVentingPermits() != null) {
            pkg.getVentingPermits().forEach(permit -> {
                permit.setDate(date);
                if (time != null && !time.isBlank()) {
                    permit.setTime(time);
                }
            });
        }

        String effectiveTime = time != null && !time.isBlank() ? time : pkg.getTime();
        pkg.addModification(buildBulkDateTimeModification(previousDate, previousTime, date, effectiveTime));

        DailyPermitPackage saved = dailyPermitPackageRepo.save(pkg);
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    private void syncCollections(DailyPermitPackage existing, DailyPermitPackage incoming,
                                 DailyPermitPackageDto permitPackageDto) {
        if (permitPackageDto.hasWorkRequestsPayload()) {
            existing.setWorkRequests(new HashSet<>(incoming.getWorkRequests()));
        }

        if (permitPackageDto.hasSafeWorksPayload()) {
            existing.setSafeWorks(new HashSet<>(incoming.getSafeWorks()));
        }

        if (permitPackageDto.hasHotWorksPayload()) {
            existing.setHotWorks(new HashSet<>(incoming.getHotWorks()));
        }

        if (permitPackageDto.hasConfinedSpacesPayload()) {
            existing.setConfinedSpaces(new HashSet<>(incoming.getConfinedSpaces()));
        }

        if (permitPackageDto.hasLotosPayload()) {
            existing.getLotos().clear();
            existing.getLotos().addAll(incoming.getLotos());
        }

        if (permitPackageDto.hasEnergizedWorkPermitsPayload()) {
            existing.setEnergizedWorkPermits(new HashSet<>(incoming.getEnergizedWorkPermits()));
        }

        if (permitPackageDto.hasExcavationPermitsPayload()) {
            existing.setExcavationPermits(new HashSet<>(incoming.getExcavationPermits()));
        }

        if (permitPackageDto.hasVentingPermitsPayload()) {
            existing.setVentingPermits(new HashSet<>(incoming.getVentingPermits()));
        }
    }

    private String normalizePermitType(String permitType) {
        if (permitType == null) {
            return "";
        }

        return switch (permitType) {
            case "safeWork", "safeWorks", "SafeWork" -> "safeWorks";
            case "hotWork", "hotWorks", "HotWork" -> "hotWorks";
            case "confinedSpace", "confinedSpaces", "ConfinedSpace" -> "confinedSpaces";
            case "energizedWorkPermit", "energizedWorkPermits", "EnergizedWorkPermit" -> "energizedWorkPermits";
            case "excavationPermit", "excavationPermits", "ExcavationPermit" -> "excavationPermits";
            case "ventingPermit", "ventingPermits", "VentingPermit" -> "ventingPermits";
            case "workRequest", "workRequests", "WorkRequest" -> "workRequests";
            case "loto", "lotos", "Loto" -> "lotos";
            default -> permitType;
        };
    }

    private PackageModification buildPermitRemovalModification(String permitType, Long permitId) {
        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("PERMIT_REMOVED");
        mod.setPermitType(normalizeModificationPermitType(permitType));
        mod.setPermitId(permitId);
        mod.setPerformedBy(getCurrentUsername());
        mod.setDescription(mod.getPermitType() + " #" + permitId + " removed");
        return mod;
    }

    private String normalizeModificationPermitType(String permitType) {
        return switch (normalizePermitType(permitType)) {
            case "safeWorks" -> "SafeWork";
            case "hotWorks" -> "HotWork";
            case "confinedSpaces" -> "ConfinedSpace";
            case "energizedWorkPermits" -> "EnergizedWorkPermit";
            case "excavationPermits" -> "ExcavationPermit";
            case "ventingPermits" -> "VentingPermit";
            case "workRequests" -> "WorkRequest";
            case "lotos" -> "Loto";
            default -> permitType;
        };
    }

    private PackageModification buildBulkDateTimeModification(String oldDate, String oldTime, String newDate, String newTime) {
        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("FIELD_CHANGED");
        mod.setFieldName("packageDateTime");
        mod.setOldValue((oldDate != null ? oldDate : "(none)") + " " + (oldTime != null ? oldTime : "(none)"));
        mod.setNewValue((newDate != null ? newDate : "(none)") + " " + (newTime != null ? newTime : "(none)"));
        mod.setPerformedBy(getCurrentUsername());
        mod.setDescription("Applied package date/time to all permits");
        return mod;
    }

    /**
     * Auto-sync SafeWork gas monitoring checkboxes based on HW/CS presence in the package.
     * Only updates EXISTING SafeWorks — never creates new ones (to avoid interfering with
     * intentional permit removal).
     */
    private void syncSafeWorkGasMonitoring(DailyPermitPackage pkg) {
        if (pkg.getSafeWorks() == null || pkg.getSafeWorks().isEmpty()) return;

        boolean hasHotWork = pkg.getHotWorks() != null && !pkg.getHotWorks().isEmpty();
        boolean hasReclassifiedCs = pkg.getConfinedSpaces() != null && pkg.getConfinedSpaces().stream()
                .anyMatch(cs -> cs.getCsType() == com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType.RECLASSIFIED);
        boolean hasPermitRequiredCs = pkg.getConfinedSpaces() != null && pkg.getConfinedSpaces().stream()
                .anyMatch(cs -> cs.getCsType() == com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType.PERMIT_REQUIRED);
        boolean hasConfinedSpace = hasReclassifiedCs || hasPermitRequiredCs;

        for (SafeWork sw : pkg.getSafeWorks()) {
            com.dk_power.power_plant_java.entities.permits.pojo.SwPermits permits = sw.getPermits();
            com.dk_power.power_plant_java.entities.permits.pojo.SwPpe ppe = sw.getPpe();
            if (permits == null) permits = new com.dk_power.power_plant_java.entities.permits.pojo.SwPermits();
            if (ppe == null) ppe = new com.dk_power.power_plant_java.entities.permits.pojo.SwPpe();

            applyGasMonitoringFlags(permits, ppe, hasHotWork, hasReclassifiedCs, hasPermitRequiredCs, hasConfinedSpace);
            sw.setPermits(permits);
            sw.setPpe(ppe);
        }
    }

    private void applyGasMonitoringFlags(
            com.dk_power.power_plant_java.entities.permits.pojo.SwPermits permits,
            com.dk_power.power_plant_java.entities.permits.pojo.SwPpe ppe,
            boolean hasHotWork, boolean hasReclassifiedCs, boolean hasPermitRequiredCs, boolean hasConfinedSpace) {
        permits.setHotWork(hasHotWork);
        permits.setConfinedSpaceReclassified(hasReclassifiedCs);
        permits.setConfinedSpacePermitRequired(hasPermitRequiredCs);
        permits.setGasTesting(hasHotWork || hasConfinedSpace);
        ppe.setGasMonitor(hasHotWork || hasConfinedSpace);
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

    public DailyPermitPackageDto reissuePermits(String packageIdToReissue, String targetPackageId,
                                                  String date, String time) {
        DailyPermitPackage packageToReissue = getEntityById(packageIdToReissue);
        DailyPermitPackage targetPackage = getEntityById(targetPackageId);

        // Use provided date/time or fall back to target package's
        String reissueDate = (date != null && !date.isEmpty()) ? date : targetPackage.getDate();
        String reissueTime = (time != null && !time.isEmpty()) ? time : targetPackage.getTime();

        copyPermitsFromSource(packageToReissue, targetPackage, reissueDate, reissueTime);

        DailyPermitPackage saved = dailyPermitPackageRepo.save(targetPackage);
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    public DailyPermitPackageDto reissueFromPackageForWorkRequest(
            Long sourcePackageId, Long workRequestId, String date, String time) {
        DailyPermitPackage source = getEntityById(String.valueOf(sourcePackageId));
        WorkRequest wr = workRequestRepo.findById(workRequestId)
                .orElseThrow(() -> new RuntimeException("WorkRequest not found: " + workRequestId));

        String reissueDate = (date != null && !date.isBlank()) ? date : wr.getDateOfWorkToBePerformed();
        String reissueTime = (time != null && !time.isBlank()) ? time : wr.getTimeOfWorkToBePerformed();

        wr.setPermitStatus(ngValueService.createValue("Permit Status", "Processed"));

        // Create new package
        DailyPermitPackage newPackage = new DailyPermitPackage();
        newPackage.setDate(reissueDate);
        newPackage.setTime(reissueTime);
        newPackage.setPersonName(source.getPersonName());
        newPackage.setCompanyName(wr.getCompany());
        newPackage.setName(wr.getWorkScope());
        newPackage.setPermitNumber(permitNumberGenerator.generate(reissueDate));

        Value buildingStatus = ngValueService.createValue("Package Status", "Building");
        newPackage.setPackageStatus(buildingStatus);

        // Save first to get ID (before adding WR, to avoid transient reference)
        newPackage = dailyPermitPackageRepo.save(newPackage);

        // Now add WR (newPackage is persisted, so back-ref won't cause transient error)
        newPackage.addWorkRequest(wr);

        // Copy permits from source
        copyPermitsFromSource(source, newPackage, reissueDate, reissueTime);

        DailyPermitPackage saved = dailyPermitPackageRepo.save(newPackage);

        // Link to parent job if WR has one
        try {
            // Find job by source package
            var jobOpt = jobLogRepo.findByPackageId(source.getId());
            if (jobOpt.isPresent()) {
                var job = jobOpt.get();
                job.addPackage(saved);
                jobLogRepo.save(job);
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not link reissued package to job: " + e.getMessage());
        }

        try {
            if (wr.getSharepointId() != null && !wr.getSharepointId().isBlank()) {
                workRequestSharePointAdapter.changeStatus(wr.getSharepointId(), "Processed");
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not update SharePoint status for reissued work request: " + e.getMessage());
        }

        return dailyPermitPackageMapper.convertToDto(saved);
    }

    public DailyPermitPackageDto reissuePackageToNewPackage(Long sourcePackageId, String date, String time) {
        return reissuePackageToNewPackage(sourcePackageId, date, time, false);
    }

    public DailyPermitPackageDto reissuePackageToNewPackage(Long sourcePackageId, String date, String time, boolean skipWorkRequests) {
        DailyPermitPackage source = getEntityById(String.valueOf(sourcePackageId));

        String reissueDate = (date != null && !date.isBlank()) ? date : source.getDate();
        String reissueTime = (time != null && !time.isBlank()) ? time : source.getTime();

        // Generate permit number before linking work requests to avoid flush issues
        String newPermitNumber = permitNumberGenerator.generate(reissueDate);

        DailyPermitPackage newPackage = new DailyPermitPackage();
        newPackage.setDate(reissueDate);
        newPackage.setTime(reissueTime);
        newPackage.setPersonName(source.getPersonName());
        newPackage.setCompanyName(source.getCompanyName());
        newPackage.setName(source.getName());
        newPackage.setPermitNumber(newPermitNumber);

        Value buildingStatus = ngValueService.createValue("Package Status", "Building");
        newPackage.setPackageStatus(buildingStatus);

        newPackage = dailyPermitPackageRepo.saveAndFlush(newPackage);
        // Add work requests after package is persisted (unless skipped)
        if (!skipWorkRequests) {
            for (WorkRequest wr : source.getWorkRequests()) {
                newPackage.addWorkRequest(wr);
            }
        }
        copyPermitsFromSource(source, newPackage, reissueDate, reissueTime);

        DailyPermitPackage saved = dailyPermitPackageRepo.save(newPackage);

        try {
            var jobOpt = jobLogRepo.findByPackageId(source.getId());
            if (jobOpt.isPresent()) {
                var job = jobOpt.get();
                job.addPackage(saved);
                jobLogRepo.save(job);
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not link reissued package to job: " + e.getMessage());
        }

        return dailyPermitPackageMapper.convertToDto(saved);
    }

    public List<DailyPermitPackageDto> searchPackages(String scope, String date, String location) {
        return dailyPermitPackageRepo.findAll().stream()
                .filter(pkg -> {
                    boolean matches = true;
                    if (scope != null && !scope.isEmpty()) {
                        String name = pkg.getName() != null ? pkg.getName().toLowerCase() : "";
                        matches = name.contains(scope.toLowerCase());
                    }
                    if (date != null && !date.isEmpty()) {
                        matches = matches && date.equals(pkg.getDate());
                    }
                    if (location != null && !location.isEmpty()) {
                        String locationLower = location.toLowerCase();
                        boolean locationMatches = Stream.of(
                                        pkg.getWorkRequests().stream().map(WorkRequest::getLocation),
                                        pkg.getSafeWorks().stream().map(SafeWork::getLocation),
                                        pkg.getHotWorks().stream().map(HotWork::getLocation))
                                .flatMap(s -> s)
                                .filter(Objects::nonNull)
                                .map(String::toLowerCase)
                                .anyMatch(value -> value.contains(locationLower));
                        matches = matches && locationMatches;
                    }
                    return matches;
                })
                .map(dailyPermitPackageMapper::convertToDto)
                .collect(Collectors.toList());
    }

    private void copyPermitsFromSource(DailyPermitPackage source, DailyPermitPackage target,
                                       String date, String time) {
        Value buildingStatus = ngValueService.createValue("Permit Status", "Building");
        String workScope = target.getName();

        target.setSafeWorks(new HashSet<>());
        target.setHotWorks(new HashSet<>());
        target.setConfinedSpaces(new HashSet<>());
        target.setEnergizedWorkPermits(new HashSet<>());
        target.setExcavationPermits(new HashSet<>());
        target.setVentingPermits(new HashSet<>());
        target.getLotos().clear();

        // Copy SafeWorks
        source.getSafeWorks().forEach(sw -> {
            SafeWorkDto dto = safeWorkMapper.convertToDto(sw);
            dto.setId(null); dto.setDate(date); dto.setTime(time);
            dto.setWorkScope(workScope); dto.setRedTagNum(null);
            SafeWork newSw = safeWorkMapper.convertToEntity(dto);
            newSw.setPermitStatus(buildingStatus);
            newSw.setPermitNumber(permitNumberGenerator.generate(date));
            target.addSafeWork(newSw);
        });

        // Copy HotWorks
        source.getHotWorks().forEach(hw -> {
            HotWorkDto dto = hotWorkMapper.convertToDto(hw);
            dto.setId(null); dto.setDate(date);
            dto.setWorkScope(workScope); dto.setRedTagNum(null);
            HotWork newHw = hotWorkMapper.convertToEntity(dto);
            newHw.setPermitStatus(buildingStatus);
            newHw.setPermitNumber(permitNumberGenerator.generate(date));
            target.addHotWork(newHw);
        });

        // Copy ConfinedSpaces
        source.getConfinedSpaces().forEach(cs -> {
            ConfinedSpaceDto dto = confinedSpaceMapper.convertToDto(cs);
            dto.setId(null); dto.setDate(date); dto.setTime(time);
            dto.setWorkScope(workScope); dto.setRedTagNum(null);
            ConfinedSpace newCs = confinedSpaceMapper.convertToEntity(dto);
            newCs.setPermitStatus(buildingStatus);
            newCs.setPermitNumber(permitNumberGenerator.generate(date));
            target.addConfinedSpace(newCs);
        });

        // Copy EnergizedWorkPermits
        source.getEnergizedWorkPermits().forEach(ep -> {
            EnergizedWorkPermit newEp = new EnergizedWorkPermit();
            newEp.setDate(date);
            newEp.setTime(time);
            newEp.setLocation(ep.getLocation());
            newEp.setIssuedTo(ep.getIssuedTo());
            newEp.setWorkOrder(ep.getWorkOrder());
            newEp.setCircuitDescription(ep.getCircuitDescription());
            newEp.setWorkDescription(ep.getWorkDescription());
            newEp.setJustification(ep.getJustification());
            newEp.setRequester(ep.getRequester());
            newEp.setRequesterDate(ep.getRequesterDate());
            newEp.setQualifiedPersonSignature(ep.getQualifiedPersonSignature());
            newEp.setQualifiedPersonDate(ep.getQualifiedPersonDate());
            newEp.setPlantManagerSignature(ep.getPlantManagerSignature());
            newEp.setPlantManagerDate(ep.getPlantManagerDate());
            newEp.setWorkCanBePerformedSafely(ep.getWorkCanBePerformedSafely());
            newEp.setChecklistJson(ep.getChecklistJson());
            newEp.setWorkScope(workScope);
            newEp.setRedTagNum(null);
            newEp.setPermitStatus(buildingStatus);
            newEp.setPermitNumber(permitNumberGenerator.generate(date));
            target.addEnergizedWorkPermit(newEp);
        });

        // Copy ExcavationPermits
        source.getExcavationPermits().forEach(ep -> {
            ExcavationPermit newEp = new ExcavationPermit();
            newEp.setDate(date);
            newEp.setTime(time);
            newEp.setLocation(ep.getLocation());
            newEp.setIssuedTo(ep.getIssuedTo());
            newEp.setSupervisor(ep.getSupervisor());
            newEp.setJobLocation(ep.getJobLocation());
            newEp.setSupervisorPhone(ep.getSupervisorPhone());
            newEp.setExcavationDescription(ep.getExcavationDescription());
            newEp.setWorkOrder(ep.getWorkOrder());
            newEp.setLocationPipingMarked(ep.getLocationPipingMarked());
            newEp.setSupervisorApprovalDate(ep.getSupervisorApprovalDate());
            newEp.setSupervisorApprovalTime(ep.getSupervisorApprovalTime());
            newEp.setPermitClosedDate(ep.getPermitClosedDate());
            newEp.setPermitClosedTime(ep.getPermitClosedTime());
            newEp.setJobStatusComplete(ep.getJobStatusComplete());
            newEp.setSupervisorFieldInspectionName(ep.getSupervisorFieldInspectionName());
            newEp.setSupervisorFieldInspectionDate(ep.getSupervisorFieldInspectionDate());
            newEp.setSupervisorFieldInspectionTime(ep.getSupervisorFieldInspectionTime());
            newEp.setFacilityName(ep.getFacilityName());
            newEp.setCompetentPerson(ep.getCompetentPerson());
            newEp.setSoilType(ep.getSoilType());
            newEp.setExcavationDepth(ep.getExcavationDepth());
            newEp.setExcavationWidth(ep.getExcavationWidth());
            newEp.setProtectiveSystemType(ep.getProtectiveSystemType());
            newEp.setTypeOfWorkJson(ep.getTypeOfWorkJson());
            newEp.setInspectionsJson(ep.getInspectionsJson());
            newEp.setChecklistJson(ep.getChecklistJson());
            newEp.setWorkScope(workScope);
            newEp.setRedTagNum(null);
            newEp.setPermitStatus(buildingStatus);
            newEp.setPermitNumber(permitNumberGenerator.generate(date));
            target.addExcavationPermit(newEp);
        });

        // Copy VentingPermits
        source.getVentingPermits().forEach(vp -> {
            VentingPermit newVp = new VentingPermit();
            newVp.setDate(date);
            newVp.setTime(time);
            newVp.setLocation(vp.getLocation());
            newVp.setIssuedTo(vp.getIssuedTo());
            newVp.setPlantName(vp.getPlantName());
            newVp.setSystemName(vp.getSystemName());
            newVp.setRequestingIndividual(vp.getRequestingIndividual());
            newVp.setPurpose(vp.getPurpose());
            newVp.setTimeCommence(vp.getTimeCommence());
            newVp.setTimeConclude(vp.getTimeConclude());
            newVp.setIndividualIssuing(vp.getIndividualIssuing());
            newVp.setGasType(vp.getGasType());
            newVp.setLel(vp.getLel());
            newVp.setUel(vp.getUel());
            newVp.setCalculatedVolume(vp.getCalculatedVolume());
            newVp.setPressure(vp.getPressure());
            newVp.setGasIndicatorModel(vp.getGasIndicatorModel());
            newVp.setGasIndicatorSerial(vp.getGasIndicatorSerial());
            newVp.setCalibrationDate(vp.getCalibrationDate());
            newVp.setSdsProvided(vp.getSdsProvided());
            newVp.setSdsInitials(vp.getSdsInitials());
            newVp.setGeneralArrangementProvided(vp.getGeneralArrangementProvided());
            newVp.setGeneralArrangementInitials(vp.getGeneralArrangementInitials());
            newVp.setHazardousClassificationDrawing(vp.getHazardousClassificationDrawing());
            newVp.setHazardousClassificationInitials(vp.getHazardousClassificationInitials());
            newVp.setPidWithValves(vp.getPidWithValves());
            newVp.setPidInitials(vp.getPidInitials());
            newVp.setDrawingNumbers(vp.getDrawingNumbers());
            newVp.setStackDescription(vp.getStackDescription());
            newVp.setEquipmentToBeDeenergized(vp.getEquipmentToBeDeenergized());
            newVp.setLotoDescription(vp.getLotoDescription());
            newVp.setRadioChannel(vp.getRadioChannel());
            newVp.setControlRoom(vp.getControlRoom());
            newVp.setOsmSupervisor(vp.getOsmSupervisor());
            newVp.setOsmDate(vp.getOsmDate());
            newVp.setPlantManager(vp.getPlantManager());
            newVp.setPlantManagerDate(vp.getPlantManagerDate());
            newVp.setDivisionDirector(vp.getDivisionDirector());
            newVp.setDivisionDirectorDate(vp.getDivisionDirectorDate());
            newVp.setChecklistJson(vp.getChecklistJson());
            newVp.setWorkScope(workScope);
            newVp.setRedTagNum(null);
            newVp.setPermitStatus(buildingStatus);
            newVp.setPermitNumber(permitNumberGenerator.generate(date));
            target.addVentingPermit(newVp);
        });

        // Associate same LOTOs
        target.getLotos().addAll(source.getLotos());
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

    // --- LOTO Suggestions from WorkArea ---

    public Map<String, Object> getLotoSuggestionsForWorkArea(Long workAreaId) {
        WorkArea workArea = workAreaRepo.findById(workAreaId).orElse(null);
        if (workArea == null || workArea.getConstantLotos() == null || workArea.getConstantLotos().isEmpty()) {
            return Map.of("existingLotos", List.of(), "suggestedStandards", List.of());
        }

        // For each standard, extract its loto point IDs
        Map<Long, Set<Long>> standardPointSets = new LinkedHashMap<>();
        for (var standard : workArea.getConstantLotos()) {
            Set<Long> pointIds = standard.getLotoPoints() != null
                    ? standard.getLotoPoints().stream().map(p -> p.getId()).collect(Collectors.toSet())
                    : Set.of();
            standardPointSets.put(standard.getId(), pointIds);
        }

        // Find existing Lotos that share loto points with the standards
        // Compare using lotoPointOrder JSON keys (point IDs)
        List<Loto> allLotos = lotoRepo.findAll();
        List<Map<String, Object>> existingLotoInfos = new ArrayList<>();
        Set<Long> matchedStandardIds = new HashSet<>();

        for (Loto loto : allLotos) {
            if (loto.getLotoPointOrder() == null || loto.getLotoPointOrder().isEmpty()) continue;
            Set<Long> lotoPointIds = loto.getLotoPointOrder().keySet().stream()
                    .map(Long::parseLong)
                    .collect(Collectors.toSet());

            for (var entry : standardPointSets.entrySet()) {
                if (!entry.getValue().isEmpty() && lotoPointIds.containsAll(entry.getValue())) {
                    Map<String, Object> info = new LinkedHashMap<>();
                    info.put("id", loto.getId());
                    info.put("permitNumber", loto.getPermitNumber());
                    info.put("equipmentSystem", loto.getEquipmentSystem());
                    info.put("matchedStandardId", entry.getKey());
                    var matchedStd = workArea.getConstantLotos().stream()
                            .filter(s -> s.getId().equals(entry.getKey())).findFirst().orElse(null);
                    info.put("matchedStandardName", matchedStd != null ? matchedStd.getName() : null);
                    existingLotoInfos.add(info);
                    matchedStandardIds.add(entry.getKey());
                    break; // One match per Loto is enough
                }
            }
        }

        // Standards without matching existing Lotos — suggest to operator
        List<Map<String, Object>> suggestedStandards = workArea.getConstantLotos().stream()
                .filter(s -> !matchedStandardIds.contains(s.getId()))
                .map(s -> {
                    Map<String, Object> info = new LinkedHashMap<>();
                    info.put("id", s.getId());
                    info.put("name", s.getName());
                    info.put("description", s.getDescription());
                    info.put("lotoPointCount", s.getLotoPoints() != null ? s.getLotoPoints().size() : 0);
                    return info;
                })
                .collect(Collectors.toList());

        return Map.of("existingLotos", existingLotoInfos, "suggestedStandards", suggestedStandards);
    }

    // --- LOTO Board ---

    public List<Map<String, Object>> getActiveLotosForBoard() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<DailyPermitPackage> allPackages = dailyPermitPackageRepo.findAll();

        for (DailyPermitPackage pkg : allPackages) {
            String status = pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : "Building";
            if (!"Active".equals(status) && !"Test".equals(status)) continue;
            if (pkg.getLotos() == null || pkg.getLotos().isEmpty()) continue;

            for (Loto loto : pkg.getLotos()) {
                Map<String, Object> info = new LinkedHashMap<>();
                info.put("id", loto.getId());
                info.put("permitNumber", loto.getPermitNumber());
                info.put("equipmentSystem", loto.getEquipmentSystem());
                info.put("lotoRequestor", loto.getLotoRequestor());
                info.put("date", loto.getDate());
                info.put("boxNumber", loto.getBoxNumber());
                info.put("lockCount", loto.getLocks() != null ? loto.getLocks().size() : 0);
                info.put("pointCount", loto.getLotoPointOrder() != null ? loto.getLotoPointOrder().size() : 0);
                info.put("packageId", pkg.getId());
                info.put("packageNumber", pkg.getPermitNumber());
                info.put("packageStatus", status);
                // WorkArea from package's work requests
                String workAreaName = pkg.getWorkRequests().stream()
                        .filter(wr -> wr.getWorkArea() != null)
                        .map(wr -> wr.getWorkArea().getName())
                        .findFirst().orElse(null);
                info.put("workArea", workAreaName);
                result.add(info);
            }
        }
        return result;
    }

    // --- Status Lifecycle ---

    public DailyPermitPackageDto activatePackage(String id) {
        DailyPermitPackage pkg = getEntityById(id);
        boolean isReactivation = pkg.getActivationSnapshotJson() != null && !pkg.getActivationSnapshotJson().isEmpty();

        DailyPermitPackageDto result = changeStatus(id, "Active", Set.of("Building", "Test"));
        takeSnapshot(Long.parseLong(id));

        // Attach LOTOs to the parent Job when package is activated
        pkg = getEntityById(id);
        if (pkg.getJobLog() != null && pkg.getLotos() != null) {
            for (var loto : pkg.getLotos()) {
                pkg.getJobLog().attachLoto(loto);
            }
        }

        if (isReactivation) {
            // Increment modification count
            pkg = getEntityById(id); // re-fetch after status change
            Integer count = pkg.getModificationCount() != null ? pkg.getModificationCount() : 0;
            pkg.setModificationCount(count + 1);

            PackageModification mod = new PackageModification();
            mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            mod.setAction("PACKAGE_MODIFIED");
            mod.setFieldName("modificationCount");
            mod.setNewValue(String.valueOf(count + 1));
            mod.setPerformedBy(getCurrentUsername());
            mod.setDescription("Package re-activated after modification (revision " + (count + 1) + ")");
            pkg.addModification(mod);

            // Clear foreman close-out flag for fresh cycle
            pkg.setForemanCloseOutCompleted(null);
            pkg.setWorkCompleted(null);
            pkg.setClosureComments(null);
            pkg.setScopeChanged(null);
            pkg.setClosureScopeDetails(null);
            pkg.setContinueDate(null);
            pkg.setContinueTime(null);

            dailyPermitPackageRepo.save(pkg);

            // Email signed-on personnel about modification
            notifyPersonnelOfModification(pkg, count + 1);
        }

        return getDtoById(id);
    }

    private void notifyPersonnelOfModification(DailyPermitPackage pkg, int revision) {
        try {
            notifyRequestorIfNeeded(pkg, "Active");
        } catch (Exception e) {
            System.err.println("Warning: Failed to send modification notification: " + e.getMessage());
        }
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
        }
        autoSignOffAllPersonnel(pkg);
        dailyPermitPackageRepo.save(pkg);
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
        notifyRequestorIfNeeded(saved, targetStatus);
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    private void notifyRequestorIfNeeded(DailyPermitPackage pkg, String newStatus) {
        if (!Set.of("Active", "Closed", "Test").contains(newStatus)) return;

        // Find submitter email from package's work requests
        String submitterEmail = pkg.getWorkRequests().stream()
                .filter(wr -> wr.getSubmitterEmail() != null && !wr.getSubmitterEmail().isBlank())
                .map(WorkRequest::getSubmitterEmail)
                .findFirst().orElse(null);
        if (submitterEmail == null) return;

        String permitNumber = pkg.getPermitNumber() != null ? pkg.getPermitNumber() : "N/A";
        String workArea = pkg.getWorkRequests().stream()
                .filter(wr -> wr.getWorkArea() != null)
                .map(wr -> wr.getWorkArea().getName())
                .findFirst().orElse("the designated area");

        String subject;
        String body;

        switch (newStatus) {
            case "Active" -> {
                boolean isReactivation = pkg.getActivationSnapshotJson() != null
                        && !pkg.getActivationSnapshotJson().isEmpty()
                        && pkg.getModificationCount() != null
                        && pkg.getModificationCount() > 0;

                if (isReactivation) {
                    subject = "Permit Package " + permitNumber + " — Resumed";
                    body = "Work has resumed on Permit Package " + permitNumber + ".\n\n" +
                            "Status: Active (revision " + pkg.getModificationCount() + ")\n" +
                            "Location: " + workArea + "\n\n" +
                            "Please report to " + workArea + " for sign-on.";
                } else {
                    subject = "Permit Package " + permitNumber + " — Active";
                    body = "Your work request has been processed.\n\n" +
                            "Permit Package: " + permitNumber + "\n" +
                            "Status: Active\n\n" +
                            "Please report to " + workArea + " for sign-on.";
                }
            }
            case "Test" -> {
                subject = "Permit Package " + permitNumber + " — Paused";
                body = "Work has been paused on Permit Package " + permitNumber + ".\n\n" +
                        "Status: Paused\n" +
                        "Location: " + workArea + "\n\n" +
                        "Stand by for further instructions.";
            }
            case "Closed" -> {
                subject = "Permit Package " + permitNumber + " — Closed";
                body = "Permit Package " + permitNumber + " has been closed.\n\n" +
                        "Work completed: " + (Boolean.TRUE.equals(pkg.getWorkCompleted()) ? "Yes" : "No") + "\n" +
                        (pkg.getClosureComments() != null ? "Comments: " + pkg.getClosureComments() + "\n" : "") +
                        (pkg.getContinueDate() != null ? "Work continues on: " + pkg.getContinueDate() + "\n" : "") +
                        (Boolean.TRUE.equals(pkg.getScopeChanged()) ? "\nNote: Scope has changed. A new Work Request may be needed.\n" +
                                (pkg.getClosureScopeDetails() != null ? "Details: " + pkg.getClosureScopeDetails() : "") : "");
            }
            default -> { return; }
        }

        // Push SSE event to PWA user (real-time)
        try {
            Map<String, Object> sseData = new LinkedHashMap<>();
            sseData.put("type", "STATUS_CHANGE");
            sseData.put("packageId", pkg.getId());
            sseData.put("packageNumber", permitNumber);
            sseData.put("status", newStatus);
            sseData.put("description", subject);
            sseData.put("workArea", workArea);
            sseData.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            pwaSseService.sendToUser(submitterEmail, "permit_status", sseData);
        } catch (Exception e) {
            // SSE failure is non-critical
            System.out.println("[PWA SSE] Failed to push to " + submitterEmail + ": " + e.getMessage());
        }

        // Send email notification
        try {
            var emailRequest = com.dk_power.power_plant_java.dto.email.EmailRequest.builder()
                    .to(submitterEmail)
                    .subject(subject)
                    .body(body)
                    .build();
            emailFacadeService.sendEmail(emailRequest);
        } catch (Exception e) {
            // Don't fail the status change if email fails
            System.out.println("[Permit Notification] Failed to send email to " + submitterEmail + ": " + e.getMessage());
        }
    }

    private void cascadeStatusToPermits(DailyPermitPackage pkg, String status) {
        Value permitStatus = ngValueService.createValue("Permit Status", status);
        if (pkg.getWorkRequests() != null) pkg.getWorkRequests().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getSafeWorks() != null) pkg.getSafeWorks().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getHotWorks() != null) pkg.getHotWorks().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getConfinedSpaces() != null) pkg.getConfinedSpaces().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getEnergizedWorkPermits() != null) pkg.getEnergizedWorkPermits().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getExcavationPermits() != null) pkg.getExcavationPermits().forEach(p -> p.setPermitStatus(permitStatus));
        if (pkg.getVentingPermits() != null) pkg.getVentingPermits().forEach(p -> p.setPermitStatus(permitStatus));
        // LOTOs are NOT cascaded — they have their own independent lifecycle
        // A LOTO can be attached to multiple packages and is activated/closed separately
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
            } else {
                job.setJobStatus(ngValueService.createValue("Job Status", "Building"));
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
            pkg.setActivationSnapshotJson(objectMapper.writeValueAsString(dto));
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

    private List<PackageModification> detectChanges(DailyPermitPackage old, DailyPermitPackage updated,
                                                    DailyPermitPackageDto incomingDto) {
        List<PackageModification> mods = new ArrayList<>();
        String user = getCurrentUsername();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        // Field changes
        if (incomingDto.getDate() != null) diffField(mods, now, user, "date", old.getDate(), updated.getDate());
        if (incomingDto.getTime() != null) diffField(mods, now, user, "time", old.getTime(), updated.getTime());
        if (incomingDto.getCompanyName() != null) diffField(mods, now, user, "companyName", old.getCompanyName(), updated.getCompanyName());
        if (incomingDto.getPersonName() != null) diffField(mods, now, user, "personName", old.getPersonName(), updated.getPersonName());
        if (incomingDto.getName() != null) diffField(mods, now, user, "name", old.getName(), updated.getName());

        // Status change
        if (incomingDto.getPackageStatus() != null) {
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
        }

        // Permit collection changes
        if (incomingDto.hasWorkRequestsPayload()) {
            detectPermitCollectionChanges(mods, now, user, "WorkRequest",
                    getIds(old.getWorkRequests()), getIds(updated.getWorkRequests()));
        }
        if (incomingDto.hasSafeWorksPayload()) {
            detectPermitCollectionChanges(mods, now, user, "SafeWork",
                    getIds(old.getSafeWorks()), getIds(updated.getSafeWorks()));
        }
        if (incomingDto.hasHotWorksPayload()) {
            detectPermitCollectionChanges(mods, now, user, "HotWork",
                    getIds(old.getHotWorks()), getIds(updated.getHotWorks()));
        }
        if (incomingDto.hasConfinedSpacesPayload()) {
            detectPermitCollectionChanges(mods, now, user, "ConfinedSpace",
                    getIds(old.getConfinedSpaces()), getIds(updated.getConfinedSpaces()));
        }
        if (incomingDto.hasLotosPayload()) {
            detectPermitCollectionChanges(mods, now, user, "Loto",
                    getIds(old.getLotos()), getIds(updated.getLotos()));
        }
        if (incomingDto.hasEnergizedWorkPermitsPayload()) {
            detectPermitCollectionChanges(mods, now, user, "EnergizedWorkPermit",
                    getIds(old.getEnergizedWorkPermits()), getIds(updated.getEnergizedWorkPermits()));
        }
        if (incomingDto.hasExcavationPermitsPayload()) {
            detectPermitCollectionChanges(mods, now, user, "ExcavationPermit",
                    getIds(old.getExcavationPermits()), getIds(updated.getExcavationPermits()));
        }
        if (incomingDto.hasVentingPermitsPayload()) {
            detectPermitCollectionChanges(mods, now, user, "VentingPermit",
                    getIds(old.getVentingPermits()), getIds(updated.getVentingPermits()));
        }

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

    // --- Personnel Sign-On/Off ---

    public DailyPermitPackageDto foremanSignOn(String packageId, String personName, String company) {
        DailyPermitPackage pkg = getEntityById(packageId);
        String currentStatus = pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : "Building";
        if (!"Active".equals(currentStatus) && !"Test".equals(currentStatus)) {
            throw new RuntimeException("Cannot sign on when package status is '" + currentStatus + "'");
        }
        if (!pkg.getPersonnel().isEmpty()) {
            throw new RuntimeException("Foreman must be the first person to sign on");
        }
        String user = getCurrentUsername();
        pkg.signOnPerson(personName, "Foreman", company, user, true);

        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("FOREMAN_SIGN_ON");
        mod.setFieldName("personnel");
        mod.setNewValue(personName + " (Foreman)");
        mod.setPerformedBy(user);
        mod.setDescription("Foreman " + personName + " signed on");
        pkg.addModification(mod);

        dailyPermitPackageRepo.save(pkg);
        return dailyPermitPackageMapper.convertToDto(pkg);
    }

    public DailyPermitPackageDto signOnPerson(String packageId, String personName, String personRole, String company) {
        DailyPermitPackage pkg = getEntityById(packageId);
        String currentStatus = pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : "Building";
        if (!"Active".equals(currentStatus) && !"Test".equals(currentStatus)) {
            throw new RuntimeException("Cannot sign on when package status is '" + currentStatus + "'");
        }
        if (!pkg.hasForemanSignedOn()) {
            throw new RuntimeException("Foreman must sign on before workers can sign on");
        }
        String user = getCurrentUsername();
        pkg.signOnPerson(personName, personRole, company, user, false);

        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("PERSONNEL_SIGN_ON");
        mod.setFieldName("personnel");
        mod.setNewValue(personName + " (" + (personRole != null ? personRole : "") + ")");
        mod.setPerformedBy(user);
        mod.setDescription(personName + " signed on as " + (personRole != null ? personRole : "worker"));
        pkg.addModification(mod);

        dailyPermitPackageRepo.save(pkg);
        return dailyPermitPackageMapper.convertToDto(pkg);
    }

    public DailyPermitPackageDto signOffPerson(String packageId, String personName, String comments) {
        DailyPermitPackage pkg = getEntityById(packageId);
        String user = getCurrentUsername();
        boolean found = pkg.signOffPerson(personName, user, comments);
        if (!found) {
            throw new RuntimeException("Person '" + personName + "' is not currently signed on");
        }

        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("PERSONNEL_SIGN_OFF");
        mod.setFieldName("personnel");
        mod.setOldValue(personName);
        mod.setPerformedBy(user);
        mod.setDescription(personName + " signed off" + (comments != null && !comments.isBlank() ? ": " + comments : ""));
        pkg.addModification(mod);

        dailyPermitPackageRepo.save(pkg);
        return dailyPermitPackageMapper.convertToDto(pkg);
    }

    public DailyPermitPackageDto foremanSignOff(String packageId, Map<String, Object> closeOutData) {
        DailyPermitPackage pkg = getEntityById(packageId);
        String user = getCurrentUsername();

        // Sign off the foreman
        var foremanEntry = pkg.getPersonnel().stream()
                .filter(e -> e.isForeman() && e.getSignOffTime() == null)
                .findFirst().orElseThrow(() -> new RuntimeException("No foreman currently signed on"));
        // Store close-out data (operator will review these later)
        Boolean workCompleted = closeOutData.containsKey("workCompleted") ? (Boolean) closeOutData.get("workCompleted") : null;
        String comments = (String) closeOutData.get("comments");

        // Sign off foreman with their actual close-out comments
        pkg.signOffPerson(foremanEntry.getPersonName(), user, comments != null && !comments.isBlank() ? comments : "Close-out completed");
        Boolean scopeChanged = closeOutData.containsKey("scopeChanged") ? (Boolean) closeOutData.get("scopeChanged") : null;
        String scopeDetails = (String) closeOutData.get("scopeDetails");
        String continueDate = (String) closeOutData.get("continueDate");
        String continueTime = (String) closeOutData.get("continueTime");

        pkg.setWorkCompleted(workCompleted);
        pkg.setClosureComments(comments);
        pkg.setScopeChanged(scopeChanged);
        pkg.setClosureScopeDetails(scopeDetails);
        pkg.setContinueDate(continueDate);
        pkg.setContinueTime(continueTime);
        pkg.setForemanCloseOutCompleted(true);

        PackageModification mod = new PackageModification();
        mod.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mod.setAction("FOREMAN_SIGN_OFF");
        mod.setFieldName("personnel");
        mod.setOldValue(foremanEntry.getPersonName());
        mod.setPerformedBy(user);
        mod.setDescription("Foreman " + foremanEntry.getPersonName() + " completed close-out (work " +
                (Boolean.TRUE.equals(workCompleted) ? "completed" : "not completed") + ")");
        pkg.addModification(mod);

        dailyPermitPackageRepo.save(pkg);
        // Package stays Active — operator reviews and decides to close or reissue
        return dailyPermitPackageMapper.convertToDto(pkg);
    }

    public DailyPermitPackageDto generateContinuationFromCloseOut(String packageId) {
        DailyPermitPackage pkg = getEntityById(packageId);
        if (!Boolean.TRUE.equals(pkg.getForemanCloseOutCompleted())) {
            throw new RuntimeException("Foreman close-out must be completed before generating continuation");
        }
        String continueDate = pkg.getContinueDate();
        if (continueDate == null || continueDate.isBlank()) {
            throw new RuntimeException("No continue date set in foreman close-out");
        }
        generateContinuation(pkg, continueDate, pkg.getScopeChanged(), pkg.getClosureScopeDetails());
        return dailyPermitPackageMapper.convertToDto(pkg);
    }

    private void generateContinuation(DailyPermitPackage source, String continueDate, Boolean scopeChanged, String scopeDetails) {
        // Clone originating WR
        WorkRequest origWr = source.getWorkRequests().isEmpty() ? null : source.getWorkRequests().iterator().next();
        if (origWr == null) return;

        WorkRequest newWr = new WorkRequest();
        newWr.setCompany(origWr.getCompany());
        newWr.setRequestedBy(origWr.getRequestedBy());
        newWr.setLocation(origWr.getLocation());
        newWr.setAffectedEquipment(origWr.getAffectedEquipment());
        newWr.setForeman(origWr.getForeman());
        newWr.setFireWatch(origWr.getFireWatch());
        newWr.setIsHotWorkRequired(origWr.getIsHotWorkRequired());
        newWr.setIsLotoRequired(origWr.getIsLotoRequired());
        newWr.setIsConfinedSpaceEntryRequired(origWr.getIsConfinedSpaceEntryRequired());
        newWr.setSpace(origWr.getSpace());
        newWr.setWorkCategory(origWr.getWorkCategory());
        newWr.setWorkArea(origWr.getWorkArea());
        newWr.setDateOfWorkToBePerformed(continueDate);
        newWr.setTimeOfWorkToBePerformed(origWr.getTimeOfWorkToBePerformed());

        // Preserve contractor identity for notifications
        newWr.setSubmitterName(origWr.getSubmitterName());
        newWr.setSubmitterEmail(origWr.getSubmitterEmail());
        newWr.setSubmitterPhone(origWr.getSubmitterPhone());
        newWr.setSubmitterCompany(origWr.getSubmitterCompany());

        if (Boolean.TRUE.equals(scopeChanged) && scopeDetails != null && !scopeDetails.isBlank()) {
            newWr.setWorkScope(scopeDetails);
            newWr.setName(scopeDetails);
        } else {
            String origScope = origWr.getWorkScope() != null ? origWr.getWorkScope() : "";
            newWr.setWorkScope(origScope + " (Continuation)");
            newWr.setName(origScope + " (Continuation)");
        }

        // Generate permit number before saving WR to avoid flush issues
        String newPermitNumber = permitNumberGenerator.generate(continueDate);

        newWr = workRequestRepo.saveAndFlush(newWr);

        // Create new package with copied permits
        DailyPermitPackage newPackage = new DailyPermitPackage();
        newPackage.setDate(continueDate);
        newPackage.setTime(source.getTime());
        newPackage.setPersonName(source.getPersonName());
        newPackage.setCompanyName(source.getCompanyName());
        newPackage.setName(newWr.getWorkScope());
        newPackage.setPermitNumber(newPermitNumber);
        newPackage.setPackageStatus(ngValueService.createValue("Package Status", "Building"));
        newPackage = dailyPermitPackageRepo.saveAndFlush(newPackage);
        newPackage.addWorkRequest(newWr);
        copyPermitsFromSource(source, newPackage, continueDate, source.getTime());
        newPackage = dailyPermitPackageRepo.save(newPackage);

        // Attach to same job
        try {
            var jobOpt = jobLogRepo.findByPackageId(source.getId());
            if (jobOpt.isPresent()) {
                var job = jobOpt.get();
                job.addPackage(newPackage);
                jobLogRepo.save(job);
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not link continuation package to job: " + e.getMessage());
        }
    }

    private void autoSignOffAllPersonnel(DailyPermitPackage pkg) {
        var signedOn = pkg.getSignedOnPersonnel();
        if (signedOn.isEmpty()) return;
        String user = getCurrentUsername();
        for (var entry : signedOn) {
            pkg.signOffPerson(entry.getPersonName(), user, "Auto-signed off at package closure");
        }
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

    private <T extends com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity> boolean removeMatching(
            Set<T> collection, Long id, java.util.function.Consumer<T> remover) {
        T match = collection.stream()
                .filter(item -> id.equals(item.getId()))
                .findFirst()
                .orElse(null);
        if (match == null) return false;
        remover.accept(match);
        return true;
    }

}
