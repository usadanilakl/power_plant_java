package com.dk_power.power_plant_java.sevice.automation.redtag.core;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.basics.Settings;
import org.sikuli.script.App;
import org.sikuli.script.FindFailed;
import org.sikuli.script.Key;
import org.sikuli.script.KeyModifier;
import org.sikuli.script.Match;
import org.sikuli.script.Region;
import org.sikuli.script.Screen;
import org.springframework.stereotype.Component;

/**
 * Thin, intention-revealing wrapper over the SikuliX {@link Screen} API.
 *
 * <p>The legacy service called {@code screen.find(...).offset(...).click()} inline
 * hundreds of times and translated failures into stringly-typed messages. This
 * driver centralises:
 * <ul>
 *   <li>pattern resolution (via {@link PatternCatalog});</li>
 *   <li>anchor-relative clicking — find a distinctive label/button, then click at a
 *       pixel offset (blank input fields are never used as patterns);</li>
 *   <li>clipboard-based pasting (frameworks ignore key-by-key typing);</li>
 *   <li>uniform failure translation to {@link AutomationException};</li>
 *   <li>bounded retries.</li>
 * </ul>
 *
 * <p>The {@link Screen} is created lazily so the application still starts on a
 * headless server/hub where no automation is ever run.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SikuliDriver {

    private final PatternCatalog catalog;
    private final RedTagAutomationProperties properties;

    private Screen screen;

    /** Lazily creates the SikuliX screen — only ever touched on a real desktop. */
    private synchronized Screen screen() {
        if (screen == null) {
            Settings.TypeDelay = 0;
            Settings.MoveMouseDelay = 0;
            screen = new Screen();
            screen.setAutoWaitTimeout(properties.getAutoWaitTimeoutSeconds());
            log.info("[RedTag] SikuliX screen initialised ({}x{})", screen.w, screen.h);
        }
        return screen;
    }

    // --- Finding -------------------------------------------------------------

    /** Finds a pattern anywhere on screen using the default find timeout. */
    public Match find(RedTagPattern pattern) {
        return findIn(screen(), pattern, properties.getFindTimeoutSeconds());
    }

    /** Waits up to {@code seconds} for a pattern to appear anywhere on screen. */
    public Match waitFor(RedTagPattern pattern, double seconds) {
        return findIn(screen(), pattern, seconds);
    }

    /** Finds a pattern within a previously located region. */
    public Match findIn(Region region, RedTagPattern pattern, double seconds) {
        try {
            return region.wait(catalog.resolve(pattern), seconds);
        } catch (FindFailed e) {
            throw new AutomationException(
                    "Could not find '" + pattern.getDescription() + "' on screen. "
                            + "The element may not be visible, or the screen resolution differs "
                            + "from the captured pattern.",
                    pattern.name(), e);
        }
    }

    /** @return {@code true} if the pattern appears within {@code seconds}, without throwing. */
    public boolean exists(RedTagPattern pattern, double seconds) {
        if (!catalog.isAvailable(pattern)) return false;
        return screen().exists(catalog.resolve(pattern), seconds) != null;
    }

    // --- Clicking ------------------------------------------------------------

    /** Finds a pattern and clicks its centre. */
    public Match click(RedTagPattern pattern) {
        Match match = find(pattern);
        match.click();
        return match;
    }

    /**
     * Finds an anchor pattern and clicks at a pixel offset from its centre —
     * the standard way to target an input field next to its label.
     */
    public Match clickOffset(RedTagPattern anchor, int dx, int dy) {
        Match match = find(anchor);
        match.offset(dx, dy).click();
        return match;
    }

    /** Finds an anchor inside a region and clicks at an offset from its centre. */
    public Match clickOffsetIn(Region region, RedTagPattern anchor, int dx, int dy) {
        Match match = findIn(region, anchor, properties.getFindTimeoutSeconds());
        match.offset(dx, dy).click();
        return match;
    }

    /** Clicks a pattern, retrying up to {@code attempts} times before failing. */
    public void clickWithRetry(RedTagPattern pattern, int attempts) {
        AutomationException last = null;
        for (int i = 0; i < attempts; i++) {
            try {
                click(pattern);
                return;
            } catch (AutomationException e) {
                last = e;
                sleep(500);
            }
        }
        throw last != null ? last
                : new AutomationException("Failed to click " + pattern.name(), pattern.name(), null);
    }

    // --- Typing / clipboard --------------------------------------------------

    /**
     * Clicks at an offset from an anchor, then pastes text into the focused field.
     * Pasting (rather than typing) is used because the Red Tag UI does not register
     * synthetic key-by-key input reliably.
     */
    public void pasteAt(RedTagPattern anchor, int dx, int dy, String text) {
        clickOffset(anchor, dx, dy);
        paste(text);
    }

    /** Pastes text into whatever field currently has focus. */
    public void paste(String text) {
        App.setClipboard(text == null ? "" : text);
        screen().type("v", KeyModifier.CTRL);
    }

    public void pressEnter() {
        screen().type(Key.ENTER);
    }

    public void pressTab() {
        screen().type(Key.TAB);
    }

    // --- OCR -----------------------------------------------------------------

    /** Reads text from a region via SikuliX OCR. */
    public String readText(Region region) {
        return region.text();
    }

    // --- Misc ----------------------------------------------------------------

    /** Builds an absolute screen region (x, y, width, height). */
    public Region region(int x, int y, int w, int h) {
        return new Region(x, y, w, h);
    }

    public void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public int screenWidth() {
        return screen().w;
    }

    public int screenHeight() {
        return screen().h;
    }
}
