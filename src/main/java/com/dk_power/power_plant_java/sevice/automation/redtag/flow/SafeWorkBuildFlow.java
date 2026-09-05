package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPermits;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPpe;
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
import java.util.List;
import java.util.stream.Collectors;

/**
 * Automates building a Safe Work permit in Red Tag, per
 * {@code project/features/red-tag-automation/create-permit.md}:
 * open the Safe Work tab, start a new permit with no template, fill the header +
 * hazard / permit / PPE checkboxes + footer, save, and read the new permit number back.
 *
 * <p>The form is left at whatever zoom it opens at; {@link SikuliDriver#calibrateScale}
 * measures that zoom once and every pattern and offset below is scaled to it. Offsets are
 * written in <b>captured-form pixels</b> and go through {@link SikuliDriver#px}.
 *
 * <h2>Checkbox grid — per-label image matching</h2>
 * Every checkbox is a small PNG crop ("checkbox + label") at
 * {@code safe-work/labels/<key>.png}, cut from the 2026-09-03 form capture by
 * {@code import-form-patterns.ps1}. To tick a checkbox we image-find its crop inside the
 * right section region and click {@code (match.x + CHECKBOX_X_OFFSET, match.y + match.h / 2)} —
 * the checkbox centre inside the crop, which the importer normalises to a constant position.
 *
 * <p>This replaces the previous OCR-readlines-and-guess-the-column approach,
 * which was inconsistent because Tesseract returns different bounding boxes
 * for asterisk-prefixed vs non-asterisked labels — one "column gap" can't be
 * correct for every column at once. Image matching is pixel-deterministic
 * and survives the column-gap problem entirely.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SafeWorkBuildFlow {

    /**
     * Distance from the LEFT edge of a label-crop match to the checkbox centre.
     *
     * <p>Measured over all 59 crops when they were imported from the 2026-09-03 capture: the
     * importer normalises every crop so the checkbox border sits 2 px in, and the reported
     * centre came out 8-10 px across the whole set.
     */
    private static final int CHECKBOX_X_OFFSET = 9;

    /** Checkbox side in captured-form pixels — the sample window for reading tick state. */
    private static final int CHECKBOX_SIZE = 16;

    /**
     * Offset from a checkbox-crop match's top-left to the free-text field that sits
     * just below-right of it — the "Type" box under Respirator/Dust Mask and under
     * Protective Gloves. Measured off the PPE section capture, where the field starts
     * ~29 px right of the crop origin and ~32 px below the checkbox row; we click well
     * inside it so a few px of variance still lands in the field.
     */
    private static final int FIELD_BELOW_DX = 66;
    private static final int FIELD_BELOW_DY = 32;

    /**
     * How far inside the right edge of a crop that includes its input box to click, so the
     * click lands in the field rather than on its border ("Other ___", the permit "#" boxes).
     */
    private static final int FIELD_RIGHT_INSET = 12;

    /**
     * Time to let the freshly-opened form finish painting its fields BEFORE we scan
     * or click. We sleep (no screen-grabs) through the form's initial repaint, so it
     * doesn't flicker. Sized to cover the "few seconds" of paint the operator saw.
     */
    private static final int FORM_SETTLE_MS = 3500;

    /** Wheel ticks per scroll step when bringing a section into view (known-good value). */
    private static final int SCROLL_TICKS = 3;
    /** Max scroll steps before giving up trying to reveal a section. */
    private static final int SCROLL_MAX_STEPS = 25;
    /** A section header is "in view enough" once it sits in the top fraction of the screen. */
    private static final double SECTION_TOP_FRACTION = 0.45;

    // === Header / footer field offsets (from label-crop centre) ===
    // Measured off the 2026-09-03 full-form capture against each label crop's centre.
    private static final int DATE_FIELD_DY = 23;      // Date field sits below its label
    private static final int LOCATION_FIELD_DX = 206; // field to the right, same row
    private static final int DESCRIPTION_FIELD_DX = 249;
    private static final int SPECIAL_INSTR_DY = 29;   // large text area below the label
    private static final int REQUESTOR_FIELD_DX = 51, REQUESTOR_FIELD_DY = 22; // field below-right, after the "X"

    private final SikuliDriver driver;
    private final RedTagAutomationProperties properties;

    // --- Navigation ----------------------------------------------------------

    /**
     * Opens a fresh Safe Work permit form (no template) at the normal zoom.
     *
     * <p>The form is left at its default zoom — the checkbox label patterns are
     * captured at that zoom, and each section is scrolled into view at fill time
     * (see {@link #scrollToSection}). The old "Ctrl+scroll to zoom the whole form
     * out" step is gone: at zoom-out the labels render too small to match
     * reliably.
     */
    public String openSafeWorkForm() {
        driver.click(RedTagPattern.SW_TAB);
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.SW_NEW_PERMIT_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
        // OCR find with retry — the dialog sometimes hasn't fully painted when
        // we look, and one-shot OCR has been intermittent.
        findIssuePermitButton().click();
        driver.sleep(properties.getInterStepDelayMs());
        // The form repaints its fields one-by-one for a few seconds as it opens.
        // That "flicker" is driven by SikuliX repeatedly grabbing the screen — on
        // Windows a screen-grab forces the foreground form to redraw. So we do NOT
        // scan while it paints: park the cursor off the form and just SLEEP through
        // the render (no captures = no flicker), then verify the header once (it's
        // already rendered, so it matches on the first scan).
        driver.parkMouse();
        driver.sleep(FORM_SETTLE_MS);
        // Measure the zoom the form actually rendered at, once, while the hazards bar is on
        // screen. Every find and pixel offset below then rides the measured scale, so the
        // build survives a form that is not at the zoom the patterns were captured at.
        double scale = driver.calibrateScale(RedTagPattern.SW_HAZARDS_HEADER);
        driver.waitFor(RedTagPattern.SW_HAZARDS_HEADER, 15);
        return String.format("Safe Work form opened (zoom %.2fx)", scale);
    }

    /** Retries OCR for "Issue Permit" — the post-NEW-PERMIT dialog renders intermittently. */
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
                "Could not OCR-locate 'Issue Permit' button after 6 retries (3s).",
                "ISSUE_PERMIT", last);
    }

    // --- Header --------------------------------------------------------------

    /** Fills the header block: date, time, company/person, location, description. */
    public String fillHeader(SafeWorkDto sw) {
        scrollToTop();
        // Date / Time / Company sit in a row — fill the date field, then TAB across.
        driver.clickOffset(RedTagPattern.SW_DATE_ISSUED_LABEL, 0, driver.px(DATE_FIELD_DY));
        driver.paste(formatDate(sw.getDate()));
        driver.pressTab();
        driver.paste(nullToEmpty(sw.getTime()));
        driver.pressTab();
        driver.paste(nullToEmpty(sw.getCompanyPerson()));

        driver.pasteAt(RedTagPattern.SW_LOCATION_LABEL, driver.px(LOCATION_FIELD_DX), 0,
                nullToEmpty(sw.getLocation()));
        driver.pasteAt(RedTagPattern.SW_DESCRIPTION_LABEL, driver.px(DESCRIPTION_FIELD_DX), 0,
                nullToEmpty(sw.getWorkScope()));
        return "Safe Work header filled";
    }

    // --- Hazard / permit / PPE checkbox grids --------------------------------

    /**
     * Ticks every selected hazard checkbox by image-matching its auto-generated
     * label crop inside the hazards section. Keys must match
     * {@code SwLabelPatternGenerator.HAZ_LABELS}.
     */
    public String fillHazards(SafeWorkDto sw) {
        SwHazards h = sw.getHazards() != null ? sw.getHazards() : new SwHazards();
        scrollToSection(RedTagPattern.SW_HAZARDS_HEADER);
        Region sect = sectionRegion(RedTagPattern.SW_HAZARDS_HEADER, RedTagPattern.SW_PERMITS_HEADER);
        log.info("[RedTag SW] hazards section ({},{}) {}x{}", sect.x, sect.y, sect.w, sect.h);

        tickLabel(sect, h.isHighTemp(), "high-temp");
        tickLabel(sect, h.isHighPressure(), "high-pressure");
        tickLabel(sect, h.isHazardousFlammablePipingMaint(), "hazardous-piping");
        tickLabel(sect, h.isElectricalTesting599V(), "electrical-testing");
        tickLabel(sect, h.isEnergized(), "energized-electrical-work");
        tickLabel(sect, h.isStoredEnergy(), "stored-energy");
        tickLabel(sect, h.isEyeHazard(), "eye-hazard");
        tickLabel(sect, h.isEgressAccess(), "egress-access");
        tickLabel(sect, h.isErgonomicHazard(), "ergonomic");
        tickLabel(sect, h.isFallingObject(), "falling-object");
        tickLabel(sect, h.isHighNoise(), "high-noise");
        tickLabel(sect, h.isDustParticulate(), "dust-particulate");
        tickLabel(sect, h.isCombustibleDust(), "combustible-dust");
        tickLabel(sect, h.isFireHazard(), "fire-explosion");
        tickLabel(sect, h.isHotSurface(), "hot-surfaces");
        tickLabel(sect, h.isSlippery(), "slip-trip");
        tickLabel(sect, h.isVentilationRequired(), "ventilation-required");
        tickLabel(sect, h.isLightingRestrictions(), "lighting-restrictions");
        tickLabel(sect, h.isExposedRotatingParts(), "exposed-rotating");
        tickLabel(sect, h.isChemicalExposure(), "chemical-exposure");
        tickLabel(sect, h.isLiftingHazard(), "lifting-hazard");
        tickLabel(sect, h.isHandTraps(), "hand-traps");
        tickLabel(sect, h.isHeatColdStress(), "heat-cold-stress");
        tickLabel(sect, h.isElevatedSurface(), "elevated-surface");
        tickLabel(sect, h.isEnvironmental(), "environmental");
        Match weather = tickLabel(sect, h.isWeatherHazards(), "weather-hazards");
        fillFieldRight(weather, h.getWeatherHazardDescription());
        // Testing/Troubleshooting carries a "Voltage" text field on the sub-row below it,
        // matched by its own (label + empty field) crop.
        tickLabel(sect, h.isTestingTroubleshooting50V(), "testing-troubleshooting");
        fillAnchoredField(sect, "voltage-field", h.getVoltageDescription());
        tickLabel(sect, h.isHexavalentChromium(), "hexavalent-chromium");
        Match hazOther = tickLabel(sect, h.isOther(), "haz-other");
        fillFieldRight(hazOther, h.getOtherDescription());
        return "Hazards filled";
    }

    /** Ticks every selected permit/test/action checkbox via image matching. */
    public String fillPermits(SafeWorkDto sw) {
        SwPermits p = sw.getPermits() != null ? sw.getPermits() : new SwPermits();
        scrollToSection(RedTagPattern.SW_PERMITS_HEADER);
        Region sect = sectionRegion(RedTagPattern.SW_PERMITS_HEADER, RedTagPattern.SW_PPE_HEADER);
        log.info("[RedTag SW] permits section ({},{}) {}x{}", sect.x, sect.y, sect.w, sect.h);

        // LOTO / Hot Work / Confined Space carry a "#" field, but their numbers are written by
        // the Associate flow, which links the permits Red Tag actually issued. Typing our local
        // description into the same box would put a second, unlinked number beside them —
        // right at best, and silently contradicting the association at worst. Tick only.
        tickLabel(sect, p.isLotoRequired(), "loto-required");
        tickLabel(sect, p.isHotWork(), "hot-work-permit");
        tickLabel(sect, p.isConfinedSpace(), "confined-space");
        tickLabel(sect, p.isExcavationPermit(), "excavation-permit");
        fillFieldRight(tickLabel(sect, p.isEnergizedPermit(), "energized-elec-wp"), p.getEnergizedPermitDescription());
        fillFieldRight(tickLabel(sect, p.isVentingPurging(), "venting-purging"), p.getVentingPurgingDescription());
        tickLabel(sect, p.isJha(), "jha");
        tickLabel(sect, p.isGasTesting(), "air-monitoring");
        tickLabel(sect, p.isLiftPlan(), "lift-plan");
        tickLabel(sect, p.isConfSpaceRescuePlanReview(), "rescue-plan-review");
        tickLabel(sect, p.isFallRescuePlan(), "fall-rescue-plan");
        fillFieldRight(tickLabel(sect, p.isOther(), "per-other"), p.getOtherDescription());
        return "Permits/tests/actions filled";
    }

    /** Ticks every selected PPE checkbox via image matching. */
    public String fillPpe(SafeWorkDto sw) {
        SwPpe ppe = sw.getPpe() != null ? sw.getPpe() : new SwPpe();
        // Log the data the automation actually received — if a box you ticked in the
        // app reads false here, the value was lost on save/load, not in the clicking.
        log.info("[RedTag SW] PPE data received: {}", ppe);
        scrollToSection(RedTagPattern.SW_PPE_HEADER);
        Region sect = sectionRegion(RedTagPattern.SW_PPE_HEADER, RedTagPattern.SW_SPECIAL_INSTRUCTIONS_LABEL);
        log.info("[RedTag SW] ppe section ({},{}) {}x{}", sect.x, sect.y, sect.w, sect.h);

        tickLabel(sect, ppe.isHardhat(), "hardhat");
        tickLabel(sect, ppe.isSafetyGlasses(), "safety-glasses");
        tickLabel(sect, ppe.isHearingProtection(), "hearing-protection");
        tickLabel(sect, ppe.isBoots(), "protective-footwear");
        tickLabel(sect, ppe.isWeldingPpe(), "welding-ppe");
        // Respirator/Dust Mask and Protective Gloves each carry a "Type" text field
        // just below them — fill it when the box is ticked and a type was entered.
        Match respirator = tickLabel(sect, ppe.isRespiratorDustMask(), "respirator-dust-mask");
        fillFieldBelow(respirator, ppe.getRespiratorType());
        Match gloves = tickLabel(sect, ppe.isGloves(), "protective-gloves");
        fillFieldBelow(gloves, ppe.getGlovesType());

        tickLabel(sect, ppe.isGasMonitor(), "air-monitor");
        tickLabel(sect, ppe.isTyvekSuit(), "tyvek-suit");
        tickLabel(sect, ppe.isAcidSuit(), "acid-suit");
        tickLabel(sect, ppe.isBarricade(), "barricade");
        tickLabel(sect, ppe.isFaceShield(), "face-shield");
        // Arc Flash/Shock PPE carries a "Class/Cal Rating" text field on the sub-row
        // below it, matched by its own (label + empty field) crop.
        tickLabel(sect, ppe.isArcFlashPpe(), "arc-flash");
        fillAnchoredField(sect, "arc-flash-class-field", ppe.getClassCalRating());
        tickLabel(sect, ppe.isGfi(), "gfci");
        tickLabel(sect, ppe.isPurgingVentilation(), "purging-ventilation");
        tickLabel(sect, ppe.isFallProtection(), "fall-protection");
        // Fall Protection carries a "Fall Clearance" text field on the sub-row below it.
        fillAnchoredField(sect, "fall-clearance-field", ppe.getFallClearance());
        fillFieldRight(tickLabel(sect, ppe.isOther(), "ppe-other"), ppe.getOtherDescription());
        return "PPE filled";
    }

    // --- Footer --------------------------------------------------------------

    /** Fills Special Instructions and the Requestor signature line. */
    public String fillFooter(SafeWorkDto sw, List<Integer> lotoBoxNumbers) {
        scrollToSection(RedTagPattern.SW_SPECIAL_INSTRUCTIONS_LABEL);
        String instructions = specialInstructionsWithBoxes(sw, lotoBoxNumbers);
        driver.pasteAt(RedTagPattern.SW_SPECIAL_INSTRUCTIONS_LABEL, 0, driver.px(SPECIAL_INSTR_DY),
                instructions);
        driver.pasteAt(RedTagPattern.SW_REQUESTOR_LABEL, driver.px(REQUESTOR_FIELD_DX),
                driver.px(REQUESTOR_FIELD_DY), nullToEmpty(sw.getRequestedBy()));
        return "Safe Work footer filled";
    }

    /**
     * Appends the lock-box numbers of the package's LOTOs to Special Instructions.
     *
     * <p>The box is what a worker actually walks up to, and the permit's own "LOTO Required #"
     * box is written by the Associate flow with Red Tag's LOTO numbers, not box numbers — so
     * without this the tag never says which box to go to. Appended rather than substituted:
     * whatever the issuer wrote stays, and stays first.
     */
    private String specialInstructionsWithBoxes(SafeWorkDto sw, List<Integer> lotoBoxNumbers) {
        String instructions = nullToEmpty(sw.getSpecialInstructions()).trim();
        if (lotoBoxNumbers == null || lotoBoxNumbers.isEmpty()) {
            log.info("[RedTag SW] no LOTO lock boxes on this permit's package — "
                    + "Special Instructions left as written");
            return instructions;
        }
        String note = (lotoBoxNumbers.size() == 1 ? "LOTO Box: " : "LOTO Boxes: ")
                + lotoBoxNumbers.stream().map(String::valueOf).collect(Collectors.joining(", "));
        log.info("[RedTag SW] Special Instructions note: {}", note);
        return instructions.isEmpty() ? note : instructions + " | " + note;
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
                throw new AutomationException("Safe Work permit would not save — "
                        + "'record in use' error did not clear after 10 retries.");
            }
        }
        return "Safe Work permit saved";
    }

    /**
     * Reads the new permit's Red Tag number from the first row of the Safe Work
     * list via OCR. Assumes the list is ungrouped so the newest permit is on top.
     */
    public String readPermitNumber() {
        Match header = driver.waitFor(RedTagPattern.SW_PERMIT_NUMBER_COLUMN, 10);
        Region firstRow = driver.region(header.x - 6, header.y + header.h + 2,
                header.w + 12, header.h + 6);
        String digits = nullToEmpty(driver.readText(firstRow)).replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            throw new AutomationException(
                    "Could not read the Safe Work permit number. Ungroup the list "
                            + "(drag the Status header out of the yellow band) and retry.");
        }
        if (digits.length() > 6) {
            digits = digits.substring(digits.length() - 6);
        }
        log.info("[RedTag] Read Safe Work permit number: {}", digits);
        return digits;
    }

    // --- Associate (Safe Work only) -----------------------------------------

    /** CALIBRATE: search field is this far left of the 'Search' button centre. */
    private static final int ASSOC_SEARCH_FIELD_DX = -100;
    /** CALIBRATE: first result row of the source list, offset from the 'Search' button. */
    private static final int ASSOC_RESULT_DX = -95, ASSOC_RESULT_DY = 72;

    /**
     * Runs the Safe Work association flow (create-permit.md step 9): select the
     * just-created permit, Modify it, open the Associate dialog, and add the
     * issued LOTOs + permits matching the work scope.
     *
     * <p>Per the doc this intentionally <b>stops before the final "Continue"</b> —
     * the operator reviews the associations and submits manually. Each tab is
     * searched by the Safe Work's own work scope and the first match is added;
     * extend {@code searchAndAdd} if multiple matches must be added per tab.
     */
    public String associate(SafeWorkDto sw) {
        // Select the just-created permit (first row of the list) and Modify it.
        Match col = driver.waitFor(RedTagPattern.SW_PERMIT_NUMBER_COLUMN, 10);
        col.offset(0, col.h + 4).click();
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.SW_MODIFY_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());

        // Open and maximise the Associate dialog.
        driver.click(RedTagPattern.SW_ASSOCIATE_BUTTON);
        Match title = driver.waitFor(RedTagPattern.SW_ASSOCIATE_DIALOG_TITLE, 10);
        title.doubleClick(); // maximise via the title bar
        driver.sleep(properties.getInterStepDelayMs());

        String query = nullToEmpty(sw.getWorkScope());
        driver.click(RedTagPattern.SW_ASSOCIATE_ISSUED_LOTOS_TAB);
        searchAndAdd(query);
        driver.click(RedTagPattern.SW_ASSOCIATE_ISSUED_PERMITS_TAB);
        searchAndAdd(query);

        return "Permits associated — review the dialog and click Continue manually";
    }

    /** Clears the search, searches a term, and double-clicks the first result to add it. */
    private void searchAndAdd(String query) {
        driver.click(RedTagPattern.SW_ASSOCIATE_CLEAR_BUTTON);
        driver.sleep(150);
        driver.clickOffset(RedTagPattern.SW_ASSOCIATE_SEARCH_BUTTON, ASSOC_SEARCH_FIELD_DX, 0);
        driver.paste(query);
        Match search = driver.click(RedTagPattern.SW_ASSOCIATE_SEARCH_BUTTON);
        driver.sleep(400);
        search.offset(ASSOC_RESULT_DX, ASSOC_RESULT_DY).doubleClick();
        driver.sleep(properties.getInterStepDelayMs());
    }

    // --- helpers -------------------------------------------------------------

    /**
     * Builds a screen-wide region between two section anchors so SikuliX is scoped
     * to the right section — prevents matching, say, the "haz-other" crop against
     * the "per-other" or "ppe-other" crop (same word, different sections).
     *
     * <p>The bottom anchor may be scrolled off-screen (a tall section near the
     * bottom of the form); in that case the region runs to the bottom of the screen.
     */
    private Region sectionRegion(RedTagPattern top, RedTagPattern bottom) {
        Match t = driver.find(top);
        Match b = driver.findOpt(bottom, 0.4);
        int y = t.y + t.h;
        int h = (b != null) ? Math.max(1, b.y - y) : (driver.screenHeight() - y);
        return driver.region(0, y, driver.screenWidth(), h);
    }

    /**
     * Scrolls the form down until {@code header} sits in the top
     * {@link #SECTION_TOP_FRACTION} of the screen, so that section's checkboxes
     * are visible below it. Best-effort: logs and returns after
     * {@link #SCROLL_MAX_STEPS} if the header never reaches the top band (label
     * matching then works on whatever is visible).
     */
    private void scrollToSection(RedTagPattern header) {
        driver.hoverCenter();
        driver.sleep(120); // let the cursor settle at centre so the wheel lands on the form
        int topBand = (int) (driver.screenHeight() * SECTION_TOP_FRACTION);
        int lastY = Integer.MIN_VALUE;
        int stuck = 0;
        for (int i = 0; i < SCROLL_MAX_STEPS; i++) {
            Match m = driver.findOpt(header, 0.4);
            int y = (m == null) ? Integer.MIN_VALUE : m.y;
            if (m != null && m.y <= topBand) {
                log.info("[RedTag SW] '{}' in view at y={} after {} scroll step(s)", header.name(), m.y, i);
                return;
            }
            // Detect a form that isn't actually scrolling (wheel events not landing).
            if (y == lastY) {
                if (++stuck == 4) {
                    log.warn("[RedTag SW] '{}' not moving while scrolling (headerY stuck at {}) — "
                            + "wheel-scroll may not be reaching the form", header.name(),
                            y == Integer.MIN_VALUE ? "not-visible" : y);
                }
            } else {
                stuck = 0;
            }
            lastY = y;
            log.info("[RedTag SW] scrolling to '{}' step {} (headerY={})",
                    header.name(), i, y == Integer.MIN_VALUE ? "not-visible" : y);
            driver.scrollDown(SCROLL_TICKS);
            driver.sleep(150);
        }
        log.warn("[RedTag SW] could not bring section header '{}' into view after {} scroll steps "
                + "— its checkboxes will likely be missed", header.name(), SCROLL_MAX_STEPS);
    }

    /** Scrolls the form back to the top so the header fields / first section are visible. */
    private void scrollToTop() {
        driver.hoverCenter();
        driver.scrollUp(SCROLL_MAX_STEPS * SCROLL_TICKS);
        driver.sleep(200);
    }

    /**
     * Image-matches the label crop ({@code safe-work/labels/<key>.png}) inside
     * {@code region} and clicks the checkbox centre. No-op if {@code on} is false.
     * Logs and continues on miss — one missing crop shouldn't kill a section.
     *
     * @return the crop match (so callers can locate an adjacent field), or
     *         {@code null} if {@code on} was false or the crop wasn't found.
     */
    private Match tickLabel(Region region, boolean on, String key) {
        if (!on) return null;
        Match m = driver.findLabelOpt(key, region, 1.0);
        if (m == null) {
            log.warn("[RedTag SW] label crop '{}' not found in section — checkbox skipped "
                    + "(is the crop present for this machine's zoom?)", key);
            return null;
        }
        int clickX = m.x + driver.px(CHECKBOX_X_OFFSET);
        int clickY = m.y + m.h / 2;
        // Read before clicking. Every Safe Work box is clear on a fresh permit, so this is
        // normally a no-op — but a click toggles, and if one ever does arrive ticked (a
        // template, a re-run over a part-filled permit) a blind click would clear it.
        if (driver.isTicked(clickX, clickY, CHECKBOX_SIZE)) {
            log.info("[RedTag SW] [{}] already ticked @ ({},{})", key, clickX, clickY);
            return m;
        }
        log.info("[RedTag SW] tick [{}] @ ({},{}) — crop matched at ({},{}) {}x{}",
                key, clickX, clickY, m.x, m.y, m.w, m.h);
        new Location(clickX, clickY).click();
        driver.sleep(40);
        return m;
    }

    /**
     * Fills the free-text field that sits just below-right of a checkbox (e.g. the
     * "Type" box under Respirator/Dust Mask). No-op when the checkbox wasn't
     * ticked ({@code checkbox == null}) or the text is blank. Clicks into the
     * field at a fixed offset from the checkbox-crop match, then pastes.
     */
    private void fillFieldBelow(Match checkbox, String text) {
        if (checkbox == null || text == null || text.isBlank()) return;
        int clickX = checkbox.x + driver.px(FIELD_BELOW_DX);
        int clickY = checkbox.y + driver.px(FIELD_BELOW_DY);
        log.info("[RedTag SW] fill field below checkbox @ ({},{}) = '{}'", clickX, clickY, text);
        new Location(clickX, clickY).click();
        driver.sleep(60);
        driver.replacePaste(text);
        driver.sleep(40);
    }

    /**
     * Fills the free-text field that sits to the RIGHT of a checkbox on the same
     * row (the "#" permit-number fields, the "Other ___" descriptions). The label
     * crops for these include the input box, so we click near the crop's right
     * edge — which lands inside the field — then paste. No-op when not ticked or
     * the text is blank.
     */
    private void fillFieldRight(Match checkbox, String text) {
        if (checkbox == null || text == null || text.isBlank()) return;
        int clickX = checkbox.x + checkbox.w - driver.px(FIELD_RIGHT_INSET);
        int clickY = checkbox.y + checkbox.h / 2;
        log.info("[RedTag SW] fill field right of checkbox @ ({},{}) = '{}'", clickX, clickY, text);
        new Location(clickX, clickY).click();
        driver.sleep(60);
        driver.replacePaste(text);
        driver.sleep(40);
    }

    /**
     * Fills a sub-row free-text field that has its OWN label crop showing the label
     * plus the (empty) input box — e.g. {@code voltage-field}, {@code arc-flash-class-field},
     * {@code fall-clearance-field}. We match the crop directly (deterministic, since
     * the captured field is empty and so is the runtime field before we type) and
     * click near its right edge, which lands in the input box. More reliable than
     * guessing an offset down from the parent checkbox. No-op when text is blank.
     */
    private void fillAnchoredField(Region region, String anchorKey, String text) {
        if (text == null || text.isBlank()) return;
        Match m = driver.findLabelOpt(anchorKey, region, 1.0);
        if (m == null) {
            log.warn("[RedTag SW] field-anchor crop '{}' not found — field skipped", anchorKey);
            return;
        }
        fillFieldRight(m, text);
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
