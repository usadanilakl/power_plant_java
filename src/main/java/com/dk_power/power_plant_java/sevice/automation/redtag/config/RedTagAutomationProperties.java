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

    /**
     * Whether to register the global ESC hotkey that pauses a running build.
     *
     * <p>Registering it is the ONLY eager SikuliX entry point in the app: it initialises the
     * SikuliX runtime at startup — loading {@code opencv_java430.dll} plus JNA and installing an
     * OS-wide keyboard hook — on every desktop, whether or not an automation is ever run. Every
     * other SikuliX path is lazy ({@code SikuliDriver.screen()}, {@code OCR.readLines}).
     *
     * <p>Opt-in ({@code false} by default) so the native layer never enters the JVM on the
     * many desktops that never run Red Tag. Set to {@code true} in the device config of a
     * machine that actually runs automations and wants ESC-to-pause. Automation itself works
     * either way — {@code SikuliDriver} loads SikuliX lazily when a build starts; only the
     * global ESC pause depends on this flag.
     */
    private boolean hotkeyEnabled = false;

    // -----------------------------------------------------------------------
    // State-sync flow tuning (LOTO Procedures list scrape).
    // -----------------------------------------------------------------------

    /** Vertical distance (pixels) from the expanded tab bottom to the first row. */
    private int stateSyncRowsTopPadding = 4;
    /** Height of the OCR scan region below the expanded tab, in pixels. */
    private int stateSyncRowsRegionHeight = 700;
    /** Ticks to scroll the row area by between OCR passes when scraping. */
    private int stateSyncScrollTicks = 5;
    /** Pixels above/below a LOTO-number anchor included in its row cell. */
    private int stateSyncCellVerticalPadding = 2;
    /** Fallback row height when the current OCR pass exposes only one anchor. */
    private int stateSyncDefaultRowHeight = 32;
    /** Maximum row band height; protects a missed anchor from swallowing later rows. */
    private int stateSyncMaxRowHeight = 64;
    /**
     * How many consecutive scroll passes may return zero new rows before the
     * scrape considers the tab exhausted.
     */
    private int stateSyncEmptyScrollLimit = 2;
    /** Hard upper bound on rows scraped in one pass, as a runaway guard. */
    private int stateSyncMaxRows = 2000;
}
