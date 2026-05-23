package com.dk_power.power_plant_java.sevice.automation.redtag.session;

import com.dk_power.power_plant_java.sevice.automation.redtag.core.AutomationException;
import com.dk_power.power_plant_java.sevice.automation.redtag.progress.RedTagProgressBroadcaster;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.basics.HotkeyEvent;
import org.sikuli.basics.HotkeyListener;
import org.sikuli.script.Env;
import org.sikuli.script.Key;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Supplier;

/**
 * Generic, permit-agnostic runner for an {@link AutomationSession}.
 *
 * <p>Each step is backed by a {@code Supplier<String>} action registered by name.
 * An action signals failure either by throwing (preferred) or by returning a
 * message containing {@code "failed"}. The engine runs steps on a single
 * background thread and supports pause / resume / stop / retry / skip, plus an
 * optional "manual confirmation" mode that halts after every successful step.
 *
 * <p>This is the cleaned-up successor of the legacy {@code RedTagStepExecutionService}:
 * the orchestration logic (which was sound) is kept; the per-permit knowledge is
 * pushed out to the flow/facade layer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StepEngine {

    private final RedTagProgressBroadcaster broadcaster;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private volatile AutomationSession session;
    private volatile Map<String, Supplier<String>> stepActions;
    private volatile boolean pauseRequested;
    private volatile boolean stopRequested;
    private volatile boolean manualConfirmation;
    private Future<?> runningTask;

    /**
     * Registers ESC as a global OS-level hotkey that pauses the running build.
     *
     * <p>The Angular panel's {@code document:keydown.escape} handler only fires
     * while the browser owns focus — and during a build SikuliX has stolen focus
     * for Red Tag. A SikuliX global hotkey fires regardless of which window is
     * active. Wrapped in {@code try/catch} so the app still starts on a
     * headless host (hub/server profiles) where the keyboard hook can't bind.
     */
    @PostConstruct
    void registerHotkeys() {
        try {
            Env.addHotkey(Key.ESC, 0, new HotkeyListener() {
                @Override
                public void hotkeyPressed(HotkeyEvent evt) {
                    AutomationSession s = session;
                    if (s != null && s.getStatus() == SessionStatus.RUNNING) {
                        log.info("[RedTag] ESC pressed — pausing build");
                        try {
                            pause();
                        } catch (Exception e) {
                            log.warn("[RedTag] ESC-triggered pause failed: {}", e.getMessage());
                        }
                    }
                }
            });
            log.info("[RedTag] Global ESC hotkey registered (pauses running build)");
        } catch (Throwable t) {
            log.warn("[RedTag] Could not register ESC hotkey ({}): {} — ESC pause unavailable",
                    t.getClass().getSimpleName(), t.getMessage());
        }
    }

    // --- Public control surface ---------------------------------------------

    /** Starts running the given session. Fails fast if a build is already running. */
    public synchronized AutomationSession run(AutomationSession newSession,
                                              Map<String, Supplier<String>> actions) {
        if (isRunning()) {
            throw new IllegalStateException("A Red Tag build is already running");
        }
        this.session = newSession;
        this.stepActions = actions;
        this.pauseRequested = false;
        this.stopRequested = false;
        session.setStatus(SessionStatus.RUNNING);
        session.setStartTimeMs(System.currentTimeMillis());
        session.setLastUpdateMs(session.getStartTimeMs());
        broadcaster.session("session_started", session);
        runningTask = executor.submit(this::executeLoop);
        return session;
    }

    public synchronized AutomationSession pause() {
        requireStatus(SessionStatus.RUNNING, "No running build to pause");
        pauseRequested = true;
        return session;
    }

    public synchronized AutomationSession resume() {
        requireStatus(SessionStatus.PAUSED, "No paused build to resume");
        pauseRequested = false;
        session.setStatus(SessionStatus.RUNNING);
        session.setLastUpdateMs(System.currentTimeMillis());
        broadcaster.session("session_resumed", session);
        runningTask = executor.submit(this::executeLoop);
        return session;
    }

    public synchronized AutomationSession stop() {
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
        broadcaster.session("session_complete", session);
        return session;
    }

    /** Resets the failed step to pending and resumes from it. */
    public synchronized AutomationSession retryStep() {
        requireStatus(SessionStatus.FAILED, "No failed build to retry");
        AutomationStep failed = session.getSteps().get(session.getCurrentStepIndex());
        failed.setStatus(StepStatus.PENDING);
        failed.setErrorMessage(null);
        failed.setStartTimeMs(0);
        failed.setEndTimeMs(0);
        pauseRequested = false;
        stopRequested = false;
        session.setStatus(SessionStatus.RUNNING);
        session.setLastUpdateMs(System.currentTimeMillis());
        broadcaster.session("session_resumed", session);
        runningTask = executor.submit(this::executeLoop);
        return session;
    }

    /** Marks the failed step skipped and continues with the next one. */
    public synchronized AutomationSession skipStep() {
        requireStatus(SessionStatus.FAILED, "No failed build to skip");
        AutomationStep failed = session.getSteps().get(session.getCurrentStepIndex());
        failed.setStatus(StepStatus.SKIPPED);
        broadcaster.step(failed);
        session.setCurrentStepIndex(session.getCurrentStepIndex() + 1);
        if (session.getCurrentStepIndex() >= session.getSteps().size()) {
            session.setStatus(SessionStatus.COMPLETED);
            session.setLastUpdateMs(System.currentTimeMillis());
            broadcaster.session("session_complete", session);
        } else {
            pauseRequested = false;
            stopRequested = false;
            session.setStatus(SessionStatus.RUNNING);
            session.setLastUpdateMs(System.currentTimeMillis());
            broadcaster.session("session_resumed", session);
            runningTask = executor.submit(this::executeLoop);
        }
        return session;
    }

    public AutomationSession getSession() {
        return session;
    }

    public synchronized void setManualConfirmation(boolean enabled) {
        this.manualConfirmation = enabled;
    }

    public boolean isManualConfirmation() {
        return manualConfirmation;
    }

    public boolean isRunning() {
        return session != null && session.getStatus() == SessionStatus.RUNNING;
    }

    // --- Execution -----------------------------------------------------------

    private void executeLoop() {
        Thread.interrupted(); // clear any stale interrupt from a previous task on this thread
        try {
            List<AutomationStep> steps = session.getSteps();
            int start = Math.max(0, session.getCurrentStepIndex());

            for (int i = start; i < steps.size(); i++) {
                if (stopRequested || Thread.currentThread().isInterrupted()) {
                    return;
                }
                if (pauseRequested) {
                    session.setStatus(SessionStatus.PAUSED);
                    session.setLastUpdateMs(System.currentTimeMillis());
                    broadcaster.session("session_paused", session);
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
                    broadcaster.session("session_failed", session);
                    return;
                }

                // Manual mode: stop after each success so the operator must click Resume.
                if (manualConfirmation) {
                    session.setStatus(SessionStatus.PAUSED);
                    session.setLastUpdateMs(System.currentTimeMillis());
                    broadcaster.session("awaiting_confirmation", session);
                    return;
                }

                Thread.sleep(200);
            }

            if (!stopRequested) {
                session.setStatus(SessionStatus.COMPLETED);
                session.setLastUpdateMs(System.currentTimeMillis());
                broadcaster.session("session_complete", session);
            }
        } catch (InterruptedException e) {
            log.info("[RedTag] Build execution interrupted");
        } catch (Exception e) {
            log.error("[RedTag] Unexpected error in build execution: {}", e.getMessage(), e);
            session.setStatus(SessionStatus.FAILED);
            session.setLastUpdateMs(System.currentTimeMillis());
            broadcaster.session("session_failed", session);
        }
    }

    private void executeStep(AutomationStep step) {
        step.setStatus(StepStatus.RUNNING);
        step.setStartTimeMs(System.currentTimeMillis());
        broadcaster.step(step);

        Supplier<String> action = stepActions.get(step.getId());
        if (action == null) {
            fail(step, "No action registered for step '" + step.getId() + "'");
            return;
        }
        try {
            String result = action.get();
            if (result != null && result.toLowerCase().contains("failed")) {
                fail(step, result);
            } else {
                step.setStatus(StepStatus.SUCCESS);
            }
        } catch (Exception e) {
            fail(step, formatError(e));
        }
        step.setEndTimeMs(System.currentTimeMillis());
        session.setLastUpdateMs(System.currentTimeMillis());
        broadcaster.step(step);
    }

    private void fail(AutomationStep step, String message) {
        step.setStatus(StepStatus.FAILED);
        step.setErrorMessage(message);
    }

    private void requireStatus(SessionStatus required, String message) {
        if (session == null || session.getStatus() != required) {
            throw new IllegalStateException(message);
        }
    }

    private String formatError(Throwable e) {
        if (e instanceof AutomationException ae) {
            return ae.getMessage();
        }
        Throwable cause = e.getCause();
        if (cause instanceof AutomationException ae) {
            return ae.getMessage();
        }
        return e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
    }
}
