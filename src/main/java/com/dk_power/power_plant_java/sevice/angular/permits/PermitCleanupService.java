package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
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
 * {@code WorkRequest} and {@code Loto} re-declare it; {@code SafeWork}, {@code HotWork},
 * {@code ConfinedSpace} and {@code DailyPermitPackage} never did. So for those four, "deleted" is a
 * flag every single query has to remember on its own — and the permits map is proof of how easy
 * that is to miss.
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
            } else if (isClosed(pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : null)
                    || Boolean.TRUE.equals(pkg.getDeleted())) {
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
