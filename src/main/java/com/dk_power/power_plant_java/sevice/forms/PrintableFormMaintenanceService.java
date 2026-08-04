package com.dk_power.power_plant_java.sevice.forms;

import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.repository.forms.FormContainerRepo;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import com.dk_power.power_plant_java.sevice.sync.SyncContext;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin-triggered maintenance for the printable-form tables. Every operation supports
 * {@code dryRun} so the plan can be reviewed before anything is written.
 *
 * <p><b>Why these are admin actions and not a startup task.</b> The two problems here need
 * opposite propagation semantics, and neither is safe to run unattended on every boot:
 *
 * <ul>
 *   <li><b>Orphaned containers are per-node state.</b> A {@code FormContainer} is orphaned on
 *       this node because its parent {@link PrintableForm} never arrived here — the same row
 *       may be correctly linked on another node. Broadcasting a delete would destroy a healthy
 *       container elsewhere, so the repair runs inside {@link SyncContext} and stays local.</li>
 *   <li><b>Duplicate primaries are one logical row.</b> {@code PrintableForm} is CRDT-synced, so
 *       demoting through {@link PrintableFormService#save} emits FieldChanges and converges the
 *       whole fleet from a single node. That one must broadcast.</li>
 * </ul>
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PrintableFormMaintenanceService {

    private final EntityManager entityManager;
    private final FormContainerRepo formContainerRepo;
    private final PrintableFormRepo printableFormRepo;
    private final PrintableFormService printableFormService;
    private final SyncContext syncContext;

    /** Read-only snapshot of both problems, safe to call at any time. */
    @Transactional(readOnly = true)
    public Map<String, Object> diagnose() {
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("totalForms", countOf("SELECT COUNT(*) FROM printable_form WHERE deleted IS NOT TRUE"));
        result.put("totalContainers", countOf("SELECT COUNT(*) FROM form_container WHERE deleted IS NOT TRUE"));

        List<Long> orphanIds = findOrphanContainerIds();
        result.put("orphanedContainers", orphanIds.size());
        result.put("orphansByDevice", orphanCountsByDevice());

        List<Map<String, Object>> duplicates = findDuplicatePrimaries();
        result.put("duplicatePrimaryTypes", duplicates.size());
        result.put("duplicatePrimaries", duplicates);

        return result;
    }

    /**
     * Soft-delete {@code FormContainer} rows with no parent form. LOCAL ONLY — wrapped in
     * {@link SyncContext} so no FieldChange is emitted and peers are untouched. Idempotent.
     */
    public Map<String, Object> repairOrphanedContainers(boolean dryRun) {
        List<Long> orphanIds = findOrphanContainerIds();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dryRun", dryRun);
        result.put("orphanCount", orphanIds.size());
        result.put("orphansByDevice", orphanCountsByDevice());
        result.put("sampleIds", orphanIds.stream().limit(50).toList());

        if (dryRun || orphanIds.isEmpty()) {
            result.put("softDeleted", 0);
            return result;
        }

        // Local-only: orphan-ness is this node's state, not a fact about the fleet.
        syncContext.executeInSyncContext(() -> {
            List<FormContainer> orphans = formContainerRepo.findAllById(orphanIds);
            orphans.forEach(c -> c.setDeleted(true));
            formContainerRepo.saveAll(orphans);
            log.info("Form maintenance: soft-deleted {} orphaned FormContainer(s) (local only, not broadcast)",
                    orphans.size());
        });

        result.put("softDeleted", orphanIds.size());
        return result;
    }

    /**
     * Collapse each {@code formType} that has more than one primary down to a single winner —
     * the most recently created form. Routed through {@link PrintableFormService#save} so the
     * demotions emit FieldChanges and propagate to every node.
     */
    public Map<String, Object> fixDuplicatePrimaries(boolean dryRun) {
        List<Map<String, Object>> duplicates = findDuplicatePrimaries();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dryRun", dryRun);
        result.put("affectedTypes", duplicates.size());
        result.put("plan", duplicates);

        if (dryRun || duplicates.isEmpty()) {
            result.put("demoted", 0);
            return result;
        }

        int demoted = 0;
        for (Map<String, Object> entry : duplicates) {
            Long keepId = (Long) entry.get("keepId");
            PrintableForm keeper = printableFormRepo.findById(keepId).orElse(null);
            if (keeper == null) continue;

            // save() demotes every other form of this type, then re-flags the keeper.
            keeper.setIsPrimary(true);
            printableFormService.save(keeper);

            @SuppressWarnings("unchecked")
            List<Long> demoteIds = (List<Long>) entry.get("demoteIds");
            demoted += demoteIds.size();
            log.info("Form maintenance: formType={} kept primary #{}, demoted {}",
                    entry.get("formType"), keepId, demoteIds);
        }

        result.put("demoted", demoted);
        return result;
    }

    // ---------------------------------------------------------------- helpers

    /**
     * {@code printable_form_id} is owned by the parent's {@code @OneToMany @JoinColumn} and has no
     * Java field on {@link FormContainer}, so it is only reachable via native SQL.
     */
    @SuppressWarnings("unchecked")
    private List<Long> findOrphanContainerIds() {
        List<Number> rows = entityManager.createNativeQuery(
                        "SELECT id FROM form_container WHERE printable_form_id IS NULL AND deleted IS NOT TRUE")
                .getResultList();
        return rows.stream().map(Number::longValue).collect(Collectors.toList());
    }

    /** Device number is encoded in the id as {@code device * 1_000_000_000 + sequence}. */
    @SuppressWarnings("unchecked")
    private Map<String, Long> orphanCountsByDevice() {
        List<Object[]> rows = entityManager.createNativeQuery(
                        "SELECT CAST(id / 1000000000 AS INT) AS device, COUNT(*) "
                                + "FROM form_container "
                                + "WHERE printable_form_id IS NULL AND deleted IS NOT TRUE "
                                + "GROUP BY CAST(id / 1000000000 AS INT) ORDER BY device")
                .getResultList();
        Map<String, Long> byDevice = new LinkedHashMap<>();
        for (Object[] row : rows) {
            byDevice.put("device " + ((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }
        return byDevice;
    }

    /**
     * Group live forms by {@code formType} and report any type carrying more than one primary.
     * The newest form wins, matching what a re-seed would have intended.
     */
    private List<Map<String, Object>> findDuplicatePrimaries() {
        Map<String, List<PrintableForm>> primariesByType = printableFormRepo.findAll().stream()
                .filter(f -> !Boolean.TRUE.equals(f.getDeleted()))
                .filter(f -> Boolean.TRUE.equals(f.getIsPrimary()))
                .filter(f -> f.getFormType() != null)
                .collect(Collectors.groupingBy(PrintableForm::getFormType));

        List<Map<String, Object>> duplicates = new ArrayList<>();
        primariesByType.forEach((formType, forms) -> {
            if (forms.size() < 2) return;

            List<PrintableForm> ordered = forms.stream()
                    .sorted(Comparator.comparing(PrintableForm::getDateCreated,
                                    Comparator.nullsFirst(Comparator.naturalOrder()))
                            .thenComparing(PrintableForm::getId))
                    .toList();
            PrintableForm keeper = ordered.get(ordered.size() - 1);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("formType", formType);
            entry.put("keepId", keeper.getId());
            entry.put("keepName", keeper.getName());
            entry.put("demoteIds", ordered.stream()
                    .filter(f -> !f.getId().equals(keeper.getId()))
                    .map(PrintableForm::getId)
                    .toList());
            entry.put("demoteNames", ordered.stream()
                    .filter(f -> !f.getId().equals(keeper.getId()))
                    .map(PrintableForm::getName)
                    .toList());
            duplicates.add(entry);
        });
        return duplicates;
    }

    private long countOf(String sql) {
        Number n = (Number) entityManager.createNativeQuery(sql).getSingleResult();
        return n == null ? 0L : n.longValue();
    }
}
