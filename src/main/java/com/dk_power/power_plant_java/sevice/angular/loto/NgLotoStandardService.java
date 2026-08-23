package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.CounterpartStandardPreviewDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.loto.LotoStandardApprovalEvent;
import com.dk_power.power_plant_java.entities.loto.LotoStandardPendingChange;
import com.dk_power.power_plant_java.entities.loto.LotoStandardStatus;
import com.dk_power.power_plant_java.entities.users.LotoRole;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.permits.LotoStandardMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardApprovalEventRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardPendingChangeRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class NgLotoStandardService implements NgCrudService<LotoStandard, LotoStandardDto, LotoStandardRepo, LotoStandardMapper> {
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoStandardMapper lotoStandardMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final NgLotoPointService ngLotoPointService;
    private final LotoStandardApprovalEventRepo approvalEventRepo;
    private final LotoStandardPendingChangeRepo pendingChangeRepo;
    private final NgValueService ngValueService;
    private final UserRepo userRepo;
    private final ObjectMapper objectMapper;
    // Delete-cascade dependencies — used by deleteStandard() to unlink or soft-delete children.
    private final com.dk_power.power_plant_java.repository.loto.LotoRepo lotoRepo;
    private final com.dk_power.power_plant_java.repository.permits.WorkAreaRepo workAreaRepo;
    private final com.dk_power.power_plant_java.repository.loto.RedTagStandardRepo redTagStandardRepo;
    private final com.dk_power.power_plant_java.repository.loto.LotoStandardWalkdownRepo lotoStandardWalkdownRepo;

    public NgLotoStandardService(LotoStandardRepo lotoStandardRepo, LotoStandardMapper lotoStandardMapper, SessionFactory sessionFactory, EntityManager entityManager, NgLotoPointService ngLotoPointService, LotoStandardApprovalEventRepo approvalEventRepo, LotoStandardPendingChangeRepo pendingChangeRepo, NgValueService ngValueService, UserRepo userRepo, ObjectMapper objectMapper,
                                  com.dk_power.power_plant_java.repository.loto.LotoRepo lotoRepo,
                                  com.dk_power.power_plant_java.repository.permits.WorkAreaRepo workAreaRepo,
                                  com.dk_power.power_plant_java.repository.loto.RedTagStandardRepo redTagStandardRepo,
                                  com.dk_power.power_plant_java.repository.loto.LotoStandardWalkdownRepo lotoStandardWalkdownRepo) {
        this.lotoStandardRepo = lotoStandardRepo;
        this.lotoStandardMapper = lotoStandardMapper;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.ngLotoPointService = ngLotoPointService;
        this.approvalEventRepo = approvalEventRepo;
        this.pendingChangeRepo = pendingChangeRepo;
        this.ngValueService = ngValueService;
        this.userRepo = userRepo;
        this.objectMapper = objectMapper;
        this.lotoRepo = lotoRepo;
        this.workAreaRepo = workAreaRepo;
        this.redTagStandardRepo = redTagStandardRepo;
        this.lotoStandardWalkdownRepo = lotoStandardWalkdownRepo;
    }

    @Override
    public LotoStandard getEntity() {
        return new LotoStandard();
    }

    @Override
    public LotoStandardDto getDto() {
        return new LotoStandardDto();
    }

    @Override
    public LotoStandardRepo getRepo() {
        return lotoStandardRepo;
    }

    @Override
    public LotoStandardMapper getMapper() {
        return lotoStandardMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public LotoStandard toEntity(LotoStandardDto dto) {
        return lotoStandardMapper.convertToEntity(dto);
    }

    @Override
    public LotoStandardDto toDto(LotoStandard entity) {
        return lotoStandardMapper.convertToDto(entity);
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<LotoStandard> getEntityClass() {
        return LotoStandard.class;
    }

    @Override
    public List<LotoStandardDto> getAllDtos() {
        return lotoStandardRepo.findAll().stream().map(lotoStandardMapper::convertToDto).toList();
    }

    /**
     * Get LOTO standards by search criteria for export.
     * Uses the complex search without pagination to get all matching results.
     */
    public List<LotoStandard> getBySearchCriteria(SearchCriteria criteria) {
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        boolean andLogicEnabled = criteria.getColumnFilterLogic() == null ||
                !criteria.getColumnFilterLogic().values().stream().anyMatch("OR"::equalsIgnoreCase);
        Page<LotoStandard> results = complexSearchWithPagination(lotoStandardRepo, criteria, pageable, andLogicEnabled);
        return results.getContent();
    }

    /**
     * Get LOTO standards by list of IDs for export.
     */
    public List<LotoStandard> getByIds(List<Long> ids) {
        return lotoStandardRepo.findAllById(ids);
    }

    public LotoStandardDto createStandard(LotoStandardIdDto standard) {
        // Only Control Authority may build a LOTO Standard. The subsequent verify
        // step will reject the submitter as its own verifier, so gate build here to
        // keep everything downstream honest.
        requireRole(LotoRole.CONTROL_AUTHORITY);
        LotoStandard standardEntity = lotoStandardMapper.convertIdDtoToEntity(standard);
        // Initialize workflow state for new standards
        if (standardEntity.getDevelopmentStatus() == null) {
            standardEntity.setDevelopmentStatus(getOrCreateStatus(LotoStandardStatus.DRAFT));
        }
        if (standardEntity.getCurrentVersion() == null) {
            standardEntity.setCurrentVersion(1);
        }
        lotoStandardRepo.save(standardEntity);
        return lotoStandardMapper.convertToDto(standardEntity);
    }

    /**
     * Duplicate an existing LOTO Standard into a fresh independent DRAFT.
     * <p>
     * Copies the standard's own content — name (with a "(Copy)" suffix), description,
     * procedural prose (install + removal sides), removal-order flag, groups,
     * point-order map, and per-point prerequisites JSON — into a brand-new
     * {@link LotoStandard} row. The two are then completely independent for edits
     * on any of those fields.
     * <p>
     * <b>LOTO points are shared, not duplicated.</b> LotoPoint entities represent
     * physical isolation points (a specific valve, breaker, etc.); duplicating
     * them would fork the physical world. Both standards reference the same
     * points via the ManyToMany join table; adding or removing a point on the
     * copy only touches the join, not the original.
     * <p>
     * <b>Workflow state resets.</b> The copy starts in DRAFT at v1 with no
     * approval attribution, no pending-review marker, and no approval-event
     * history. The source's audit trail stays untouched.
     */
    @Transactional
    public LotoStandardDto duplicate(Long sourceId) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        LotoStandard source = lotoStandardRepo.findById(sourceId)
                .orElseThrow(() -> new EntityNotFoundException("LotoStandard not found: " + sourceId));

        LotoStandard copy = new LotoStandard();
        copy.setName(deriveCopyName(source.getName()));
        copy.setDescription(source.getDescription());

        // Procedural prose — copy verbatim. These are text fields on the standard
        // itself, not shared with any other row, so the operator can edit freely.
        copy.setInstallPrerequisitesText(source.getInstallPrerequisitesText());
        copy.setInstallHazardControlText(source.getInstallHazardControlText());
        copy.setInstallProcedureText(source.getInstallProcedureText());
        copy.setRemovalPrerequisitesText(source.getRemovalPrerequisitesText());
        copy.setRemovalHazardControlText(source.getRemovalHazardControlText());
        copy.setRemovalProcedureText(source.getRemovalProcedureText());
        copy.setRemovalReversesInstallOrder(source.isRemovalReversesInstallOrder());

        // JSON blobs — deep copy via the domain setters/getters so the copy carries
        // its own serialized string, not an alias to the source's.
        copy.setLotoPointOrder(source.getLotoPointOrder());
        copy.setPointPrerequisites(source.getPointPrerequisites());

        // Groups — categorization labels are shared references (they're Values).
        copy.setGroups(new HashSet<>(source.getGroups()));

        // LOTO points — SHARE references, so both the source and the copy
        // point at the same physical isolation points via the M2M join.
        // Adding a point on the copy only touches the join, not the original.
        //
        // IMPORTANT: use setLotoPoints against a fresh list, NOT
        // getLotoPoints().addAll(...) — getLotoPoints() returns a SORTED
        // COPY of the persistent list (see LotoStandard.getLotoPoints),
        // so addAll on it populates the throwaway copy and the persistent
        // field stays empty. This was the "duplicate ends up with no
        // points" bug — mirror of the delete-cascade gotcha we already
        // caught. lotoPointOrder was copied above, so the sorted view
        // will match the source's order on the very next read.
        copy.setLotoPoints(new java.util.ArrayList<>(source.getLotoPoints()));

        // Workflow reset — start fresh in DRAFT v1 with no attribution.
        copy.setDevelopmentStatus(getOrCreateStatus(LotoStandardStatus.DRAFT));
        copy.setCurrentVersion(1);
        copy.clearWorkflowAttribution();
        copy.setPendingReviewSince(null);

        lotoStandardRepo.save(copy);

        // Update the reverse side of the ManyToMany so LotoPoint.lotoStandards
        // includes the new standard on the in-memory graph too. Without this,
        // a subsequent read of the point's lotoStandards set would omit the
        // copy until the persistence context is refreshed.
        for (LotoPoint p : source.getLotoPoints()) {
            p.addLotoStandard(copy);
        }

        return lotoStandardMapper.convertToDto(copy);
    }

    /**
     * Compute the copy's display name. Handles chained duplicates so
     * "X" → "X (Copy)" → "X (Copy 2)" → "X (Copy 3)" etc., rather than
     * "X (Copy) (Copy)" or "X (Copy) (Copy) (Copy)".
     */
    private String deriveCopyName(String original) {
        if (original == null || original.isBlank()) return "Standard (Copy)";
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\\s*\\(Copy(?:\\s+(\\d+))?\\)\\s*$")
                .matcher(original);
        if (m.find()) {
            String base = original.substring(0, m.start()).trim();
            String nStr = m.group(1);
            int nextN = (nStr == null) ? 2 : Integer.parseInt(nStr) + 1;
            return base + " (Copy " + nextN + ")";
        }
        return original + " (Copy)";
    }


    @Transactional
    public LotoStandardDto addLotoPointToStandard(Long lotoPointId, String lotoStandardId) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        try {
            LotoStandard standard = getEntityById(lotoStandardId);
            LotoPoint lotoPoint = ngLotoPointService.getEntityById(lotoPointId);

            if (standard == null || lotoPoint == null) {
                throw new EntityNotFoundException("LotoStandard or LotoPoint not found");
            }

            if (standard.getLotoPoints().contains(lotoPoint)) {
                return toDto(standard);
            }

            if (isApproved(standard)) {
                // Propose: simulate the would-be state without mutating the standard.
                // closeReview applies KEPT proposals atomically when the review closes.
                String oldIds = standardPointIdsSnapshot(standard);
                List<Long> projected = new ArrayList<>(currentOrderedPointIds(standard));
                projected.add(lotoPointId);
                captureFieldProposal(standard, lotoPointId, "lotoPoints (add " + lotoPointId + ")",
                        oldIds, projected.toString());
                // No save() — the standard wasn't mutated.
                return toDto(standard);
            }

            standard.addLotoPoint(lotoPoint);
            lotoPoint.addLotoStandard(standard);
            Map<String, Integer> orderMap = standard.getLotoPointOrder();
            int maxOrder = orderMap.values().stream().mapToInt(Integer::intValue).max().orElse(0);
            orderMap.put(lotoPoint.getId().toString(), maxOrder + 1);
            standard.setLotoPointOrder(orderMap);
            return toDto(save(standard));
        } catch (Exception e) {
            throw new RuntimeException("Error adding LotoPoint to LotoStandard: " + e.getMessage(), e);
        }
    }

    @Transactional
    public LotoStandardDto removeLotoPointToStandard(Long lotoPointId, String lotoStandardId) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        try {
            LotoStandard standard = getEntityById(lotoStandardId);
            LotoPoint lotoPoint = ngLotoPointService.getEntityById(lotoPointId);

            if (standard == null || lotoPoint == null) {
                throw new EntityNotFoundException("LotoStandard or LotoPoint not found");
            }

            if (!standard.getLotoPoints().contains(lotoPoint)) {
                return toDto(standard);
            }

            if (isApproved(standard)) {
                String oldIds = standardPointIdsSnapshot(standard);
                List<Long> projected = new ArrayList<>(currentOrderedPointIds(standard));
                projected.remove(lotoPointId);
                captureFieldProposal(standard, lotoPointId, "lotoPoints (remove " + lotoPointId + ")",
                        oldIds, projected.toString());
                return toDto(standard);
            }

            standard.removeLotoPoint(lotoPoint);
            lotoPoint.removeStandard(standard);
            return toDto(save(standard));
        } catch (Exception e) {
            throw new RuntimeException("Error removing LotoPoint from LotoStandard: " + e.getMessage(), e);
        }
    }

    public List<FileDto> getRelatedFiles(Long lotoStandardId) {
        LotoStandard standard = getEntityById(lotoStandardId);
        if (standard == null) {
            throw new EntityNotFoundException("LotoStandard not found");
        }
        List<LotoPoint> points = standard.getLotoPoints();
        if(points==null || points.isEmpty()) return List.of();
        Set<FileDto> files = new HashSet<>();
        for(LotoPoint point : points){
            files.addAll(ngLotoPointService.getRelatedFiles(point.getId()));
        }

        return files.stream().distinct().toList();
    }

    public LotoStandardDto reorderLotoPoints(Long currentStandardId, List<Long> lotoPoints) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        LotoStandard standard = getEntityById(currentStandardId);
        if (standard == null) {
            throw new EntityNotFoundException("LotoStandard not found");
        }
        String oldIds = standardPointIdsSnapshot(standard);

        if (isApproved(standard)) {
            // Skip-when-equal so a remove-then-reorder roundtrip with identical
            // ID order doesn't generate a phantom proposal.
            String projected = (lotoPoints == null ? List.<Long>of() : lotoPoints).toString();
            captureFieldProposal(standard, null, "lotoPoints (reorder)", oldIds, projected);
            return toDto(standard);
        }

        standard.reorderLotoPoints(lotoPoints);
        return toDto(save(standard));
    }

    /**
     * Generate a counterpart standard preview.
     * For each LOTO point in the source standard, finds or suggests a counterpart
     * point for the other unit (01 <-> 02).
     */
    @Transactional(readOnly = true)
    public CounterpartStandardPreviewDto generateCounterpartPreview(Long sourceStandardId) {
        LotoStandard source = getEntityById(sourceStandardId);
        if (source == null) {
            throw new EntityNotFoundException("LotoStandard not found with id: " + sourceStandardId);
        }

        List<LotoPoint> sourcePoints = source.getLotoPoints();
        if (sourcePoints == null || sourcePoints.isEmpty()) {
            throw new IllegalArgumentException("Source standard has no LOTO points");
        }

        String sourceUnit = detectSourceUnit(sourcePoints);
        String targetUnit = "01".equals(sourceUnit) ? "02" : "01";

        LotoPointRepo lotoPointRepo = (LotoPointRepo) ngLotoPointService.getRepo();

        List<CounterpartStandardPreviewDto.CounterpartItemDto> items = new ArrayList<>();

        for (int i = 0; i < sourcePoints.size(); i++) {
            LotoPoint sourcePoint = sourcePoints.get(i);
            LotoPointDto sourceDto = ngLotoPointService.toDto(sourcePoint);

            CounterpartStandardPreviewDto.CounterpartItemDto item = new CounterpartStandardPreviewDto.CounterpartItemDto();
            item.setSourcePoint(sourceDto);
            item.setSourceIndex(i);

            String tag = sourcePoint.getTagNumber();

            // Case 1: Tag doesn't start with 01 or 02 -> non-counterpart
            if (tag == null || (!tag.startsWith("01") && !tag.startsWith("02"))) {
                item.setCategory("non-counterpart");
                item.setCounterpartPoint(sourceDto);
                items.add(item);
                continue;
            }

            // Case 2: counterpartId is set -> confirmed
            if (sourcePoint.getCounterpartId() != null) {
                LotoPoint counterpart = lotoPointRepo.findByIdWithEquipment(sourcePoint.getCounterpartId());
                if (counterpart != null) {
                    item.setCategory("confirmed");
                    item.setCounterpartPoint(ngLotoPointService.toDto(counterpart));
                    items.add(item);
                    continue;
                }
                // counterpartId was set but entity not found - fall through to tag search
            }

            // Case 3: Search by swapped tag number
            String destTag = targetUnit + tag.substring(2);
            List<LotoPoint> matches = lotoPointRepo.findByTagNumber(destTag);

            if (matches != null && !matches.isEmpty()) {
                item.setCategory("suggested");
                item.setCounterpartPoint(ngLotoPointService.toDto(matches.get(0)));
                if (matches.size() > 1) {
                    item.setHasMultipleMatches(true);
                    item.setAllMatches(matches.stream()
                            .map(ngLotoPointService::toDto)
                            .toList());
                }
                items.add(item);
            } else {
                // Case 4: No counterpart found -> original
                item.setCategory("original");
                item.setCounterpartPoint(sourceDto);
                items.add(item);
            }
        }

        CounterpartStandardPreviewDto preview = new CounterpartStandardPreviewDto();
        preview.setSourceStandard(toDto(source));
        preview.setSourceUnit(sourceUnit);
        preview.setTargetUnit(targetUnit);
        preview.setItems(items);

        return preview;
    }

    private String detectSourceUnit(List<LotoPoint> points) {
        for (LotoPoint p : points) {
            if (p.getTagNumber() != null) {
                if (p.getTagNumber().startsWith("01")) return "01";
                if (p.getTagNumber().startsWith("02")) return "02";
            }
        }
        return "01";
    }

    /**
     * Find all LOTO standards with pagination
     */
    public Page<LotoStandardDto> findAllPaginated(Pageable pageable) {
        Page<LotoStandard> entityPage = lotoStandardRepo.findAll(pageable);
        return entityPage.map(lotoStandardMapper::convertToDto);
    }

    /**
     * Update existing LOTO standard.
     *
     * <p>When the standard is APPROVED, scalar edits (name/description) are
     * captured as proposals instead of mutating the entity. Structural edits
     * passed via this endpoint (lotoPoints, groups) are captured as proposals
     * for lotoPoints; groups are not part of the pending-review model so
     * they're always applied directly (groups don't affect procedure content).
     */
    @Transactional
    public LotoStandardDto updateStandard(LotoStandardIdDto standardIdDto) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        if (standardIdDto.getId() == null) {
            throw new IllegalArgumentException("ID is required for update");
        }

        LotoStandard existing = getEntityById(standardIdDto.getId());
        if (existing == null) {
            throw new EntityNotFoundException("LotoStandard not found with id: " + standardIdDto.getId());
        }

        boolean approved = isApproved(existing);

        String oldName = existing.getName();
        String oldDescription = existing.getDescription();
        String requestedName = standardIdDto.getName();
        String requestedDescription = standardIdDto.getDescription();

        if (requestedName != null && !requestedName.isEmpty() && !Objects.equals(requestedName, oldName)) {
            if (approved) {
                captureFieldProposal(existing, null, "name", oldName, requestedName);
            } else {
                existing.setName(requestedName);
            }
        }
        if (requestedDescription != null && !requestedDescription.isEmpty() && !Objects.equals(requestedDescription, oldDescription)) {
            if (approved) {
                captureFieldProposal(existing, null, "description", oldDescription, requestedDescription);
            } else {
                existing.setDescription(requestedDescription);
            }
        }

        // LOTO points list passed via the update payload — propose vs apply
        if (standardIdDto.getLotoPoints() != null) {
            List<LotoPoint> newPoints = standardIdDto.getLotoPoints().stream()
                .filter(Objects::nonNull)
                .map(ngLotoPointService::getEntityById)
                .toList();
            List<Long> projectedIds = newPoints.stream()
                .map(LotoPoint::getId)
                .filter(Objects::nonNull)
                .toList();
            String oldIds = standardPointIdsSnapshot(existing);
            String newIdsStr = projectedIds.toString();
            if (!Objects.equals(oldIds, newIdsStr)) {
                if (approved) {
                    captureFieldProposal(existing, null, "lotoPoints (replace)", oldIds, newIdsStr);
                } else {
                    existing.setLotoPoints(newPoints);
                }
            }
        }

        // Groups never participate in pending review — applied directly regardless of status.
        if (standardIdDto.getGroups() != null) {
            Set<com.dk_power.power_plant_java.entities.categories.Value> newGroups = standardIdDto.getGroups().stream()
                .filter(Objects::nonNull)
                .map(id -> entityManager.find(com.dk_power.power_plant_java.entities.categories.Value.class, id))
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
            existing.setGroups(newGroups);
        }

        entityManager.flush();
        return lotoStandardMapper.convertToDto(existing);
    }

    /**
     * Delete a LOTO Standard end-to-end.
     * <p>
     * Semantics (per user decision):
     * <ul>
     *   <li><b>Standards, not permits.</b> Historical permits sourced from this
     *       standard survive with a NULL {@code sourceStandard} FK. Permits are
     *       never deleted; they carry their own snapshot of the procedure they
     *       were flipped from, so losing the standard doesn't corrupt them.</li>
     *   <li><b>LOTO Points are physical isolation points and are never touched.</b>
     *       The M2M join rows are cleared, but every point survives.</li>
     *   <li><b>Related lifecycle rows die with the standard.</b> Pending changes
     *       and approval events soft-delete (goes through JPA {@code save} so
     *       {@code FieldChangeEntityListener.@PostUpdate} fires and sync propagates).
     *       The hub-local walkdown row hard-deletes (not synced by design).</li>
     * </ul>
     * <p>
     * <b>Role:</b> {@code CONTROL_AUTHORITY} or {@code MANAGER}. Mirrors the
     * pending-change resolution methods.
     * <p>
     * <b>Never use {@code lotoStandardRepo.deleteById}</b> — it (a) hits H2's
     * FK enforcement because the M2M join rows and per-child lifecycle rows
     * still reference the standard, and (b) bypasses the sync listener, so
     * peer desktops keep a phantom row.
     */
    @Transactional
    public void deleteStandard(Long id) {
        requireAnyRole(LotoRole.CONTROL_AUTHORITY, LotoRole.MANAGER);
        // PESSIMISTIC_WRITE lock: a concurrent NgLotoService.createFromStandard
        // may be mid-transaction with a stale deleted=false read. The row lock
        // serializes the two paths so create either aborts (blocked → sees the
        // committed deleted=true) or completes before delete begins.
        LotoStandard s = lotoStandardRepo.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("LotoStandard not found: " + id));
        if (Boolean.TRUE.equals(s.getDeleted())) {
            // Idempotent: already gone. Return without a second broadcast.
            return;
        }

        // 1. Unlink historical permits — they survive with sourceStandard=null.
        //    Never delete a permit as a side-effect of deleting a standard.
        for (com.dk_power.power_plant_java.entities.loto.Loto permit : lotoRepo.findBySourceStandard_Id(id)) {
            permit.setSourceStandard(null);
            lotoRepo.save(permit);
        }

        // 2. Unlink LOTO Points — clear the M2M join. Points survive (they're
        //    physical isolation points shared across many standards / permits).
        //    IMPORTANT: use the persistent list directly, NOT getLotoPoints() —
        //    the domain getter returns a sorted COPY, so mutations on it don't
        //    reach the join table. Assign a fresh empty list so Hibernate's
        //    dirty-checker flushes the deletes on save.
        s.setLotoPoints(new java.util.ArrayList<>());

        // 3. Unlink from WorkArea.constantLotos M2M (WorkArea is the owning side).
        for (com.dk_power.power_plant_java.entities.permits.WorkArea wa :
                workAreaRepo.findByConstantLotoStandardId(id)) {
            wa.getConstantLotos().removeIf(cs -> cs.getId().equals(id));
            workAreaRepo.save(wa);
        }

        // 4. Null out the soft-FK on any RedTagStandard row that spawned this standard.
        for (com.dk_power.power_plant_java.entities.loto.RedTagStandard rts :
                redTagStandardRepo.findByGeneratedStandardId(id)) {
            rts.setGeneratedStandardId(null);
            redTagStandardRepo.save(rts);
        }

        // 5. Unlink groups (shared Value labels; never delete them).
        if (s.getGroups() != null) s.getGroups().clear();

        // 6. Soft-delete pending changes — sync-registered, propagates.
        for (com.dk_power.power_plant_java.entities.loto.LotoStandardPendingChange c :
                pendingChangeRepo.findByStandard_IdOrderByEditedAtAsc(id)) {
            c.setDeleted(true);
            pendingChangeRepo.save(c);
        }

        // 7. Soft-delete approval events — sync-registered, propagates.
        for (com.dk_power.power_plant_java.entities.loto.LotoStandardApprovalEvent e :
                approvalEventRepo.findByStandard_IdOrderByEventAtAsc(id)) {
            e.setDeleted(true);
            approvalEventRepo.save(e);
        }

        // 8. Hard-delete the hub-local walkdown row. Not in the sync entity table
        //    registry — a soft-delete would not propagate to peers, and the row
        //    lives only on the hub anyway.
        lotoStandardWalkdownRepo.deleteByStandardId(id);

        // 9. Soft-delete the standard itself. @PostUpdate on BaseIdEntity fires
        //    → FieldChangeEntityListener emits a sync event → peers receive
        //    setDeleted(true) and hide the row.
        s.setDeleted(true);
        lotoStandardRepo.save(s);
    }

    /**
     * Complex search with criteria
     */
    public Page<LotoStandardDto> complexSearch(
            SearchCriteria criteria,
            int page,
            int pageSize,
            String sortColumn,
            String sortDirection,
            boolean useAndLogic) {

        Pageable pageable = createPageable(page, pageSize, sortColumn, sortDirection);

        Page<LotoStandard> results;

        // One path for every criteria shape, via the shared specification builder.
        // The previous if/else-on-type dispatched to in-memory helpers that knew only
        // name / description / id (every other column filtered to ZERO rows), matched
        // the raw filter string (so multi-select never matched), could not combine a
        // global query with column filters, and loaded the whole table on each search.
        results = complexSearchWithPagination(lotoStandardRepo, criteria, pageable, useAndLogic);

        return results.map(lotoStandardMapper::convertToDto);
    }





    /**
     * Get unique values for a column with filtering
     */
    public Page<String> getFilteredUniqueValuesOfColumn(
            String column,
            SearchCriteria searchCriteria,
            int page,
            int pageSize,
            boolean andLogicEnabled) {

        // Delegates to the shared implementation (the same one the LOTO POINT table
        // uses). The hand-rolled version this replaces loaded every standard into
        // memory and read the column through a switch that knew only name /
        // description / id — every other column returned null, so its dropdown was
        // permanently empty. It also matched the raw filter string, so a multi-select
        // value ("A | B | ") matched nothing at all. The shared query resolves any
        // persistent column generically and understands multi-select.
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        return getFilteredUniqueValuesOfColumn(
                entityManager, lotoStandardRepo, LotoStandard.class,
                column, searchCriteria, pageable, andLogicEnabled);
    }


    /**
     * Get grouped LOTO standards
     */
    public Map<String, List<LotoStandardDto>> getGroupedLotoStandards(String groupBy) {
        List<LotoStandard> all = lotoStandardRepo.findAll();
        Map<String, List<LotoStandardDto>> grouped = new LinkedHashMap<>();

        for (LotoStandard standard : all) {
            String groupKey = getGroupKey(standard, groupBy);
            grouped.computeIfAbsent(groupKey, k -> new ArrayList<>())
                   .add(lotoStandardMapper.convertToDto(standard));
        }

        return grouped;
    }

    /**
     * Get group key based on groupBy field
     */
    private String getGroupKey(LotoStandard standard, String groupBy) {
        switch (groupBy.toLowerCase()) {
            case "name":
                return standard.getName() != null ? standard.getName() : "Unknown";
            default:
                return "All";
        }
    }

    /**
     * Helper: Create pageable with sorting
     */
    private Pageable createPageable(int page, int pageSize, String sortColumn, String sortDirection) {
        org.springframework.data.domain.Sort.Direction direction =
            sortDirection.equalsIgnoreCase("desc")
                ? org.springframework.data.domain.Sort.Direction.DESC
                : org.springframework.data.domain.Sort.Direction.ASC;

        return PageRequest.of(page, pageSize, org.springframework.data.domain.Sort.by(direction, sortColumn));
    }



    // ── Development workflow ─────────────────────────────────────────────────

    /** Submit a DRAFT standard for second-person verification. Any qualified user. */
    @Transactional
    public LotoStandardDto submitForVerification(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.CONTROL_AUTHORITY);
        String from = transition(s, LotoStandardStatus.PENDING_VERIFICATION);
        String user = currentUserName();
        s.setSubmittedForVerificationBy(user);
        s.setSubmittedForVerificationAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.SUBMITTED_FOR_VERIFICATION, user, from, LotoStandardStatus.PENDING_VERIFICATION, notes);
        return toDto(save(s));
    }

    /**
     * Second-person verify. Verifier must hold {@link LotoRole#CONTROL_AUTHORITY}
     * AND must be a different person than the one who submitted the draft for
     * verification. Per operational rule, "the submitter of the draft is the
     * builder" — the same-person check is against {@code submittedForVerificationBy},
     * not against {@code createdBy}. The old {@code createdBy} guard was a silent
     * no-op anyway because JPA auditing is disabled in this codebase and the field
     * is never populated; keeping only the check that actually has teeth avoids
     * pretending we're enforcing something we're not.
     */
    @Transactional
    public LotoStandardDto verify(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.CONTROL_AUTHORITY);
        String user = currentUserName();
        if (s.getSubmittedForVerificationBy() != null
                && user.equalsIgnoreCase(s.getSubmittedForVerificationBy())) {
            throw new IllegalStateException("Verifier must be a different qualified person than the one who submitted the draft");
        }
        String from = transition(s, LotoStandardStatus.VERIFIED);
        s.setVerifiedBy(user);
        s.setVerifiedAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.VERIFIED, user, from, LotoStandardStatus.VERIFIED, notes);
        return toDto(save(s));
    }

    /**
     * Mark walkdown complete. MANAGER-only per operational policy — walkdown is a
     * manager responsibility, distinct from the Control Authority who built and
     * verified. No same-person check here: the role gate is the only guard because
     * a manager who happened to also hold CONTROL_AUTHORITY and built the standard
     * is still allowed to complete walkdown under the current spec.
     */
    @Transactional
    public LotoStandardDto markWalkdownComplete(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.MANAGER);
        String from = transition(s, LotoStandardStatus.WALKDOWN_COMPLETE);
        String user = currentUserName();
        s.setWalkdownBy(user);
        s.setWalkdownAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.WALKDOWN_COMPLETE, user, from, LotoStandardStatus.WALKDOWN_COMPLETE, notes);
        return toDto(save(s));
    }

    /** Mark ready for testing — first-time hang gate. Any qualified user. */
    @Transactional
    public LotoStandardDto markReadyForTesting(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.CONTROL_AUTHORITY);
        String from = transition(s, LotoStandardStatus.READY_FOR_TESTING);
        String user = currentUserName();
        s.setReadyForTestingBy(user);
        s.setReadyForTestingAt(LocalDateTime.now());
        recordEvent(s, LotoStandardApprovalEvent.Type.READY_FOR_TESTING, user, from, LotoStandardStatus.READY_FOR_TESTING, notes);
        return toDto(save(s));
    }

    /** Final approval. Manager-only. Records APPROVED or REAPPROVED depending on history. */
    @Transactional
    public LotoStandardDto approve(Long standardId, String notes) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.MANAGER);
        String from = transition(s, LotoStandardStatus.APPROVED);
        String user = currentUserName();
        s.setManagerApprovedBy(user);
        s.setManagerApprovedAt(LocalDateTime.now());
        boolean isReapproval = approvalEventRepo.findByStandard_IdOrderByEventAtAsc(s.getId()).stream()
                .anyMatch(e -> e.getEventType() == LotoStandardApprovalEvent.Type.APPROVED);
        LotoStandardApprovalEvent.Type type = isReapproval
                ? LotoStandardApprovalEvent.Type.REAPPROVED
                : LotoStandardApprovalEvent.Type.APPROVED;
        recordEvent(s, type, user, from, LotoStandardStatus.APPROVED, notes);
        return toDto(save(s));
    }

    /** Step back to DRAFT (e.g., reviewer rejects). Any qualified user. Clears attribution. */
    @Transactional
    public LotoStandardDto sendBackToDraft(Long standardId, String reason) {
        LotoStandard s = requireStandard(standardId);
        requireRole(LotoRole.CONTROL_AUTHORITY);
        String from = transition(s, LotoStandardStatus.DRAFT);
        s.clearWorkflowAttribution();
        recordEvent(s, LotoStandardApprovalEvent.Type.INVALIDATED, currentUserName(), from, LotoStandardStatus.DRAFT, reason);
        return toDto(save(s));
    }

    /** Returns approval-event history for a standard, oldest first. */
    @Transactional(readOnly = true)
    public List<LotoStandardApprovalEvent> getApprovalHistory(Long standardId) {
        return approvalEventRepo.findByStandard_IdOrderByEventAtAsc(standardId);
    }

    /**
     * Replace the per-point prerequisites map on the standard. When the
     * standard is APPROVED, captured as a proposal (serialized as JSON so
     * closeReview can deserialize and apply on accept). Otherwise applied
     * directly.
     */
    @Transactional
    public LotoStandardDto updateStandardPrerequisites(Long standardId,
                                                       java.util.Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> prerequisites) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        LotoStandard s = requireStandard(standardId);
        Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> proposed =
                prerequisites != null ? prerequisites : new HashMap<>();

        if (isApproved(s)) {
            String oldJson = toJson(s.getPointPrerequisites() != null ? s.getPointPrerequisites() : new HashMap<>());
            String newJson = toJson(proposed);
            captureFieldProposal(s, null, "pointPrerequisites", oldJson, newJson);
            return toDto(s);
        }

        s.setPointPrerequisites(proposed);
        return toDto(save(s));
    }

    /**
     * Update the procedural prose fields on the standard. Pass null on any
     * field to leave it unchanged; pass empty string to clear it. When the
     * standard is APPROVED, each changed field is captured as a proposal
     * (rolling-coalesced per (field, user)) instead of being applied.
     */
    @Transactional
    public LotoStandardDto updateStandardProceduralText(Long standardId,
                                                        java.util.Map<String, String> fields) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        LotoStandard s = requireStandard(standardId);
        if (fields == null) return toDto(s);
        boolean approved = isApproved(s);

        proposeOrApplyText(s, approved, fields, "installPrerequisitesText",
                s::getInstallPrerequisitesText, s::setInstallPrerequisitesText);
        proposeOrApplyText(s, approved, fields, "installHazardControlText",
                s::getInstallHazardControlText, s::setInstallHazardControlText);
        proposeOrApplyText(s, approved, fields, "installProcedureText",
                s::getInstallProcedureText, s::setInstallProcedureText);
        proposeOrApplyText(s, approved, fields, "removalPrerequisitesText",
                s::getRemovalPrerequisitesText, s::setRemovalPrerequisitesText);
        proposeOrApplyText(s, approved, fields, "removalHazardControlText",
                s::getRemovalHazardControlText, s::setRemovalHazardControlText);
        proposeOrApplyText(s, approved, fields, "removalProcedureText",
                s::getRemovalProcedureText, s::setRemovalProcedureText);

        return toDto(approved ? s : save(s));
    }

    private void proposeOrApplyText(LotoStandard s, boolean approved,
                                    Map<String, String> fields, String key,
                                    java.util.function.Supplier<String> getter,
                                    java.util.function.Consumer<String> setter) {
        if (!fields.containsKey(key)) return;
        String oldV = getter.get();
        String newV = fields.get(key);
        if (Objects.equals(oldV, newV)) return;
        if (approved) {
            captureFieldProposal(s, null, key, oldV, newV);
        } else {
            setter.accept(newV);
        }
    }

    /**
     * Toggle the standard's "removal reverses install order" flag. When true,
     * any point that does NOT have explicit removalRequiredPointIds inherits a
     * reversed install graph for removal sequencing. When the standard is
     * APPROVED, captured as a proposal.
     */
    @Transactional
    public LotoStandardDto setRemovalReversesInstallOrder(Long standardId, boolean reverse) {
        requireRole(LotoRole.CONTROL_AUTHORITY);
        LotoStandard s = requireStandard(standardId);
        if (s.isRemovalReversesInstallOrder() == reverse) return toDto(s);
        boolean oldVal = s.isRemovalReversesInstallOrder();

        if (isApproved(s)) {
            captureFieldProposal(s, null, "removalReversesInstallOrder",
                    String.valueOf(oldVal), String.valueOf(reverse));
            return toDto(s);
        }

        s.setRemovalReversesInstallOrder(reverse);
        return toDto(save(s));
    }

    // ── Workflow helpers ─────────────────────────────────────────────────────

    /** Apply a workflow transition or throw if not allowed. Returns the prior status name (may be null). */
    private String transition(LotoStandard s, String target) {
        String current = s.getDevelopmentStatus() != null ? s.getDevelopmentStatus().getName() : null;
        // Legacy rows: a null current is treated as DRAFT for FSM purposes (allowedTargets does the same)
        // and we record DRAFT as the from-status on the audit row so it isn't ambiguous.
        String effectiveFrom = current == null ? LotoStandardStatus.DRAFT : current;
        if (!LotoStandardStatus.allowedTargets(current).contains(target)) {
            throw new IllegalStateException("Invalid status transition: " + effectiveFrom + " -> " + target);
        }
        s.setDevelopmentStatus(getOrCreateStatus(target));
        return effectiveFrom;
    }

    /** True iff the standard's development status is APPROVED. */
    private boolean isApproved(LotoStandard s) {
        return s.getDevelopmentStatus() != null
                && LotoStandardStatus.APPROVED.equals(s.getDevelopmentStatus().getName());
    }

    /** JSON-serialize, never throwing — falls back to {@code String.valueOf} on encoding failure. */
    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    /**
     * Capture a proposal for an APPROVED standard. Asserts isApproved(s) — callers
     * branch on isApproved themselves, so this method exists to make the propose
     * path explicit at the call site. Delegates to the underlying coalescing
     * capture which also handles the "first edit of cycle" event + skip-when-equal.
     */
    private void captureFieldProposal(LotoStandard s, Long lotoPointId, String fieldName,
                                       String oldValue, String newValue) {
        captureFieldEditIfApproved(s, lotoPointId, fieldName, oldValue, newValue);
    }

    /**
     * If the standard is currently APPROVED, capture this edit as a pending
     * change and open the pending-review window (no status change). The CA
     * or Manager later resolves each change as KEPT/DISMISSED and decides
     * whether to close the review as minor or require re-approval. See
     * loto-procedure.md §3.3.
     *
     * <p>Backwards-compatible signature: callers that previously called
     * invalidateIfApproved(s, reason) now call flagForReviewIfApproved(s,
     * reason) with the reason carried as the change's fieldName + a note.
     * Most call sites also have access to richer info (which field, old/new
     * values) — those should call {@link #captureFieldEditIfApproved} instead.
     */
    private void flagForReviewIfApproved(LotoStandard s, String reason) {
        captureFieldEditIfApproved(s, /*lotoPointId*/ null, reason, /*oldValue*/ null, /*newValue*/ null);
    }

    /**
     * Capture a single field-level edit on an APPROVED standard. Stores a
     * PENDING row in {@code loto_standard_pending_change} with the old +
     * new values, opens the pending-review window if not already open,
     * and logs an {@code EDIT_PENDING_REVIEW} event on the first edit of
     * the cycle. Does nothing if the standard isn't APPROVED.
     */
    private void captureFieldEditIfApproved(LotoStandard s, Long lotoPointId, String fieldName,
                                             String oldValue, String newValue) {
        if (s.getDevelopmentStatus() == null) return;
        if (!LotoStandardStatus.APPROVED.equals(s.getDevelopmentStatus().getName())) return;

        // Skip no-op edits — e.g. the FE sends a reorder request after a point
        // remove, but the resulting point-id list is the same (the remove
        // already shifted the order map). We don't want a "reordered" row that
        // shows identical before/after.
        if (java.util.Objects.equals(oldValue, newValue) && oldValue != null) return;

        String actor = currentUserName();
        String resolvedFieldName = fieldName == null ? "(unspecified)" : fieldName;

        // Coalesce: if this same user already has a PENDING row on this same
        // (standard, field, pointId), update its newValue + editedAt instead
        // of creating a new row. Keeps the auto-save typing burst as one
        // entry whose newValue tracks the latest state, with the original
        // oldValue preserved (the pre-cycle baseline).
        java.util.List<LotoStandardPendingChange> existing = pendingChangeRepo.findCoalesceTargets(
                s.getId(), resolvedFieldName, lotoPointId, actor);
        if (!existing.isEmpty()) {
            LotoStandardPendingChange row = existing.get(0);
            // If after coalescing the row becomes a no-op (newValue equals the
            // ORIGINAL oldValue), discard it — user typed and reverted back.
            if (java.util.Objects.equals(row.getOldValue(), newValue)) {
                pendingChangeRepo.delete(row);
                // If that was the only row, also clear the pending-review flag.
                if (pendingChangeRepo.findByStandard_IdOrderByEditedAtAsc(s.getId()).isEmpty()) {
                    s.setPendingReviewSince(null);
                }
                return;
            }
            row.setNewValue(newValue);
            row.setEditedAt(LocalDateTime.now());
            pendingChangeRepo.save(row);
            return;
        }

        boolean firstEditOfCycle = (s.getPendingReviewSince() == null);
        if (firstEditOfCycle) {
            s.setPendingReviewSince(LocalDateTime.now());
        }

        LotoStandardPendingChange change = new LotoStandardPendingChange();
        change.setStandard(s);
        change.setLotoPointId(lotoPointId);
        change.setFieldName(resolvedFieldName);
        change.setOldValue(oldValue);
        change.setNewValue(newValue);
        change.setEditedBy(actor);
        change.setEditedAt(LocalDateTime.now());
        change.setResolution(LotoStandardPendingChange.Resolution.PENDING);
        pendingChangeRepo.save(change);

        if (firstEditOfCycle) {
            recordEvent(s, LotoStandardApprovalEvent.Type.EDIT_PENDING_REVIEW, actor,
                    LotoStandardStatus.APPROVED, LotoStandardStatus.APPROVED,
                    "Pending review opened: " + change.getFieldName());
        }
    }

    /**
     * Helper: snapshot the current LotoStandard's point-id list as a JSON-ish
     * string so add/remove/reorder edits get a meaningful before/after diff.
     * We use the list ORDER from {@code lotoPointOrder} when available so a
     * pure-reorder shows up correctly.
     */
    private String standardPointIdsSnapshot(LotoStandard s) {
        return currentOrderedPointIds(s).toString();
    }

    /** Current point-id list in display order. Used to project would-be states for proposals. */
    private List<Long> currentOrderedPointIds(LotoStandard s) {
        Map<String, Integer> orderMap = s.getLotoPointOrder();
        return s.getLotoPoints().stream()
                .filter(Objects::nonNull)
                .map(LotoPoint::getId)
                .filter(Objects::nonNull)
                .sorted((a, b) -> {
                    Integer oa = orderMap.get(a.toString());
                    Integer ob = orderMap.get(b.toString());
                    if (oa == null && ob == null) return Long.compare(a, b);
                    if (oa == null) return 1;
                    if (ob == null) return -1;
                    return Integer.compare(oa, ob);
                })
                .toList();
    }

    /**
     * Backwards-compatible wrapper so existing call sites keep compiling. New
     * code should call {@link #captureFieldEditIfApproved} with the actual
     * field name + values.
     *
     * @deprecated use {@link #captureFieldEditIfApproved} instead.
     */
    @Deprecated
    private void invalidateIfApproved(LotoStandard s, String reason) {
        flagForReviewIfApproved(s, reason);
    }

    // ── Pending-review review actions ─────────────────────────────────────────

    /**
     * List every pending change for a standard, oldest first, regardless of
     * resolution. Used by the review panel to render the diff list.
     */
    @Transactional(readOnly = true)
    public List<LotoStandardPendingChange> getPendingChanges(Long standardId) {
        requireStandard(standardId);
        return pendingChangeRepo.findByStandard_IdOrderByEditedAtAsc(standardId);
    }

    /** Mark a PENDING change as KEPT — newValue stays on the underlying field. */
    public LotoStandardPendingChange keepChange(Long changeId) {
        requireAnyRole(LotoRole.CONTROL_AUTHORITY, LotoRole.MANAGER);
        LotoStandardPendingChange c = pendingChangeRepo.findById(changeId)
                .orElseThrow(() -> new EntityNotFoundException("PendingChange not found: " + changeId));
        c.setResolution(LotoStandardPendingChange.Resolution.KEPT);
        c.setResolvedBy(currentUserName());
        c.setResolvedAt(LocalDateTime.now());
        return pendingChangeRepo.save(c);
    }

    /**
     * Mark a PENDING change as DISMISSED. The reviewer is saying "revert this
     * edit". Today we record the resolution; the actual revert of the field
     * on the underlying entity is left to the caller / a follow-up that knows
     * how to deserialize the oldValue for each field type. Storing the
     * resolution + oldValue is enough for the audit trail and lets the UI
     * surface "this change was dismissed".
     */
    public LotoStandardPendingChange dismissChange(Long changeId) {
        requireAnyRole(LotoRole.CONTROL_AUTHORITY, LotoRole.MANAGER);
        LotoStandardPendingChange c = pendingChangeRepo.findById(changeId)
                .orElseThrow(() -> new EntityNotFoundException("PendingChange not found: " + changeId));
        c.setResolution(LotoStandardPendingChange.Resolution.DISMISSED);
        c.setResolvedBy(currentUserName());
        c.setResolvedAt(LocalDateTime.now());
        return pendingChangeRepo.save(c);
    }

    /**
     * Close the pending-review window. {@code requireReapproval=false} means
     * "Close as minor" — the standard stays APPROVED; {@code true} flips it
     * to NEW_PENDING_REAPPROVAL.
     *
     * <p>Model B2 semantics: KEPT proposals are <em>applied</em> to the
     * standard here, atomically, before the transition. DISMISSED proposals
     * are simply discarded (the standard never reflected them in the first
     * place). For each canonical field, only the most recent KEPT proposal
     * wins — earlier KEPT proposals on the same field are stepping stones
     * whose final state is captured by the latest one.
     *
     * <p>Throws {@link IllegalStateException} if any PENDING rows remain
     * unresolved.
     */
    public LotoStandardDto closeReview(Long standardId, boolean requireReapproval) {
        requireAnyRole(LotoRole.CONTROL_AUTHORITY, LotoRole.MANAGER);
        LotoStandard s = requireStandard(standardId);
        if (s.getPendingReviewSince() == null) {
            throw new IllegalStateException("Standard is not in pending review");
        }
        long stillPending = pendingChangeRepo.countByStandard_IdAndResolution(
                standardId, LotoStandardPendingChange.Resolution.PENDING);
        if (stillPending > 0) {
            throw new IllegalStateException(stillPending + " pending changes must be resolved first");
        }

        List<LotoStandardPendingChange> keptOldestFirst = pendingChangeRepo
                .findByStandard_IdAndResolutionOrderByEditedAtAsc(
                        standardId, LotoStandardPendingChange.Resolution.KEPT);

        // Safety: structural KEPT changes force require-reapproval.
        if (!requireReapproval) {
            boolean structuralKept = keptOldestFirst.stream()
                    .map(LotoStandardPendingChange::getFieldName)
                    .filter(Objects::nonNull)
                    .anyMatch(name -> name.startsWith("lotoPoints"));
            if (structuralKept) {
                throw new IllegalStateException(
                        "Cannot close as minor — a kept change adds, removes, or reorders LOTO points. " +
                        "Re-approval is required for structural changes.");
            }
        }

        // Apply KEPT proposals to the standard (Model B2 propose-then-apply).
        applyKeptProposals(s, keptOldestFirst);

        long dismissed = pendingChangeRepo.countByStandard_IdAndResolution(
                standardId, LotoStandardPendingChange.Resolution.DISMISSED);
        String summary = "Kept " + keptOldestFirst.size() + ", dismissed " + dismissed;

        s.setPendingReviewSince(null);

        if (requireReapproval) {
            s.setDevelopmentStatus(getOrCreateStatus(LotoStandardStatus.NEW_PENDING_REAPPROVAL));
            s.setCurrentVersion((s.getCurrentVersion() == null ? 1 : s.getCurrentVersion()) + 1);
            s.clearWorkflowAttribution();
            recordEvent(s, LotoStandardApprovalEvent.Type.EDIT_REQUIRES_REAPPROVAL, currentUserName(),
                    LotoStandardStatus.APPROVED, LotoStandardStatus.NEW_PENDING_REAPPROVAL, summary);
        } else {
            recordEvent(s, LotoStandardApprovalEvent.Type.EDIT_ACCEPTED_AS_MINOR, currentUserName(),
                    LotoStandardStatus.APPROVED, LotoStandardStatus.APPROVED, summary);
        }

        return toDto(save(s));
    }

    /**
     * Apply KEPT proposals to a standard. For each canonical field key, the
     * latest KEPT proposal in time order wins (earlier proposals are stepping
     * stones whose intent is captured by the later snapshot).
     *
     * <p>Unknown field names are skipped — keeps the applier forward-compatible
     * when new proposal types are added.
     */
    private void applyKeptProposals(LotoStandard s, List<LotoStandardPendingChange> keptOldestFirst) {
        java.util.LinkedHashMap<String, LotoStandardPendingChange> latestPerField = new java.util.LinkedHashMap<>();
        for (LotoStandardPendingChange c : keptOldestFirst) {
            latestPerField.put(canonicalFieldKey(c), c);
        }
        for (LotoStandardPendingChange c : latestPerField.values()) {
            applyOneProposal(s, c);
        }
    }

    /**
     * Build a stable grouping key so multiple proposals on the same field
     * coalesce to a single apply step. Per-point fields are keyed by
     * (fieldName, lotoPointId); structural lotoPoints variants all collapse
     * to "lotoPoints".
     */
    private String canonicalFieldKey(LotoStandardPendingChange c) {
        String name = c.getFieldName() == null ? "" : c.getFieldName();
        if (name.startsWith("lotoPoints")) return "lotoPoints";
        if (c.getLotoPointId() != null) return name + ":" + c.getLotoPointId();
        return name;
    }

    private void applyOneProposal(LotoStandard s, LotoStandardPendingChange c) {
        String f = c.getFieldName();
        String v = c.getNewValue();
        if (f == null) return;

        switch (f) {
            case "name": s.setName(v); return;
            case "description": s.setDescription(v); return;
            case "installPrerequisitesText": s.setInstallPrerequisitesText(v); return;
            case "installHazardControlText": s.setInstallHazardControlText(v); return;
            case "installProcedureText": s.setInstallProcedureText(v); return;
            case "removalPrerequisitesText": s.setRemovalPrerequisitesText(v); return;
            case "removalHazardControlText": s.setRemovalHazardControlText(v); return;
            case "removalProcedureText": s.setRemovalProcedureText(v); return;
            case "removalReversesInstallOrder":
                s.setRemovalReversesInstallOrder(Boolean.parseBoolean(v));
                return;
            case "pointPrerequisites":
                applyPointPrerequisitesProposal(s, v);
                return;
            default:
                if (f.startsWith("lotoPoints")) {
                    applyLotoPointsProposal(s, v);
                }
                // Unknown fieldName — silently skip (forward compat).
        }
    }

    /** Apply a {@code lotoPoints} proposal whose newValue is a "[1, 2, 3]" id list. */
    private void applyLotoPointsProposal(LotoStandard s, String newIdsList) {
        List<Long> targetIds = parseLongList(newIdsList);
        // Detach points the proposal drops
        List<LotoPoint> current = new ArrayList<>(s.getLotoPoints() != null ? s.getLotoPoints() : List.of());
        for (LotoPoint p : current) {
            if (p.getId() != null && !targetIds.contains(p.getId())) {
                s.removeLotoPoint(p);
                p.removeStandard(s);
            }
        }
        // Add points the proposal introduces
        java.util.Set<Long> existing = s.getLotoPoints().stream()
                .map(LotoPoint::getId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        for (Long id : targetIds) {
            if (id == null || existing.contains(id)) continue;
            LotoPoint p = ngLotoPointService.getEntityById(id);
            if (p == null) continue;
            s.addLotoPoint(p);
            p.addLotoStandard(s);
        }
        // Reorder to match the proposal's order
        List<Long> presentIds = s.getLotoPoints().stream()
                .map(LotoPoint::getId).filter(Objects::nonNull)
                .toList();
        List<Long> ordered = targetIds.stream().filter(presentIds::contains).collect(Collectors.toList());
        if (!ordered.isEmpty()) {
            s.reorderLotoPoints(ordered);
        }
    }

    private void applyPointPrerequisitesProposal(LotoStandard s, String json) {
        try {
            Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> parsed =
                    objectMapper.readValue(
                            json == null ? "{}" : json,
                            new TypeReference<Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite>>() {});
            s.setPointPrerequisites(parsed == null ? new HashMap<>() : parsed);
        } catch (Exception e) {
            // Bad JSON in proposal — leave the existing map untouched rather than corrupting state.
        }
    }

    /** Parse a {@code List<Long>.toString()}-formatted string like "[1, 2, 3]". */
    private List<Long> parseLongList(String value) {
        if (value == null) return List.of();
        String trimmed = value.trim();
        if (trimmed.startsWith("[")) trimmed = trimmed.substring(1);
        if (trimmed.endsWith("]")) trimmed = trimmed.substring(0, trimmed.length() - 1);
        if (trimmed.isBlank()) return List.of();
        List<Long> out = new ArrayList<>();
        for (String piece : trimmed.split(",")) {
            String p = piece.trim();
            if (p.isEmpty()) continue;
            try { out.add(Long.parseLong(p)); }
            catch (NumberFormatException ignored) { /* skip */ }
        }
        return out;
    }

    private LotoStandard requireStandard(Long id) {
        if (id == null) throw new IllegalArgumentException("Standard id required");
        LotoStandard s = lotoStandardRepo.findById(id).orElse(null);
        if (s == null) throw new EntityNotFoundException("LotoStandard not found: " + id);
        return s;
    }

    private Value getOrCreateStatus(String statusName) {
        return ngValueService.createValue(LotoStandardStatus.CATEGORY, statusName);
    }

    private void recordEvent(LotoStandard s, LotoStandardApprovalEvent.Type type, String user,
                             String from, String to, String notes) {
        LotoStandardApprovalEvent e = new LotoStandardApprovalEvent();
        e.setStandard(s);
        e.setStandardVersion(s.getCurrentVersion());
        e.setEventType(type);
        e.setPerformedBy(user);
        e.setEventAt(LocalDateTime.now());
        e.setFromStatus(from);
        e.setToStatus(to);
        e.setNotes(notes);
        approvalEventRepo.save(e);
    }

    private void requireRole(LotoRole role) {
        requireAnyRole(role);
    }

    /**
     * Public role-check entry point for other services that need the same
     * LOTO-role gating without duplicating the user-lookup logic. The private
     * {@link #requireAnyRole(LotoRole...)} stays private so its callers within
     * this class can keep using it directly; this wrapper is the intended
     * cross-service handle.
     */
    public void requireLotoRole(LotoRole... roles) {
        requireAnyRole(roles);
    }

    /** Pass-if-any-of helper. CONTROL_AUTHORITY callers also satisfy legacy QUALIFIED gates. */
    @SuppressWarnings("deprecation")
    private void requireAnyRole(LotoRole... roles) {
        User user = currentUser();
        if (user == null) {
            throw new SecurityException("Authentication required");
        }
        for (LotoRole r : roles) {
            if (user.hasLotoRole(r)) return;
            // Legacy alias: QUALIFIED ⇆ CONTROL_AUTHORITY
            if (r == LotoRole.CONTROL_AUTHORITY && user.hasLotoRole(LotoRole.QUALIFIED)) return;
            if (r == LotoRole.QUALIFIED && user.hasLotoRole(LotoRole.CONTROL_AUTHORITY)) return;
            // Legacy alias: AUTHORIZED ⇆ LOTO_QUALIFIED
            if (r == LotoRole.LOTO_QUALIFIED && user.hasLotoRole(LotoRole.AUTHORIZED)) return;
            if (r == LotoRole.AUTHORIZED && user.hasLotoRole(LotoRole.LOTO_QUALIFIED)) return;
        }
        String names = java.util.Arrays.stream(roles).map(LotoRole::roleName).reduce((a,b) -> a + " | " + b).orElse("");
        throw new SecurityException("Requires one of LOTO role: " + names);
    }

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /**
     * Resolves the signed-in user. Spring's principal username equals the
     * user's email (see CustomUserDetails), so we look up by id from
     * CustomUserDetails first, then fall back to email lookup.
     */
    private User currentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            Object principal = auth.getPrincipal();
            if (principal instanceof com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails details) {
                return userRepo.findById(details.getId()).orElse(null);
            }
            String name = auth.getName();
            if (name == null || "anonymousUser".equalsIgnoreCase(name) || "anonymous".equalsIgnoreCase(name)) {
                return null;
            }
            User u = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(name);
            if (u == null) u = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(name);
            return u;
        } catch (Exception e) {
            return null;
        }
    }
}
