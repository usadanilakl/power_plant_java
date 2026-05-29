package com.dk_power.power_plant_java.sevice.automation.redtag;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgConfinedSpaceService;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.ConfinedSpaceBuildFlow;
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
 * Entry point for "build this Confined Space permit in Red Tag". Mirrors
 * {@link RedTagHotWorkAutomationService} / {@link RedTagSafeWorkAutomationService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedTagConfinedSpaceAutomationService {

    private static final String PERMIT_TYPE = "ConfinedSpace";

    private final StepEngine stepEngine;
    private final LoginFlow loginFlow;
    private final ConfinedSpaceBuildFlow csBuildFlow;
    private final NgConfinedSpaceService csService;
    private final RedTagAutomationProperties properties;

    public AutomationSession startConfinedSpaceBuild(ConfinedSpaceDto cs) {
        return startConfinedSpaceBuild(cs, null, null);
    }

    public AutomationSession startConfinedSpaceBuild(ConfinedSpaceDto cs, Integer fromStep, Integer toStep) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("Red Tag automation is disabled (redtag.automation.enabled=false)");
        }
        AutomationSession session = buildSession(cs);
        applyStepRange(session, fromStep, toStep);
        Map<String, Supplier<String>> actions = buildActions(cs);
        log.info("[RedTag] Starting Confined Space build '{}' (steps {}-{})",
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

    private AutomationSession buildSession(ConfinedSpaceDto cs) {
        AutomationSession session = new AutomationSession();
        session.setPackageId(cs.getId());
        session.setPackageName("Confined Space " + (cs.getDocNum() != null ? cs.getDocNum() : cs.getId())
                + " (" + cs.getCsType() + ")");

        Long id = cs.getId();
        List<AutomationStep> steps = new ArrayList<>();
        steps.add(new AutomationStep(0, "open-app", "Open Red Tag Application", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(1, "login", "Log in to Red Tag", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(2, "open-form", "Open Confined Space Form", "confinedSpace", PERMIT_TYPE, id));
        steps.add(new AutomationStep(3, "fill-general", "Fill General Information", "confinedSpace", PERMIT_TYPE, id));
        steps.add(new AutomationStep(4, "fill-hazards-precautions",
                "Fill Hazards & Precautions", "confinedSpace", PERMIT_TYPE, id));
        steps.add(new AutomationStep(5, "fill-ppe", "Fill PPE & Equipment", "confinedSpace", PERMIT_TYPE, id));
        steps.add(new AutomationStep(6, "save", "Save & Read Permit Number", "confinedSpace", PERMIT_TYPE, id));
        session.setSteps(steps);
        return session;
    }

    private Map<String, Supplier<String>> buildActions(ConfinedSpaceDto cs) {
        Map<String, Supplier<String>> actions = new LinkedHashMap<>();
        actions.put("open-app", loginFlow::ensureAppOpen);
        actions.put("login", loginFlow::ensureLoggedIn);
        actions.put("open-form", () -> csBuildFlow.openConfinedSpaceForm(cs));
        actions.put("fill-general", () -> csBuildFlow.fillGeneralInfo(cs));
        actions.put("fill-hazards-precautions", () -> csBuildFlow.fillHazardsAndPrecautions(cs));
        actions.put("fill-ppe", () -> csBuildFlow.fillPpe(cs));
        actions.put("save", () -> {
            csBuildFlow.save();
            String number = csBuildFlow.readPermitNumber();
            cs.setRedTagNum(number);
            try {
                csService.save(cs);
            } catch (Exception e) {
                log.error("[RedTag] Confined Space {} saved in Red Tag as {} but local persist failed: {}",
                        cs.getId(), number, e.getMessage(), e);
                return "Confined Space saved in Red Tag as " + number
                        + " but FAILED to persist redTagNum locally: " + e.getMessage();
            }
            return "Confined Space saved — Red Tag number " + number;
        });
        return actions;
    }
}
