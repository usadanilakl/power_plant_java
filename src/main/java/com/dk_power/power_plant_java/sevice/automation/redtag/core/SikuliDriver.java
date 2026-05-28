package com.dk_power.power_plant_java.sevice.automation.redtag.core;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.basics.Settings;
import org.sikuli.script.App;
import org.sikuli.script.FindFailed;
import org.sikuli.script.Key;
import org.sikuli.script.KeyModifier;
import org.sikuli.script.Location;
import org.sikuli.script.Match;
import org.sikuli.script.Mouse;
import org.sikuli.script.OCR;
import org.sikuli.script.Pattern;
import org.sikuli.script.Region;
import org.sikuli.script.Screen;
import org.springframework.stereotype.Component;

import java.util.List;

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
            // Scan ~once/sec instead of the default 3/sec. The form is static, so a
            // present pattern is still matched on the first (immediate) scan; this
            // just cuts how often SikuliX grabs the screen, which on Windows can make
            // the Red Tag form repaint/flicker while we wait for it to render.
            Settings.WaitScanRate = 1f;
            Settings.ObserveScanRate = 1f;
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

    /** Finds a pattern within {@code seconds}, returning {@code null} on miss instead of throwing. */
    public Match findOpt(RedTagPattern pattern, double seconds) {
        if (!catalog.isAvailable(pattern)) return null;
        return screen().exists(catalog.resolve(pattern), seconds);
    }

    /**
     * Finds an auto-generated SW label crop ({@code safe-work/labels/<key>.png})
     * inside {@code region} and returns its match (or {@code null} if not found
     * within {@code seconds}). The crop includes the checkbox to the LEFT of the
     * label text, so {@code match.x + ~13, match.y + match.h/2} hits the
     * checkbox centre.
     *
     * <p>Returns {@code null} (no throw) so a single missing label can't kill a
     * 60-checkbox section — the caller logs and continues.
     */
    public Match findLabelOpt(String labelKey, Region region, double seconds) {
        if (!catalog.labelExists(labelKey)) return null;
        return region.exists(catalog.resolveLabel(labelKey), seconds);
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

    /**
     * OCR-locates the given text within {@code region} and returns the matching region.
     * Throws {@link AutomationException} when the text is not found.
     */
    public Match findText(Region region, String text) {
        try {
            return region.findText(text);
        } catch (FindFailed e) {
            throw new AutomationException(
                    "OCR could not locate text '" + text + "' in the search region.", null, e);
        }
    }

    /** OCR-locates the given text anywhere on screen. */
    public Match findText(String text) {
        return findText(screen(), text);
    }

    /** Same as {@link #findText(Region, String)} but returns {@code null} on miss instead of throwing. */
    public Match findTextOpt(Region region, String text) {
        try {
            return region.findText(text);
        } catch (FindFailed e) {
            return null;
        }
    }

    /**
     * Single OCR pass over {@code region}: returns every text line found with its
     * bounding box, in reading order. Much faster than 60 individual {@code findText}
     * calls — the form-fill code reads lines once per section then looks each
     * checkbox label up in memory.
     *
     * <p>The returned {@link Match} coordinates are translated to absolute screen
     * coordinates. SikuliX 2.0.x {@code OCR.readLines} returns image-relative
     * coordinates (relative to the input region's top-left), which would cause
     * clicks to land at the top of the screen if used directly.
     */
    public List<Match> readLines(Region region) {
        List<Match> lines = OCR.readLines(region);
        for (Match m : lines) {
            m.x += region.x;
            m.y += region.y;
        }
        return lines;
    }

    // --- Mouse wheel ---------------------------------------------------------

    /**
     * Moves the mouse to the centre of the primary screen. Uses {@link Mouse#move}
     * with an explicit absolute {@link Location} — {@code Screen.hover()} silently
     * no-ops on some Windows DPI configurations, which left Ctrl+wheel scrolling
     * landing on whatever the cursor happened to be over before the build started.
     */
    public void hoverCenter() {
        Screen s = screen();
        Mouse.move(new Location(s.x + s.w / 2, s.y + s.h / 2));
    }

    /**
     * Moves the cursor to the top-left corner, off any interactive field. Call this
     * after opening a form so its input fields don't hover-highlight ("flicker") one
     * by one under a parked cursor while the form paints or while SikuliX scans.
     */
    public void parkMouse() {
        Mouse.move(new Location(screen().x + 2, screen().y + 2));
    }

    /**
     * Holds Ctrl and scrolls the mouse wheel by {@code steps} ticks. Positive
     * {@code steps} scrolls UP (zoom in in most apps), negative scrolls DOWN
     * (zoom out). Caller should hover over the target area first so the wheel
     * events land on the right window.
     */
    public void ctrlScroll(int steps) {
        Screen s = screen();
        int direction = steps < 0 ? -1 : 1;
        int count = Math.abs(steps);
        s.keyDown(Key.CTRL);
        try {
            s.wheel(direction, count);
        } finally {
            s.keyUp(Key.CTRL);
        }
    }

    /** Scrolls the mouse wheel DOWN by {@code ticks} (content moves up the screen). */
    public void scrollDown(int ticks) {
        screen().wheel(1, ticks); // 1 == WHEEL_DOWN
    }

    /** Scrolls the mouse wheel UP by {@code ticks} (content moves down the screen). */
    public void scrollUp(int ticks) {
        screen().wheel(-1, ticks); // -1 == WHEEL_UP
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
