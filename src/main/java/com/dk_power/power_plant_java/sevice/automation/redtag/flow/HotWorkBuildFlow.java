package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.AutomationException;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagPattern;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.SikuliDriver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.script.Location;
import org.sikuli.script.Match;
import org.sikuli.script.Region;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Automates building a Hot Work permit in Red Tag, mirroring {@link SafeWorkBuildFlow}.
 *
 * <h2>Checklist (Y / NA)</h2>
 * The Hot Work form is a 12-row checklist; each row has a <b>Y</b> and an <b>NA</b>
 * checkbox. Each {@link HotWorkMeasures} boolean maps to a row: {@code true} ticks
 * <b>Y</b>, {@code false} ticks <b>NA</b> (every row gets one or the other — matching
 * the legacy behaviour). Rows are matched by per-row image crops in
 * {@code hot-work/labels/}; the crop starts at the Y box, so Y is at
 * {@code match.x + MEASURE_Y_DX} and NA at {@code match.x + MEASURE_NA_DX}.
 *
 * <p>Navigation reuses the shared toolbar/list patterns (NEW PERMIT, Issue-with-
 * NO-Template, Save, Permit-# column); only the Hot Work tab and the form-content
 * labels are HW-specific.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HotWorkBuildFlow {

    /** Pattern sub-folder for HW measure label crops. */
    private static final String HW_LABELS = "hot-work";

    /** Y checkbox centre / NA checkbox centre, measured from a measure crop's left edge. */
    private static final int MEASURE_Y_DX = 25;
    private static final int MEASURE_NA_DX = 117;
    /** Fire-Watch-Required row: Y box / N box centre from that crop's left edge. */
    private static final int FIRE_WATCH_Y_DX = 657;
    private static final int FIRE_WATCH_N_DX = 723;
    /** Click this far inside the right edge of a label-crop's field to focus it. */
    private static final int FIELD_RIGHT_INSET = 25;

    /** Let the freshly-opened form finish painting before we scan/click (avoids flicker + half-rendered clicks). */
    private static final int FORM_SETTLE_MS = 3500;
    private static final int SCROLL_TICKS = 3;
    private static final int SCROLL_MAX_STEPS = 25;
    private static final double SECTION_TOP_FRACTION = 0.45;

    private final SikuliDriver driver;
    private final RedTagAutomationProperties properties;

    // --- Navigation ----------------------------------------------------------

    /** Opens a fresh Hot Work permit form (no template) at the normal zoom. */
    public String openHotWorkForm() {
        driver.click(RedTagPattern.HW_TAB);
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.SW_NEW_PERMIT_BUTTON);   // shared toolbar button
        driver.sleep(properties.getInterStepDelayMs());
        findIssuePermitButton().click();
        driver.sleep(properties.getInterStepDelayMs());
        // Sleep (no scanning) through the form's initial paint, then verify it's open.
        driver.parkMouse();
        driver.sleep(FORM_SETTLE_MS);
        driver.waitFor(RedTagPattern.HW_LOCATION_LABEL, 15);
        return "Hot Work form opened";
    }

    /** Retries OCR for the "Issue Permit with NO Template" button (renders intermittently). */
    private Match findIssuePermitButton() {
        AutomationException last = null;
        for (int i = 0; i < 6; i++) {
            try {
                return driver.findText("Issue Permit");
            } catch (AutomationException e) {
                last = e;
                driver.sleep(500);
            }
        }
        throw new AutomationException(
                "Could not OCR-locate 'Issue Permit' button after 6 retries (3s).", "ISSUE_PERMIT", last);
    }

    // --- Header --------------------------------------------------------------

    /** Fills the header: location, date, foreman, fire watch, meter model/serial/cal date, fire-watch-required. */
    public String fillHeader(HotWorkDto hw) {
        scrollToTop();
        fillLabeledField(RedTagPattern.HW_LOCATION_LABEL, hw.getLocation());
        fillLabeledField(RedTagPattern.HW_DATE_LABEL, formatDate(hw.getDate()));
        fillLabeledField(RedTagPattern.HW_FOREMAN_LABEL, hw.getForeman());
        fillLabeledField(RedTagPattern.HW_FIRE_WATCH_NAME_LABEL, hw.getFireWatch());
        fillLabeledField(RedTagPattern.HW_METER_MODEL_LABEL, hw.getMeterModel());
        fillLabeledField(RedTagPattern.HW_SERIAL_LABEL, hw.getMeterNum());
        // Cal Date has no dedicated DTO field — the legacy used the permit date.
        fillLabeledField(RedTagPattern.HW_CAL_DATE_LABEL, formatDate(hw.getDate()));
        tickFireWatchRequired(hw);
        return "Hot Work header filled";
    }

    /** Ticks the Fire-Watch-Required Y box when a fire watch is named, otherwise N. */
    private void tickFireWatchRequired(HotWorkDto hw) {
        Match m = driver.findOpt(RedTagPattern.HW_FIRE_WATCH_REQUIRED, 2);
        if (m == null) {
            log.warn("[RedTag HW] fire-watch-required row not found — skipped");
            return;
        }
        boolean required = hw.getFireWatch() != null && !hw.getFireWatch().isBlank();
        int dx = required ? FIRE_WATCH_Y_DX : FIRE_WATCH_N_DX;
        log.info("[RedTag HW] fire watch required -> {}", required ? "Y" : "N");
        new Location(m.x + dx, m.y + m.h / 2).click();
        driver.sleep(40);
    }

    // --- Checklist (measures) ------------------------------------------------

    /** Ticks Y/NA for each of the 12 checklist measures. */
    public String fillMeasures(HotWorkDto hw) {
        HotWorkMeasures m = hw.getMeasures() != null ? hw.getMeasures() : new HotWorkMeasures();
        log.info("[RedTag HW] measures received: {}", m);
        scrollToSection(RedTagPattern.HW_SECTION_HEADER);
        Region sect = sectionRegion(RedTagPattern.HW_SECTION_HEADER, RedTagPattern.HW_SPECIAL_INSTRUCTIONS_LABEL);
        log.info("[RedTag HW] checklist section ({},{}) {}x{}", sect.x, sect.y, sect.w, sect.h);

        tickMeasure(sect, "area-clean", m.isAreaIsClean());
        tickMeasure(sect, "flammables-secured", m.isFlammablesAreSecured());
        tickMeasure(sect, "no-combustible-dust", m.isNoCombustibleDustOrDebrisPresent());
        tickMeasure(sect, "radiative-heat", m.isRadiativeHeatPreventiveMeasuresAreTaken());
        tickMeasure(sect, "vessels-purged", m.isVesselsArePurged());
        tickMeasure(sect, "openings-covered", m.isOpeningsAreCovered());
        tickMeasure(sect, "duct-ventilation", m.isDuctVentilationIsSecured());
        tickMeasure(sect, "lockout-completed", m.isLockOutIsCompleted());
        tickMeasure(sect, "communication", m.isCommunicationIsEstablished());
        tickMeasure(sect, "fire-watch-aware", m.isFireWatchIsAwareOfDuties());
        tickMeasure(sect, "fire-extinguisher", m.isFireExtinguisherPresent());
        tickMeasure(sect, "fire-protection", m.isFireProtectionIsInService());
        return "Hot Work checklist filled";
    }

    /** Clicks Y (when {@code yes}) or NA (otherwise) for a checklist row matched by its crop. */
    private void tickMeasure(Region region, String key, boolean yes) {
        Match m = driver.findLabelOpt(HW_LABELS, key, region, 1.0);
        if (m == null) {
            log.warn("[RedTag HW] measure crop '{}' not found — row skipped", key);
            return;
        }
        int clickX = m.x + (yes ? MEASURE_Y_DX : MEASURE_NA_DX);
        int clickY = m.y + m.h / 2;
        log.info("[RedTag HW] {} -> {} @ ({},{}) [crop at ({},{}) {}x{}]",
                key, yes ? "Y" : "NA", clickX, clickY, m.x, m.y, m.w, m.h);
        new Location(clickX, clickY).click();
        driver.sleep(40);
    }

    // --- Footer / save -------------------------------------------------------

    /** Fills the Special Instructions field. */
    public String fillFooter(HotWorkDto hw) {
        scrollToSection(RedTagPattern.HW_SPECIAL_INSTRUCTIONS_LABEL);
        fillLabeledField(RedTagPattern.HW_SPECIAL_INSTRUCTIONS_LABEL, hw.getSpecialInstructions());
        return "Hot Work footer filled";
    }

    /** Clicks save and clears the "record in use" error if it appears, retrying. */
    public String save() {
        driver.click(RedTagPattern.SW_SAVE_BUTTON);
        int retries = 0;
        while (driver.exists(RedTagPattern.SW_ERROR_RECORD_IN_USE, 1)) {
            driver.pressEnter();
            driver.sleep(300);
            driver.click(RedTagPattern.SW_SAVE_BUTTON);
            if (++retries > 10) {
                throw new AutomationException("Hot Work permit would not save — "
                        + "'record in use' error did not clear after 10 retries.");
            }
        }
        return "Hot Work permit saved";
    }

    /** Reads the new permit's Red Tag number from the first row of the list via OCR. */
    public String readPermitNumber() {
        Match header = driver.waitFor(RedTagPattern.SW_PERMIT_NUMBER_COLUMN, 10);
        Region firstRow = driver.region(header.x - 6, header.y + header.h + 2,
                header.w + 12, header.h + 6);
        String digits = nullToEmpty(driver.readText(firstRow)).replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            throw new AutomationException(
                    "Could not read the Hot Work permit number. Ungroup the list and retry.");
        }
        if (digits.length() > 6) {
            digits = digits.substring(digits.length() - 6);
        }
        log.info("[RedTag] Read Hot Work permit number: {}", digits);
        return digits;
    }

    // --- helpers -------------------------------------------------------------

    /**
     * Finds a label crop that includes its input field and clicks near the field's
     * right edge to focus it, then pastes. No-op on blank text or a missing label.
     */
    private void fillLabeledField(RedTagPattern label, String text) {
        if (text == null || text.isBlank()) return;
        Match m = driver.findOpt(label, 2);
        if (m == null) {
            log.warn("[RedTag HW] field label '{}' not found — field skipped", label.name());
            return;
        }
        int clickX = m.x + m.w - FIELD_RIGHT_INSET;
        int clickY = m.y + m.h / 2;
        log.info("[RedTag HW] fill {} @ ({},{}) = '{}'", label.name(), clickX, clickY, text);
        new Location(clickX, clickY).click();
        driver.sleep(60);
        driver.paste(text);
        driver.sleep(40);
    }

    /** Region from a top anchor down to a (possibly off-screen) bottom anchor or the screen bottom. */
    private Region sectionRegion(RedTagPattern top, RedTagPattern bottom) {
        Match t = driver.find(top);
        Match b = driver.findOpt(bottom, 0.4);
        int y = t.y + t.h;
        int h = (b != null) ? Math.max(1, b.y - y) : (driver.screenHeight() - y);
        return driver.region(0, y, driver.screenWidth(), h);
    }

    /** Scrolls the form down until {@code header} sits in the top band; best-effort. */
    private void scrollToSection(RedTagPattern header) {
        driver.hoverCenter();
        driver.sleep(120);
        int topBand = (int) (driver.screenHeight() * SECTION_TOP_FRACTION);
        for (int i = 0; i < SCROLL_MAX_STEPS; i++) {
            Match m = driver.findOpt(header, 0.4);
            if (m != null && m.y <= topBand) {
                log.info("[RedTag HW] '{}' in view at y={} after {} scroll step(s)", header.name(), m.y, i);
                return;
            }
            log.info("[RedTag HW] scrolling to '{}' step {} (headerY={})",
                    header.name(), i, m == null ? "not-visible" : m.y);
            driver.scrollDown(SCROLL_TICKS);
            driver.sleep(150);
        }
        log.warn("[RedTag HW] could not bring '{}' into view after {} steps", header.name(), SCROLL_MAX_STEPS);
    }

    /** Scrolls the form back to the top so the header fields are visible. */
    private void scrollToTop() {
        driver.hoverCenter();
        driver.scrollUp(SCROLL_MAX_STEPS * SCROLL_TICKS);
        driver.sleep(200);
    }

    /** Converts an ISO date (2026-05-22) to US format (05/22/2026); passes other text through. */
    private String formatDate(String date) {
        if (date == null) return "";
        if (date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return LocalDate.parse(date).format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        }
        return date;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
