package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.repository.permits.JobLogRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin sweep for jobs and packages that were opened and never closed.
 *
 * <p>Work requests already auto-expire ({@code WorkRequestExpiryService}); jobs and packages never
 * have, which is why they accumulate indefinitely. Nothing here runs on a schedule — an operator
 * closing real work by accident is far worse than a stale row surviving another day — so this is
 * dry-run first, apply on request, from Admin.
 *
 * <h2>What counts as stale</h2>
 * The two have genuinely different lifetimes and so use different rules:
 * <ul>
 *   <li><b>Packages</b> are a single shift's authorisation — twelve hours. One that is still open
 *       well past that was abandoned, not extended, so the trigger is elapsed time from the start
 *       of its own work window (default 14h, leaving headroom over the nominal 12).</li>
 *   <li><b>Jobs</b> legitimately run for weeks. Elapsed time says nothing, so the trigger is
 *       INACTIVITY: no edit to the job or to any of its packages for N days.</li>
 * </ul>
 *
 * <h2>Cascade</h2>
 * {@code NgJobLogService.closeJob} refuses while any package is open, which by itself makes the
 * stale jobs the ones that cannot be closed. So closing a stale job closes its open packages first.
 * Those packages are listed per job in the dry run, because the cascade reaches packages that are
 * not individually stale.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class JobPackageMaintenanceService {

    private final JobLogRepo jobLogRepo;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final NgDailyPermitPackageService packageService;
    private final NgJobLogService jobLogService;

    /** A package authorises one shift; past this many hours from its window start it is abandoned. */
    public static final int DEFAULT_PACKAGE_HOURS = 14;
    /** Jobs run long, so only silence marks them stale. */
    public static final int DEFAULT_INACTIVE_DAYS = 30;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");
    private static final String CLOSED = "Closed";

    // ---------------------------------------------------------------- diagnose

    /** What the sweep would consider stale right now. Reads only. */
    public Map<String, Object> diagnose(int inactiveDays, int packageHours) {
        LocalDateTime now = LocalDateTime.now();
        List<JobLog> openJobs = jobLogRepo.findAllOpenJobs();

        List<Map<String, Object>> staleJobs = new ArrayList<>();
        List<Map<String, Object>> stalePackages = new ArrayList<>();

        // Packages reachable through a stale job are cascaded, so they must not also be listed as
        // standalone candidates — otherwise the totals double-count them.
        List<Long> cascaded = new ArrayList<>();

        for (JobLog job : openJobs) {
            // findAllOpenJobs does not exclude soft-deleted rows (see findAllOpenPackages).
            if (Boolean.TRUE.equals(job.getDeleted())) continue;
            LocalDateTime last = lastActivity(job);
            if (last != null && last.plusDays(inactiveDays).isBefore(now)) {
                List<Map<String, Object>> toClose = new ArrayList<>();
                for (DailyPermitPackage pkg : openPackagesOf(job)) {
                    cascaded.add(pkg.getId());
                    toClose.add(packageRow(pkg, now, packageHours));
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("jobId", job.getId());
                row.put("permitNumber", job.getPermitNumber());
                row.put("company", job.getCompany());
                row.put("foreman", job.getForeman());
                row.put("location", job.getLocation());
                row.put("workScope", job.getWorkScope());
                row.put("status", job.getJobStatus() != null ? job.getJobStatus().getName() : "Open");
                row.put("lastActivity", last.toString());
                row.put("idleDays", ChronoUnit.DAYS.between(last, now));
                row.put("packagesToClose", toClose);
                staleJobs.add(row);
            }
        }

        for (DailyPermitPackage pkg : dailyPermitPackageRepo.findAllOpenPackages()) {
            if (cascaded.contains(pkg.getId())) continue;
            LocalDateTime anchor = packageAnchor(pkg);
            if (anchor != null && anchor.plusHours(packageHours).isBefore(now)) {
                stalePackages.add(packageRow(pkg, now, packageHours));
            }
        }

        staleJobs.sort((a, b) -> Long.compare((long) b.get("idleDays"), (long) a.get("idleDays")));
        stalePackages.sort((a, b) -> Long.compare((long) b.get("hoursOpen"), (long) a.get("hoursOpen")));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("inactiveDays", inactiveDays);
        out.put("packageHours", packageHours);
        out.put("openJobs", openJobs.size());
        out.put("staleJobCount", staleJobs.size());
        out.put("stalePackageCount", stalePackages.size());
        out.put("cascadedPackageCount", cascaded.size());
        out.put("staleJobs", staleJobs);
        out.put("stalePackages", stalePackages);
        return out;
    }

    // ---------------------------------------------------------------- apply

    /**
     * Close everything {@link #diagnose} lists. With {@code dryRun} the counts come back and
     * nothing is written.
     *
     * <p>Each close goes through the normal service path, so status cascades to the child permits,
     * personnel are signed off, a modification entry is recorded and the change is emitted for
     * sync. A row that fails is reported and the sweep continues — one bad package must not strand
     * the rest.
     */
    public Map<String, Object> closeStale(int inactiveDays, int packageHours,
                                          boolean dryRun, String reason) {
        Map<String, Object> plan = diagnose(inactiveDays, packageHours);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> staleJobs = (List<Map<String, Object>>) plan.get("staleJobs");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> stalePackages = (List<Map<String, Object>>) plan.get("stalePackages");

        Map<String, Object> out = new LinkedHashMap<>(plan);
        out.put("dryRun", dryRun);
        if (dryRun) return out;

        String note = reason == null || reason.isBlank()
                ? "Closed by administrative sweep (stale)." : reason.trim();
        List<String> failures = new ArrayList<>();
        int packagesClosed = 0, jobsClosed = 0;

        for (Map<String, Object> row : stalePackages) {
            Long id = (Long) row.get("packageId");
            try {
                packageService.adminForceClose(String.valueOf(id), note);
                packagesClosed++;
            } catch (Exception e) {
                failures.add("Package " + id + ": " + describe(e));
            }
        }

        for (Map<String, Object> job : staleJobs) {
            Long jobId = (Long) job.get("jobId");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> pkgs = (List<Map<String, Object>>) job.get("packagesToClose");
            boolean cascadeOk = true;
            for (Map<String, Object> pkg : pkgs) {
                Long id = (Long) pkg.get("packageId");
                try {
                    packageService.adminForceClose(String.valueOf(id), note);
                    packagesClosed++;
                } catch (Exception e) {
                    cascadeOk = false;
                    failures.add("Package " + id + " (job " + jobId + "): " + describe(e));
                }
            }
            if (!cascadeOk) {
                // closeJob would throw anyway; say so plainly instead of surfacing its message.
                failures.add("Job " + jobId + ": left open because a package could not be closed.");
                continue;
            }
            try {
                jobLogService.closeJobIsolated(String.valueOf(jobId));
                jobsClosed++;
            } catch (Exception e) {
                failures.add("Job " + jobId + ": " + describe(e));
            }
        }

        out.put("packagesClosed", packagesClosed);
        out.put("jobsClosed", jobsClosed);
        out.put("failures", failures);
        log.info("[Job sweep] closed {} package(s) and {} job(s); {} failure(s)",
                packagesClosed, jobsClosed, failures.size());
        return out;
    }

    /**
     * Exception type plus message, and the root cause when the top-level message is unhelpful.
     *
     * <p>Bare {@code getMessage()} is what made the original failure unreadable: every row came
     * back as "Transaction silently rolled back", which names the symptom and hides the throw that
     * caused it.
     */
    private String describe(Exception e) {
        StringBuilder sb = new StringBuilder(e.getClass().getSimpleName());
        if (e.getMessage() != null && !e.getMessage().isBlank()) sb.append(": ").append(e.getMessage());
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) root = root.getCause();
        if (root != e && root.getMessage() != null && !root.getMessage().isBlank()) {
            sb.append(" (caused by ").append(root.getClass().getSimpleName())
              .append(": ").append(root.getMessage()).append(")");
        }
        return sb.toString();
    }

    // ---------------------------------------------------------------- helpers

    private Map<String, Object> packageRow(DailyPermitPackage pkg, LocalDateTime now, int packageHours) {
        LocalDateTime anchor = packageAnchor(pkg);
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("packageId", pkg.getId());
        row.put("permitNumber", pkg.getPermitNumber());
        row.put("companyName", pkg.getCompanyName());
        row.put("personName", pkg.getPersonName());
        row.put("date", pkg.getDate());
        row.put("time", pkg.getTime());
        row.put("status", pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : "Building");
        row.put("windowStart", anchor != null ? anchor.toString() : null);
        row.put("hoursOpen", anchor != null ? ChronoUnit.HOURS.between(anchor, now) : 0L);
        row.put("overdueBy", anchor != null
                ? Math.max(0, ChronoUnit.HOURS.between(anchor.plusHours(packageHours), now)) : 0L);
        return row;
    }

    private List<DailyPermitPackage> openPackagesOf(JobLog job) {
        List<DailyPermitPackage> open = new ArrayList<>();
        if (job.getPackages() == null) return open;
        for (DailyPermitPackage pkg : job.getPackages()) {
            if (!isClosed(pkg) && !Boolean.TRUE.equals(pkg.getDeleted())) open.add(pkg);
        }
        return open;
    }

    private boolean isClosed(DailyPermitPackage pkg) {
        return pkg.getPackageStatus() != null && CLOSED.equals(pkg.getPackageStatus().getName());
    }

    /**
     * When a package's authorised window began. Falls back to creation time, so a package with no
     * date still ages — otherwise the rows most likely to be abandoned would be the ones the sweep
     * could never see.
     */
    private LocalDateTime packageAnchor(DailyPermitPackage pkg) {
        LocalDate date = parseDate(pkg.getDate());
        if (date == null) return pkg.getDateCreated();
        LocalTime time = parseTime(pkg.getTime());
        return time != null ? date.atTime(time) : date.atStartOfDay();
    }

    /**
     * The start of this package's own work window, or null when its date cannot be parsed.
     *
     * <p>Deliberately NOT {@link #packageAnchor}, which falls back to the creation timestamp.
     * That fallback is right for the manual sweep, where a person reviews the list before anything
     * happens — an undated package is very likely abandoned and worth showing. It is wrong for the
     * automatic expiry, which writes without review: "we cannot read the date" is not evidence that
     * the window has closed, and guessing would expire live work. The automatic path skips those
     * and lets the reviewed sweep deal with them.
     */
    public LocalDateTime packageWindowStart(DailyPermitPackage pkg) {
        LocalDate date = parseDate(pkg.getDate());
        if (date == null) return null;
        LocalTime time = parseTime(pkg.getTime());
        return time != null ? date.atTime(time) : date.atStartOfDay();
    }

    /**
     * When work on this job was last scheduled — the newest work window across its packages.
     *
     * <p>Deliberately NOT {@code dateModified}. Two things churn that column and neither means
     * work happened:
     * <ul>
     *   <li>closing a package writes the package AND, through {@code updateParentJobStatus}, the
     *       job — so the sweep's own writes would reset the clock on every job it touched, and no
     *       job could ever be found idle again after the first run;</li>
     *   <li>inbound CRDT sync stamps {@code dateModified} for any field arriving from another
     *       node, including bookkeeping fields nobody edited.</li>
     * </ul>
     *
     * <p>A package's work window is operator-entered and never rewritten by either, so it is the
     * honest signal. Falls back to the job's creation time when it has no packages at all.
     */
    private LocalDateTime lastActivity(JobLog job) {
        LocalDateTime latest = null;
        if (job.getPackages() != null) {
            for (DailyPermitPackage pkg : job.getPackages()) {
                LocalDateTime scheduled = packageAnchor(pkg);
                if (scheduled != null && (latest == null || scheduled.isAfter(latest))) {
                    latest = scheduled;
                }
            }
        }
        return latest != null ? latest : job.getDateCreated();
    }

    /**
     * Package dates are not stored in one shape. Most are {@code MM/dd/yyyy}, some are a plain ISO
     * date, and some are a full ISO instant ({@code 2025-10-19T00:00:00.000Z}) from a date picker.
     * All three have to parse or the row silently falls back to its creation time and its
     * "hours open" reads wrong.
     */
    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        String v = value.trim();
        int t = v.indexOf('T');
        if (t == 10) v = v.substring(0, t);          // ISO instant -> ISO date
        try {
            return LocalDate.parse(v, DATE_FMT);
        } catch (Exception ignored) {
            try {
                return LocalDate.parse(v);
            } catch (Exception e) {
                return null;
            }
        }
    }

    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalTime.parse(value.trim());
        } catch (Exception ignored) {
            return null;
        }
    }
}
