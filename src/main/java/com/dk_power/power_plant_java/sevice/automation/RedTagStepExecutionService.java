package com.dk_power.power_plant_java.sevice.automation;

import com.dk_power.power_plant_java.controller.automation.RedTagProgressController;
import com.dk_power.power_plant_java.dto.automation.*;
import com.dk_power.power_plant_java.dto.permits.*;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgConfinedSpaceService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgHotWorkService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgSafeWorkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.script.FindFailed;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedTagStepExecutionService {

    private final RedTagAutomationService redTagService;
    private final RedTagProgressController progressController;
    private final NgHotWorkService hotWorkService;
    private final NgConfinedSpaceService confinedSpaceService;
    private final NgSafeWorkService safeWorkService;
    private final NgLotoService lotoService;
    private final LotoPointMapper lotoPointMapper;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private volatile AutomationSessionState session;
    private volatile boolean pauseRequested;
    private volatile boolean stopRequested;
    private volatile boolean manualConfirmation;
    private Future<?> runningTask;

    // Step actions built per-session (closures over the package DTOs)
    private Map<String, Supplier<String>> stepActions;

    public synchronized AutomationSessionState startBuild(DailyPermitPackageDto packageDto) {
        if (session != null && session.getStatus() == SessionStatus.RUNNING) {
            throw new IllegalStateException("A build is already running");
        }

        session = new AutomationSessionState();
        session.setPackageId(packageDto.getId());
        session.setPackageName(packageDto.getName());
        session.setStartTimeMs(System.currentTimeMillis());
        session.setStatus(SessionStatus.RUNNING);

        pauseRequested = false;
        stopRequested = false;

        buildStepQueue(packageDto);
        buildStepActions(packageDto);

        progressController.broadcastSessionState("session_started", session);

        runningTask = executor.submit(() -> executeLoop());
        return session;
    }

    public synchronized AutomationSessionState startLotoBuild(LotoDto lotoDto) {
        if (session != null && session.getStatus() == SessionStatus.RUNNING) {
            throw new IllegalStateException("A build is already running");
        }

        session = new AutomationSessionState();
        session.setPackageName("LOTO " + (lotoDto.getDocNum() != null ? lotoDto.getDocNum() : lotoDto.getId()));
        session.setStartTimeMs(System.currentTimeMillis());
        session.setStatus(SessionStatus.RUNNING);

        pauseRequested = false;
        stopRequested = false;

        buildLotoStepQueue(lotoDto);
        buildLotoStepActions(lotoDto);

        progressController.broadcastSessionState("session_started", session);

        runningTask = executor.submit(() -> executeLoop());
        return session;
    }

    public synchronized AutomationSessionState pauseBuild() {
        if (session == null || session.getStatus() != SessionStatus.RUNNING) {
            throw new IllegalStateException("No running build to pause");
        }
        pauseRequested = true;
        return session;
    }

    public synchronized AutomationSessionState resumeBuild() {
        if (session == null || session.getStatus() != SessionStatus.PAUSED) {
            throw new IllegalStateException("No paused build to resume");
        }
        pauseRequested = false;
        session.setStatus(SessionStatus.RUNNING);
        session.setLastUpdateMs(System.currentTimeMillis());
        progressController.broadcastSessionState("session_resumed", session);
        runningTask = executor.submit(() -> executeLoop());
        return session;
    }

    public synchronized AutomationSessionState stopBuild() {
        if (session == null) {
            throw new IllegalStateException("No build session exists");
        }
        stopRequested = true;
        if (runningTask != null) {
            runningTask.cancel(true);
        }
        for (AutomationStep step : session.getSteps()) {
            if (step.getStatus() == StepStatus.PENDING || step.getStatus() == StepStatus.RUNNING) {
                step.setStatus(StepStatus.SKIPPED);
            }
        }
        session.setStatus(SessionStatus.COMPLETED);
        session.setLastUpdateMs(System.currentTimeMillis());
        progressController.broadcastSessionState("session_complete", session);
        return session;
    }

    public synchronized AutomationSessionState retryStep() {
        if (session == null || session.getStatus() != SessionStatus.FAILED) {
            throw new IllegalStateException("No failed build to retry");
        }
        AutomationStep failedStep = session.getSteps().get(session.getCurrentStepIndex());
        failedStep.setStatus(StepStatus.PENDING);
        failedStep.setErrorMessage(null);
        failedStep.setStartTimeMs(0);
        failedStep.setEndTimeMs(0);

        pauseRequested = false;
        stopRequested = false;
        session.setStatus(SessionStatus.RUNNING);
        session.setLastUpdateMs(System.currentTimeMillis());
        progressController.broadcastSessionState("session_resumed", session);
        runningTask = executor.submit(() -> executeLoop());
        return session;
    }

    public synchronized AutomationSessionState skipStep() {
        if (session == null || session.getStatus() != SessionStatus.FAILED) {
            throw new IllegalStateException("No failed build to skip");
        }
        AutomationStep failedStep = session.getSteps().get(session.getCurrentStepIndex());
        failedStep.setStatus(StepStatus.SKIPPED);
        progressController.broadcastStepUpdate(failedStep);

        // Advance to next step
        session.setCurrentStepIndex(session.getCurrentStepIndex() + 1);
        if (session.getCurrentStepIndex() >= session.getSteps().size()) {
            session.setStatus(SessionStatus.COMPLETED);
            session.setLastUpdateMs(System.currentTimeMillis());
            progressController.broadcastSessionState("session_complete", session);
        } else {
            pauseRequested = false;
            stopRequested = false;
            session.setStatus(SessionStatus.RUNNING);
            session.setLastUpdateMs(System.currentTimeMillis());
            progressController.broadcastSessionState("session_resumed", session);
            runningTask = executor.submit(() -> executeLoop());
        }
        return session;
    }

    public AutomationSessionState getSessionState() {
        return session;
    }

    public synchronized void setManualConfirmation(boolean enabled) {
        this.manualConfirmation = enabled;
    }

    public boolean isManualConfirmation() {
        return manualConfirmation;
    }

    // --- Execution Loop ---

    private void executeLoop() {
        Thread.interrupted(); // clear any stale interrupt flag from previous tasks on this executor thread
        try {
            List<AutomationStep> steps = session.getSteps();
            int startIdx = session.getCurrentStepIndex();
            if (startIdx < 0) startIdx = 0;

            for (int i = startIdx; i < steps.size(); i++) {
                if (stopRequested || Thread.currentThread().isInterrupted()) {
                    break;
                }
                if (pauseRequested) {
                    session.setStatus(SessionStatus.PAUSED);
                    session.setLastUpdateMs(System.currentTimeMillis());
                    progressController.broadcastSessionState("session_paused", session);
                    return;
                }

                AutomationStep step = steps.get(i);
                if (step.getStatus() == StepStatus.SUCCESS || step.getStatus() == StepStatus.SKIPPED) {
                    continue;
                }

                session.setCurrentStepIndex(i);
                executeStep(step);

                if (step.getStatus() == StepStatus.FAILED) {
                    session.setStatus(SessionStatus.FAILED);
                    session.setLastUpdateMs(System.currentTimeMillis());
                    progressController.broadcastSessionState("session_failed", session);
                    return;
                }

                // Manual confirmation: pause after each successful step so user must click Resume
                if (manualConfirmation && step.getStatus() == StepStatus.SUCCESS) {
                    session.setStatus(SessionStatus.PAUSED);
                    session.setLastUpdateMs(System.currentTimeMillis());
                    progressController.broadcastSessionState("awaiting_confirmation", session);
                    return;
                }

                // Small pause between steps for stability
                Thread.sleep(200);
            }

            // All steps completed
            if (!stopRequested) {
                session.setStatus(SessionStatus.COMPLETED);
                session.setLastUpdateMs(System.currentTimeMillis());
                progressController.broadcastSessionState("session_complete", session);
            }
        } catch (InterruptedException e) {
            // Don't re-set interrupt flag — executor thread is reused for future tasks
            log.info("Build execution interrupted");
        } catch (Exception e) {
            log.error("Unexpected error in build execution: {}", e.getMessage(), e);
            session.setStatus(SessionStatus.FAILED);
            session.setLastUpdateMs(System.currentTimeMillis());
            progressController.broadcastSessionState("session_failed", session);
        }
    }

    private void executeStep(AutomationStep step) {
        step.setStatus(StepStatus.RUNNING);
        step.setStartTimeMs(System.currentTimeMillis());
        progressController.broadcastStepUpdate(step);

        Supplier<String> action = stepActions.get(step.getId());
        if (action == null) {
            step.setStatus(StepStatus.FAILED);
            step.setErrorMessage("No action registered for step: " + step.getId());
            step.setEndTimeMs(System.currentTimeMillis());
            progressController.broadcastStepUpdate(step);
            return;
        }

        try {
            String result = action.get();
            if (result != null && result.toLowerCase().contains("failed")) {
                step.setStatus(StepStatus.FAILED);
                step.setErrorMessage(result);
            } else {
                step.setStatus(StepStatus.SUCCESS);
            }
        } catch (Exception e) {
            step.setStatus(StepStatus.FAILED);
            step.setErrorMessage(formatError(e));
        }

        step.setEndTimeMs(System.currentTimeMillis());
        session.setLastUpdateMs(System.currentTimeMillis());
        progressController.broadcastStepUpdate(step);
    }

    // --- Step Queue Builder ---

    private void buildStepQueue(DailyPermitPackageDto packageDto) {
        List<AutomationStep> steps = new ArrayList<>();
        int idx = 0;

        steps.add(new AutomationStep(idx++, "open-app", "Open Red Tag Application", "setup"));
        steps.add(new AutomationStep(idx++, "login", "Login to Red Tag", "setup"));

        // LOTOs
        int lotoNum = 0;
        if (packageDto.getLotos() != null) {
            for (LotoDto loto : packageDto.getLotos()) {
                if (loto.getRedTagNum() != null) continue;
                lotoNum++;
                String suffix = "-" + lotoNum;
                Long pid = loto.getId();
                steps.add(new AutomationStep(idx++, "loto" + suffix + "-open", "Open LOTO Builder (#" + lotoNum + ")", "loto", "Loto", pid));
                steps.add(new AutomationStep(idx++, "loto" + suffix + "-no-standard", "Fill LOTO Header (#" + lotoNum + ")", "loto", "Loto", pid));
                steps.add(new AutomationStep(idx++, "loto" + suffix + "-add-points", "Add LOTO Points (#" + lotoNum + ")", "loto", "Loto", pid));
                steps.add(new AutomationStep(idx++, "loto" + suffix + "-save", "Save LOTO (#" + lotoNum + ")", "loto", "Loto", pid));
            }
        }

        // Hot Works
        int hwNum = 0;
        for (HotWorkDto hw : packageDto.getHotWorks()) {
            if (hw.getRedTagNum() != null) continue;
            hwNum++;
            String suffix = "-" + hwNum;
            Long pid = hw.getId();
            steps.add(new AutomationStep(idx++, "hw" + suffix + "-open", "Open Hot Work Builder (#" + hwNum + ")", "hotWork", "HotWork", pid));
            steps.add(new AutomationStep(idx++, "hw" + suffix + "-fill", "Fill Hot Work Form (#" + hwNum + ")", "hotWork", "HotWork", pid));
            steps.add(new AutomationStep(idx++, "hw" + suffix + "-save", "Save Hot Work (#" + hwNum + ")", "hotWork", "HotWork", pid));
        }

        // Confined Spaces
        int csNum = 0;
        for (ConfinedSpaceDto cs : packageDto.getConfinedSpaces()) {
            if (cs.getRedTagNum() != null) continue;
            csNum++;
            String suffix = "-" + csNum;
            Long pid = cs.getId();
            steps.add(new AutomationStep(idx++, "cs" + suffix + "-open", "Open Confined Space Builder (#" + csNum + ")", "confinedSpace", "ConfinedSpace", pid));
            steps.add(new AutomationStep(idx++, "cs" + suffix + "-fill", "Fill Confined Space Form (#" + csNum + ")", "confinedSpace", "ConfinedSpace", pid));
            steps.add(new AutomationStep(idx++, "cs" + suffix + "-save", "Save Confined Space (#" + csNum + ")", "confinedSpace", "ConfinedSpace", pid));
        }

        // Safe Works
        int swNum = 0;
        for (SafeWorkDto sw : packageDto.getSafeWorks()) {
            if (sw.getRedTagNum() != null) continue;
            swNum++;
            String suffix = "-" + swNum;
            Long pid = sw.getId();
            steps.add(new AutomationStep(idx++, "sw" + suffix + "-open", "Open Safe Work Builder (#" + swNum + ")", "safeWork", "SafeWork", pid));
            steps.add(new AutomationStep(idx++, "sw" + suffix + "-fill", "Fill Safe Work Form (#" + swNum + ")", "safeWork", "SafeWork", pid));
            steps.add(new AutomationStep(idx++, "sw" + suffix + "-save", "Save Safe Work (#" + swNum + ")", "safeWork", "SafeWork", pid));
            steps.add(new AutomationStep(idx++, "sw" + suffix + "-associate", "Associate Permits for Safe Work (#" + swNum + ")", "association", "SafeWork", pid));
        }

        session.setSteps(steps);
    }

    // --- Step Actions Builder ---

    private void buildStepActions(DailyPermitPackageDto packageDto) {
        stepActions = new LinkedHashMap<>();
        StringBuilder hotworkNums = new StringBuilder();
        StringBuilder spaceNums = new StringBuilder();

        String lotoNumbers = "";
        String lotoBoxes = "";
        List<LotoDto> lotos = packageDto.getLotos();
        if (lotos != null && !lotos.isEmpty()) {
            List<Integer> boxList = lotos.stream().map(LotoDto::getBoxNumber).toList();
            lotoBoxes = "LOTO Boxes: " + boxList;
            lotoNumbers = lotos.stream().map(LotoDto::getDocNum).toList().toString();
        }

        final String finalLotoNumbers = lotoNumbers;
        final String finalLotoBoxes = lotoBoxes;

        stepActions.put("open-app", () -> redTagService.openApp());
        stepActions.put("login", () -> redTagService.login());

        // LOTOs
        int lotoNum = 0;
        if (lotos != null) {
            for (LotoDto loto : lotos) {
                if (loto.getRedTagNum() != null) continue;
                lotoNum++;
                String suffix = "-" + lotoNum;
                final LotoDto lotoRef = loto;

                stepActions.put("loto" + suffix + "-open", () -> {
                    try {
                        return redTagService.openNewLotoBuilder();
                    } catch (FindFailed ex) { throw new RuntimeException(ex); }
                });
                stepActions.put("loto" + suffix + "-no-standard", () -> {
                    try {
                        return redTagService.openLotoBuilderWithNoStandard(lotoRef);
                    } catch (FindFailed ex) { throw new RuntimeException(ex); }
                });
                stepActions.put("loto" + suffix + "-add-points", () -> {
                    List<LotoPointDto> points = lotoRef.getLotoPoints() == null
                            ? java.util.List.of()
                            : lotoRef.getLotoPoints().stream().map(lotoPointMapper::convertToDto).toList();
                    return redTagService.buildWithNewPoints(points);
                });
                stepActions.put("loto" + suffix + "-save", () -> {
                    String permitNum = redTagService.saveLoto();
                    if (permitNum != null && !permitNum.toLowerCase().contains("failed")) {
                        lotoRef.setRedTagNum(permitNum);
                        try {
                            lotoService.save(lotoRef);
                        } catch (Exception saveErr) {
                            log.error("LOTO {} saved in Red Tag as {} but failed to persist to DB: {}",
                                    lotoRef.getId(), permitNum, saveErr.getMessage(), saveErr);
                            return "Failed to persist LOTO redTagNum=" + permitNum + ": " + saveErr.getMessage();
                        }
                    }
                    return permitNum;
                });
            }
        }

        // Hot Works
        int hwNum = 0;
        for (HotWorkDto hw : packageDto.getHotWorks()) {
            if (hw.getRedTagNum() != null) continue;
            hwNum++;
            String suffix = "-" + hwNum;
            final HotWorkDto hwRef = hw;

            stepActions.put("hw" + suffix + "-open", () -> redTagService.openNewHwBuilder());
            stepActions.put("hw" + suffix + "-fill", () -> redTagService.fillOutHwForm(hwRef));
            stepActions.put("hw" + suffix + "-save", () -> {
                String permitNum = redTagService.saveHwForm();
                if (permitNum != null && !permitNum.toLowerCase().contains("failed")) {
                    hotworkNums.append(",").append(permitNum);
                    hwRef.setRedTagNum(permitNum);
                    hotWorkService.save(hwRef);
                }
                return permitNum;
            });
        }

        // Confined Spaces
        int csNum = 0;
        for (ConfinedSpaceDto cs : packageDto.getConfinedSpaces()) {
            if (cs.getRedTagNum() != null) continue;
            csNum++;
            String suffix = "-" + csNum;
            final ConfinedSpaceDto csRef = cs;

            stepActions.put("cs" + suffix + "-open", () -> {
                csRef.setHotWorkNum(hotworkNums.toString());
                csRef.setLotoNum(finalLotoNumbers);
                return redTagService.openNewConfinedSpaceBuilder(csRef.getCsType());
            });
            stepActions.put("cs" + suffix + "-fill", () -> redTagService.fillOutCSForm(csRef));
            stepActions.put("cs" + suffix + "-save", () -> {
                String permitNum = redTagService.saveCsForm();
                if (permitNum != null && !permitNum.toLowerCase().contains("failed")) {
                    spaceNums.append(",").append(permitNum);
                    csRef.setRedTagNum(permitNum);
                    confinedSpaceService.save(csRef);
                }
                return permitNum;
            });
        }

        // Safe Works
        int swNum = 0;
        for (SafeWorkDto sw : packageDto.getSafeWorks()) {
            if (sw.getRedTagNum() != null) continue;
            swNum++;
            String suffix = "-" + swNum;
            final SafeWorkDto swRef = sw;

            stepActions.put("sw" + suffix + "-open", () -> {
                // Prepare safe work data before opening builder
                String specialInstructions = swRef.getSpecialInstructions();
                if (specialInstructions == null) {
                    specialInstructions = finalLotoBoxes;
                } else if (!specialInstructions.contains(finalLotoBoxes)) {
                    specialInstructions += ", " + finalLotoBoxes;
                }
                if (lotos != null && !lotos.isEmpty()) swRef.getPermits().setLotoRequired(true);
                boolean hasHotWork = packageDto.getHotWorks() != null && !packageDto.getHotWorks().isEmpty();
                if (hasHotWork) swRef.getPermits().setHotWork(true);
                List<ConfinedSpaceDto> allCs = packageDto.getConfinedSpaces();
                if (allCs != null && !allCs.isEmpty()) {
                    boolean hasReclassified = allCs.stream()
                            .anyMatch(c -> c.getCsType() == ConfinedSpaceType.RECLASSIFIED);
                    boolean hasPermitRequired = allCs.stream()
                            .anyMatch(c -> c.getCsType() == ConfinedSpaceType.PERMIT_REQUIRED
                                    || c.getCsType() == null);
                    swRef.getPermits().setConfinedSpace(hasReclassified || hasPermitRequired);
                }
                swRef.setSpecialInstructions(specialInstructions);
                return redTagService.openNewSafeWorkBuilder();
            });
            stepActions.put("sw" + suffix + "-fill", () -> redTagService.fillOutSafeWorkForm(swRef));
            stepActions.put("sw" + suffix + "-save", () -> {
                String permitNum = redTagService.saveSafeWork();
                if (permitNum != null && !permitNum.toLowerCase().contains("failed")) {
                    swRef.setRedTagNum(permitNum);
                    safeWorkService.save(swRef);
                }
                return permitNum;
            });
            stepActions.put("sw" + suffix + "-associate", () -> redTagService.associatePermits(packageDto));
        }
    }

    // --- Standalone LOTO build (single LotoDto) ---

    private void buildLotoStepQueue(LotoDto loto) {
        List<AutomationStep> steps = new ArrayList<>();
        int idx = 0;
        Long pid = loto.getId();

        steps.add(new AutomationStep(idx++, "open-app", "Open Red Tag Application", "setup"));
        steps.add(new AutomationStep(idx++, "login", "Login to Red Tag", "setup"));
        steps.add(new AutomationStep(idx++, "loto-1-open", "Open LOTO Builder", "loto", "Loto", pid));
        steps.add(new AutomationStep(idx++, "loto-1-no-standard", "Fill LOTO Header", "loto", "Loto", pid));
        steps.add(new AutomationStep(idx++, "loto-1-add-points", "Add LOTO Points", "loto", "Loto", pid));
        steps.add(new AutomationStep(idx++, "loto-1-save", "Save LOTO", "loto", "Loto", pid));

        session.setSteps(steps);
    }

    private void buildLotoStepActions(LotoDto loto) {
        stepActions = new LinkedHashMap<>();
        final LotoDto lotoRef = loto;

        stepActions.put("open-app", () -> redTagService.openApp());
        stepActions.put("login", () -> redTagService.login());

        stepActions.put("loto-1-open", () -> {
            try {
                return redTagService.openNewLotoBuilder();
            } catch (FindFailed ex) { throw new RuntimeException(ex); }
        });
        stepActions.put("loto-1-no-standard", () -> {
            try {
                return redTagService.openLotoBuilderWithNoStandard(lotoRef);
            } catch (FindFailed ex) { throw new RuntimeException(ex); }
        });
        stepActions.put("loto-1-add-points", () -> {
            List<LotoPointDto> points = lotoRef.getLotoPoints() == null
                    ? java.util.List.of()
                    : lotoRef.getLotoPoints().stream().map(lotoPointMapper::convertToDto).toList();
            return redTagService.buildWithNewPoints(points);
        });
        stepActions.put("loto-1-save", () -> {
            String permitNum = redTagService.saveLoto();
            if (permitNum != null && !permitNum.toLowerCase().contains("failed")) {
                lotoRef.setRedTagNum(permitNum);
                try {
                    lotoService.save(lotoRef);
                } catch (Exception saveErr) {
                    log.error("LOTO {} saved in Red Tag as {} but failed to persist to DB: {}",
                            lotoRef.getId(), permitNum, saveErr.getMessage(), saveErr);
                    return "Failed to persist LOTO redTagNum=" + permitNum + ": " + saveErr.getMessage();
                }
            }
            return permitNum;
        });
    }

    private String formatError(Exception e) {
        if (e instanceof FindFailed ff) {
            String msg = ff.getMessage();
            // Extract pattern filename from FindFailed message
            if (msg != null && msg.contains("/")) {
                String filename = msg.substring(msg.lastIndexOf("/") + 1);
                if (filename.contains("\\")) filename = filename.substring(filename.lastIndexOf("\\") + 1);
                if (filename.contains(".png")) {
                    filename = filename.substring(0, filename.indexOf(".png") + 4);
                    return "Could not find '" + filename + "' on screen. The element may not be visible.";
                }
            }
            return "Screen element not found: " + msg;
        }
        if (e instanceof RuntimeException && e.getCause() instanceof FindFailed) {
            return formatError((Exception) e.getCause());
        }
        return e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
    }
}
