package com.dk_power.power_plant_java.sevice.automation.redtag;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.LoginFlow;
import com.dk_power.power_plant_java.sevice.automation.redtag.flow.LotoBuildFlow;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationSession;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationStep;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.StepEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Public entry point for "build this LOTO in Red Tag".
 *
 * <p>Translates a {@link LotoDto} into an ordered {@link AutomationSession}, wires
 * each step to a flow action, and hands the session to the generic {@link StepEngine}.
 * All session controls (pause/resume/stop/retry/skip) delegate to the engine.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedTagLotoAutomationService {

    private static final String PERMIT_TYPE = "Loto";

    private final StepEngine stepEngine;
    private final LoginFlow loginFlow;
    private final LotoBuildFlow lotoBuildFlow;
    private final LotoPointMapper lotoPointMapper;
    private final NgLotoService lotoService;
    private final RedTagAutomationProperties properties;

    /** Builds the given LOTO in Red Tag, end to end, on a background thread. */
    public AutomationSession startLotoBuild(LotoDto loto) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("Red Tag automation is disabled (redtag.automation.enabled=false)");
        }
        List<LotoPointDto> points = toPointDtos(loto);
        AutomationSession session = buildSession(loto);
        Map<String, Supplier<String>> actions = buildActions(loto, points);
        log.info("[RedTag] Starting LOTO build '{}' with {} point(s)",
                session.getPackageName(), points.size());
        return stepEngine.run(session, actions);
    }

    // --- session / step assembly --------------------------------------------

    private AutomationSession buildSession(LotoDto loto) {
        AutomationSession session = new AutomationSession();
        session.setPackageId(loto.getId());
        session.setPackageName("LOTO " + (loto.getDocNum() != null ? loto.getDocNum() : loto.getId()));

        Long id = loto.getId();
        List<AutomationStep> steps = new ArrayList<>();
        steps.add(new AutomationStep(0, "open-app", "Open Red Tag Application", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(1, "login", "Log in to Red Tag", "setup", PERMIT_TYPE, id));
        steps.add(new AutomationStep(2, "open-builder", "Open LOTO Builder", "loto", PERMIT_TYPE, id));
        steps.add(new AutomationStep(3, "fill-header", "Fill LOTO Header", "loto", PERMIT_TYPE, id));
        steps.add(new AutomationStep(4, "add-points", "Add LOTO Points", "loto", PERMIT_TYPE, id));
        steps.add(new AutomationStep(5, "fill-details", "Fill LOTO Information Form", "loto", PERMIT_TYPE, id));
        steps.add(new AutomationStep(6, "save", "Submit & Save LOTO Number", "loto", PERMIT_TYPE, id));
        session.setSteps(steps);
        return session;
    }

    private Map<String, Supplier<String>> buildActions(LotoDto loto, List<LotoPointDto> points) {
        Map<String, Supplier<String>> actions = new LinkedHashMap<>();
        actions.put("open-app", loginFlow::ensureAppOpen);
        actions.put("login", loginFlow::ensureLoggedIn);
        actions.put("open-builder", lotoBuildFlow::openLotoBuilder);
        actions.put("fill-header", () -> lotoBuildFlow.fillHeader(loto));
        actions.put("add-points", () -> lotoBuildFlow.addPoints(points));
        actions.put("fill-details", () -> {
            lotoBuildFlow.openLotoDetails();
            return lotoBuildFlow.fillLotoDetails(loto);
        });
        actions.put("save", () -> {
            lotoBuildFlow.submitLotoDetails();
            String number = lotoBuildFlow.readPermitNumber();
            loto.setRedTagNum(number);
            try {
                lotoService.save(loto);
            } catch (Exception e) {
                log.error("[RedTag] LOTO {} saved in Red Tag as {} but local persist failed: {}",
                        loto.getId(), number, e.getMessage(), e);
                return "LOTO saved in Red Tag as " + number
                        + " but FAILED to persist redTagNum locally: " + e.getMessage();
            }
            return "LOTO saved — Red Tag number " + number;
        });
        return actions;
    }

    private List<LotoPointDto> toPointDtos(LotoDto loto) {
        if (loto.getLotoPoints() == null) {
            return List.of();
        }
        return loto.getLotoPoints().stream()
                .map(lotoPointMapper::convertToDto)
                .toList();
    }

    // --- session controls (delegated to the engine) -------------------------

    public AutomationSession pause() {
        return stepEngine.pause();
    }

    public AutomationSession resume() {
        return stepEngine.resume();
    }

    public AutomationSession stop() {
        return stepEngine.stop();
    }

    public AutomationSession retryStep() {
        return stepEngine.retryStep();
    }

    public AutomationSession skipStep() {
        return stepEngine.skipStep();
    }

    public AutomationSession getSession() {
        return stepEngine.getSession();
    }

    public void setManualConfirmation(boolean enabled) {
        stepEngine.setManualConfirmation(enabled);
    }

    public boolean isManualConfirmation() {
        return stepEngine.isManualConfirmation();
    }
}
