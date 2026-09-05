package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpacePpe;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpacePrecautions;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType;
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
 * Automates building a Confined Space permit in Red Tag. Mirrors
 * {@link HotWorkBuildFlow} / {@link SafeWorkBuildFlow}.
 *
 * <p>Two form variants are selected by {@link ConfinedSpaceType}:
 * {@link RedTagPattern#CS_TAB_PERMIT_REQUIRED} or {@link RedTagPattern#CS_TAB_RECLASSIFIED}.
 * Past that point both variants share the same section layout: General Information →
 * Hazards + Precautions (side-by-side in one band) → PPE.
 *
 * <p>Each Hazards / Precautions / PPE crop is a single-checkbox row (no Y/NA),
 * matched like SW: tick at {@code match.x + CHECKBOX_X_OFFSET}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConfinedSpaceBuildFlow {

    /** Pattern sub-folder for CS row label crops. */
    private static final String CS_LABELS = "confined-space";

    /** Distance from a checkbox-crop match's left edge to the box centre (measured-equivalent to SW). */
    private static final int CHECKBOX_X_OFFSET = 22;
    /** Click this far inside the right edge of a label-crop's field to focus it. */
    private static final int FIELD_RIGHT_INSET = 25;

    /** Sleep through the form's initial paint before clicking. */
    private static final int FORM_SETTLE_MS = 3500;
    private static final int SCROLL_TICKS = 3;
    private static final int SCROLL_MAX_STEPS = 25;
    private static final double SECTION_TOP_FRACTION = 0.45;

    private final SikuliDriver driver;
    private final RedTagAutomationProperties properties;

    // --- Navigation ----------------------------------------------------------

    /** Opens a fresh Confined Space permit form (no template), choosing the tab by {@code csType}. */
    public String openConfinedSpaceForm(ConfinedSpaceDto cs) {
        RedTagPattern tab = cs.getCsType() == ConfinedSpaceType.RECLASSIFIED
                ? RedTagPattern.CS_TAB_RECLASSIFIED
                : RedTagPattern.CS_TAB_PERMIT_REQUIRED;
        driver.click(tab);
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.SW_NEW_PERMIT_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
        findIssuePermitButton().click();
        driver.sleep(properties.getInterStepDelayMs());
        driver.parkMouse();
        driver.sleep(FORM_SETTLE_MS);
        // The Confined Space patterns have not been recaptured at the shared 2026-09-03 scale,
        // so this flow does not calibrate — but a Safe Work or Hot Work build earlier in this
        // JVM may have left a zoom factor set, which would rescale the CS crops to nothing.
        // Reset to the scale these patterns were captured at.
        driver.resetScale();
        driver.waitFor(RedTagPattern.CS_SECTION_HEADER_GENERAL, 15);
        return "Confined Space form opened (" + cs.getCsType() + ")";
    }

    private Match findIssuePermitButton() {
        AutomationException last = null;
        for (int i = 0; i < 6; i++) {
            try { return driver.findText("Issue Permit"); }
            catch (AutomationException e) { last = e; driver.sleep(500); }
        }
        throw new AutomationException("Could not OCR-locate 'Issue Permit' after 6 retries.", "ISSUE_PERMIT", last);
    }

    // --- 1. General Information ---------------------------------------------

    /** Fills Section 1: Space, Date, Purpose, Start Time, Issued To, Duration. */
    public String fillGeneralInfo(ConfinedSpaceDto cs) {
        scrollToTop();
        fillLabeledField(RedTagPattern.CS_SPACE_LABEL, cs.getSpace());
        fillLabeledField(RedTagPattern.CS_DATE_LABEL, formatDate(cs.getDate()));
        fillLabeledField(RedTagPattern.CS_PURPOSE_LABEL, cs.getWorkScope());
        fillLabeledField(RedTagPattern.CS_START_TIME_LABEL, cs.getTime());
        fillLabeledField(RedTagPattern.CS_ISSUED_TO_LABEL, cs.getIssuedTo());
        fillLabeledField(RedTagPattern.CS_DURATION_LABEL, cs.getDuration());
        return "Confined Space general information filled";
    }

    // --- 2. Hazards + 3. Precautions (side-by-side, one scroll) -------------

    /** Ticks Section 2 hazards and fills Section 3 precautions — they share a vertical band. */
    public String fillHazardsAndPrecautions(ConfinedSpaceDto cs) {
        ConfinedSpaceHazards h = cs.getHazards() != null ? cs.getHazards() : new ConfinedSpaceHazards();
        ConfinedSpacePrecautions p = cs.getPrecautions() != null ? cs.getPrecautions() : new ConfinedSpacePrecautions();
        log.info("[RedTag CS] hazards={} precautions={}", h, p);

        scrollToSection(RedTagPattern.CS_SECTION_HEADER_HAZARDS);
        // Region spans both sections (top of hazards header to top of PPE header below).
        Region sect = sectionRegion(RedTagPattern.CS_SECTION_HEADER_HAZARDS, RedTagPattern.CS_SECTION_HEADER_PPE);
        log.info("[RedTag CS] hazards+precautions section ({},{}) {}x{}", sect.x, sect.y, sect.w, sect.h);

        // Hazards (10 single-checkbox rows)
        tickCsCheckbox(sect, "haz-oxygen", h.isOxygenDeficiency());
        tickCsCheckbox(sect, "haz-flammable", h.isFlammableGas());
        tickCsCheckbox(sect, "haz-combustible", h.isCombustibleDust());
        tickCsCheckbox(sect, "haz-toxic", h.isToxicGas());
        tickCsCheckbox(sect, "haz-rotating", h.isRotatingEquipment());
        tickCsCheckbox(sect, "haz-electrical", h.isElectricalShock());
        tickCsCheckbox(sect, "haz-entrapment", h.isEntrapment());
        tickCsCheckbox(sect, "haz-engulfment", h.isEngulfment());
        tickCsCheckbox(sect, "haz-heat-stress", h.isHeatStress());
        tickCsCheckbox(sect, "haz-other", h.isOther());

        // Precautions: first two are "(# [number]" fields, rest are single checkboxes
        // (the LOTO# / HW# come from the main DTO — they're set when sibling permits build).
        fillLabeledField(RedTagPattern.CS_PREC_LOCKOUT_TAGOUT_LABEL, cs.getLotoNum());
        fillLabeledField(RedTagPattern.CS_PREC_HOT_WORK_PERMIT_LABEL, cs.getHotWorkNum());
        tickCsCheckbox(sect, "prec-ventilation", p.isVentilation());
        tickCsCheckbox(sect, "prec-blank-flanged", p.isBlankFlanged());
        tickCsCheckbox(sect, "prec-double-block-bleed", p.isDoubleBlockAndBleed());
        tickCsCheckbox(sect, "prec-barriers", p.isBarriers());
        tickCsCheckbox(sect, "prec-other", p.isOther());
        return "Confined Space hazards + precautions filled";
    }

    // --- 4. PPE -------------------------------------------------------------

    /** Ticks Section 4 PPE & Equipment (11 single-checkbox rows in 3 columns). */
    public String fillPpe(ConfinedSpaceDto cs) {
        ConfinedSpacePpe ppe = cs.getPpe() != null ? cs.getPpe() : new ConfinedSpacePpe();
        log.info("[RedTag CS] ppe={}", ppe);

        scrollToSection(RedTagPattern.CS_SECTION_HEADER_PPE);
        // No reliable bottom anchor — use a screen-wide region from below the PPE header.
        Match pHdr = driver.find(RedTagPattern.CS_SECTION_HEADER_PPE);
        Region sect = driver.region(0, pHdr.y + pHdr.h, driver.screenWidth(),
                driver.screenHeight() - (pHdr.y + pHdr.h));
        log.info("[RedTag CS] ppe section ({},{}) {}x{}", sect.x, sect.y, sect.w, sect.h);

        tickCsCheckbox(sect, "ppe-face-shield", ppe.isFaceShield());
        tickCsCheckbox(sect, "ppe-gcfi", ppe.isFcfi());
        tickCsCheckbox(sect, "ppe-low-voltage", ppe.isLovVoltageTools());
        tickCsCheckbox(sect, "ppe-explosion-proof", ppe.isExplosionProofTools());
        tickCsCheckbox(sect, "ppe-non-sparking", ppe.isNonSparkingTools());
        tickCsCheckbox(sect, "ppe-fall-protection", ppe.isFallProtection());
        tickCsCheckbox(sect, "ppe-retrieval", ppe.isRetrievalSystem());
        tickCsCheckbox(sect, "ppe-lifeline", ppe.isLifeline());
        tickCsCheckbox(sect, "ppe-personal-meter", ppe.isPersonalAtmosphericMeter());
        tickCsCheckbox(sect, "ppe-tripod", ppe.isTripod());
        tickCsCheckbox(sect, "ppe-other", ppe.isOther());
        return "Confined Space PPE filled";
    }

    // --- Save / read-back ---------------------------------------------------

    public String save() {
        driver.click(RedTagPattern.SW_SAVE_BUTTON);
        int retries = 0;
        while (driver.exists(RedTagPattern.SW_ERROR_RECORD_IN_USE, 1)) {
            driver.pressEnter();
            driver.sleep(300);
            driver.click(RedTagPattern.SW_SAVE_BUTTON);
            if (++retries > 10) {
                throw new AutomationException("Confined Space permit would not save — "
                        + "'record in use' error did not clear after 10 retries.");
            }
        }
        return "Confined Space permit saved";
    }

    public String readPermitNumber() {
        Match header = driver.waitFor(RedTagPattern.SW_PERMIT_NUMBER_COLUMN, 10);
        Region firstRow = driver.region(header.x - 6, header.y + header.h + 2,
                header.w + 12, header.h + 6);
        String digits = nullToEmpty(driver.readText(firstRow)).replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            throw new AutomationException(
                    "Could not read the Confined Space permit number. Ungroup the list and retry.");
        }
        if (digits.length() > 6) digits = digits.substring(digits.length() - 6);
        log.info("[RedTag] Read Confined Space permit number: {}", digits);
        return digits;
    }

    // --- helpers ------------------------------------------------------------

    private void tickCsCheckbox(Region region, String key, boolean on) {
        if (!on) return;
        Match m = driver.findLabelOpt(CS_LABELS, key, region, 1.0);
        if (m == null) {
            log.warn("[RedTag CS] checkbox crop '{}' not found — row skipped", key);
            return;
        }
        int clickX = m.x + CHECKBOX_X_OFFSET;
        int clickY = m.y + m.h / 2;
        log.info("[RedTag CS] tick [{}] @ ({},{})", key, clickX, clickY);
        new Location(clickX, clickY).click();
        driver.sleep(40);
    }

    private void fillLabeledField(RedTagPattern label, String text) {
        if (text == null || text.isBlank()) return;
        Match m = driver.findOpt(label, 2);
        if (m == null) {
            log.warn("[RedTag CS] field label '{}' not found — field skipped", label.name());
            return;
        }
        int clickX = m.x + m.w - FIELD_RIGHT_INSET;
        int clickY = m.y + m.h / 2;
        log.info("[RedTag CS] fill {} @ ({},{}) = '{}'", label.name(), clickX, clickY, text);
        new Location(clickX, clickY).click();
        driver.sleep(60);
        driver.paste(text);
        driver.sleep(40);
    }

    private Region sectionRegion(RedTagPattern top, RedTagPattern bottom) {
        Match t = driver.find(top);
        Match b = driver.findOpt(bottom, 0.4);
        int y = t.y + t.h;
        int h = (b != null && b.y > y) ? (b.y - y) : (driver.screenHeight() - y);
        return driver.region(0, y, driver.screenWidth(), h);
    }

    private void scrollToSection(RedTagPattern header) {
        driver.hoverCenter();
        driver.sleep(120);
        int topBand = (int) (driver.screenHeight() * SECTION_TOP_FRACTION);
        for (int i = 0; i < SCROLL_MAX_STEPS; i++) {
            Match m = driver.findOpt(header, 0.4);
            if (m != null && m.y <= topBand) {
                log.info("[RedTag CS] '{}' in view at y={} after {} step(s)", header.name(), m.y, i);
                return;
            }
            log.info("[RedTag CS] scrolling to '{}' step {} (y={})",
                    header.name(), i, m == null ? "not-visible" : m.y);
            driver.scrollDown(SCROLL_TICKS);
            driver.sleep(150);
        }
        log.warn("[RedTag CS] could not bring '{}' into view after {} steps", header.name(), SCROLL_MAX_STEPS);
    }

    private void scrollToTop() {
        driver.hoverCenter();
        driver.scrollUp(SCROLL_MAX_STEPS * SCROLL_TICKS);
        driver.sleep(200);
    }

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
