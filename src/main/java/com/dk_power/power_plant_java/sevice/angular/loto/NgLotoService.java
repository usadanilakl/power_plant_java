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
import com.dk_power.power_plant_java.sevice.angular.permits.PermitNumberGenerator;
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
    private final com.dk_power.power_plant_java.repository.users.UserRepo userRepo;
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
    private final PermitNumberGenerator permitNumberGenerator;

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
        // Never MANUFACTURE a snapshot here. getLatestSnapshot() creates one when the set is empty, and the sync apply
        // saves the Loto BEFORE its LotoSnapshots have been applied — so this used to persist an empty phantom snapshot
        // (dateCreated = now(), zero points) that then won max(dateCreated) and hid the permit's real LOTO points.
        // Only persist a snapshot that genuinely exists.
        LotoSnapshot latest = entity.getSnapshots() == null || entity.getSnapshots().isEmpty()
                ? null : entity.getLatestSnapshot();
        if (latest != null) lotoSnapshotRepo.save(latest);
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

    /**
     * Update + convert inside one tx. The controller used to call update() then
     * toDto() as separate calls — the second call ran in a fresh tx with the
     * entity already detached, triggering LazyInit on locks/snapshots. Keep
     * both inside the same persistence context.
     */
    @Transactional
    public LotoDto updateAndConvert(LotoIdDto dto) {
        return toDto(update(dto));
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
        // Add/remove/reorder reshape the permit. Only CA may do this, and only when
        // the permit is structurally editable: Building (first build) or Modification
        // (after the permit went Active and was paused for changes). Test is a
        // pause-for-rehang, not a modification — adding/removing during Test is forbidden
        // (loto-procedure.md §4.2).
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStructurallyEditable(loto, "Add point to LOTO");

        LotoPoint point = lotoPointService.findById(pointId)
               .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + pointId));

        loto.addLotoPoint(lotoPointService.toIdDto(point));
        // Points added during Modification go through the re-hang flow before re-activation.
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Modification".equals(status)) {
            loto.getLatestSnapshot().flagNeedsRehang(pointId);
        }
        flagIfModificationStructuralEdit(loto);

        return toDto(save(loto));
    }

    private LotoPointIdDto toIdDto(LotoPoint point) {
        return this.mapper.toIdDto(point);
    }

    public LotoDto removeLotoPointFromLoto(Long pointId, Long lotoId) {
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStructurallyEditable(loto, "Remove point from LOTO");
        loto.removeLotoPoint(pointId);
        flagIfModificationStructuralEdit(loto);
        return toDto(save(loto));
    }

    /**
     * Reject when permit is not in a state that allows structural edits
     * (add/remove/reorder of points). Active permits are immutable; Test is a
     * pause-for-rehang, not a modification window; Closed is terminal.
     */
    private void requireStructurallyEditable(Loto loto, String operation) {
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if (!"Building".equals(status) && !"Modification".equals(status)) {
            throw new IllegalStateException(operation + " not allowed in status " + status
                    + " (only Building or Modification permits structural edits)");
        }
    }

    /**
     * Flip {@code wasModifiedDuringActive} when an actual point add/remove happens during
     * Modification. Only Modification flips this flag — Test pulls existing points for
     * re-hang without touching the point list, so the permit hasn't been *modified* in
     * the sense the close-time disposition cares about.
     */
    private void flagIfModificationStructuralEdit(Loto loto) {
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Modification".equals(status)) {
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
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = getEntityById(currentLotoId);
        if(loto == null) {
            throw new EntityNotFoundException("Loto not found");
        }
        requireStructurallyEditable(loto, "Reorder LOTO points");
        loto.reorderLotoPoints(lotoPoints);
        flagIfModificationStructuralEdit(loto);
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
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        // PESSIMISTIC_WRITE lock: pairs with the same lock in
        // NgLotoStandardService.deleteStandard. Without it, this transaction
        // can read a stale deleted=false snapshot and save a permit whose
        // sourceStandard is soft-deleted by the time this commits — the
        // operator would then see the permit reference a "(deleted)"
        // standard on every subsequent load. The lock serializes so the
        // deleted check below is authoritative.
        LotoStandard standard = lotoStandardRepo.findByIdForUpdate(standardId)
                .orElseThrow(() -> new EntityNotFoundException("LotoStandard not found with id: " + standardId));
        if (Boolean.TRUE.equals(standard.getDeleted())) {
            throw new IllegalStateException(
                    "Cannot create a permit from a deleted LOTO Standard (id " + standardId + ").");
        }

        Loto loto = new Loto();
        if (permitData != null) mapper.updateLotoFromDto(permitData, loto);
        loto.setSourceStandard(standard);
        loto.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        // Generate permit number BEFORE the first repo.save so we don't need a
        // second save that would call merge() — merge returns a new managed
        // instance and orphans the snapshot's loto reference, producing a
        // snapshot row with loto_id=null and an NPE at DTO conversion time.
        if (loto.getPermitNumber() == null || loto.getPermitNumber().isEmpty()) {
            loto.setPermitNumber(permitNumberGenerator.generate(loto.getDate()));
        }

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

        // Also stamp the order on the Loto entity itself so Loto.getLotoPoints() can
        // sort deterministically without needing to reach into the snapshot's JSON.
        // Historically only the snapshot got this — Loto.lotoPointOrder was left null,
        // and getLotoPointOrderMap() fell back to iterating the transient HashSet, which
        // is what shuffles the hang list on every "Mark Hung" round-trip.
        loto.setLotoPointOrder(standard.getLotoPointOrder());

        // Copy point prerequisites from standard so the instance has its own editable copy
        snapshot.setPointPrerequisites(standard.getPointPrerequisites());
        // Capture removal direction policy at flip time — used by per-point removal enforcement
        snapshot.setRemovalReversesInstallOrder(standard.isRemovalReversesInstallOrder());

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
        // See createFromStandard: number generation must precede the first
        // save so we only save the Loto once. Two saves detach the snapshot's
        // loto reference and produce loto_id=null on insert.
        if (loto.getPermitNumber() == null || loto.getPermitNumber().isEmpty()) {
            loto.setPermitNumber(permitNumberGenerator.generate(loto.getDate()));
        }

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
        // Status transitions (Active, Test, Modification, Closed) are CA-only.
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        String currentStatus = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        validateStatusTransition(currentStatus, newStatus);
        String user = currentUserName();

        switch (newStatus) {
            case "Active" -> {
                // First Activation (Building → Active) requires CA Activation signature.
                // Re-Activation (Test/Modification → Active) requires all needsRehang cleared
                // and all points hung + verified.
                if ("Test".equals(currentStatus) || "Modification".equals(currentStatus)) {
                    LotoSnapshot latest = loto.getLatestSnapshot();
                    java.util.Set<Long> stillNeed = latest.getPointNeedsRehang();
                    if (!stillNeed.isEmpty()) {
                        throw new IllegalStateException(
                                "Cannot re-activate: " + stillNeed.size() + " point(s) still need re-hanging");
                    }
                    // Verify every current point has been re-hung + re-verified
                    java.util.Set<Long> pointIds = new java.util.HashSet<>();
                    for (var p : latest.getLotoPointDtos()) {
                        if (p != null && p.getId() != null) pointIds.add(p.getId());
                    }
                    if (!latest.getPointHungBy().keySet().containsAll(pointIds)) {
                        throw new IllegalStateException("Cannot re-activate: not all points are hung");
                    }
                    if (!latest.getPointVerifiedBy().keySet().containsAll(pointIds)) {
                        throw new IllegalStateException("Cannot re-activate: not all points are verified");
                    }
                } else {
                    boolean caActivated = loto.getSnapshots().stream().anyMatch(sn -> sn.getCaActivatedBy() != null);
                    if (!caActivated) {
                        throw new IllegalStateException("Control Authority must Activate the LOTO before it can be marked Active");
                    }
                    // Defense-in-depth: re-derive completeness in case a point was added or unmarked
                    // between CA activation and this Building → Active flip (caActivatedBy stays set).
                    LotoSnapshot latest = loto.getLatestSnapshot();
                    java.util.Set<Long> pointIds = new java.util.HashSet<>();
                    for (var p : latest.getLotoPointDtos()) { if (p != null && p.getId() != null) pointIds.add(p.getId()); }
                    if (!latest.getPointHungBy().keySet().containsAll(pointIds)
                            || !latest.getPointVerifiedBy().keySet().containsAll(pointIds)) {
                        throw new IllegalStateException("Cannot activate: every point must be hung and independently verified");
                    }
                }
                LotoSnapshot latest = loto.getLatestSnapshot();
                latest.setPersonnelSnapshot(loto.getPersonnelJson());
                if ("Test".equals(currentStatus) || "Modification".equals(currentStatus)) {
                    latest.setSnapshotReason("Re-Activated from " + currentStatus);
                    LotoSnapshot recorded = loto.recordReactivated(user);
                    lotoSnapshotRepo.save(recorded);
                } else {
                    // No separate "activatedBy" record — CA Activated (caActivatedBy)
                    // is the canonical authorization event; the status flip itself
                    // doesn't need a separate signer.
                    latest.setSnapshotReason("Activated");
                }
                lotoSnapshotRepo.save(latest);
            }
            case "Test", "Modification" -> {
                // Pre-flight: everyone must be signed off before entering Test or Modification.
                java.util.List<PersonnelSignEntry> stillOn = loto.getSignedOnPersonnel();
                if (!stillOn.isEmpty()) {
                    throw new IllegalStateException(
                            "Cannot enter " + newStatus + ": " + stillOn.size() + " worker(s) still signed on (" +
                            stillOn.stream().map(PersonnelSignEntry::getPersonName).reduce((a, b) -> a + ", " + b).orElse("") + ")");
                }
                LotoSnapshot latest = loto.getLatestSnapshot();
                try {
                    LotoSnapshot pauseSnapshot = (LotoSnapshot) latest.clone();
                    pauseSnapshot.setId(null);
                    pauseSnapshot.setDateCreated(java.time.LocalDateTime.now());
                    pauseSnapshot.setLoto(loto);
                    pauseSnapshot.clearLifecycleEventFields();
                    pauseSnapshot.setSnapshotReason(newStatus + " Started");
                    if ("Test".equals(newStatus)) {
                        pauseSnapshot.setTestStartedBy(user);
                        pauseSnapshot.setTestStartedAt(java.time.LocalDateTime.now());
                    }
                    loto.getSnapshots().add(pauseSnapshot);
                    lotoSnapshotRepo.save(pauseSnapshot);
                } catch (CloneNotSupportedException e) {
                    throw new RuntimeException("Failed to clone snapshot for " + newStatus, e);
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
     * Audit-friendly actor string. For ordinary requests this is just the
     * authenticated user's name (their email under our Spring config). For
     * step-up'd requests the StepUpAuthFilter has put {@code stepUpActor} and
     * {@code stepUpSessionHolder} on the request, and we suffix the actor with
     * {@code " via:<sessionHolder>"} so a hanger can't pretend to be the
     * verifier just because the verifier signed on their device — both names
     * appear in the audit field.
     */
    private String currentAuditActor() {
        String actor = currentUserName();
        try {
            var attrs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes sra) {
                var req = sra.getRequest();
                Object holder = req.getAttribute("stepUpSessionHolder");
                if (holder instanceof String s && !s.isBlank() && !s.equals(actor)) {
                    return actor + " via:" + s;
                }
            }
        } catch (Exception ignored) { /* fall through */ }
        return actor;
    }

    /**
     * Resolves the signed-in user from the Spring SecurityContext. Returns null
     * if the request is unauthenticated. Spring's principal username is the
     * user's email (see CustomUserDetails) — never the `username` column — so
     * we look up by id from CustomUserDetails first, then fall back to email.
     */
    private com.dk_power.power_plant_java.entities.users.User currentUser() {
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            Object principal = auth.getPrincipal();
            if (principal instanceof com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails details) {
                return userRepo.findById(details.getId()).orElse(null);
            }
            String name = auth.getName();
            if (name == null || "anonymousUser".equalsIgnoreCase(name) || "anonymous".equalsIgnoreCase(name)) {
                return null;
            }
            // Last-resort fallbacks (filter-based auth paths)
            com.dk_power.power_plant_java.entities.users.User u = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(name);
            if (u == null) u = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(name);
            return u;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Throws if the authenticated user has none of the supplied LOTO roles. Legacy
     * role names (QUALIFIED, AUTHORIZED) are accepted as aliases for the new ones.
     */
    @SuppressWarnings("deprecation")
    private void requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole... roles) {
        com.dk_power.power_plant_java.entities.users.User user = currentUser();
        if (user == null) {
            throw new SecurityException("Authentication required");
        }
        for (var r : roles) {
            if (user.hasLotoRole(r)) return;
            if (r == com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY
                    && user.hasLotoRole(com.dk_power.power_plant_java.entities.users.LotoRole.QUALIFIED)) return;
            if (r == com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED
                    && user.hasLotoRole(com.dk_power.power_plant_java.entities.users.LotoRole.AUTHORIZED)) return;
        }
        String names = java.util.Arrays.stream(roles)
                .map(com.dk_power.power_plant_java.entities.users.LotoRole::roleName)
                .reduce((a,b) -> a + " | " + b).orElse("");
        throw new SecurityException("Requires LOTO role: " + names);
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
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "CA approval for hanging", "Building");
        LotoSnapshot s = loto.recordCaApprovedForHanging(currentAuditActor());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto caActivate(Long lotoId) {
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "CA activation", "Building");
        // Guard: every CURRENT point must be hung AND independently verified before CA can activate.
        // The aggregate hungBy/verifiedBy stamps alone are not sufficient — a point can be added or
        // unmarked in Building after "Hanging Complete"/"Verified Complete" were signed, and those
        // stamps would still read true. Re-derive completeness from the live point set.
        java.util.Set<Long> currentPointIds = loto.getLotoPointDtos().stream()
                .map(LotoPointIdDto::getId).filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        boolean hung = loto.getSnapshots().stream().anyMatch(sn -> sn.getHungBy() != null)
                && aggregatePointKeys(loto, true).containsAll(currentPointIds);
        boolean verified = loto.getSnapshots().stream().anyMatch(sn -> sn.getVerifiedBy() != null)
                && aggregatePointKeys(loto, false).containsAll(currentPointIds);
        if (!hung || !verified) {
            throw new IllegalStateException("Every LOTO point must be hung AND independently verified before Control Authority can activate it");
        }
        LotoSnapshot s = loto.recordCaActivated(currentAuditActor());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markHung(Long lotoId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
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
        // Guard: signer must be one of the people who actually hung points.
        LotoSnapshot latest = loto.getLatestSnapshot();
        java.util.Set<String> hangers = new java.util.HashSet<>(latest.getPointHungBy().values());
        String me = currentUserName();
        if (!hangers.contains(me)) {
            throw new IllegalStateException(
                    "Only a user who hung at least one point can sign the LOTO as hung");
        }
        // SoD check uses plain actor; audit field captures dual attribution (via:sessionHolder).
        LotoSnapshot s = loto.recordHung(currentAuditActor());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markPointHung(Long lotoId, Long pointId, java.util.List<String> acknowledgedSafetyConditions, String notes) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requirePerPointHangVerifyStatus(loto, "Mark point hung", pointId);
        // CA must approve the LOTO for hanging before any point is hung (Building initial build).
        // Mod/Test re-hangs run against a cloned snapshot whose approval stamp was cleared on clone,
        // and are instead gated by the needs-rehang check in requirePerPointHangVerifyStatus above.
        String hangStatus = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Building".equals(hangStatus)
                && loto.getSnapshots().stream().noneMatch(sn -> sn.getCaApprovedForHangingBy() != null)) {
            throw new IllegalStateException("Control Authority must approve the LOTO for hanging before points can be hung");
        }
        LotoSnapshot latest = loto.getLatestSnapshot();
        enforcePrerequisitesForHang(loto, latest, pointId, acknowledgedSafetyConditions);
        LotoSnapshot s = loto.markPointHung(pointId, currentUserName(), notes);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    /**
     * Per-point hang/verify is allowed during Building (initial build) OR during
     * Modification / Test when the point is flagged needsRehang (resume flow).
     */
    private void requirePerPointHangVerifyStatus(Loto loto, String op, Long pointId) {
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Building".equals(status)) return;
        if ("Modification".equals(status) || "Test".equals(status)) {
            LotoSnapshot latest = loto.getLatestSnapshot();
            if (latest != null && latest.isNeedsRehang(pointId)) return;
            throw new IllegalStateException(
                    op + " during " + status + " is only allowed for points flagged needs-rehang");
        }
        throw new IllegalStateException(op + " not allowed in status: " + status);
    }

    @Transactional
    public LotoDto unmarkPointHung(Long lotoId, Long pointId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requirePerPointHangVerifyStatus(loto, "Unmark point hung", pointId);
        LotoSnapshot latest = loto.getLatestSnapshot();
        // Reject if any successor still depends on this hang
        for (java.util.Map.Entry<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> e
                : latest.getPointPrerequisites().entrySet()) {
            if (e.getKey().equals(pointId)) continue;
            if (e.getValue() == null || e.getValue().getInstallRequiredPointIds() == null) continue;
            if (!e.getValue().getInstallRequiredPointIds().contains(pointId)) continue;
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
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requirePerPointHangVerifyStatus(loto, "Mark point verified", pointId);
        LotoSnapshot latest = loto.getLatestSnapshot();
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Building".equals(status)) {
            boolean hangingComplete = loto.getSnapshots().stream().anyMatch(sn -> sn.getHungBy() != null);
            if (!hangingComplete) {
                throw new IllegalStateException("Cannot verify points until 'Hanging Complete' is signed by one of the hangers");
            }
        }
        // A point may only be verified if it is itself currently hung — enforced in EVERY status.
        // Building: catches a point added or unmarked after the aggregate "Hanging Complete" sign-off,
        // whose stamp would otherwise let an un-hung point be "verified" with no second-person check.
        // Mod/Test: the re-hang flow requires the affected point to be re-hung first.
        if (!latest.getPointHungBy().containsKey(pointId)) {
            throw new IllegalStateException("Cannot verify point " + pointId + " — it must be hung first");
        }
        enforcePrerequisitesForVerify(loto, latest, pointId, acknowledgedSafetyConditions);
        // Second-person rule: the user who hung this point cannot verify it.
        String hungBy = latest.getPointHungBy().get(pointId);
        String me = currentUserName();
        if (hungBy != null && hungBy.equals(me)) {
            throw new IllegalStateException("Cannot verify a point you hung yourself");
        }
        LotoSnapshot s = loto.markPointVerified(pointId, me, notes);
        // Re-hang flow: verifying the re-hung point clears the rehang flag for that point.
        s.clearNeedsRehang(pointId);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto unmarkPointVerified(Long lotoId, Long pointId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requirePerPointHangVerifyStatus(loto, "Unmark point verified", pointId);
        LotoSnapshot s = loto.unmarkPointVerified(pointId);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markPointWalkdown(Long lotoId, Long pointId, String notes) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        // Walkdown is a post-verified action; Test/Modification re-hangs may need to
        // re-walk a point too (loto-procedure.md §5.3).
        requireStatusOneOf(loto, "Mark point walkdown", "Building", "Test", "Modification");
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
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Unmark point walkdown", "Building", "Test", "Modification");
        LotoSnapshot s = loto.unmarkPointWalkdown(pointId);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    // ── Per-point removal (post CA-release) ───────────────────────────────────

    /**
     * Gate for per-point removal operations. Removal is allowed when CA has released
     * the LOTO (controlAuthorityReleasedBy set on any snapshot) and the LOTO isn't Closed
     * and no personnel are still signed on. The personnel check is the safety-critical
     * one — removing isolation while a worker is still on the permit is the canonical
     * LOTO failure mode (loto-procedure.md §5.4).
     */
    private void requireCaReleasedAndOpen(Loto loto, String operation) {
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Closed".equals(status)) {
            throw new IllegalStateException(operation + " not allowed: LOTO is Closed");
        }
        boolean caReleased = loto.getSnapshots() != null && loto.getSnapshots().stream()
                .anyMatch(sn -> sn.getControlAuthorityReleasedBy() != null);
        if (!caReleased) {
            throw new IllegalStateException(operation + " not allowed: Control Authority has not released the LOTO");
        }
        java.util.List<PersonnelSignEntry> stillOn = loto.getSignedOnPersonnel();
        if (stillOn != null && !stillOn.isEmpty()) {
            throw new IllegalStateException(operation + " not allowed: "
                    + stillOn.size() + " worker(s) still signed on (" +
                    stillOn.stream().map(PersonnelSignEntry::getPersonName).reduce((a, b) -> a + ", " + b).orElse("")
                    + ")");
        }
    }

    @Transactional
    public LotoDto markPointRemoved(Long lotoId, Long pointId, java.util.List<String> acknowledgedSafetyConditions, String notes) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireCaReleasedAndOpen(loto, "Mark point removed");
        LotoSnapshot latest = loto.getLatestSnapshot();
        enforcePrerequisitesForRemove(latest, pointId, acknowledgedSafetyConditions);
        LotoSnapshot s = loto.markPointRemoved(pointId, currentUserName(), notes);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto unmarkPointRemoved(Long lotoId, Long pointId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireCaReleasedAndOpen(loto, "Unmark point removed");
        LotoSnapshot latest = loto.getLatestSnapshot();
        // Reject if any successor (point that lists this one as a removal predecessor) is already removed.
        java.util.Set<Long> alreadyRemoved = latest.getPointRemovedBy().keySet();
        for (var p : latest.getLotoPointDtos()) {
            if (p == null || p.getId() == null || p.getId().equals(pointId)) continue;
            if (!alreadyRemoved.contains(p.getId())) continue;
            java.util.List<Long> preds = latest.effectiveRemovalPredecessors(p.getId());
            if (preds != null && preds.contains(pointId)) {
                throw new IllegalStateException(
                        "Cannot undo removal of point " + pointId + " — point " + p.getId() + " was removed after it");
            }
        }
        LotoSnapshot s = loto.unmarkPointRemoved(pointId);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    /**
     * Test-mode action: pull a point for testing. Marks it needsRehang and clears its
     * hung/verified state for the current snapshot. Caller must be authenticated; no
     * role check (operators do this).
     */
    @Transactional
    public LotoDto pullPointForTest(Long lotoId, Long pointId, String reason) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if (!"Test".equals(status) && !"Modification".equals(status)) {
            throw new IllegalStateException("Pull-for-test requires Test or Modification status (current: " + status + ")");
        }
        LotoSnapshot latest = loto.getLatestSnapshot();
        // Use lifecycleSnapshot via Loto helper to write to the current mutable snapshot
        latest.flagNeedsRehang(pointId);
        latest.clearPointHung(pointId);
        latest.clearPointVerified(pointId);
        // Stash reason as the new install note for the operator to see (optional — passthrough field).
        // Not modifying prereqs; reason just appears in a future "rehang reason" log if needed.
        lotoSnapshotRepo.save(latest);
        return toDto(repo.save(loto));
    }

    /** Predecessor + safety enforcement for per-point removal. Mirrors hang/verify gates. */
    private void enforcePrerequisitesForRemove(LotoSnapshot latest, Long pointId, java.util.List<String> acknowledged) {
        java.util.List<Long> preds = latest.effectiveRemovalPredecessors(pointId);
        java.util.Set<Long> alreadyRemoved = latest.getPointRemovedBy().keySet();
        if (preds != null) {
            for (Long required : preds) {
                if (!alreadyRemoved.contains(required)) {
                    throw new IllegalStateException(
                            "Cannot remove point " + pointId + " — required predecessor point " + required + " is not yet removed");
                }
            }
        }
        enforceSafetyConditions("remove", pointId, latest.effectiveRemovalSafetyConditions(pointId), acknowledged);
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
        if (spec.getInstallRequiredPointIds() != null) {
            for (Long required : spec.getInstallRequiredPointIds()) {
                if (!alreadyHung.contains(required)) {
                    throw new IllegalStateException(
                            "Cannot hang point " + pointId + " — required predecessor point " + required + " is not yet hung");
                }
            }
        }
        enforceSafetyConditions("hang", pointId, spec.getInstallSafetyConditions(), acknowledged);
    }

    /**
     * Verify follows the same prerequisite rules: predecessor points must be verified,
     * and verify-time safety conditions (same list) must be acknowledged.
     */
    private void enforcePrerequisitesForVerify(Loto loto, LotoSnapshot latest, Long pointId, java.util.List<String> acknowledged) {
        com.dk_power.power_plant_java.entities.loto.PointPrerequisite spec =
                latest.getPointPrerequisites().get(pointId);
        if (spec == null) return;

        // Verification is ORDER-DEVIATABLE by design: every point must be verified, but a verifier may take them in
        // any order (unlike hanging, which is locked to the predecessor DAG). So we deliberately do NOT require the
        // predecessor points to be verified first — we only enforce the point's own safety conditions. The all-points-
        // hung gate and the hanger≠verifier separation-of-duty rule are enforced by the caller (markPointVerified).
        enforceSafetyConditions("verify", pointId, spec.getInstallSafetyConditions(), acknowledged);
    }

    /**
     * Compare safety conditions case-insensitively after trimming whitespace,
     * so display drift (extra space, capitalization) doesn't block a legitimate ack.
     */
    private static java.util.List<String> trimAndDropBlanks(java.util.List<String> in) {
        if (in == null) return java.util.Collections.emptyList();
        return in.stream()
                .map(c -> c == null ? "" : c.trim())
                .filter(c -> !c.isEmpty())
                .toList();
    }

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
                java.util.List<String> installConds = trimAndDropBlanks(spec.getInstallSafetyConditions());
                java.util.List<String> removalConds = trimAndDropBlanks(spec.getRemovalSafetyConditions());
                java.util.List<Long> installReqs = spec.getInstallRequiredPointIds() == null
                        ? java.util.Collections.emptyList() : spec.getInstallRequiredPointIds();
                java.util.List<Long> removalReqs = spec.getRemovalRequiredPointIds() == null
                        ? java.util.Collections.emptyList() : spec.getRemovalRequiredPointIds();
                var normalizedSpec = new com.dk_power.power_plant_java.entities.loto.PointPrerequisite(
                        new java.util.ArrayList<>(installReqs),
                        new java.util.ArrayList<>(installConds),
                        spec.getInstallNotes(),
                        new java.util.ArrayList<>(removalReqs),
                        new java.util.ArrayList<>(removalConds),
                        spec.getRemovalNotes(),
                        spec.getRemovalOrder());
                normalized.put(entry.getKey(), normalizedSpec);
            }
        }
        latest.setPointPrerequisites(normalized);
        lotoSnapshotRepo.save(latest);
        flagIfModificationStructuralEdit(loto);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto markVerified(Long lotoId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.LOTO_QUALIFIED);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Mark verified (aggregate)", "Building");
        java.util.Set<Long> requiredPointIds = loto.getLotoPointDtos().stream()
                .map(p -> p.getId()).filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        java.util.Set<Long> verifiedPointIds = aggregatePointKeys(loto, false);
        if (!verifiedPointIds.containsAll(requiredPointIds)) {
            throw new IllegalStateException("All LOTO points must be marked verified before the LOTO can be signed as verified");
        }
        // Separation of duty: whoever signs the aggregate Verified must
        // themselves have verified at least one of the points. Mirrors the
        // hanger rule and prevents a third party (with the role but no actual
        // verification work) from rubber-stamping the LOTO.
        String actor = currentUserName();
        LotoSnapshot latest = loto.getLatestSnapshot();
        java.util.Collection<String> perPointVerifiers = latest != null
                ? latest.getPointVerifiedBy().values()
                : java.util.Collections.emptyList();
        if (actor == null || !perPointVerifiers.contains(actor)) {
            throw new SecurityException(
                    "Only a user who verified at least one point can sign the LOTO as Verified");
        }
        // SoD check uses plain actor; audit field captures dual attribution (via:sessionHolder).
        LotoSnapshot s = loto.recordVerified(currentAuditActor());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto transferRequestor(Long lotoId, String fromUser, String toUser) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.REQUESTOR);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Transfer requestor", "Building", "Active", "Test");
        if (toUser == null || toUser.isBlank()) {
            throw new IllegalArgumentException("Transfer requires a target user (toUser)");
        }
        // Caller must be the current requestor.
        String me = currentUserName();
        String current = loto.getLotoRequestor();
        if (current == null || !current.equals(me)) {
            throw new IllegalStateException(
                    "Only the current requestor (" + (current != null ? current : "unknown") + ") can initiate a transfer");
        }
        // Target must be in the LOTO's personnel list.
        if (loto.getPersonnel() == null
                || loto.getPersonnel().stream().noneMatch(p -> toUser.equals(p.getPersonName()))) {
            throw new IllegalArgumentException("Transfer target '" + toUser + "' is not in this LOTO's personnel list");
        }
        // Don't allow transferring to self.
        if (toUser.equals(me)) {
            throw new IllegalArgumentException("Cannot transfer the LOTO to yourself");
        }
        String resolvedFrom = (fromUser != null && !fromUser.isBlank()) ? fromUser : current;
        LotoSnapshot s = loto.recordTransferred(resolvedFrom, toUser);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    /**
     * Cancel a pending transfer. Only the current requestor (the one who initiated)
     * may cancel, and only while the transfer is still pending (no acceptedBy yet).
     */
    @Transactional
    public LotoDto cancelTransfer(Long lotoId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.REQUESTOR);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Cancel transfer", "Building", "Active", "Test");
        String me = currentUserName();
        String current = loto.getLotoRequestor();
        if (current == null || !current.equals(me)) {
            throw new IllegalStateException(
                    "Only the current requestor (" + (current != null ? current : "unknown") + ") can cancel a transfer");
        }
        // Pending = latest snapshot has transferredTo and no acceptedBy on any later snapshot.
        LotoSnapshot latest = loto.getLatestSnapshot();
        if (latest == null || latest.getTransferredTo() == null) {
            throw new IllegalStateException("No pending transfer to cancel");
        }
        if (latest.getAcceptedBy() != null) {
            throw new IllegalStateException("Transfer has already been accepted — cannot cancel");
        }
        LotoSnapshot s = loto.cancelTransfer();
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto acceptRequestor(Long lotoId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.REQUESTOR);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Accept requestor transfer", "Building", "Active", "Test");
        // Pending state lives on the latest snapshot: transferredTo set + acceptedBy still null.
        // After accept, lifecycleSnapshot() duplicates and clearLifecycleEventFields wipes
        // transferredTo on the new snapshot, so subsequent accepts have no pending to find.
        LotoSnapshot latest = loto.getLatestSnapshot();
        String pendingRecipient = latest != null ? latest.getTransferredTo() : null;
        if (pendingRecipient == null) {
            throw new IllegalStateException("No pending transfer to accept");
        }
        if (latest.getAcceptedBy() != null) {
            throw new IllegalStateException("Transfer has already been accepted");
        }
        String me = currentUserName();
        if (!pendingRecipient.equals(me)) {
            throw new IllegalStateException(
                    "Only " + pendingRecipient + " (the transfer recipient) can accept this transfer");
        }
        // recordAccepted writes both the audit field (acceptedBy = currentAuditActor() — includes
        // the "via:<sessionHolder>" suffix when step-up was used) AND flips lotoRequestor. The
        // identity stored in lotoRequestor must be the plain principal name, because every
        // subsequent gate compares it against currentUserName() (e.g. releaseByRequestor).
        LotoSnapshot s = loto.recordAccepted(currentAuditActor());
        // Override the requestor identity the entity just set to the audit string. The acceptedBy
        // audit field still carries the via:sessionHolder context for traceability.
        loto.setLotoRequestor(me);
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto releaseByRequestor(Long lotoId) {
        requireAnyRole(
                com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY,
                com.dk_power.power_plant_java.entities.users.LotoRole.REQUESTOR);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Requestor release", "Building", "Active", "Test");
        String me = currentUserName();
        String current = loto.getLotoRequestor();
        if (current == null || !current.equals(me)) {
            throw new IllegalStateException(
                    "Only the current requestor (" + (current != null ? current : "unknown") + ") can release the LOTO");
        }
        // Everyone must be signed off before requestor release.
        java.util.List<PersonnelSignEntry> stillOn = loto.getSignedOnPersonnel();
        if (!stillOn.isEmpty()) {
            throw new IllegalStateException(
                    "Cannot release: " + stillOn.size() + " worker(s) still signed on (" +
                    stillOn.stream().map(PersonnelSignEntry::getPersonName).reduce((a, b) -> a + ", " + b).orElse("") + ")");
        }
        LotoSnapshot s = loto.recordRequestorReleased(currentAuditActor());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto releaseByControlAuthority(Long lotoId) {
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Control Authority release", "Building", "Active", "Test");
        LotoSnapshot s = loto.recordControlAuthorityReleased(currentAuditActor());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto removeLocks(Long lotoId) {
        requireAnyRole(com.dk_power.power_plant_java.entities.users.LotoRole.CONTROL_AUTHORITY);
        Loto loto = repo.findById(lotoId).orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        requireStatusOneOf(loto, "Remove locks", "Active", "Test");
        LotoSnapshot s = loto.recordLocksRemoved(currentAuditActor());
        lotoSnapshotRepo.save(s);
        return toDto(repo.save(loto));
    }

    private void validateStatusTransition(String current, String target) {
        if (target == null) throw new IllegalArgumentException("Target status cannot be null");
        Set<String> allowed = switch (current != null ? current : "") {
            case "Building" -> Set.of("Active", "Closed");
            case "Active" -> Set.of("Test", "Modification", "Closed");
            case "Test" -> Set.of("Active", "Closed");
            case "Modification" -> Set.of("Active", "Closed");
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
        // Lifecycle gates: sign-on requires Active (not Test or Modification — those pauses
        // are explicit "everyone off the LOTO" phases), CA-activated, and requestor not released.
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if (!"Active".equals(status)) {
            throw new IllegalStateException("Sign-on requires the LOTO to be Active (current: " + status + ")");
        }
        boolean caActivated = loto.getSnapshots().stream().anyMatch(sn -> sn.getCaActivatedBy() != null);
        if (!caActivated) {
            throw new IllegalStateException("Sign-on requires CA Activation first");
        }
        boolean requestorReleased = loto.getSnapshots().stream().anyMatch(sn -> sn.getRequestorReleasedBy() != null);
        if (requestorReleased) {
            throw new IllegalStateException("Sign-on is closed — requestor has released the LOTO");
        }
        // Resolve name; reject duplicate open sign-ons for the same person.
        if (entry.getPersonName() == null || entry.getPersonName().isBlank()) {
            entry.setPersonName(currentUserName());
        }
        boolean alreadyOn = loto.getSignedOnPersonnel().stream()
                .anyMatch(e -> entry.getPersonName().equals(e.getPersonName()));
        if (alreadyOn) {
            throw new IllegalStateException(entry.getPersonName() + " is already signed on");
        }
        entry.setSignOnTime(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        if (entry.getPerformedBy() == null || entry.getPerformedBy().isBlank()) {
            entry.setPerformedBy(currentUserName());
        }
        List<PersonnelSignEntry> personnel = loto.getPersonnel();
        personnel.add(entry);
        loto.setPersonnel(personnel);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto signOffPerson(Long lotoId, String personName, String comments) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        if ("Closed".equals(status)) {
            throw new IllegalStateException("Cannot sign off — LOTO is Closed");
        }
        String resolved = (personName != null && !personName.isBlank()) ? personName : currentUserName();
        boolean found = loto.signOffPerson(resolved, currentUserName(), comments);
        if (!found) throw new EntityNotFoundException("No active sign-on found for: " + resolved);
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

        flagIfModificationStructuralEdit(loto);
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

}
