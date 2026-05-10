package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.*;
import com.dk_power.power_plant_java.entities.permits.pojo.PersonnelSignEntry;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.loto.LotoSnapshotRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgLotoService implements NgCrudService<Loto, LotoDto, LotoRepo, LotoMapper> {
    private final LotoMapper mapper;
    private final LotoRepo repo;
    private final EntityManager entityManager;
    private final SessionFactory sessionFactory;
    private final NgValueService ngValueService;
    private final NgLotoPointService lotoPointService;
    private final NgLotoBoxService lotoBoxService;
    private final NgLockService lockService;
    private final LotoSnapshotRepo lotoSnapshotRepo;
    private final LotoStandardRepo lotoStandardRepo;
    private final com.dk_power.power_plant_java.sevice.loto.loto_box.LotoAssignmentService lotoAssignmentService;
    private final com.dk_power.power_plant_java.repository.permits.JobLogRepo jobLogRepo;

    @Override
    public LotoRepo getRepo() {
        return this.repo;
    }

    @Override
    public LotoMapper getMapper() {
        return this.mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LotoDto getDto() {
        return new LotoDto();
    }

    @Override
    public Loto getEntity() {
        return new Loto();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<Loto> getEntityClass() {
        return Loto.class;
    }

    @Override
    public Loto save(Loto entity) {
        if(entity.isArchived()) throw new IllegalArgumentException("Archived loto cannot be saved");
        lotoSnapshotRepo.save(entity.getLatestSnapshot());
        return this.repo.save(entity);
    }

    @Transactional
    public void deleteLoto(Long id) {
        Loto loto = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + id));
        loto.setDeleted(true);
        repo.saveAndFlush(loto);
    }

    public Optional<Loto> findById(Long id) {
        return this.repo.findById(id);
    }

    public Optional<LotoDto> findDtoById(Long id) {
        return this.findById(id).map(this::toDto);
    }

    public Page<LotoDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("docNum", searchString);
        searchCriteria.put("workScope", searchString);
        searchCriteria.put("system.name", searchString);
        searchCriteria.put("permitStatus.name", searchString);
        searchCriteria.put("permitType.name", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
//        return complexSearch(sc).stream().map(this::toDto).toList();
        return complexSearch(sc, page, size, "socNum", "asc", false);
    }

    public Set<String> getRelatedImages(Long id) {
        return repo.findById(id)
                .map(loto -> loto.getLotoPoints().stream()
                        .map(l -> lotoPointService.getRelatedImages(l.getId()))
                        .flatMap(Collection::stream)
                        .collect(Collectors.toSet()))
                .orElse(Collections.emptySet());
    }

    @Override
    public Loto toEntity(LotoDto dto) {
        return mapper.convertToEntity(dto);
    }

    @Override
    public LotoDto toDto(Loto entity) {
        return mapper.convertToDto(entity);
    }

    @Transactional
    public Loto update(LotoIdDto dto) {
        Loto loto;
        boolean isNewLoto = dto.getId() == null || dto.getId() == 0;

        if (isNewLoto) {
            loto = new Loto();
        } else {
            loto = repo.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + dto.getId()));
        }

        // Update Loto with new data
        mapper.updateLotoFromDto(dto, loto);

        // Handle LotoPoints
        Set<Long> newLotoPointIds = dto.getLotoPoints() != null ? new HashSet<>(dto.getLotoPoints()) : new HashSet<>();

        if (loto.getLotoPoints() == null) {
            loto.setLotoPoints(new HashSet<>());
        }

        loto.getSnapshots().forEach(s->{
            if(s.getId()==null) lotoSnapshotRepo.save(s);
        });

        return repo.save(loto);
    }

    public List<LotoDto> getActiveWithBox() {
        return repo.findActiveWithBox().stream().map(this::toDto).toList();
    }

    public List<LotoPointDto> getActiveLotoPoints() {
//        return repo.findAll().stream()
//                .filter(loto -> loto.getLotoPoints() != null && !loto.getLotoPoints().isEmpty())
//                .flatMap(loto -> loto.getLotoPoints().stream())
//                .distinct()
//                .map(lotoPointService::toDto)
//                .collect(Collectors.toList());
        return null;
    }

    public LotoDto addLotoPointToLoto(Long pointId, Long lotoId) {
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        LotoPoint point = lotoPointService.findById(pointId)
               .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + pointId));

        loto.addLotoPoint(lotoPointService.toIdDto(point));
        flagIfActiveModification(loto);

        return toDto(save(loto));
    }

    private LotoPointIdDto toIdDto(LotoPoint point) {
        return this.mapper.toIdDto(point);
    }

    public LotoDto removeLotoPointFromLoto(Long pointId, Long lotoId) {
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        loto.removeLotoPoint(pointId);
        flagIfActiveModification(loto);
        return toDto(save(loto));
    }

    /**
     * Flip {@code wasModifiedDuringActive} on the LOTO if the current permit status
     * is Active or Test. Used by add/remove-point paths to record that the LOTO was
     * mutated after first activation, which feeds the close-time disposition logic.
     */
    private void flagIfActiveModification(Loto loto) {
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Active".equals(status) || "Test".equals(status)) {
            loto.setWasModifiedDuringActive(Boolean.TRUE);
        }
    }


    public List<FileDto> getRelatedFiles(Long lotoStandardId) {
        Loto loto = getEntityById(lotoStandardId);
        if (loto == null) {
            throw new EntityNotFoundException("Loto not found");
        }
        List<LotoPoint> points = loto.getLotoPoints().stream().map(lotoPointService::convertIdDtoToEntity).toList();
        if(points==null || points.isEmpty()) return List.of();
        Set<FileDto> files = new HashSet<>();
        for(LotoPoint point : points){
            files.addAll(lotoPointService.getRelatedFiles(point.getId()));
        }

        return files.stream().distinct().toList();
    }

    public LotoDto reorderLotoPoints(Long currentLotoId, List<Long> lotoPoints) {
        Loto loto = getEntityById(currentLotoId);
        if(loto == null) {
            throw new EntityNotFoundException("Loto not found");
        }
        loto.reorderLotoPoints(lotoPoints);
        flagIfActiveModification(loto);
        return toDto(save(loto));
    }

    public List<LotoDto> saveAll(List<LotoIdDto> lotos) {
        return lotos.stream()
               .map(this::idDtoToEntity)
                .map(this::save)
               .map(this::toDto)
               .collect(Collectors.toList());
    }

    private Loto idDtoToEntity(LotoIdDto lotoIdDto) {
        return this.mapper.convertIdDtoToEntity(lotoIdDto);
    }

    /*********************************************************************************************************************
     * LOTO PERMIT WORKFLOW
     ******************************************************************************************************************/

    @Transactional
    public LotoDto createFromStandard(Long standardId, LotoIdDto permitData, Integer requestedBoxNumber) {
        LotoStandard standard = lotoStandardRepo.findById(standardId)
                .orElseThrow(() -> new EntityNotFoundException("LotoStandard not found with id: " + standardId));

        Loto loto = new Loto();
        if (permitData != null) mapper.updateLotoFromDto(permitData, loto);
        loto.setSourceStandard(standard);
        loto.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));

        LotoSnapshot snapshot = loto.createNewSnapshot();
        snapshot.setSnapshotReason("Created from standard: " + standard.getName());

        Set<LotoPointIdDto> pointDtos = new HashSet<>();
        for (LotoPoint point : standard.getLotoPoints()) {
            pointDtos.add(lotoPointService.toIdDto(point));
        }
        snapshot.setLotoPointDtos(pointDtos);
        try {
            snapshot.setLotoPointOrder(new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(standard.getLotoPointOrder()));
        } catch (Exception e) {
            snapshot.setLotoPointOrder("{}");
        }

        // Copy point prerequisites from standard so the instance has its own editable copy
        snapshot.setPointPrerequisites(standard.getPointPrerequisites());

        loto = repo.save(loto);
        lotoSnapshotRepo.save(snapshot);

        // Auto-assign box + locks based on point count
        int pointCount = standard.getLotoPoints().size();
        if (requestedBoxNumber != null) {
            lotoBoxService.assignBoxToLoto(loto, requestedBoxNumber);
        } else {
            lotoAssignmentService.autoAssign(loto, pointCount);
            lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), "Building");
        }

        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto createFromScratch(LotoIdDto permitData, Integer requestedBoxNumber) {
        Loto loto = new Loto();
        if (permitData != null) mapper.updateLotoFromDto(permitData, loto);
        loto.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));

        LotoSnapshot snapshot = loto.createNewSnapshot();
        snapshot.setSnapshotReason("Created from scratch");

        loto = repo.save(loto);
        lotoSnapshotRepo.save(snapshot);

        // Auto-assign box (no locks yet since no points)
        if (requestedBoxNumber != null) {
            lotoBoxService.assignBoxToLoto(loto, requestedBoxNumber);
        } else {
            lotoAssignmentService.autoAssign(loto, 0);
            lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), "Building");
        }

        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto changeStatus(Long lotoId, String newStatus) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        String currentStatus = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        validateStatusTransition(currentStatus, newStatus);
        String user = currentUserName();

        switch (newStatus) {
            case "Active" -> {
                // First Activation (Building → Active) requires CA Activation signature.
                // Re-Activation (Test → Active) does not — the LOTO was already CA-activated previously.
                if (!"Test".equals(currentStatus)) {
                    boolean caActivated = loto.getSnapshots().stream().anyMatch(sn -> sn.getCaActivatedBy() != null);
                    if (!caActivated) {
                        throw new IllegalStateException("Control Authority must Activate the LOTO before it can be marked Active");
                    }
                }
                LotoSnapshot latest = loto.getLatestSnapshot();
                latest.setPersonnelSnapshot(loto.getPersonnelJson());
                if ("Test".equals(currentStatus)) {
                    latest.setSnapshotReason("Re-Activated");
                    LotoSnapshot recorded = loto.recordReactivated(user);
                    lotoSnapshotRepo.save(recorded);
                } else {
                    latest.setSnapshotReason("Activated");
                    LotoSnapshot recorded = loto.recordActivated(user);
                    lotoSnapshotRepo.save(recorded);
                }
                lotoSnapshotRepo.save(latest);
            }
            case "Test" -> {
                LotoSnapshot latest = loto.getLatestSnapshot();
                try {
                    LotoSnapshot testSnapshot = (LotoSnapshot) latest.clone();
                    testSnapshot.setId(null);
                    testSnapshot.setDateCreated(java.time.LocalDateTime.now());
                    testSnapshot.setLoto(loto);
                    testSnapshot.clearLifecycleEventFields();
                    testSnapshot.setSnapshotReason("Test Started");
                    testSnapshot.setTestStartedBy(user);
                    testSnapshot.setTestStartedAt(java.time.LocalDateTime.now());
                    loto.getSnapshots().add(testSnapshot);
                    lotoSnapshotRepo.save(testSnapshot);
                } catch (CloneNotSupportedException e) {
                    throw new RuntimeException("Failed to clone snapshot for test", e);
                }
            }
            case "Closed" -> {
                LotoSnapshot latest = loto.getLatestSnapshot();
                latest.setPersonnelSnapshot(loto.getPersonnelJson());
                latest.setSnapshotReason("Closed");
                LotoSnapshot recorded = loto.recordClosed(user);
                lotoSnapshotRepo.save(recorded);
                lotoSnapshotRepo.save(latest);

                // Compute close-time disposition: did anything change during Active?
                boolean wasModified = Boolean.TRUE.equals(loto.getWasModifiedDuringActive());
                loto.setCloseDisposition(wasModified ? "NEEDS_REVIEW" : "READY_FOR_APPROVAL");

                // Release locks back to inventory
                lotoAssignmentService.releaseLocks(loto);
                // Release box
                if (loto.getLotoBox() != null) lotoBoxService.releaseBox(loto.getLotoBox());
            }
        }

        Value statusValue = ngValueService.createValue("Permit Status", newStatus);
        loto.setPermitStatus(statusValue);

        if (!"Closed".equals(newStatus) && loto.getLotoBox() != null) {
            lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), newStatus);
        }

        return toDto(repo.save(loto));
    }

    /*********************************************************************************************************************
     * LIFECYCLE EVENTS — operator records hung/verified/transfer/accept/release/etc into the latest snapshot.
     ******************************************************************************************************************/

    private String currentUserName() {
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /**
     * Returns the current permit status name (e.g. "Building" / "Active" / "Test" / "Closed").
     * Null when the LOTO has no status (shouldn't happen post-creation; treated as Closed for safety).
     */
    private String permitStatusOf(Loto loto) {
        return loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
    }

    /**
     * Reject if the LOTO's current permit status isn't one of the allowed states.
     * Mirrors the frontend canRecord() switch for defence-in-depth.
     */
    private void requireStatusOneOf(Loto loto, String operation, String... allowedStates) {
        String s = permitStatusOf(loto);
        for (String allowed : allowedStates) {
            if (allowed.equals(s)) return;
        }
        throw new IllegalStateException(operation + " is not allowed in status " + s
                + " — allowed: " + String.join(", ", allowedStates));
    }

    @Transactional
    public LotoDto approveForHanging(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "CA approval for hanging", "Building");
        LotoSnapshot s = loto.recordCaApprovedForHanging(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto caActivate(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "CA activation", "Building");
        // Guard: hung + verified must be done before CA can activate
        boolean hung = loto.getSnapshots().stream().anyMatch(sn -> sn.getHungBy() != null);
        boolean verified = loto.getSnapshots().stream().anyMatch(sn -> sn.getVerifiedBy() != null);
        if (!hung || !verified) {
            throw new IllegalStateException("LOTO must be Hung and Verified before Control Authority can activate it");
        }
        LotoSnapshot s = loto.recordCaActivated(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markHung(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Mark hung (aggregate)", "Building");
        // Guard: CA must have approved hanging before the LOTO can be marked hung
        boolean caApproved = loto.getSnapshots().stream().anyMatch(sn -> sn.getCaApprovedForHangingBy() != null);
        if (!caApproved) {
            throw new IllegalStateException("Control Authority must approve the LOTO before it can be signed as hung");
        }
        // Guard: every loto point must be marked hung
        java.util.Set<Long> requiredPointIds = loto.getLotoPointDtos().stream()
                .map(p -> p.getId()).filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        java.util.Set<Long> hungPointIds = aggregatePointKeys(loto, true);
        if (!hungPointIds.containsAll(requiredPointIds)) {
            throw new IllegalStateException("All LOTO points must be marked hung before the LOTO can be signed as hung");
        }
        LotoSnapshot s = loto.recordHung(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markPointHung(Long lotoId, Long pointId, java.util.List<String> acknowledgedSafetyConditions, String notes) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Mark point hung", "Building");
        LotoSnapshot latest = loto.getLatestSnapshot();
        enforcePrerequisitesForHang(loto, latest, pointId, acknowledgedSafetyConditions);
        LotoSnapshot s = loto.markPointHung(pointId, currentUserName(), notes);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto unmarkPointHung(Long lotoId, Long pointId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Unmark point hung", "Building");
        LotoSnapshot latest = loto.getLatestSnapshot();
        // Reject if any successor still depends on this hang
        for (java.util.Map.Entry<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> e
                : latest.getPointPrerequisites().entrySet()) {
            if (e.getKey().equals(pointId)) continue;
            if (e.getValue() == null || e.getValue().getRequiredPointIds() == null) continue;
            if (!e.getValue().getRequiredPointIds().contains(pointId)) continue;
            if (latest.getPointHungBy().containsKey(e.getKey())) {
                throw new IllegalStateException(
                        "Cannot un-hang point " + pointId + " — point " + e.getKey() + " was hung after it");
            }
        }
        // Verify must be undone first if present
        if (latest.getPointVerifiedBy().containsKey(pointId)) {
            throw new IllegalStateException("Cannot un-hang point " + pointId + " — verify it off first");
        }
        LotoSnapshot s = loto.unmarkPointHung(pointId);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markPointVerified(Long lotoId, Long pointId, java.util.List<String> acknowledgedSafetyConditions, String notes) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Mark point verified", "Building");
        LotoSnapshot latest = loto.getLatestSnapshot();
        // Verify is only available after every point in the LOTO has been hung.
        java.util.Set<Long> pointIds = new java.util.HashSet<>();
        for (com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto p : latest.getLotoPointDtos()) {
            if (p != null && p.getId() != null) pointIds.add(p.getId());
        }
        if (!latest.getPointHungBy().keySet().containsAll(pointIds)) {
            throw new IllegalStateException("Cannot verify points until every point on the LOTO has been hung");
        }
        enforcePrerequisitesForVerify(loto, latest, pointId, acknowledgedSafetyConditions);
        // Second-person rule: the user who hung this point cannot verify it.
        String hungBy = latest.getPointHungBy().get(pointId);
        String me = currentUserName();
        if (hungBy != null && hungBy.equals(me)) {
            throw new IllegalStateException("Cannot verify a point you hung yourself");
        }
        LotoSnapshot s = loto.markPointVerified(pointId, me, notes);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto unmarkPointVerified(Long lotoId, Long pointId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Unmark point verified", "Building");
        LotoSnapshot s = loto.unmarkPointVerified(pointId);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markPointWalkdown(Long lotoId, Long pointId, String notes) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Mark point walkdown", "Building");
        LotoSnapshot latest = loto.getLatestSnapshot();
        // Walkdown is only available after every point has been verified.
        java.util.Set<Long> pointIds = new java.util.HashSet<>();
        for (com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto p : latest.getLotoPointDtos()) {
            if (p != null && p.getId() != null) pointIds.add(p.getId());
        }
        if (!latest.getPointVerifiedBy().keySet().containsAll(pointIds)) {
            throw new IllegalStateException("Cannot walk down points until every point on the LOTO has been verified");
        }
        LotoSnapshot s = loto.markPointWalkdown(pointId, currentUserName(), notes);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto unmarkPointWalkdown(Long lotoId, Long pointId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Unmark point walkdown", "Building");
        LotoSnapshot s = loto.unmarkPointWalkdown(pointId);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    /**
     * Reject the hang if (a) any prerequisite point isn't yet hung, or
     * (b) any safety condition declared on the point hasn't been acknowledged.
     */
    private void enforcePrerequisitesForHang(Loto loto, LotoSnapshot latest, Long pointId, java.util.List<String> acknowledged) {
        com.dk_power.power_plant_java.entities.loto.PointPrerequisite spec =
                latest.getPointPrerequisites().get(pointId);
        if (spec == null) return; // no prereqs configured

        java.util.Set<Long> alreadyHung = latest.getPointHungBy().keySet();
        if (spec.getRequiredPointIds() != null) {
            for (Long required : spec.getRequiredPointIds()) {
                if (!alreadyHung.contains(required)) {
                    throw new IllegalStateException(
                            "Cannot hang point " + pointId + " — required predecessor point " + required + " is not yet hung");
                }
            }
        }
        enforceSafetyConditions("hang", pointId, spec.getSafetyConditions(), acknowledged);
    }

    /**
     * Verify follows the same prerequisite rules: predecessor points must be verified,
     * and verify-time safety conditions (same list) must be acknowledged.
     */
    private void enforcePrerequisitesForVerify(Loto loto, LotoSnapshot latest, Long pointId, java.util.List<String> acknowledged) {
        com.dk_power.power_plant_java.entities.loto.PointPrerequisite spec =
                latest.getPointPrerequisites().get(pointId);
        if (spec == null) return;

        java.util.Set<Long> alreadyVerified = latest.getPointVerifiedBy().keySet();
        if (spec.getRequiredPointIds() != null) {
            for (Long required : spec.getRequiredPointIds()) {
                if (!alreadyVerified.contains(required)) {
                    throw new IllegalStateException(
                            "Cannot verify point " + pointId + " — required predecessor point " + required + " is not yet verified");
                }
            }
        }
        enforceSafetyConditions("verify", pointId, spec.getSafetyConditions(), acknowledged);
    }

    /**
     * Compare safety conditions case-insensitively after trimming whitespace,
     * so display drift (extra space, capitalization) doesn't block a legitimate ack.
     */
    private void enforceSafetyConditions(String op, Long pointId,
                                         java.util.List<String> required, java.util.List<String> acknowledged) {
        if (required == null || required.isEmpty()) return;
        java.util.Set<String> ackSet = new java.util.HashSet<>();
        if (acknowledged != null) {
            for (String c : acknowledged) {
                if (c != null) ackSet.add(c.trim().toLowerCase(java.util.Locale.ROOT));
            }
        }
        for (String cond : required) {
            if (cond == null) continue;
            String key = cond.trim().toLowerCase(java.util.Locale.ROOT);
            if (key.isEmpty()) continue;
            if (!ackSet.contains(key)) {
                throw new IllegalStateException(
                        "Cannot " + op + " point " + pointId + " — safety condition not acknowledged: \"" + cond + "\"");
            }
        }
    }

    /**
     * Aggregate the set of pointIds that have been marked hung (or verified) across the
     * latest snapshot of this LOTO.
     */
    private java.util.Set<Long> aggregatePointKeys(Loto loto, boolean hung) {
        LotoSnapshot latest = loto.getLatestSnapshot();
        if (latest == null) return java.util.Collections.emptySet();
        return (hung ? latest.getPointHungBy() : latest.getPointVerifiedBy()).keySet();
    }

    /**
     * Replace the per-point prerequisites map on the latest snapshot for this LOTO instance.
     * The instance's prerequisites are independent of the source LotoStandard's after creation.
     */
    @Transactional
    public LotoDto updateInstancePrerequisites(Long lotoId,
                                               java.util.Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> prerequisites) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        LotoSnapshot latest = loto.getLatestSnapshot();
        // Normalize safety-condition strings: trim + drop blanks. Match what the UI sends.
        java.util.Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> normalized = new java.util.HashMap<>();
        if (prerequisites != null) {
            for (var entry : prerequisites.entrySet()) {
                var spec = entry.getValue();
                if (spec == null) continue;
                java.util.List<String> conds = (spec.getSafetyConditions() == null
                        ? java.util.Collections.<String>emptyList()
                        : spec.getSafetyConditions()).stream()
                            .map(c -> c == null ? "" : c.trim())
                            .filter(c -> !c.isEmpty())
                            .toList();
                java.util.List<Long> reqs = spec.getRequiredPointIds() == null
                        ? java.util.Collections.emptyList() : spec.getRequiredPointIds();
                var normalizedSpec = new com.dk_power.power_plant_java.entities.loto.PointPrerequisite(
                        new java.util.ArrayList<>(reqs), new java.util.ArrayList<>(conds),
                        spec.getInstallNotes(), spec.getRemovalNotes(), spec.getRemovalOrder());
                normalized.put(entry.getKey(), normalizedSpec);
            }
        }
        latest.setPointPrerequisites(normalized);
        lotoSnapshotRepo.save(latest);
        flagIfActiveModification(loto);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markVerified(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Mark verified (aggregate)", "Building");
        java.util.Set<Long> requiredPointIds = loto.getLotoPointDtos().stream()
                .map(p -> p.getId()).filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        java.util.Set<Long> verifiedPointIds = aggregatePointKeys(loto, false);
        if (!verifiedPointIds.containsAll(requiredPointIds)) {
            throw new IllegalStateException("All LOTO points must be marked verified before the LOTO can be signed as verified");
        }
        LotoSnapshot s = loto.recordVerified(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto transferRequestor(Long lotoId, String fromUser, String toUser) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Transfer requestor", "Building", "Active", "Test");
        if (toUser == null || toUser.isBlank()) {
            throw new IllegalArgumentException("Transfer requires a target user (toUser)");
        }
        String resolvedFrom = (fromUser != null && !fromUser.isBlank()) ? fromUser : loto.getLotoRequestor();
        LotoSnapshot s = loto.recordTransferred(resolvedFrom, toUser);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto acceptRequestor(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Accept requestor transfer", "Building", "Active", "Test");
        LotoSnapshot s = loto.recordAccepted(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto releaseByRequestor(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Requestor release", "Building", "Active", "Test");
        LotoSnapshot s = loto.recordRequestorReleased(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto releaseByControlAuthority(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Control Authority release", "Building", "Active", "Test");
        LotoSnapshot s = loto.recordControlAuthorityReleased(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto removeLocks(Long lotoId) {
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Remove locks", "Active", "Test");
        LotoSnapshot s = loto.recordLocksRemoved(currentUserName());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    private void validateStatusTransition(String current, String target) {
        if (target == null) throw new IllegalArgumentException("Target status cannot be null");
        Set<String> allowed = switch (current != null ? current : "") {
            case "Building" -> Set.of("Active", "Closed");
            case "Active" -> Set.of("Test", "Closed");
            case "Test" -> Set.of("Active", "Closed");
            case "Closed" -> Set.of();
            default -> Set.of("Active", "Building", "Closed");
        };
        if (!allowed.contains(target)) {
            throw new IllegalArgumentException("Invalid status transition: " + (current != null ? current : "null") + " → " + target);
        }
    }

    @Transactional
    public LotoDto signOnPerson(Long lotoId, PersonnelSignEntry entry) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        entry.setSignOnTime(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        List<PersonnelSignEntry> personnel = loto.getPersonnel();
        personnel.add(entry);
        loto.setPersonnel(personnel);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto signOffPerson(Long lotoId, String personName, String comments) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        boolean found = loto.signOffPerson(personName, null, comments);
        if (!found) throw new EntityNotFoundException("No active sign-on found for: " + personName);
        return toDto(repo.save(loto));
    }

    public List<PersonnelSignEntry> getPersonnel(Long lotoId) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        return loto.getPersonnel();
    }

    @Transactional
    public LotoDto assignLocksToPoints(Long lotoId, List<Map<String, Object>> lockAssignments) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        for (Map<String, Object> assignment : lockAssignments) {
            Long pointId = Long.valueOf(assignment.get("lotoPointId").toString());
            String tagLabel = assignment.get("tagLabel") != null ? assignment.get("tagLabel").toString() : null;
            String lockType = assignment.get("lockType") != null ? assignment.get("lockType").toString() : "LOCK";
            Integer lockNumber = assignment.get("lockNumber") != null
                    ? Integer.valueOf(assignment.get("lockNumber").toString()) : null;

            Lock lock = loto.getLocks() != null
                    ? loto.getLocks().stream()
                        .filter(l -> pointId.equals(l.getAssignedLotoPointId()))
                        .findFirst().orElse(null)
                    : null;

            if (lock == null) {
                lock = new Lock();
                lock.setLoto(loto);
            }
            lock.setAssignedLotoPointId(pointId);
            lock.setTagLabel(tagLabel);
            lock.setLockType(lockType);
            if (lockNumber != null) lock.setNumber(lockNumber);
            lockService.save(lock);
        }

        flagIfActiveModification(loto);
        repo.save(loto);
        return toDto(repo.findById(lotoId).orElseThrow());
    }

    /*********************************************************************************************************************
     * LOTO USAGE MONITOR
     ******************************************************************************************************************/

    /**
     * Returns all active LOTOs with their associated jobs and foremen.
     * Used by the LOTO Usage Monitor table to help foremen see what to sign on to
     * and operators see if a LOTO is no longer needed (no associated jobs).
     */
    public List<Map<String, Object>> getLotoUsageMonitor() {
        List<Map<String, Object>> result = new ArrayList<>();

        // Get all LOTOs that are not closed
        List<Loto> activeLots = repo.findAll().stream()
                .filter(loto -> {
                    String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
                    return status != null && !"Closed".equals(status);
                })
                .toList();

        // Get all open jobs with their LOTOs
        List<com.dk_power.power_plant_java.entities.permits.JobLog> openJobs = jobLogRepo.findAllOpenJobs();

        for (Loto loto : activeLots) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", loto.getId());
            row.put("boxNumber", loto.getBoxNumber());
            row.put("permitNumber", loto.getPermitNumber());
            row.put("name", loto.getName());
            row.put("workScope", loto.getWorkScope());
            row.put("equipmentSystem", loto.getEquipmentSystem());
            row.put("status", loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null);
            row.put("pointCount", loto.getLotoPointDtos() != null ? loto.getLotoPointDtos().size() : 0);
            row.put("lockCount", loto.getLocks() != null ? loto.getLocks().size() : 0);

            // Find associated jobs
            List<Map<String, Object>> associatedJobs = new ArrayList<>();
            for (var job : openJobs) {
                if (job.getLotos() != null && job.getLotos().contains(loto)) {
                    Map<String, Object> jobInfo = new LinkedHashMap<>();
                    jobInfo.put("jobId", job.getId());
                    jobInfo.put("permitNumber", job.getPermitNumber());
                    jobInfo.put("foreman", job.getForeman());
                    jobInfo.put("company", job.getCompany());
                    jobInfo.put("workScope", job.getWorkScope());
                    associatedJobs.add(jobInfo);
                }
            }
            row.put("associatedJobs", associatedJobs);

            // Extract foremen names
            List<String> foremen = associatedJobs.stream()
                    .map(j -> (String) j.get("foreman"))
                    .filter(f -> f != null && !f.isEmpty())
                    .distinct()
                    .toList();
            row.put("foremen", foremen);
            row.put("jobCount", associatedJobs.size());
            row.put("hasNoJobs", associatedJobs.isEmpty());

            result.add(row);
        }

        return result;
    }

    /**
     * Activate all LOTOs that have no status or are in Building status.
     * Sets their permitStatus to "Active" and updates box LED color.
     */
    @Transactional
    public String activateAllLotos() {
        List<Loto> allLotos = repo.findAll();
        int activated = 0;

        for (Loto loto : allLotos) {
            String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
            if (status == null || status.isEmpty() || "Building".equals(status)) {
                loto.setPermitStatus(ngValueService.createValue("Permit Status", "Active"));
                repo.save(loto);

                if (loto.getLotoBox() != null) {
                    lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), "Active");
                }
                activated++;
            }
        }

        return "Activated " + activated + " LOTOs";
    }
}
