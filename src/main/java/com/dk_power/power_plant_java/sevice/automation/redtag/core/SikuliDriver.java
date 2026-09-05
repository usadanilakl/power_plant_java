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

import java.awt.image.BufferedImage;
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
            // NOTE: leave WaitScanRate/ObserveScanRate at their defaults (3/sec).
            // Lowering them to 1/sec was tried to reduce form flicker, but the scroll
            // loop relies on the same scan rate to re-detect a section header after
            // each scroll — at 1/sec it scrolled past sections. The flicker is instead
            // handled by sleeping (no scanning) through the form's initial paint in
            // SafeWorkBuildFlow.openSafeWorkForm.
            screen = new Screen();
            screen.setAutoWaitTimeout(properties.getAutoWaitTimeoutSeconds());
            log.info("[RedTag] SikuliX screen initialised ({}x{})", screen.w, screen.h);
        }
        return screen;
    }

    // --- Zoom calibration ----------------------------------------------------

    /** Zoom ladder searched during calibration, coarse pass then a fine pass around the winner. */
    private static final double SCALE_MIN = 0.55, SCALE_MAX = 2.60;
    private static final double COARSE_STEP = 0.10, FINE_STEP = 0.02, FINE_SPAN = 0.10;
    /** Below this best-score a calibration is not believed and the captured zoom is kept. */
    private static final double CALIBRATION_MIN_SCORE = 0.70;

    /**
     * Measures how much larger or smaller the live form renders than the bundled patterns, and
     * tells the {@link PatternCatalog} so every later find and pixel offset is scaled to match.
     *
     * <p>{@code anchor} should be something big, flat and unique to the open form — a section
     * header bar. It is searched across a ladder of zooms (coarse, then fine around the best
     * hit) and the highest-scoring zoom wins. When nothing scores above
     * {@link #CALIBRATION_MIN_SCORE} the scale is left at 1.0 and a warning is logged: a wrong
     * scale would silently mis-place every click, so an uncalibrated run that fails loudly on
     * the next find is the safer outcome.
     *
     * @return the scale that was applied
     */
    public double calibrateScale(RedTagPattern anchor) {
        catalog.setScale(1.0);
        double bestScale = 1.0, bestScore = scoreAt(anchor, 1.0);
        for (double s = SCALE_MIN; s <= SCALE_MAX + 1e-9; s += COARSE_STEP) {
            double score = scoreAt(anchor, s);
            if (score > bestScore) { bestScore = score; bestScale = s; }
        }
        for (double s = bestScale - FINE_SPAN; s <= bestScale + FINE_SPAN + 1e-9; s += FINE_STEP) {
            if (s < SCALE_MIN || s > SCALE_MAX) continue;
            double score = scoreAt(anchor, s);
            if (score > bestScore) { bestScore = score; bestScale = s; }
        }
        if (bestScore < CALIBRATION_MIN_SCORE) {
            catalog.setScale(1.0);
            log.warn("[RedTag] Zoom calibration failed on '{}' — best score {} over {}..{}. "
                            + "Leaving scale at 1.0; if the form is not at the captured zoom the "
                            + "next find will fail. Re-capture the patterns or reset the form zoom.",
                    anchor.name(), String.format("%.2f", bestScore), SCALE_MIN, SCALE_MAX);
            return 1.0;
        }
        catalog.setScale(bestScale);
        log.info("[RedTag] Zoom calibrated on '{}': scale {} (score {})",
                anchor.name(), String.format("%.2f", bestScale), String.format("%.2f", bestScore));
        return bestScale;
    }

    /**
     * Restores the zoom to "exactly as captured". Call it when opening a form whose patterns
     * are not part of the calibrated set, so a factor left behind by an earlier build in the
     * same JVM cannot rescale them.
     */
    public void resetScale() {
        catalog.setScale(1.0);
    }

    /** Best match score for the anchor at one candidate zoom, or 0 when it does not appear. */
    private double scoreAt(RedTagPattern anchor, double scale) {
        catalog.setScale(scale);
        Pattern p;
        try {
            // Search at a permissive similarity: calibration ranks candidates by score, so
            // clamping them at the pattern's own threshold would hide the shape of the curve.
            // Uncached, because Pattern.similar mutates in place.
            p = catalog.resolveUncached(anchor, 0.55);
        } catch (AutomationException e) {
            return 0;
        }
        if (p.getImage() == null
                || p.getImage().getSize().width > screen().w
                || p.getImage().getSize().height > screen().h) {
            return 0; // scaled larger than the screen — cannot match by construction
        }
        Match m = screen().exists(p, 0);
        return m == null ? 0 : m.getScore();
    }

    /**
     * Converts a pixel offset measured on the captured forms into one for the live form.
     * Every hard-coded offset in the build flows is in captured-form pixels and must go
     * through here, or it will point at the wrong place on any other zoom.
     */
    public int px(int capturedPixels) {
        return (int) Math.round(capturedPixels * catalog.getScale());
    }

    /** The measured zoom of the live form relative to the captured patterns. */
    public double getScale() {
        return catalog.getScale();
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
     * Finds a pattern inside {@code region}, returning {@code null} on miss instead of throwing.
     * Scoping matters wherever a form repeats a label — the Hot Work permit carries "Model:",
     * "Cal Date", "Date:" and "Time:" in more than one section — because an unscoped search can
     * satisfy itself on the wrong copy and quietly fill the wrong box.
     */
    public Match findOptIn(Region region, RedTagPattern pattern, double seconds) {
        if (!catalog.isAvailable(pattern)) return null;
        return region.exists(catalog.resolve(pattern), seconds);
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
        return findLabelOpt("safe-work", labelKey, region, seconds);
    }

    /** Same as {@link #findLabelOpt(String, Region, double)} but for a specific permit folder (e.g. "hot-work"). */
    public Match findLabelOpt(String permitFolder, String labelKey, Region region, double seconds) {
        if (!catalog.labelExists(permitFolder, labelKey)) return null;
        return region.exists(catalog.resolveLabel(permitFolder, labelKey), seconds);
    }

    // --- Clicking ------------------------------------------------------------

    /** Finds a pattern and clicks its centre. */
    public Match click(RedTagPattern pattern) {
        Match match = find(pattern);
        match.click();
        return match;
    }

    /** Double-clicks an offset from the centre of an already located match. */
    public void doubleClickOffset(Match match, int dx, int dy) {
        match.offset(dx, dy).doubleClick();
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

    /**
     * Clicks a point expressed in <em>captured-form</em> pixels relative to a match's TOP-LEFT
     * corner, scaling the offset to the live zoom.
     *
     * <p>Offsets are anchored to the corner rather than {@link Match#offset}'s centre because
     * they are measured off the pattern PNG itself, where the origin is the only landmark that
     * does not move when a crop is retaken a couple of pixels wider.
     */
    public Location clickFromOrigin(Match match, int dx, int dy) {
        Location target = new Location(match.x + px(dx), match.y + px(dy));
        target.click();
        return target;
    }

    /** Clicks a corner-relative point (see {@link #clickFromOrigin}) then pastes into the field. */
    public void pasteFromOrigin(Match match, int dx, int dy, String text) {
        clickFromOrigin(match, dx, dy);
        sleep(60);
        replacePaste(text);
        sleep(40);
    }

    /**
     * Replaces the focused field's contents with {@code text} rather than inserting at the caret.
     *
     * <p>A freshly-opened Red Tag permit is not blank — it ships defaults, such as the Hot Work
     * meter model "RKI GX-3R Pro" and the Safe Work glove type "Cut-resistant". Clicking into
     * such a field only places a caret, so a plain paste would splice the new value into the
     * default and produce a field that reads as neither.
     *
     * <p>End-then-shift-Home rather than Ctrl+A: it selects the focused line and nothing else.
     * Ctrl+A in a document-hosted form risks selecting the whole form, and pasting over that
     * is not a mistake worth being one keystroke away from.
     */
    public void replacePaste(String text) {
        screen().type(Key.END);
        screen().type(Key.HOME, KeyModifier.SHIFT);
        paste(text);
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

    // --- Reading checkbox state ----------------------------------------------

    /** A checkbox pixel darker than this is part of a mark, not the pale-blue fill. */
    private static final int MARK_LUMINANCE = 170;
    /** Marked-pixel count inside the sample window above which the box counts as ticked. */
    private static final int MARK_PIXEL_THRESHOLD = 4;

    /**
     * Reads whether the checkbox centred at {@code (centreX, centreY)} carries a mark.
     *
     * <p>Necessary because a freshly-opened Red Tag permit is <b>not</b> blank: the Hot Work
     * checklist opens with every <b>Y</b> box ticked, as do "Fire Protection System in service"
     * and the 30-minute fire watch. A click toggles, so anything that assumes an empty form
     * gets the answer exactly backwards — it clears the rows the permit affirmed and leaves the
     * ones it did not. Callers read first and click only to change state.
     *
     * @param capturedBoxSize the checkbox's size in captured-form pixels; the sample window is
     *                        a smaller square at its centre, so a couple of pixels of drift in
     *                        the anchor match cannot pull the border into the sample
     */
    public boolean isTicked(int centreX, int centreY, int capturedBoxSize) {
        int side = Math.max(6, px(capturedBoxSize) * 2 / 3);
        Region box = new Region(centreX - side / 2, centreY - side / 2, side, side);
        BufferedImage img = screen().capture(box).getImage();
        int marked = 0;
        for (int y = 0; y < img.getHeight(); y++) {
            for (int x = 0; x < img.getWidth(); x++) {
                int rgb = img.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF, g = (rgb >> 8) & 0xFF, b = rgb & 0xFF;
                if ((int) (0.299 * r + 0.587 * g + 0.114 * b) < MARK_LUMINANCE) marked++;
            }
        }
        return marked >= MARK_PIXEL_THRESHOLD;
    }

    // --- Typing / clipboard --------------------------------------------------

    /**
     * Clicks at an offset from an anchor, then pastes text into the focused field.
     * Pasting (rather than typing) is used because the Red Tag UI does not register
     * synthetic key-by-key input reliably.
     */
    public void pasteAt(RedTagPattern anchor, int dx, int dy, String text) {
        clickOffset(anchor, dx, dy);
        replacePaste(text);
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

    // --- Drag and drop -------------------------------------------------------

    /**
     * Drags from the centre of the {@code from} pattern to the centre of the
     * {@code to} pattern. Used by the LOTO-list state-sync flow to group
     * (drag Status column → yellow grouping band) and to reset the grouped
     * view when a target status tab is buried (drag Status out then back).
     *
     * @return the destination match, in case the caller wants its coordinates
     */
    public Match dragDrop(RedTagPattern from, RedTagPattern to) {
        Match src = find(from);
        Match dst = find(to);
        try {
            int result = screen().dragDrop(src, dst);
            if (result < 1) {
                throw new AutomationException(
                        "Drag from '" + from.getDescription()
                                + "' to '" + to.getDescription() + "' returned " + result,
                        from.name(), null);
            }
        } catch (FindFailed e) {
            throw new AutomationException(
                    "Drag from '" + from.getDescription()
                            + "' to '" + to.getDescription() + "' failed: " + e.getMessage(),
                    from.name(), e);
        }
        return dst;
    }

    /**
     * Drags from the centre of the {@code from} pattern to an absolute location.
     * Used when the drop target isn't a pattern (e.g. dragging a column header
     * off-screen or into an area that has no distinctive image).
     */
    public void dragDropTo(RedTagPattern from, Location destination) {
        Match src = find(from);
        try {
            int result = screen().dragDrop(src, destination);
            if (result < 1) {
                throw new AutomationException(
                        "Drag from '" + from.getDescription() + "' to " + destination
                                + " returned " + result, from.name(), null);
            }
        } catch (FindFailed e) {
            throw new AutomationException(
                    "Drag from '" + from.getDescription() + "' to " + destination
                            + " failed: " + e.getMessage(), from.name(), e);
        }
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
