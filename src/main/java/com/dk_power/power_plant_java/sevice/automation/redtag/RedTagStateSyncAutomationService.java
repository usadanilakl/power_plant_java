package com.dk_power.power_plant_java.sevice.automation.redtag;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.LoginFlow;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.RedTagStateSyncFlow;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationSession;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationStep;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.StepEngine;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.DiffAction;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.DiffEntry;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.DiffPlan;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagRow;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagScrapeResult;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagStateReconciler;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagStatus;
import com.dk_power.power_plant_java.sevice.loto.LotoBypassService;
import com.dk_power.power_plant_java.sevice.loto.LotoBypassService.BypassRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Public entry point for the Red Tag state-sync flow.
 *
 * <p>Orchestrates three orthogonal responsibilities:
 * <ol>
 *   <li><b>Scrape</b> — kicks off a background {@link StepEngine} session that
 *       drives {@link RedTagStateSyncFlow} to pull rows from the Red Tag list;</li>
 *   <li><b>Plan</b> — hands the scraped rows to {@link RedTagStateReconciler}
 *       to build a {@link DiffPlan} and caches it in memory for the preview UI;</li>
 *   <li><b>Apply</b> — takes the (possibly edited) plan back from the client
 *       and executes it via {@link LotoBypassService} + {@link NgLotoService}.
 *       Each row becomes exactly one audited bypass call.</li>
 * </ol>
 *
 * <p>State is intentionally in-memory only. If the app restarts between scrape
 * and apply, the operator re-scrapes — a small annoyance that avoids any risk
 * of applying a plan built against stale local state days later.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedTagStateSyncAutomationService {

    private static final String PERMIT_TYPE = "LotoStateSync";

    private final StepEngine stepEngine;
    private final LoginFlow loginFlow;
    private final RedTagStateSyncFlow stateSyncFlow;
    private final RedTagStateReconciler reconciler;
    private final LotoBypassService bypassService;
    private final NgLotoService lotoService;
    private final RedTagAutomationProperties properties;

    /** Set by the scrape session's final step; consumed by the preview + apply endpoints. */
    private volatile RedTagScrapeResult latestScrape;
    /** Diff plan built off {@link #latestScrape}. Never persisted; disposed on restart. */
    private volatile DiffPlan latestPlan;

    // ------------------------------------------------------------------------
    // Scrape session
    // ------------------------------------------------------------------------

    public AutomationSession startScrape(RedTagStatus status) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("Red Tag automation is disabled (redtag.automation.enabled=false)");
        }
        if (status == null) throw new IllegalArgumentException("status is required");

        AutomationSession session = buildSession(status);
        Map<String, Supplier<String>> actions = buildActions(status);
        log.info("[RedTag] Starting state sync scrape for status={}", status);
        return stepEngine.run(session, actions);
    }

    private AutomationSession buildSession(RedTagStatus status) {
        AutomationSession session = new AutomationSession();
        session.setPackageName("Red Tag state sync: " + status.name());

        List<AutomationStep> steps = new ArrayList<>();
        steps.add(new AutomationStep(0, "open-app", "Open Red Tag Application", "setup", PERMIT_TYPE, null));
        steps.add(new AutomationStep(1, "login", "Log in to Red Tag", "setup", PERMIT_TYPE, null));
        steps.add(new AutomationStep(2, "open-list", "Open LOTO Procedures list", "state-sync", PERMIT_TYPE, null));
        steps.add(new AutomationStep(3, "group-by-status", "Ensure list is grouped by Status", "state-sync", PERMIT_TYPE, null));
        steps.add(new AutomationStep(4, "expand-tab", "Expand the " + status.name() + " tab", "state-sync", PERMIT_TYPE, null));
        steps.add(new AutomationStep(5, "collapse-others", "Confirm other status tabs collapsed", "state-sync", PERMIT_TYPE, null));
        steps.add(new AutomationStep(6, "scrape-rows", "Read rows via OCR", "state-sync", PERMIT_TYPE, null));
        steps.add(new AutomationStep(7, "build-plan", "Build local diff plan", "state-sync", PERMIT_TYPE, null));
        session.setSteps(steps);
        return session;
    }

    private Map<String, Supplier<String>> buildActions(RedTagStatus status) {
        Map<String, Supplier<String>> actions = new LinkedHashMap<>();
        actions.put("open-app", loginFlow::ensureAppOpen);
        actions.put("login", loginFlow::ensureLoggedIn);
        actions.put("open-list", stateSyncFlow::openLotoList);
        actions.put("group-by-status", stateSyncFlow::ensureGroupedByStatus);
        actions.put("expand-tab", () -> stateSyncFlow.expandTab(status));
        actions.put("collapse-others", () -> stateSyncFlow.collapseOtherTabs(status));
        actions.put("scrape-rows", () -> {
            List<RedTagRow> rows = stateSyncFlow.scrapeRows(status);
            RedTagScrapeResult result = new RedTagScrapeResult();
            result.setStatus(status);
            result.setRows(rows);
            result.setScrapedAt(Instant.now());
            latestScrape = result;
            latestPlan = null; // invalidate any old plan tied to a previous scrape
            return "Scraped " + rows.size() + " row(s) from " + status.name() + " tab";
        });
        actions.put("build-plan", () -> {
            if (latestScrape == null) {
                throw new IllegalStateException("Scrape step must complete before plan can be built");
            }
            DiffPlan plan = reconciler.buildPlan(latestScrape);
            latestPlan = plan;
            return "Plan ready: " + plan.getEntries().size() + " entry/entries, "
                    + plan.getMatchedCount() + " matched, "
                    + plan.getLocalOnlyCount() + " local-only";
        });
        return actions;
    }

    // ------------------------------------------------------------------------
    // Cached scrape / plan accessors (used by the preview endpoint)
    // ------------------------------------------------------------------------

    public RedTagScrapeResult getLatestScrape() { return latestScrape; }
    public DiffPlan getLatestPlan() { return latestPlan; }

    /**
     * Re-runs the reconciler against the cached scrape. Useful when local LOTOs
     * changed between the scrape and the preview open (someone edited a permit
     * on another device) and the operator wants a fresh plan without re-scraping.
     */
    public DiffPlan rebuildPlan() {
        if (latestScrape == null) {
            throw new IllegalStateException("No scrape has completed yet");
        }
        DiffPlan plan = reconciler.buildPlan(latestScrape);
        latestPlan = plan;
        return plan;
    }

    // ------------------------------------------------------------------------
    // Apply — user-edited plan → per-entry bypass
    // ------------------------------------------------------------------------

    /**
     * Applies the diff plan the operator posted back after previewing / editing.
     * Every non-skipped entry becomes one {@link LotoBypassService#bypass(BypassRequest)}
     * call (or, for CREATE entries, a {@code NgLotoService.createFromScratch} +
     * bypass to set the target status). Each entry is applied in its own bypass
     * call so a failure on one row doesn't block the rest — the result carries a
     * per-entry disposition the caller can render.
     */
    public ApplyResult apply(DiffPlan editedPlan, String reasonOverride) {
        if (editedPlan == null) throw new IllegalArgumentException("plan is required");
        if (editedPlan.getStatus() == null) {
            throw new IllegalArgumentException("plan status is required");
        }
        // Enforce Control Authority ONCE, up-front. The per-entry try/catch
        // below is meant to isolate one row's failure from the rest; if we
        // let the CA check bubble from inside the loop it would be swallowed
        // there and the controller's 403 branch could never fire, and CREATE
        // rows would reach {@code createFromScratch} before the check ran.
        bypassService.requireControlAuthority();
        String reason = (reasonOverride != null && !reasonOverride.isBlank())
                ? reasonOverride
                : "Red Tag state sync (" + editedPlan.getStatus().name() + ")";
        String targetLocalStatus = editedPlan.getStatus().localPermitStatus();

        int applied = 0, skipped = 0, failed = 0;
        List<ApplyOutcome> outcomes = new ArrayList<>();

        for (DiffEntry entry : editedPlan.getEntries()) {
            if (entry.isSkip()) {
                skipped++;
                outcomes.add(new ApplyOutcome(entry.getKey(), "SKIPPED", null, null));
                continue;
            }
            try {
                Long affectedId = applyEntry(entry, targetLocalStatus, editedPlan.getStatus(), reason);
                applied++;
                outcomes.add(new ApplyOutcome(entry.getKey(), "OK", affectedId, null));
            } catch (Exception e) {
                failed++;
                log.error("[RedTag] Apply entry {} failed: {}", entry.getKey(), e.getMessage(), e);
                outcomes.add(new ApplyOutcome(entry.getKey(), "FAILED", entry.getLocalLotoId(),
                        e.getMessage()));
            }
        }

        // Invalidate the cached plan so a stale preview can't be re-submitted.
        latestPlan = null;
        return new ApplyResult(applied, skipped, failed, outcomes);
    }

    private Long applyEntry(DiffEntry entry, String targetLocalStatus,
                            RedTagStatus scrapeStatus, String reason) {
        DiffAction action = entry.getAction();
        if (action == null) throw new IllegalArgumentException("action is required on every entry");

        switch (action) {
            case CREATE -> {
                LotoIdDto seed = new LotoIdDto();
                seed.setWorkScope(entry.getRedTagJobDescription());
                seed.setLotoRequestor(entry.getRedTagRequestor());
                // BasePermitIdDto does not carry redTagNum — that field is patched
                // in the follow-up bypass call below, together with the target status.
                Integer box = tryParseInt(entry.getRedTagLockBox());
                LotoDto created = lotoService.createFromScratch(seed, box);
                // ALWAYS call bypass on the new LOTO — even for INACTIVE scrapes
                // where the target status ("Building") matches what
                // createFromScratch already produced and OCR could not read the
                // Red-Tag number. The call has two indispensable jobs beyond
                // the field patch: (a) it writes the {@link LotoBypassAudit}
                // row that ties this CREATE to the state-sync flow, and
                // (b) the audit trail is the "every CREATE was authorised by a
                // CA and driven by a scrape" contract. Skipping when nothing
                // changes would silently create audit-less LOTOs.
                String targetToApply = (targetLocalStatus != null
                        && !"Building".equalsIgnoreCase(targetLocalStatus))
                        ? targetLocalStatus : null;
                bypassService.bypass(new BypassRequest(
                        created.getId(), targetToApply, null, null, null,
                        emptyToNull(entry.getRedTagLotoNumber()),
                        reason + " — CREATE from RT row " + safe(entry.getRedTagLotoNumber()),
                        "STATE_SYNC"));
                return created.getId();
            }
            case UPDATE, ORPHAN -> {
                // ORPHAN needs a paired localLotoId to be applicable — the UI must have set it.
                if (entry.getLocalLotoId() == null) {
                    throw new IllegalArgumentException(
                            "Entry " + entry.getKey() + " needs a localLotoId (pair an orphan before applying)");
                }
                Loto out = bypassService.bypass(new BypassRequest(
                        entry.getLocalLotoId(),
                        targetLocalStatus,
                        emptyToNull(entry.getRedTagJobDescription()),
                        emptyToNull(entry.getRedTagRequestor()),
                        tryParseInt(entry.getRedTagLockBox()),
                        emptyToNull(entry.getRedTagLotoNumber()),
                        reason + " — " + action.name() + " from RT scrape",
                        "STATE_SYNC"));
                return out.getId();
            }
            case CLOSE -> {
                if (entry.getLocalLotoId() == null) {
                    throw new IllegalArgumentException(
                            "CLOSE entry " + entry.getKey() + " has no localLotoId");
                }
                Loto out = bypassService.bypass(new BypassRequest(
                        entry.getLocalLotoId(),
                        "Closed",
                        null, null, null, null,
                        reason + " — CLOSE (missing from RT " + scrapeStatus.name() + " tab)",
                        "STATE_SYNC"));
                return out.getId();
            }
        }
        return null;
    }

    private static Integer tryParseInt(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Integer.parseInt(s.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    private static String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s; }
    private static String safe(String s) { return s == null ? "?" : s; }

    // ------------------------------------------------------------------------
    // Session control delegates — identical to the LOTO build controller.
    // ------------------------------------------------------------------------

    public AutomationSession pause() { return stepEngine.pause(); }
    public AutomationSession resume() { return stepEngine.resume(); }
    public AutomationSession stop() { return stepEngine.stop(); }
    public AutomationSession retryStep() { return stepEngine.retryStep(); }
    public AutomationSession skipStep() { return stepEngine.skipStep(); }
    public AutomationSession getSession() { return stepEngine.getSession(); }

    // ------------------------------------------------------------------------
    // Apply result carriers
    // ------------------------------------------------------------------------

    /** Aggregate outcome of {@link #apply(DiffPlan, String)}. */
    public record ApplyResult(int applied, int skipped, int failed, List<ApplyOutcome> outcomes) {}
    /** Per-entry outcome. {@code status} is one of OK / SKIPPED / FAILED. */
    public record ApplyOutcome(String entryKey, String status, Long affectedLotoId, String errorMessage) {}
}
