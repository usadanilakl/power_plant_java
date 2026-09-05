package com.dk_power.power_plant_java.sevice.automation.redtag;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgHotWorkService;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.HotWorkBuildFlow;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.LoginFlow;
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
 * Entry point for "build this Hot Work permit in Red Tag". Mirrors
 * {@link RedTagSafeWorkAutomationService}: turns a {@link HotWorkDto} into a step
 * queue and hands it to the shared {@link StepEngine}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedTagHotWorkAutomationService {

    private static final String PERMIT_TYPE = "HotWork";

    private final StepEngine stepEngine;
    private final LoginFlow loginFlow;
    private final HotWorkBuildFlow hotWorkBuildFlow;
    private final NgHotWorkService hotWorkService;
    private final RedTagAutomationProperties properties;

    public AutomationSession startHotWorkBuild(HotWorkDto hotWork) {
        return startHotWorkBuild(hotWork, null, null);
    }

    public AutomationSession startHotWorkBuild(HotWorkDto hotWork, Integer fromStep, Integer toStep) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("Red Tag automation is disabled (redtag.automation.enabled=false)");
        }
        AutomationSession session = buildSession(hotWork);
        applyStepRange(session, fromStep, toStep);
        Map<String, Supplier<String>> actions = buildActions(hotWork);
        log.info("[RedTag] Starting Hot Work build '{}' (steps {}-{})",
                session.getPackageName(),
                fromStep != null ? fromStep : 0,
                toStep != null ? toStep : session.getSteps().size() - 1);
        return stepEngine.run(session, actions);
    }

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

    private AutomationSession buildSession(HotWorkDto hw) {
        AutomationSession session = new AutomationSession();
        session.setPackageId(hw.getId());
        session.setPackageName("Hot Work " + (hw.getDocNum() != null ? hw.getDocNum() : hw.getId()));

        Long id = hw.getId();
        List<AutomationStep> steps = new ArrayList<>();
        steps.add(new AutomationStep(0, "open-app", "Open Red Tag Application", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(1, "login", "Log in to Red Tag", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(2, "open-form", "Open Hot Work Form", "hotWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(3, "fill-header", "Fill Header & Work Type", "hotWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(4, "fill-measures", "Fill Checklist & Fire Protection", "hotWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(5, "fill-air-test", "Fill Initial Air Test", "hotWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(6, "fill-requirements", "Fill Requirements & Approval", "hotWork", PERMIT_TYPE, id));
        steps.add(new AutomationStep(7, "save", "Save & Read Permit Number", "hotWork", PERMIT_TYPE, id));
        session.setSteps(steps);
        return session;
    }

    private Map<String, Supplier<String>> buildActions(HotWorkDto hw) {
        Map<String, Supplier<String>> actions = new LinkedHashMap<>();
        actions.put("open-app", loginFlow::ensureAppOpen);
        actions.put("login", loginFlow::ensureLoggedIn);
        actions.put("open-form", hotWorkBuildFlow::openHotWorkForm);
        actions.put("fill-header", () -> hotWorkBuildFlow.fillHeader(hw));
        actions.put("fill-measures", () -> hotWorkBuildFlow.fillMeasures(hw));
        actions.put("fill-air-test", () -> hotWorkBuildFlow.fillInitialAirTest(hw));
        actions.put("fill-requirements", () -> hotWorkBuildFlow.fillRequirements(hw));
        actions.put("save", () -> {
            hotWorkBuildFlow.save();
            String number = hotWorkBuildFlow.readPermitNumber();
            hw.setRedTagNum(number);
            try {
                hotWorkService.save(hw);
            } catch (Exception e) {
                log.error("[RedTag] Hot Work {} saved in Red Tag as {} but local persist failed: {}",
                        hw.getId(), number, e.getMessage(), e);
                return "Hot Work saved in Red Tag as " + number
                        + " but FAILED to persist redTagNum locally: " + e.getMessage();
            }
            return "Hot Work saved — Red Tag number " + number;
        });
        return actions;
    }
}
