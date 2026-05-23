package com.dk_power.power_plant_java.sevice.automation.redtag;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgSafeWorkService;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.LoginFlow;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.SafeWorkBuildFlow;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationSession;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationStep;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.StepEngine;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.StepStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Entry point for "build this Safe Work permit in Red Tag".
 *
 * <p>Turns a {@link SafeWorkDto} into a step queue and hands it to the shared
 * {@link StepEngine}. Session controls (pause/resume/stop/retry/skip) are shared
 * with the LOTO facade via that single engine, so the controller's existing
 * control endpoints work for a Safe Work build too.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedTagSafeWorkAutomationService {

    private static final String PERMIT_TYPE = "SafeWork";

    private final StepEngine stepEngine;
    private final LoginFlow loginFlow;
    private final SafeWorkBuildFlow safeWorkBuildFlow;
    private final NgSafeWorkService safeWorkService;
    private final RedTagAutomationProperties properties;

    /** Builds the given Safe Work permit in Red Tag, end to end, on a background thread. */
    public AutomationSession startSafeWorkBuild(SafeWorkDto safeWork) {
        return startSafeWorkBuild(safeWork, null, null);
    }

    /**
     * Builds the given Safe Work permit, optionally restricted to a contiguous step
     * range. {@code fromStep} and {@code toStep} are step indices (0-based); steps
     * outside the range are marked {@link StepStatus#SKIPPED} before the engine runs.
     * Pass {@code fromStep==toStep} to run a single step.
     */
    public AutomationSession startSafeWorkBuild(SafeWorkDto safeWork, Integer fromStep, Integer toStep) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("Red Tag automation is disabled (redtag.automation.enabled=false)");
        }
        AutomationSession session = buildSession(safeWork);
        applyStepRange(session, fromStep, toStep);
        Map<String, Supplier<String>> actions = buildActions(safeWork);
        log.info("[RedTag] Starting Safe Work build '{}' (steps {}-{})",
                session.getPackageName(),
                fromStep != null ? fromStep : 0,
                toStep != null ? toStep : session.getSteps().size() - 1);
        return stepEngine.run(session, actions);
    }

    /** Marks steps outside {@code [fromStep, toStep]} as SKIPPED and points currentStepIndex at fromStep. */
    private void applyStepRange(AutomationSession session, Integer fromStep, Integer toStep) {
        if (fromStep == null && toStep == null) return;
        List<AutomationStep> steps = session.getSteps();
        int last = steps.size() - 1;
        int from = Math.max(0, Math.min(fromStep != null ? fromStep : 0, last));
        int to = Math.max(from, Math.min(toStep != null ? toStep : last, last));
        for (int i = 0; i < steps.size(); i++) {
            if (i < from || i > to) steps.get(i).setStatus(StepStatus.SKIPPED);
        }
        session.setCurrentStepIndex(from);
    }

    private AutomationSession buildSession(SafeWorkDto sw) {
        AutomationSession session = new AutomationSession();
        session.setPackageId(sw.getId());
        session.setPackageName("Safe Work " + (sw.getDocNum() != null ? sw.getDocNum() : sw.getId()));

        Long id = sw.getId();
        List<AutomationStep> steps = new ArrayList<>();
        steps.add(new AutomationStep(0, "open-app", "Open Red Tag Application", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(1, "login", "Log in to Red Tag", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(2, "open-form", "Open Safe Work Form", "safeWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(3, "fill-header", "Fill Header", "safeWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(4, "fill-hazards", "Fill Safety Hazards", "safeWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(5, "fill-permits", "Fill Required Permits/Tests", "safeWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(6, "fill-ppe", "Fill Protective Equipment", "safeWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(7, "fill-footer", "Fill Instructions & Requestor", "safeWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(8, "save", "Save & Read Permit Number", "safeWork", PERMIT_TYPE, id));
        // NOTE: association is intentionally NOT a step here. Linking the SW to its
        // sibling LOTOs/permits requires the daily-package context (each sibling is
        // searched by its own identifying text — workScope for LOTOs, location for
        // HWs, etc.). It belongs in the package-level orchestrator and runs as the
        // final step after every sibling permit is built. SafeWorkBuildFlow exposes
        // associate() ready for that use.
        session.setSteps(steps);
        return session;
    }

    private Map<String, Supplier<String>> buildActions(SafeWorkDto sw) {
        Map<String, Supplier<String>> actions = new LinkedHashMap<>();
        actions.put("open-app", loginFlow::ensureAppOpen);
        actions.put("login", loginFlow::ensureLoggedIn);
        actions.put("open-form", safeWorkBuildFlow::openSafeWorkForm);
        actions.put("fill-header", () -> safeWorkBuildFlow.fillHeader(sw));
        actions.put("fill-hazards", () -> safeWorkBuildFlow.fillHazards(sw));
        actions.put("fill-permits", () -> safeWorkBuildFlow.fillPermits(sw));
        actions.put("fill-ppe", () -> safeWorkBuildFlow.fillPpe(sw));
        actions.put("fill-footer", () -> safeWorkBuildFlow.fillFooter(sw));
        actions.put("save", () -> {
            safeWorkBuildFlow.save();
            String number = safeWorkBuildFlow.readPermitNumber();
            sw.setRedTagNum(number);
            try {
                safeWorkService.save(sw);
            } catch (Exception e) {
                log.error("[RedTag] Safe Work {} saved in Red Tag as {} but local persist failed: {}",
                        sw.getId(), number, e.getMessage(), e);
                return "Safe Work saved in Red Tag as " + number
                        + " but FAILED to persist redTagNum locally: " + e.getMessage();
            }
            return "Safe Work saved — Red Tag number " + number;
        });
        return actions;
    }
}
