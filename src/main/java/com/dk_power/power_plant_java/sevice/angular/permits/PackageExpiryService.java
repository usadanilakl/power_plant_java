package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Expires permit packages whose validity window has run out.
 *
 * <p>A package authorises one twelve-hour shift. Past that it is not "work still running" — it is
 * an invalid document, and treating it as live is the actual hazard. The default grace of four
 * hours on top is there so an operator finishing a late shift is never racing the clock.
 *
 * <h2>Expired, not Closed — and the difference matters</h2>
 *
 * Closing asserts two things this sweep cannot know: that the work finished, and that everybody
 * came off the job. Expiring asserts only what is true — the authorisation lapsed. So:
 *
 * <ul>
 *   <li>{@code workCompleted} is left alone. Nobody knows whether the work happened.</li>
 *   <li><b>Personnel are NOT auto-signed-off.</b> The operator close path does that, because a
 *       person closing a package is stating the crew is out. A timer knows nothing of the sort, and
 *       erasing the sign-on record would delete the only evidence of who was in the field. A
 *       package that expires with people still signed on is an alarm, so those are counted and
 *       logged separately rather than tidied away.</li>
 *   <li>An expired package can be re-activated. {@code activatePackage} accepts Expired precisely
 *       so a wrong expiry costs one click instead of stranding real work.</li>
 * </ul>
 *
 * <h2>What it will not do</h2>
 *
 * <ul>
 *   <li><b>LOTO is never touched.</b> Isolation has its own lifecycle, outlives any single
 *       package, and is the one thing keeping people safe. {@code cascadeStatusToPermits} already
 *       excludes it; this sweep adds no path of its own.</li>
 *   <li><b>A package whose work window cannot be parsed is skipped.</b> Dates here are strings in
 *       several formats, and an unparseable one means "we do not know when", not "long ago".
 *       Guessing would expire live work. They are counted so they stay visible, and the manual
 *       Admin sweep — which has a human looking at it — still catches them.</li>
 * </ul>
 *
 * <h2>Where it runs</h2>
 *
 * Same guard as {@link WorkRequestExpiryService}: the hub when online, a client only when the hub
 * is unreachable. And the same warning applies — {@code serverAvailable} starts false, so a test
 * instance with sync disabled ARMS this sweep rather than disabling it. Set
 * {@code permits.package.expiry.enabled=false} on anything holding a copy of production data that
 * is not the production hub.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PackageExpiryService {

    /** States that already mean "finished" — nothing left to expire. */
    private static final Set<String> TERMINAL =
            Set.of("closed", "expired", "processed", "cancelled", "canceled");

    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final NgDailyPermitPackageService packageService;
    private final JobPackageMaintenanceService maintenanceService;
    private final SyncConfig syncConfig;
    @Lazy private final CentralSyncService centralSyncService;

    @Value("${permits.package.expiry.enabled:true}")
    private boolean expiryEnabled;

    /** 12h of permit validity plus 4h for operators to catch up. */
    @Value("${permits.package.expiry.hours:16}")
    private int expiryHours;

    /**
     * Runaway guard, not a throttle. One misconfigured instance should not be able to rewrite the
     * whole table in a single pass; whatever it skips is picked up next hour. Anything dropped is
     * logged rather than silently swallowed.
     */
    @Value("${permits.package.expiry.max-per-run:200}")
    private int maxPerRun;

    @Scheduled(fixedDelay = 3600000, initialDelay = 300000) // hourly, 5 min after start
    public void expireOverduePackages() {
        if (!expiryEnabled) {
            log.debug("[Pkg Expiry] Disabled via permits.package.expiry.enabled=false");
            return;
        }
        boolean shouldRunLocally = syncConfig.isHubMode() || !centralSyncService.isServerAvailable();
        if (!shouldRunLocally) {
            log.debug("[Pkg Expiry] Skipping — the hub is available and owns this sweep");
            return;
        }
        Map<String, Object> result = run(false);
        int expired = (int) result.get("expired");
        if (expired > 0 || !((List<?>) result.get("failures")).isEmpty()) {
            log.info("[Pkg Expiry] expired={} withPersonnelStillOn={} undated={} failures={}",
                    expired, result.get("expiredWithPersonnelOn"),
                    result.get("skippedUndated"), result.get("failures"));
        }
    }

    /** What the sweep would do right now, without doing it. Drives the Admin preview. */
    public Map<String, Object> preview() {
        return run(true);
    }

    /**
     * Run the sweep on demand, bypassing the schedule and the hub guard.
     *
     * <p>The guard exists to stop two nodes doing the same work unprompted; an operator pressing a
     * button in Admin is prompted by definition. It also means the existing backlog can be drained
     * immediately instead of an hour at a time.
     */
    public Map<String, Object> runNow(boolean dryRun) {
        return run(dryRun);
    }

    /**
     * One pass.
     *
     * <p>Each package is expired in its own transaction via
     * {@link NgDailyPermitPackageService#expirePackage}, so one bad row cannot mark a shared
     * transaction rollback-only and discard every expiry that already succeeded — the failure mode
     * that silently wiped a whole stale-package sweep.
     */
    private Map<String, Object> run(boolean dryRun) {
        LocalDateTime now = LocalDateTime.now();
        List<Map<String, Object>> due = new ArrayList<>();
        List<String> failures = new ArrayList<>();
        int skippedUndated = 0;
        int expiredWithPersonnelOn = 0;
        boolean capped = false;

        for (DailyPermitPackage pkg : dailyPermitPackageRepo.findAllOpenPackages()) {
            if (pkg == null || pkg.getId() == null) continue;
            String status = pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : "Building";
            if (TERMINAL.contains(status.toLowerCase())) continue;

            LocalDateTime windowStart = maintenanceService.packageWindowStart(pkg);
            if (windowStart == null) {
                skippedUndated++;
                continue;
            }
            if (!windowStart.plusHours(expiryHours).isBefore(now)) continue;

            if (due.size() >= maxPerRun) {
                capped = true;
                break;
            }

            boolean personnelStillOn = !pkg.getSignedOnPersonnel().isEmpty();
            if (personnelStillOn) expiredWithPersonnelOn++;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("packageId", pkg.getId());
            row.put("permitNumber", pkg.getPermitNumber());
            row.put("companyName", pkg.getCompanyName());
            row.put("status", status);
            row.put("windowStart", windowStart.toString());
            row.put("hoursOpen", java.time.Duration.between(windowStart, now).toHours());
            row.put("personnelStillSignedOn", personnelStillOn);
            due.add(row);
        }

        int expired = 0;
        if (!dryRun) {
            for (Map<String, Object> row : due) {
                Long id = (Long) row.get("packageId");
                try {
                    packageService.expirePackage(String.valueOf(id));
                    expired++;
                } catch (Exception e) {
                    failures.add("Package " + id + ": " + e.getClass().getSimpleName()
                            + ": " + e.getMessage());
                }
            }
        }

        if (capped) {
            log.warn("[Pkg Expiry] Hit the {}-per-run cap; more packages are due and will be "
                    + "picked up on the next pass", maxPerRun);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("dryRun", dryRun);
        out.put("expiryHours", expiryHours);
        out.put("dueCount", due.size());
        out.put("due", due);
        out.put("expired", expired);
        out.put("expiredWithPersonnelOn", expiredWithPersonnelOn);
        out.put("skippedUndated", skippedUndated);
        out.put("cappedAt", capped ? maxPerRun : null);
        out.put("failures", failures);
        return out;
    }
}
