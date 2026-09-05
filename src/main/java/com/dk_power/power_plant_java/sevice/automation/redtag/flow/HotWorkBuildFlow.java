package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkType;
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
 * Automates building a Hot Work permit in Red Tag against the <b>2026-08-27 form revision</b>
 * (the layout transcribed in {@code PermitFormSeeder.seedHotWorkPage1}).
 *
 * <h2>What changed, and why the old flow could not be patched</h2>
 * The reissued permit is a different document, not a re-skin: the checklist went from twelve
 * rows to nine and its wording changed, and Work Type, Initial Air Test, continuous
 * air-monitoring, the Fire Watch duration block and the issuer-approval line are all new. The
 * old flow's row keys, its {@code Fire Watch Required} Y/N pair and its single meter block have
 * no counterpart on the new paper, so the fill order is rebuilt here rather than adjusted.
 *
 * <h2>The form opens pre-filled, and its controls are not all the same kind</h2>
 * A freshly-issued Hot Work permit is <b>not</b> blank. It opens with every checklist <b>Y</b>
 * selected, with "Fire Protection System in service" selected, with the 30-minute fire watch
 * selected, and with the meter model pre-filled. Text fields are therefore pasted <em>over</em>
 * rather than into ({@link SikuliDriver#replacePaste}).
 *
 * <p>Every box goes through {@link #setBox}, which reads the box
 * ({@link SikuliDriver#isTicked}) and clicks only to change its state. One rule, correct for
 * both kinds of control on this form:
 * <ul>
 *   <li><b>Radio members</b> — the checklist Y/NA pairs, in-service vs NOT-in-service, and the
 *       three fire-watch durations. These select rather than toggle, so {@link #setGroup}
 *       selects the chosen member <em>first</em> and lets the siblings release themselves; the
 *       follow-up "clear the others" then reads them as already clear and clicks nothing. If a
 *       group ever turns out to be independent checkboxes, that same pass clears them properly.</li>
 *   <li><b>Checkboxes</b> — Work Type and the confined-space logging tick. These toggle, so a
 *       blind click on an already-correct box is not a harmless repeat, it is the wrong answer.</li>
 * </ul>
 *
 * <p><b>No anchor pattern contains a checkbox.</b> The checklist row crops stop just right of
 * the Y/NA band, and the Work Type, Fire Protection, Fire Watch and confined-space anchors are
 * cropped down to their label or header strip. They therefore match whatever state the form is
 * in — as opened, half-answered, or on a re-run of a step — and every box is reached by a fixed
 * offset from the anchor's top-left rather than by matching the box itself.
 *
 * <h2>Checklist rows (Y / NA)</h2>
 * Each row is matched by a <b>text-only</b> crop in {@code hot-work/labels/}: cropping the
 * boxes away makes the pattern independent of selection state, so it matches whether the row
 * is still at its default or already answered. The two boxes are reached by fixed negative
 * offsets from the text's left edge ({@link #MEASURE_Y_DX} / {@link #MEASURE_NA_DX}), which is
 * stable because the teal band that holds them is a fixed width.
 *
 * <p>A true measure selects Y, a false one selects NA. The pair leaves no blank state to fall
 * back to, and the form opens on Y, so doing nothing would affirm every precaution including
 * the ones the permit does not.
 *
 * <h2>Pixel offsets</h2>
 * Every constant below is in <b>captured-form pixels</b> — the coordinate space of the PNGs in
 * {@code automation/redtag/patterns/hot-work}. They are put through {@link SikuliDriver#px} (or
 * {@link SikuliDriver#clickFromOrigin}) so they follow whatever zoom
 * {@link SikuliDriver#calibrateScale} measured for this run.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HotWorkBuildFlow {

    /** Pattern sub-folder for HW checklist row crops. */
    private static final String HW_LABELS = "hot-work";

    // === Checklist row: box centres relative to the LEFT edge of the text crop ===
    // Negative because the crop starts just right of the teal Y/NA band.
    private static final int MEASURE_Y_DX = -51;
    private static final int MEASURE_NA_DX = -15;

    /** Checkbox side in captured-form pixels — the sample window for reading tick state. */
    private static final int BOX_SIZE = 16;

    // === Header ===
    private static final int LOCATION_FIELD_DX = 300, LOCATION_FIELD_DY = 14;
    private static final int DATE_FIELD_DX = 160, DATE_FIELD_DY = 16;
    // Work Type row: four checkbox centres and the free-text "Other" field.
    private static final int WT_WELDING_DX = 96, WT_GRIDING_DX = 178,
                             WT_CUTTING_DX = 257, WT_BRAZING_DX = 346;
    private static final int WT_BOX_DY = 12;
    private static final int WT_OTHER_DX = 520, WT_OTHER_DY = 13;

    // === Fire Protection System bars ===
    private static final int FP_IN_SERVICE_DX = 113, FP_NOT_IN_SERVICE_DX = 285, FP_BOX_DY = 38;
    private static final int FP_DATETIME_DX = 820, FP_DATETIME_DY = 15;

    // === Initial Air Test row ===
    private static final int AIR_MODEL_DX = 100, AIR_MODEL_DY = 15;
    private static final int AIR_SERIAL_DX = 82, AIR_SERIAL_DY = 11;
    private static final int AIR_CAL_DATE_DX = 120, AIR_CAL_DATE_DY = 11;
    private static final int AIR_TIME_DX = 84, AIR_TIME_DY = 10;
    private static final int AIR_INITIALS_DX = 84, AIR_INITIALS_DY = 11;
    private static final int AIR_LEL_DX = 147, AIR_LEL_DY = 10;

    // === Requirements & approval section ===
    // The continuous-monitoring crops are column headers with the input directly beneath them.
    private static final int CONT_MODEL_DX = 52, CONT_MODEL_DY = 30;
    private static final int CONT_SERIAL_DX = 30, CONT_SERIAL_DY = 31;
    private static final int CONT_CAL_DATE_DX = 64, CONT_CAL_DATE_DY = 29;
    private static final int LOGGED_CONF_SPACE_DX = 106, LOGGED_CONF_SPACE_DY = 30;
    private static final int FW_1HOUR_DX = 28, FW_30MIN_DX = 90, FW_NOT_REQUIRED_DX = 171;
    private static final int FW_BOX_DY = 42;
    private static final int PERSON_FIELD_DX = 300, PERSON_FIELD_DY = 13;
    private static final int FIRE_WATCH_FIELD_DX = 288, FIRE_WATCH_FIELD_DY = 13;
    private static final int SPECIAL_INSTR_DX = 400, SPECIAL_INSTR_DY = 12;
    private static final int ISSUER_SIG_DX = 444, ISSUER_SIG_DY = 13;
    private static final int APPROVED_DATE_DX = 114, APPROVED_DATE_DY = 9;
    private static final int APPROVED_TIME_DX = 86, APPROVED_TIME_DY = 10;

    // === Search scopes, in captured-form pixels measured down from a section bar ===
    // The Initial Air Test strip is ~35 px tall and the requirements block ~235 px. Bounding
    // finds to these keeps "Model:" / "Cal Date" / "Date:" / "Time:" — each printed in more
    // than one section — from being satisfied by the wrong copy.
    private static final int AIR_TEST_BAND_HEIGHT = 60;
    private static final int REQUIREMENTS_BAND_HEIGHT = 235;

    /** Let the freshly-opened form finish painting before we scan/click (avoids flicker + half-rendered clicks). */
    private static final int FORM_SETTLE_MS = 3500;
    private static final int SCROLL_TICKS = 3;
    private static final int SCROLL_MAX_STEPS = 25;
    private static final double SECTION_TOP_FRACTION = 0.45;

    private final SikuliDriver driver;
    private final RedTagAutomationProperties properties;

    // --- Navigation ----------------------------------------------------------

    /**
     * Opens a fresh Hot Work permit form (no template) and measures the zoom it rendered at.
     *
     * <p>Calibration happens here, once, while the checklist bar is guaranteed on screen — every
     * later find and offset in this build then rides the measured scale.
     */
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
        // Calibrate on the Work Type row: it is the widest, most textured thing on the freshly
        // opened form (a teal band, four boxes and four words), so its match score peaks sharply
        // at the right zoom instead of drifting the way a short line of text does.
        double scale = driver.calibrateScale(RedTagPattern.HW_WORK_TYPE_ROW);
        driver.waitFor(RedTagPattern.HW_CHECKLIST_HEADER, 15);
        return String.format("Hot Work form opened (zoom %.2fx)", scale);
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

    /** Fills the header block: location, date, and the Work Type checkbox row. */
    public String fillHeader(HotWorkDto hw) {
        scrollToTop();
        pasteInField(RedTagPattern.HW_LOCATION_LABEL, LOCATION_FIELD_DX, LOCATION_FIELD_DY, hw.getLocation());
        pasteInField(RedTagPattern.HW_DATE_LABEL, DATE_FIELD_DX, DATE_FIELD_DY, formatDate(hw.getDate()));
        fillWorkType(hw);
        return "Hot Work header filled";
    }

    /** Ticks the Work Type boxes and writes the free-text "Other" description beside them. */
    private void fillWorkType(HotWorkDto hw) {
        HotWorkType wt = hw.getWorkType();
        if (wt == null) {
            log.info("[RedTag HW] no work type on the permit — Work Type row left blank");
            return;
        }
        Match row = driver.findOpt(RedTagPattern.HW_WORK_TYPE_ROW, 3);
        if (row == null) {
            log.warn("[RedTag HW] Work Type row not found — work type skipped");
            return;
        }
        setBox(row, wt.isWelding(), WT_WELDING_DX, WT_BOX_DY, "welding");
        setBox(row, wt.isGriding(), WT_GRIDING_DX, WT_BOX_DY, "griding");
        setBox(row, wt.isCutting(), WT_CUTTING_DX, WT_BOX_DY, "cutting");
        setBox(row, wt.isBrazing(), WT_BRAZING_DX, WT_BOX_DY, "brazing");
        // The Red Tag row has no "Other" checkbox — only the free-text field beside the word.
        if (isPresent(wt.getOtherDescription())) {
            driver.pasteFromOrigin(row, WT_OTHER_DX, WT_OTHER_DY, wt.getOtherDescription());
        }
    }

    // --- Checklist (measures) ------------------------------------------------

    /** Ticks Y for each affirmed checklist measure, and leaves the rest blank. */
    public String fillMeasures(HotWorkDto hw) {
        HotWorkMeasures m = hw.getMeasures() != null ? hw.getMeasures() : new HotWorkMeasures();
        log.info("[RedTag HW] measures received: {}", m);
        scrollToSection(RedTagPattern.HW_CHECKLIST_HEADER);
        Region sect = sectionRegion(RedTagPattern.HW_CHECKLIST_HEADER, RedTagPattern.HW_INITIAL_AIR_TEST_HEADER);
        log.info("[RedTag HW] checklist section ({},{}) {}x{}", sect.x, sect.y, sect.w, sect.h);

        // Order and mapping follow PermitFormSeeder.seedHotWorkPage1 — the nine rows printed on
        // the 2026-08-27 permit, top to bottom.
        setMeasure(sect, "flammables-secured", m.isFlammablesAreSecured());
        setMeasure(sect, "radiative-heat", m.isRadiativeHeatPreventiveMeasuresAreTaken());
        setMeasure(sect, "vessels-purged", m.isVesselsArePurged());
        setMeasure(sect, "openings-covered", m.isOpeningsAreCovered());
        setMeasure(sect, "duct-ventilation", m.isDuctVentilationIsSecured());
        setMeasure(sect, "lockout-completed", m.isLockOutIsCompleted());
        setMeasure(sect, "communication", m.isCommunicationIsEstablished());
        setMeasure(sect, "fire-watch-aware", m.isFireWatchIsAwareOfDuties());
        setMeasure(sect, "fire-extinguisher", m.isFireExtinguisherPresent());

        fillFireProtection(hw);
        return "Hot Work checklist filled";
    }

    /**
     * Ticks the "Fire Protection System in service" or "NOT in service" box under the checklist,
     * and stamps the approval date/time that goes with the out-of-service case.
     *
     * <p>Prefers the dedicated 2026-08-27 fields and falls back to the older
     * {@code measures.fireProtectionIsInService} boolean, which is the only place the answer
     * lives on permits raised before the revision. The fallback is <b>one-way</b>: a true there
     * means "in service", but a false does not mean "NOT in service" — it is the same
     * unticked-checkbox default as "nobody answered". Ticking the red NOT-in-service box
     * escalates the permit to plant-manager approval, and doing that off an ambiguous false
     * would put a claim on the tag that nobody made.
     *
     * <p>When nothing answers it, the form's own default ("in service") is left alone rather
     * than cleared: the tag then reads exactly as it would had the issuer opened it by hand,
     * and neither box is a claim this automation invented.
     */
    private void fillFireProtection(HotWorkDto hw) {
        Boolean inService = hw.getFireProtectionInService();
        Boolean notInService = hw.getFireProtectionNotInService();
        if (inService == null && notInService == null) {
            HotWorkMeasures m = hw.getMeasures();
            if (m == null || !m.isFireProtectionIsInService()) {
                log.info("[RedTag HW] fire-protection state not answered — left at the form's "
                        + "default (in service)");
                return;
            }
            inService = true;
            notInService = false;
        }
        // The bars sit below the ninth checklist row, so they can be past the fold while the
        // checklist header is still parked near the top. Scroll to the next section instead —
        // that lands the bars in the upper band, above the Initial Air Test header. A scroll
        // step is three wheel ticks, so it can overshoot and carry the bars off the top; back
        // off a tick at a time until they come back into view.
        scrollToSection(RedTagPattern.HW_INITIAL_AIR_TEST_HEADER);
        Match row = findScrollingBackUp(RedTagPattern.HW_FIRE_PROTECTION_ROW);
        if (row == null) {
            log.warn("[RedTag HW] fire-protection row not found — skipped");
            return;
        }
        // notInService wins a contradictory pair — it is the answer that escalates to
        // plant-manager approval, and losing that quietly is the failure that matters.
        int chosen = Boolean.TRUE.equals(notInService) ? 1 : Boolean.TRUE.equals(inService) ? 0 : -1;
        setGroup(row, chosen,
                new int[]{FP_IN_SERVICE_DX, FP_NOT_IN_SERVICE_DX}, FP_BOX_DY,
                new String[]{"fire-protection-in-service", "fire-protection-NOT-in-service"});
        if (isPresent(hw.getFireProtectionApprovalDateTime())) {
            driver.pasteFromOrigin(row, FP_DATETIME_DX, FP_DATETIME_DY,
                    hw.getFireProtectionApprovalDateTime());
        }
    }

    // --- Initial Air Test ----------------------------------------------------

    /**
     * Fills the meter model / serial / cal date and the test time, initials and LEL reading.
     *
     * <p>Searches are scoped to the band right under the INITIAL AIR TEST bar: "Model:",
     * "Serial #" and "Cal Date" are printed again a few rows lower on the continuous-monitoring
     * strip, and an unscoped find could satisfy itself there.
     */
    public String fillInitialAirTest(HotWorkDto hw) {
        scrollToSection(RedTagPattern.HW_INITIAL_AIR_TEST_HEADER);
        Region band = bandBelow(RedTagPattern.HW_INITIAL_AIR_TEST_HEADER, AIR_TEST_BAND_HEIGHT);
        pasteInField(band, RedTagPattern.HW_METER_MODEL_LABEL, AIR_MODEL_DX, AIR_MODEL_DY, hw.getMeterModel());
        pasteInField(band, RedTagPattern.HW_SERIAL_LABEL, AIR_SERIAL_DX, AIR_SERIAL_DY, hw.getMeterNum());
        pasteInField(band, RedTagPattern.HW_CAL_DATE_LABEL, AIR_CAL_DATE_DX, AIR_CAL_DATE_DY,
                formatDate(hw.getMeterCalDate()));
        pasteInField(band, RedTagPattern.HW_INITIAL_TEST_TIME_LABEL, AIR_TIME_DX, AIR_TIME_DY,
                hw.getTimeOfInitialTest());
        pasteInField(band, RedTagPattern.HW_INITIAL_TEST_INITIALS_LABEL, AIR_INITIALS_DX, AIR_INITIALS_DY,
                hw.getInitialTestInitials());
        pasteInField(band, RedTagPattern.HW_INITIAL_TEST_LEL_LABEL, AIR_LEL_DX, AIR_LEL_DY,
                hw.getInitialTestResult());
        return "Initial air test filled";
    }

    // --- Requirements and approval ------------------------------------------

    /**
     * Fills the requirements section: the continuous-monitoring meter, the confined-space
     * logging tick, the Fire Watch duration, the two names, special instructions and the
     * issuer's approval line.
     */
    public String fillRequirements(HotWorkDto hw) {
        scrollToSection(RedTagPattern.HW_SECTION_HEADER);
        // Bounded to this section: the cancellation block further down the page repeats
        // "Date:" and "Time:", and an unscoped find could stamp the issuer's approval into
        // the fire watch's close-out line.
        Region band = bandBelow(RedTagPattern.HW_SECTION_HEADER, REQUIREMENTS_BAND_HEIGHT);
        pasteInField(band, RedTagPattern.HW_CONT_MODEL_LABEL, CONT_MODEL_DX, CONT_MODEL_DY,
                hw.getContMeterModel());
        pasteInField(band, RedTagPattern.HW_CONT_SERIAL_LABEL, CONT_SERIAL_DX, CONT_SERIAL_DY,
                hw.getContMeterNum());
        pasteInField(band, RedTagPattern.HW_CONT_CAL_DATE_LABEL, CONT_CAL_DATE_DX, CONT_CAL_DATE_DY,
                formatDate(hw.getContMeterCalDate()));

        Match logged = driver.findOptIn(band, RedTagPattern.HW_LOGGED_ON_CONF_SPACE, 3);
        if (logged == null) {
            log.warn("[RedTag HW] 'Logged On Conf. Space Perm.' box not found — left as-is");
        }
        setBox(logged, Boolean.TRUE.equals(hw.getIsAirMonitoringRegisteredOnConfinedSpace()),
                LOGGED_CONF_SPACE_DX, LOGGED_CONF_SPACE_DY, "logged-on-conf-space");

        fillFireWatchDuration(hw, band);

        pasteInField(band, RedTagPattern.HW_PERSON_PERFORMING_LABEL, PERSON_FIELD_DX, PERSON_FIELD_DY,
                hw.getForeman());
        pasteInField(band, RedTagPattern.HW_FIRE_WATCH_NAME_LABEL, FIRE_WATCH_FIELD_DX, FIRE_WATCH_FIELD_DY,
                hw.getFireWatch());
        pasteInField(band, RedTagPattern.HW_SPECIAL_INSTRUCTIONS_LABEL, SPECIAL_INSTR_DX, SPECIAL_INSTR_DY,
                hw.getSpecialInstructions());
        pasteInField(band, RedTagPattern.HW_ISSUER_SIGNATURE_LABEL, ISSUER_SIG_DX, ISSUER_SIG_DY,
                hw.getIssuerSignature());
        pasteInField(band, RedTagPattern.HW_APPROVED_DATE_LABEL, APPROVED_DATE_DX, APPROVED_DATE_DY,
                formatDate(hw.getApprovedDate()));
        pasteInField(band, RedTagPattern.HW_APPROVED_TIME_LABEL, APPROVED_TIME_DX, APPROVED_TIME_DY,
                hw.getApprovedTime());
        return "Hot Work requirements and approval filled";
    }

    /**
     * Ticks one of the three Fire Watch duration boxes.
     *
     * <p>Nothing is inferred when all three flags are false: the form's default (30 Min) is left
     * standing. The old flow decided "fire watch required" from whether a name happened to be
     * typed in, which invents a duration the issuer never chose — and on this form the choice
     * includes "Not Required", so guessing can silently drop a fire watch from a hot job.
     */
    private void fillFireWatchDuration(HotWorkDto hw, Region band) {
        boolean oneHour = Boolean.TRUE.equals(hw.getFireWatch1Hour());
        boolean thirtyMin = Boolean.TRUE.equals(hw.getFireWatch30Min());
        boolean notRequired = Boolean.TRUE.equals(hw.getFireWatchNotRequired());
        if (!oneHour && !thirtyMin && !notRequired) {
            log.info("[RedTag HW] fire-watch duration not chosen — left at the form's default (30 Min)");
            return;
        }
        Match row = driver.findOptIn(band, RedTagPattern.HW_FIRE_WATCH_ROW, 3);
        if (row == null) {
            log.warn("[RedTag HW] fire-watch duration block not found — skipped");
            return;
        }
        // Longest-watch-wins on a contradictory record, because shortening or dropping a fire
        // watch is the direction that hurts.
        int chosen = oneHour ? 0 : thirtyMin ? 1 : 2;
        setGroup(row, chosen,
                new int[]{FW_1HOUR_DX, FW_30MIN_DX, FW_NOT_REQUIRED_DX}, FW_BOX_DY,
                new String[]{"fire-watch-1-hour", "fire-watch-30-min", "fire-watch-not-required"});
    }

    // --- Save / read-back ----------------------------------------------------

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
     * Finds a label crop anywhere on screen and pastes into the field at a corner-relative
     * offset. No-op on blank text or a missing label — one absent anchor must not kill the step.
     */
    private void pasteInField(RedTagPattern label, int dx, int dy, String text) {
        pasteInField(null, label, dx, dy, text);
    }

    /** As above, but scoped to {@code region} when the label is not unique on the form. */
    private void pasteInField(Region region, RedTagPattern label, int dx, int dy, String text) {
        if (!isPresent(text)) return;
        Match m = (region == null)
                ? driver.findOpt(label, 2)
                : driver.findOptIn(region, label, 2);
        if (m == null) {
            log.warn("[RedTag HW] field anchor '{}' not found — field skipped", label.name());
            return;
        }
        log.info("[RedTag HW] fill {} = '{}'", label.name(), text);
        driver.pasteFromOrigin(m, dx, dy, text);
    }

    /**
     * A full-width screen band starting at a section bar and running {@code capturedHeight}
     * captured-form pixels down it — the scope for finds inside one section of the form.
     * Falls back to the whole screen when the bar is not visible.
     */
    private Region bandBelow(RedTagPattern sectionBar, int capturedHeight) {
        Match m = driver.findOpt(sectionBar, 2);
        if (m == null) {
            log.warn("[RedTag HW] section bar '{}' not visible — searching the whole screen",
                    sectionBar.name());
            return driver.region(0, 0, driver.screenWidth(), driver.screenHeight());
        }
        int h = Math.min(driver.px(capturedHeight), driver.screenHeight() - m.y);
        return driver.region(0, m.y, driver.screenWidth(), Math.max(1, h));
    }

    /**
     * Selects one member of a mutually-exclusive group and clears the rest.
     *
     * <p>The chosen member goes first so a radio group releases its own siblings; the clearing
     * pass then reads them as already clear and clicks nothing. On independent checkboxes the
     * same pass does the clearing itself. Either way the group ends up with exactly one answer,
     * without this code having to know which kind of control it is driving.
     *
     * @param chosen index into {@code dxs} to select, or -1 to clear the whole group
     */
    private void setGroup(Match row, int chosen, int[] dxs, int dy, String[] names) {
        if (row == null) return;
        if (chosen >= 0) setBox(row, true, dxs[chosen], dy, names[chosen]);
        for (int i = 0; i < dxs.length; i++) {
            if (i != chosen) setBox(row, false, dxs[i], dy, names[i]);
        }
    }

    /**
     * Drives the box at a corner-relative offset from an already located row TO {@code desired},
     * reading its current state first and clicking only to change it.
     */
    private void setBox(Match row, boolean desired, int dx, int dy, String what) {
        if (row == null) return;
        int x = row.x + driver.px(dx);
        int y = row.y + driver.px(dy);
        boolean current = driver.isTicked(x, y, BOX_SIZE);
        if (current == desired) {
            log.info("[RedTag HW] [{}] already {} @ ({},{})", what, desired ? "ticked" : "clear", x, y);
            return;
        }
        log.info("[RedTag HW] [{}] {} @ ({},{})", what, desired ? "tick" : "clear", x, y);
        new Location(x, y).click();
        driver.sleep(40);
    }

    /**
     * Selects <b>Y</b> or <b>NA</b> for one checklist row, per the measure the permit carries.
     *
     * <p>Y and NA are a radio pair, so the row always ends up answered one way or the other —
     * there is no blank state to leave it in, and the form opens with Y already selected. The
     * measure is a plain boolean, so false is the whole of "not Y" and NA is where it lands.
     * That makes an unanswered measure indistinguishable from a deliberate NA; if the two ever
     * need to be told apart on the tag, {@code HotWorkMeasures} has to carry a third state
     * first, and this is the method that would read it.
     */
    private void setMeasure(Region region, String key, boolean yes) {
        Match m = driver.findLabelOpt(HW_LABELS, key, region, 1.0);
        if (m == null) {
            log.warn("[RedTag HW] checklist row crop '{}' not found — row left at its default, "
                    + "which on this form means Y. Check the tag by hand.", key);
            return;
        }
        log.info("[RedTag HW] {} -> {} [row text at ({},{}) {}x{}]",
                key, yes ? "Y" : "NA", m.x, m.y, m.w, m.h);
        // The boxes sit on the text's vertical centre. That dy is in live pixels already (it
        // comes off the match, not off the captured form), so it is divided back out — setGroup
        // scales what it is handed.
        int dy = (int) Math.round(m.h / 2.0 / Math.max(0.01, driver.getScale()));
        setGroup(m, yes ? 0 : 1,
                new int[]{MEASURE_Y_DX, MEASURE_NA_DX}, dy,
                new String[]{key + ":Y", key + ":NA"});
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

    /**
     * Looks for a pattern, easing the form back <em>up</em> a tick at a time when it is not
     * there. For anything that sits just above the section header we scrolled to: a scroll step
     * is three wheel ticks, so the header can land near the top of the screen and push what
     * precedes it out of view.
     */
    private Match findScrollingBackUp(RedTagPattern pattern) {
        for (int i = 0; i <= SCROLL_TICKS; i++) {
            Match m = driver.findOpt(pattern, i == 0 ? 2 : 0.4);
            if (m != null) return m;
            driver.hoverCenter();
            driver.scrollUp(1);
            driver.sleep(150);
        }
        return driver.findOpt(pattern, 0.4);
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

    private boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
