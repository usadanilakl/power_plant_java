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
import org.sikuli.script.Match;
import org.sikuli.script.Region;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Automates building a Safe Work permit in Red Tag, per
 * {@code project/features/red-tag-automation/create-permit.md}:
 * open the Safe Work tab, start a new permit with no template, zoom the form
 * out, fill the header + hazard / permit / PPE checkboxes + footer, save, and
 * read the new permit number back.
 *
 * <h2>Checkbox grid</h2>
 * The SW form is a fixed-layout grid of single checkboxes. Rather than ~60
 * brittle per-checkbox image patterns, each checkbox is reached by an
 * <b>offset from its section header</b> ({@code SW_HAZARDS_HEADER} /
 * {@code SW_PERMITS_HEADER} / {@code SW_PPE_HEADER}). The header is located once
 * by SikuliX; every checkbox in that section is then a fixed {@code (dx, dy)}
 * from the header's centre.
 *
 * <p><b>CALIBRATION REQUIRED:</b> the {@code *_DX} / {@code *_ROW0_DY} /
 * {@code *_ROW_PITCH} constants below are measured from the supplied
 * {@code zoomed out sw form view.png}. They must be verified once against the
 * live app — run with manual confirmation on and adjust if a click misses.
 * Calibrating a whole section is ~3 numbers (column dx, first-row dy, pitch).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SafeWorkBuildFlow {

    /** Number of times to click the zoom-out magnifier so the whole form is visible. */
    private static final int ZOOM_OUT_CLICKS = 3;

    // === CALIBRATE: grid geometry (offsets from each section header centre) ===
    // --- Hazards: 3 columns ---
    private static final int HAZ_COL1_DX = -448, HAZ_COL2_DX = -155, HAZ_COL3_DX = 132;
    private static final int HAZ_ROW0_DY = 3, HAZ_ROW_PITCH = 12;
    // --- Permits: 3 columns (taller rows — they carry "#" text fields) ---
    private static final int PER_COL1_DX = -447, PER_COL2_DX = -152, PER_COL3_DX = 133;
    private static final int PER_ROW0_DY = 17, PER_ROW_PITCH = 18;
    // --- PPE: 4 columns ---
    private static final int PPE_COL1_DX = -456, PPE_COL2_DX = -141, PPE_COL3_DX = 112, PPE_COL4_DX = 349;
    private static final int PPE_ROW0_DY = 43, PPE_ROW_PITCH = 18;
    // === CALIBRATE: header / footer field offsets (from label centre) ===
    private static final int DATE_FIELD_DY = 16;     // Date field sits below its label
    private static final int LOCATION_FIELD_DX = 140;
    private static final int DESCRIPTION_FIELD_DX = 170;
    private static final int SPECIAL_INSTR_DY = 22;  // text area below the label
    private static final int REQUESTOR_FIELD_DX = 40, REQUESTOR_FIELD_DY = 26;

    private final SikuliDriver driver;
    private final RedTagAutomationProperties properties;

    // --- Navigation ----------------------------------------------------------

    /** Opens a fresh Safe Work permit form (no template) and zooms it out. */
    public String openSafeWorkForm() {
        driver.click(RedTagPattern.SW_TAB);
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.SW_NEW_PERMIT_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.SW_ISSUE_NO_TEMPLATE_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
        for (int i = 0; i < ZOOM_OUT_CLICKS; i++) {
            driver.click(RedTagPattern.SW_ZOOM_OUT_BUTTON);
            driver.sleep(150);
        }
        driver.waitFor(RedTagPattern.SW_HAZARDS_HEADER, 15);
        return "Safe Work form opened and zoomed out";
    }

    // --- Header --------------------------------------------------------------

    /** Fills the header block: date, time, company/person, location, description. */
    public String fillHeader(SafeWorkDto sw) {
        // Date / Time / Company sit in a row — fill the date field, then TAB across.
        driver.clickOffset(RedTagPattern.SW_DATE_ISSUED_LABEL, 0, DATE_FIELD_DY);
        driver.paste(formatDate(sw.getDate()));
        driver.pressTab();
        driver.paste(nullToEmpty(sw.getTime()));
        driver.pressTab();
        driver.paste(nullToEmpty(sw.getCompanyPerson()));

        driver.pasteAt(RedTagPattern.SW_LOCATION_LABEL, LOCATION_FIELD_DX, 0, nullToEmpty(sw.getLocation()));
        driver.pasteAt(RedTagPattern.SW_DESCRIPTION_LABEL, DESCRIPTION_FIELD_DX, 0, nullToEmpty(sw.getWorkScope()));
        return "Safe Work header filled";
    }

    // --- Hazard / permit / PPE checkbox grids --------------------------------

    /** Ticks every selected hazard checkbox. */
    public String fillHazards(SafeWorkDto sw) {
        SwHazards h = sw.getHazards() != null ? sw.getHazards() : new SwHazards();
        Match anchor = driver.find(RedTagPattern.SW_HAZARDS_HEADER);
        // Column 1
        check(anchor, HAZ_COL1_DX, hazRow(0), h.isHighTemp());
        check(anchor, HAZ_COL1_DX, hazRow(1), h.isHighPressure());
        check(anchor, HAZ_COL1_DX, hazRow(2), h.isHazardousFlammablePipingMaint());
        check(anchor, HAZ_COL1_DX, hazRow(3), h.isElectricalTesting599V());
        check(anchor, HAZ_COL1_DX, hazRow(4), h.isEnergized());
        check(anchor, HAZ_COL1_DX, hazRow(5), h.isStoredEnergy());
        check(anchor, HAZ_COL1_DX, hazRow(6), h.isEyeHazard());
        check(anchor, HAZ_COL1_DX, hazRow(7), h.isEgressAccess());
        check(anchor, HAZ_COL1_DX, hazRow(8), h.isErgonomicHazard());
        // Column 2
        check(anchor, HAZ_COL2_DX, hazRow(0), h.isFallingObject());
        check(anchor, HAZ_COL2_DX, hazRow(1), h.isHighNoise());
        check(anchor, HAZ_COL2_DX, hazRow(2), h.isDustParticulate());
        check(anchor, HAZ_COL2_DX, hazRow(3), h.isCombustibleDust());
        check(anchor, HAZ_COL2_DX, hazRow(4), h.isFireHazard());
        check(anchor, HAZ_COL2_DX, hazRow(5), h.isHotSurface());
        check(anchor, HAZ_COL2_DX, hazRow(6), h.isSlippery());
        check(anchor, HAZ_COL2_DX, hazRow(7), h.isVentilationRequired());
        check(anchor, HAZ_COL2_DX, hazRow(8), h.isLightingRestrictions());
        check(anchor, HAZ_COL2_DX, hazRow(9), h.isExposedRotatingParts());
        // Column 3
        check(anchor, HAZ_COL3_DX, hazRow(0), h.isChemicalExposure());
        check(anchor, HAZ_COL3_DX, hazRow(1), h.isLiftingHazard());
        check(anchor, HAZ_COL3_DX, hazRow(2), h.isHandTraps());
        check(anchor, HAZ_COL3_DX, hazRow(3), h.isHeatColdStress());
        check(anchor, HAZ_COL3_DX, hazRow(4), h.isElevatedSurface());
        check(anchor, HAZ_COL3_DX, hazRow(5), h.isEnvironmental());
        check(anchor, HAZ_COL3_DX, hazRow(6), h.isWeatherHazards());
        check(anchor, HAZ_COL3_DX, hazRow(7), h.isTestingTroubleshooting50V());
        check(anchor, HAZ_COL3_DX, hazRow(9), h.isHexavalentChromium()); // row 8 is the Voltage text line
        check(anchor, HAZ_COL3_DX, hazRow(10), h.isOther());
        return "Hazards filled";
    }

    /** Ticks every selected permit/test/action checkbox. */
    public String fillPermits(SafeWorkDto sw) {
        SwPermits p = sw.getPermits() != null ? sw.getPermits() : new SwPermits();
        Match anchor = driver.find(RedTagPattern.SW_PERMITS_HEADER);
        // Column 1
        check(anchor, PER_COL1_DX, perRow(0), p.isLotoRequired());
        check(anchor, PER_COL1_DX, perRow(1), p.isHotWork());
        check(anchor, PER_COL1_DX, perRow(2), p.isConfinedSpace());
        check(anchor, PER_COL1_DX, perRow(3), p.isExcavationPermit());
        check(anchor, PER_COL1_DX, perRow(4), p.isEnergizedPermit());
        // Column 2
        check(anchor, PER_COL2_DX, perRow(0), p.isVentingPurging());
        check(anchor, PER_COL2_DX, perRow(1), p.isJha());
        check(anchor, PER_COL2_DX, perRow(2), p.isGasTesting()); // "Air Monitoring within Safe Limits"
        check(anchor, PER_COL2_DX, perRow(3), p.isLiftPlan());
        // Column 3
        check(anchor, PER_COL3_DX, perRow(0), p.isConfSpaceRescuePlanReview());
        check(anchor, PER_COL3_DX, perRow(1), p.isFallRescuePlan());
        check(anchor, PER_COL3_DX, perRow(2), p.isOther());
        return "Permits/tests/actions filled";
    }

    /** Ticks every selected PPE checkbox. */
    public String fillPpe(SafeWorkDto sw) {
        SwPpe ppe = sw.getPpe() != null ? sw.getPpe() : new SwPpe();
        Match anchor = driver.find(RedTagPattern.SW_PPE_HEADER);
        // Column 1
        check(anchor, PPE_COL1_DX, ppeRow(0), ppe.isHardhat());
        check(anchor, PPE_COL1_DX, ppeRow(1), ppe.isSafetyGlasses());
        check(anchor, PPE_COL1_DX, ppeRow(2), ppe.isHearingProtection());
        check(anchor, PPE_COL1_DX, ppeRow(3), ppe.isBoots());
        check(anchor, PPE_COL1_DX, ppeRow(4), ppe.isWeldingPpe());
        // Column 2 (rows 1 + 3 are "Type" text lines — skipped)
        check(anchor, PPE_COL2_DX, ppeRow(0), ppe.isRespiratorDustMask());
        check(anchor, PPE_COL2_DX, ppeRow(2), ppe.isGloves());
        check(anchor, PPE_COL2_DX, ppeRow(4), ppe.isGasMonitor()); // "Air Monitor"
        check(anchor, PPE_COL2_DX, ppeRow(5), ppe.isTyvekSuit());
        // Column 3 (row 4 is the "Class/Cal Rating" text line — skipped)
        check(anchor, PPE_COL3_DX, ppeRow(0), ppe.isAcidSuit());
        check(anchor, PPE_COL3_DX, ppeRow(1), ppe.isBarricade());
        check(anchor, PPE_COL3_DX, ppeRow(2), ppe.isFaceShield());
        check(anchor, PPE_COL3_DX, ppeRow(3), ppe.isArcFlashPpe());
        check(anchor, PPE_COL3_DX, ppeRow(5), ppe.isGfi()); // "GFCI"
        // Column 4 (row 2 is the "Fall Clearance" text line — skipped)
        check(anchor, PPE_COL4_DX, ppeRow(0), ppe.isPurgingVentilation());
        check(anchor, PPE_COL4_DX, ppeRow(1), ppe.isFallProtection());
        check(anchor, PPE_COL4_DX, ppeRow(3), ppe.isOther());
        return "PPE filled";
    }

    // --- Footer --------------------------------------------------------------

    /** Fills Special Instructions and the Requestor signature line. */
    public String fillFooter(SafeWorkDto sw) {
        driver.pasteAt(RedTagPattern.SW_SPECIAL_INSTRUCTIONS_LABEL, 0, SPECIAL_INSTR_DY,
                nullToEmpty(sw.getSpecialInstructions()));
        driver.pasteAt(RedTagPattern.SW_REQUESTOR_LABEL, REQUESTOR_FIELD_DX, REQUESTOR_FIELD_DY,
                nullToEmpty(sw.getRequestedBy()));
        return "Safe Work footer filled";
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

    // --- helpers -------------------------------------------------------------

    private int hazRow(int row) {
        return HAZ_ROW0_DY + row * HAZ_ROW_PITCH;
    }

    private int perRow(int row) {
        return PER_ROW0_DY + row * PER_ROW_PITCH;
    }

    private int ppeRow(int row) {
        return PPE_ROW0_DY + row * PPE_ROW_PITCH;
    }

    /** Clicks a checkbox at an offset from the section anchor — only when {@code on}. */
    private void check(Match sectionAnchor, int dx, int dy, boolean on) {
        if (on) {
            sectionAnchor.offset(dx, dy).click();
            driver.sleep(40);
        }
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
