package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * Finds and closes permits that outlived the thing that was supposed to close them.
 *
 * <p>Closing a package already cascades to its child permits ({@code cascadeStatusToPermits}), so
 * the healthy path is fine. These are the rows that never went through it:
 *
 * <ul>
 *   <li><b>Stranded</b> — the package is Closed but the permit is not. Something wrote the package
 *       outside {@code changeStatus} (a direct repository save, or an inbound sync applying a
 *       status field without replaying the cascade), so the cascade never ran.</li>
 *   <li><b>Orphaned</b> — the permit has no package at all. Nothing owns it, so nothing will ever
 *       close it; it stays "open" forever and shows up on the permits map as live work.</li>
 *   <li><b>Deleted</b> — soft-deleted but still open. Invisible in the UI, but any query that
 *       forgets to filter {@code deleted} will surface it. Reported for visibility; closing them
 *       is what stops them leaking into a list that missed the filter.</li>
 * </ul>
 *
 * <p><b>Why "deleted" is a category at all:</b> {@code @Where(clause = "deleted IS NOT TRUE")} lives
 * on {@code BaseIdEntity}, a {@code @MappedSuperclass}, and Hibernate does NOT inherit it.
 * {@code WorkRequest}, {@code Loto}, {@code DailyPermitPackage} and {@code JobLog} re-declare it;
 * {@code SafeWork}, {@code HotWork} and {@code ConfinedSpace} never did. So for those three,
 * "deleted" is a flag every single query has to remember on its own — and the permits map is proof
 * of how easy that is to miss.
 *
 * <p>Because {@code DailyPermitPackage} now carries the filter, a permit whose package was
 * soft-deleted has an FK pointing at a row Hibernate will not return. Initialising that lazy proxy
 * throws rather than yielding null — see {@link #parentIsOpen}, which is what keeps this tool
 * working on the very rows it exists to find.
 *
 * <p>Scoped deliberately to SafeWork / HotWork / ConfinedSpace: they are the package-owned permit
 * types. Work requests have their own expiry service, and LOTOs have an independent lifecycle and
 * are explicitly NOT cascaded by a package close.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PermitCleanupService {

    /** Terminal states — a permit already in one of these needs nothing doing to it. */
    private static final Set<String> CLOSED_STATES =
            Set.of("closed", "processed", "cancelled", "canceled", "expired");

    private final EntityManager entityManager;
    private final NgValueService ngValueService;

    @Data
    @NoArgsConstructor
    public static class Row {
        private String layer;
        private Long id;
        private String permitNumber;
        private String status;
        private String date;
        private String location;
        /** STRANDED | ORPHANED | DELETED */
        private String reason;
        private Long packageId;
        private String packageNumber;
        private String packageStatus;
        private Boolean deleted;
    }

    @Data
    @NoArgsConstructor
    public static class Report {
        private List<Row> rows = new ArrayList<>();
        private Map<String, Integer> countsByReason = new LinkedHashMap<>();
        private Map<String, Integer> countsByLayer = new LinkedHashMap<>();
        private int closed;
        private boolean dryRun = true;
        private List<String> failures = new ArrayList<>();
    }

    // ------------------------------------------------------------------ scan

    public Report diagnose() {
        Report report = new Report();
        collect(report, "SW", SafeWork.class, SafeWork::getLocation, SafeWork::getDate,
                SafeWork::getDailyPermitPackage);
        collect(report, "HW", HotWork.class, HotWork::getLocation, HotWork::getDate,
                HotWork::getDailyPermitPackage);
        collect(report, "CS", ConfinedSpace.class, ConfinedSpace::getSpace, ConfinedSpace::getDate,
                ConfinedSpace::getDailyPermitPackage);

        report.getRows().sort((a, b) -> {
            int byReason = a.getReason().compareTo(b.getReason());
            return byReason != 0 ? byReason : Long.compare(
                    a.getId() == null ? 0 : a.getId(), b.getId() == null ? 0 : b.getId());
        });
        for (Row row : report.getRows()) {
            report.getCountsByReason().merge(row.getReason(), 1, Integer::sum);
            report.getCountsByLayer().merge(row.getLayer(), 1, Integer::sum);
        }
        return report;
    }

    private <T extends BasePermitEntity> void collect(
            Report report,
            String layer,
            Class<T> type,
            Function<T, String> locationOf,
            Function<T, String> dateOf,
            Function<T, DailyPermitPackage> packageOf) {

        // No status predicate in the query: an open permit is decided in Java, because a null
        // status means "Building" here and a JPQL comparison on the status name would drop exactly
        // those rows via an implicit inner join.
        List<T> all = entityManager
                .createQuery("SELECT e FROM " + type.getSimpleName() + " e", type)
                .getResultList();

        for (T permit : all) {
            if (permit == null || permit.getId() == null) continue;
            String status = permit.getPermitStatus() != null ? permit.getPermitStatus().getName() : null;
            if (isClosed(status)) continue;

            DailyPermitPackage pkg = packageOf.apply(permit);
            String reason;
            if (Boolean.TRUE.equals(permit.getDeleted())) {
                reason = "DELETED";
            } else if (pkg == null) {
                reason = "ORPHANED";
            } else if (!parentIsOpen(pkg)) {
                reason = "STRANDED";
            } else {
                continue; // Package is genuinely open — this permit is supposed to be open too.
            }

            Row row = new Row();
            row.setLayer(layer);
            row.setId(permit.getId());
            row.setPermitNumber(permit.getPermitNumber());
            row.setStatus(status == null ? "Building" : status);
            row.setDate(dateOf.apply(permit));
            row.setLocation(locationOf.apply(permit));
            row.setReason(reason);
            row.setDeleted(Boolean.TRUE.equals(permit.getDeleted()));
            if (pkg != null) {
                row.setPackageId(pkg.getId());
                row.setPackageNumber(pkg.getPermitNumber());
                row.setPackageStatus(pkg.getPackageStatus() != null
                        ? pkg.getPackageStatus().getName() : "Building");
            }
            report.getRows().add(row);
        }
    }

    /**
     * Whether a permit's package is still genuinely open.
     *
     * <p>Dereferencing the package can THROW. It is a lazy {@code @ManyToOne} with no
     * {@code @NotFound}, and {@code DailyPermitPackage} now carries {@code @Where}, so a
     * soft-deleted package is a row Hibernate refuses to materialise — the proxy blows up on first
     * access instead of coming back null.
     *
     * <p>Catching that is not defensive noise: an unloadable parent IS the stranded case, and
     * without this the diagnose/close sweep threw wholesale on exactly the rows it exists to find.
     * {@code @NotFound(IGNORE)} is deliberately not used — it forces the association eager on every
     * row, which {@code BasePermitEntity} and {@code WorkRequest} both document as unacceptable here.
     */
    /**
     * Work requests carrying hot-work PRECAUTIONS while declaring no hot work.
     *
     * <p>Older PWA builds seeded the twelve precautions from the work area and the work-category
     * profile, and nothing withdrew them when the requester answered "no hot work". Those ticks were
     * harmless while the desktop re-derived precautions from its own profiles — they are not now:
     * the work request is the SOLE source for the twelve precautions on a generated Hot Work
     * permit, so a stored row like this puts affirmations nobody made onto a controlled document.
     *
     * <p>Current builds cannot create these any more ({@code foldHotWorkProfile} clears the block
     * when hot work is switched off), so this is a one-off pass over history, not a recurring sweep.
     *
     * <p>Reports by default and only writes when told to, like every other maintenance action here.
     * The write goes through JPA so the field-change listener fires and the correction reaches the
     * other nodes rather than being fixed on one machine only.
     */
    @Transactional
    public Report sweepWithdrawnHotWorkMeasures(boolean dryRun) {
        Report report = new Report();
        report.setDryRun(dryRun);

        List<WorkRequest> all = entityManager
                .createQuery("SELECT w FROM WorkRequest w", WorkRequest.class)
                .getResultList();

        for (WorkRequest wr : all) {
            if (wr == null || wr.getId() == null) continue;
            // Boolean on the entity — the 'Yes'/'No' strings live only in the Angular models.
            if (Boolean.TRUE.equals(wr.getIsHotWorkRequired())) continue;

            HotWorkMeasures measures;
            try {
                measures = wr.getDeclaredHotWorkMeasures();
            } catch (Exception e) {
                // A malformed JSON column must not fail the whole sweep.
                continue;
            }
            if (measures == null || !anyTicked(measures)) continue;

            Row row = new Row();
            row.setLayer("WorkRequest");
            row.setId(wr.getId());
            row.setPermitNumber(wr.getPermitNumber());
            row.setReason("HOT_WORK_MEASURES_WITHOUT_HOT_WORK");
            report.getRows().add(row);

            if (!dryRun) {
                // An all-false block, not null: the readers treat a MISSING block as "no opinion"
                // and would leave the old declaration standing.
                wr.setDeclaredHotWorkMeasures(new HotWorkMeasures());
                entityManager.merge(wr);
                report.setClosed(report.getClosed() + 1);
            }
        }
        return report;
    }

    private static boolean anyTicked(HotWorkMeasures m) {
        return m.isAreaIsClean() || m.isFlammablesAreSecured() || m.isNoCombustibleDustOrDebrisPresent()
                || m.isRadiativeHeatPreventiveMeasuresAreTaken() || m.isVesselsArePurged()
                || m.isOpeningsAreCovered() || m.isDuctVentilationIsSecured() || m.isLockOutIsCompleted()
                || m.isCommunicationIsEstablished() || m.isFireWatchIsAwareOfDuties()
                || m.isFireExtinguisherPresent() || m.isFireProtectionIsInService();
    }

    private boolean parentIsOpen(DailyPermitPackage pkg) {
        try {
            if (Boolean.TRUE.equals(pkg.getDeleted())) return false;
            return !isClosed(pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : null);
        } catch (jakarta.persistence.EntityNotFoundException | org.hibernate.ObjectNotFoundException e) {
            return false;
        }
    }

    private static boolean isClosed(String status) {
        return status != null && CLOSED_STATES.contains(status.toLowerCase());
    }

    // ------------------------------------------------------------------ close

    /**
     * Close everything {@link #diagnose()} found, optionally as a dry run.
     *
     * <p>Sets the permit's own status only. It deliberately does NOT touch the package, the job or
     * the LOTOs: every row here is one whose owner is already closed, already gone, or never
     * existed, so there is nothing upstream left to keep in step — and reaching upward from a
     * cleanup is how a tidy-up turns into an incident.
     *
     * <p>One transaction, and a failure fails the whole run. That is on purpose: the alternative,
     * catching per row and carrying on, is the shape that broke the stale-package sweep — a throw
     * inside a {@code @Transactional} method marks it rollback-only, so continuing afterwards
     * guarantees every "success" is discarded at commit.
     */
    public Report closeStrandedPermits(boolean dryRun) {
        Report report = diagnose();
        report.setDryRun(dryRun);
        if (dryRun || report.getRows().isEmpty()) return report;

        var closedStatus = ngValueService.createValue("Permit Status", "Closed");
        int closed = 0;
        for (Row row : report.getRows()) {
            BasePermitEntity permit = load(row.getLayer(), row.getId());
            if (permit == null) {
                report.getFailures().add(row.getLayer() + " #" + row.getId() + " vanished mid-run");
                continue;
            }
            permit.setPermitStatus(closedStatus);
            closed++;
        }
        entityManager.flush();
        report.setClosed(closed);
        log.info("permit.cleanup.complete closed={} byReason={}", closed, report.getCountsByReason());
        return report;
    }

    private BasePermitEntity load(String layer, Long id) {
        return switch (layer) {
            case "SW" -> entityManager.find(SafeWork.class, id);
            case "HW" -> entityManager.find(HotWork.class, id);
            case "CS" -> entityManager.find(ConfinedSpace.class, id);
            default -> null;
        };
    }
}
