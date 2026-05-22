package com.dk_power.power_plant_java.sevice.automation.redtag.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Externalised configuration for the Red Tag desktop automation.
 *
 * <p>Everything that used to be a hard-coded constant in the legacy
 * {@code RedTagAutomationService} lives here so it can be tuned per machine
 * (resolution, paths, credentials) without recompiling.
 *
 * <p>Bind under prefix {@code redtag.automation} in {@code application.properties}.
 */
@Component
@ConfigurationProperties(prefix = "redtag.automation")
@Getter
@Setter
public class RedTagAutomationProperties {

    /** Absolute path to the Red Tag executable used to launch the app when it is not running. */
    private String executablePath = "J://RedTag/Redtag.exe";

    /** Process image name as it appears in {@code tasklist} — used to detect a running instance. */
    private String processName = "Redtag.exe";

    /** Window title used by the JNA {@code FindWindow} call to focus / maximise the app. */
    private String windowTitle = "Redtag Enterprise";

    /**
     * Optional external folder holding the SikuliX pattern PNGs.
     * When blank, the patterns bundled in the repo
     * ({@code classpath:automation/redtag/patterns}) are extracted to
     * {@link #patternWorkingDir} on startup and used from there.
     */
    private String patternBasePath = "";

    /** Where bundled patterns are extracted to when {@link #patternBasePath} is blank. */
    private String patternWorkingDir = "automation/redtag/patterns";

    /** Default SikuliX similarity (0-1) applied to a pattern when it declares none of its own. */
    private double defaultSimilarity = 0.80;

    /** Default seconds to wait for a pattern to appear before failing. */
    private int findTimeoutSeconds = 12;

    /** SikuliX {@code Screen.setAutoWaitTimeout} value. */
    private int autoWaitTimeoutSeconds = 30;

    /** Delay between automation steps, for UI stability. */
    private int interStepDelayMs = 200;

    /** Red Tag username. When blank the OS user name ({@code System.getProperty("user.name")}) is used. */
    private String username = "";

    /** Red Tag password. */
    private String password = "redtag";

    /** Username tried on the second login attempt if the first one fails. */
    private String fallbackUsername = "automation";

    /** Master switch — when false every automation entry point fails fast with a clear message. */
    private boolean enabled = true;
}
