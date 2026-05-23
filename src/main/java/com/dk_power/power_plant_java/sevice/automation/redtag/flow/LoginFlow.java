package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagPattern;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagWindow;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.SikuliDriver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Fully automates getting Red Tag into a "ready and logged in" state:
 * launch the app, bring it forward, and sign in if necessary.
 *
 * <p>This closes the "semi-auto" gap — previously the operator had to open and
 * log in to Red Tag by hand before any automation could run.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LoginFlow {

    /**
     * Pixel offsets from the centre of a dialog label to the input field beside it.
     * Tuned to where the label patterns are cropped — see PATTERN_MANIFEST.md.
     */
    private static final int USERNAME_FIELD_DX = 130;
    private static final int PASSWORD_FIELD_DX = 130;

    private final SikuliDriver driver;
    private final RedTagWindow window;
    private final RedTagAutomationProperties properties;

    /**
     * Launches Red Tag (if needed), brings it forward and gives it time to come up.
     *
     * <p>Best-effort readiness check — looks for the LOG IN button (always shown
     * when not logged in) or the NEW ISOLATION button (always present in the
     * left menu). Doesn't fail hard if neither matches; subsequent steps fail
     * with clearer messages if the app really isn't responsive.
     */
    public String ensureAppOpen() {
        window.launch();
        window.focusAndMaximize();
        driver.sleep(800);
        // Short best-effort readiness probe — was waiting up to 25 s when the
        // patterns rendered differently, which made the build feel hung.
        boolean ready = driver.exists(RedTagPattern.LOGIN_BUTTON, 2)
                || driver.exists(RedTagPattern.NEW_ISOLATION_BUTTON, 2);
        if (!ready) {
            log.warn("[RedTag] Could not confirm app readiness in ~5s — continuing anyway");
        }
        return "Red Tag application is open";
    }

    /** Signs in if the status bar shows nobody is logged in; otherwise does nothing. */
    public String ensureLoggedIn() {
        if (!driver.exists(RedTagPattern.STATUS_NO_ONE_LOGGED_IN, 2)) {
            return "Already logged in";
        }

        String username = resolveUsername(properties.getUsername());
        attemptLogin(username, properties.getPassword());

        // First attempt failed — Red Tag asks "Login Failed. Try Again?".
        if (driver.exists(RedTagPattern.LOGIN_FAILED_DIALOG, 2)) {
            log.info("[RedTag] First login attempt failed, retrying with fallback user");
            driver.click(RedTagPattern.LOGIN_FAILED_YES);
            attemptLogin(resolveUsername(properties.getFallbackUsername()), properties.getPassword());
            if (driver.exists(RedTagPattern.LOGIN_FAILED_DIALOG, 2)) {
                return "Failed to log in to Red Tag after two attempts";
            }
        }

        // Dismiss the "you are now Signed ON" confirmation, if shown.
        if (driver.exists(RedTagPattern.LOGIN_SIGNED_ON_OK, 4)) {
            driver.click(RedTagPattern.LOGIN_SIGNED_ON_OK);
        }

        if (driver.exists(RedTagPattern.STATUS_NO_ONE_LOGGED_IN, 2)) {
            return "Failed to log in to Red Tag — still shown as not logged in";
        }
        return "Logged in to Red Tag as " + username;
    }

    private void attemptLogin(String username, String password) {
        driver.click(RedTagPattern.LOGIN_BUTTON);
        driver.waitFor(RedTagPattern.LOGIN_DIALOG_TITLE, 8);
        driver.pasteAt(RedTagPattern.LOGIN_USERNAME_LABEL, USERNAME_FIELD_DX, 0, username);
        driver.pasteAt(RedTagPattern.LOGIN_PASSWORD_LABEL, PASSWORD_FIELD_DX, 0, password);
        driver.click(RedTagPattern.LOGIN_SUBMIT_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
    }

    /** Blank configured username → fall back to the OS account name (legacy behaviour). */
    private String resolveUsername(String configured) {
        return (configured == null || configured.isBlank())
                ? System.getProperty("user.name")
                : configured;
    }
}
