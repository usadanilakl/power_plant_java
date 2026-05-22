package com.dk_power.power_plant_java.sevice.automation.redtag.core;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.sun.jna.platform.win32.User32;
import com.sun.jna.platform.win32.WinDef;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Owns the Red Tag desktop application process and its top-level window:
 * launching it, detecting whether it is running, and bringing it to the
 * foreground maximised so SikuliX always works against a known window state.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RedTagWindow {

    private static final int SW_MAXIMIZE = 3;
    private static final int SW_RESTORE = 9;

    private final RedTagAutomationProperties properties;

    /** @return {@code true} if a process with the configured image name is running. */
    public boolean isRunning() {
        try {
            Process process = new ProcessBuilder("tasklist.exe").start();
            String tasks = new String(process.getInputStream().readAllBytes());
            return tasks.contains(properties.getProcessName());
        } catch (Exception e) {
            log.warn("[RedTag] Could not query running processes: {}", e.getMessage());
            return false;
        }
    }

    /** Starts the Red Tag executable if it is not already running. */
    public void launch() {
        if (isRunning()) {
            log.info("[RedTag] Application already running");
            return;
        }
        try {
            log.info("[RedTag] Launching application: {}", properties.getExecutablePath());
            Runtime.getRuntime().exec(properties.getExecutablePath());
        } catch (Exception e) {
            throw new AutomationException(
                    "Failed to launch Red Tag from '" + properties.getExecutablePath() + "'", e);
        }
    }

    /** Restores, maximises and brings the Red Tag window to the foreground. */
    public void focusAndMaximize() {
        WinDef.HWND hwnd = User32.INSTANCE.FindWindow(null, properties.getWindowTitle());
        if (hwnd == null) {
            log.warn("[RedTag] Window '{}' not found — cannot focus/maximise", properties.getWindowTitle());
            return;
        }
        User32.INSTANCE.ShowWindow(hwnd, SW_RESTORE);
        User32.INSTANCE.SetForegroundWindow(hwnd);
        User32.INSTANCE.ShowWindow(hwnd, SW_MAXIMIZE);
    }
}
