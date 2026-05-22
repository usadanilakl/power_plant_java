package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.AutomationException;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagPattern;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.SikuliDriver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.script.Match;
import org.sikuli.script.Region;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Automates building a LOTO procedure in the Red Tag desktop app, mirroring the
 * manual steps documented in {@code project/features/red-tag-automation/create-loto.md}:
 *
 * <ol>
 *   <li>open the LOTO builder (LOTO Procedures tab → NEW ISOLATION → select LOTO →
 *       "Issue LOTO with NO Standard Procedure");</li>
 *   <li>fill the header (Job Description, LOTO Type, Equipment Description);</li>
 *   <li>add each isolation point via the "Add a Device Manually" dialog;</li>
 *   <li>click Continue.</li>
 * </ol>
 *
 * <p>All field targeting is anchor-relative: a distinctive label is located, then a
 * click lands at a pixel offset in the field beside it. The {@code *_DX}/{@code *_DY}
 * constants below are tied to where each label pattern is cropped — see
 * {@code project/features/red-tag-automation/PATTERN_MANIFEST.md}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LotoBuildFlow {

    private static final String LOTO_TYPE_TEXT = "LOTO";

    // --- LOTO builder header field offsets (from label centre) ---------------
    private static final int JOB_DESCRIPTION_DX = 200;
    private static final int LOTO_TYPE_DX = 130;
    private static final int EQUIPMENT_DESCRIPTION_DX = 220;

    // --- 'Add Device' dialog field offsets (from label centre) --------------
    private static final int DEVICE_DESCRIPTION_DX = 260;
    private static final int DEVICE_LARGE_DESCRIPTION_DX = 60;
    private static final int DEVICE_LARGE_DESCRIPTION_DY = 40;
    private static final int DEVICE_PNID_DX = 260;
    private static final int DEVICE_LOCATION_DX = 260;
    private static final int DEVICE_ISOLATED_POSITION_DX = 150;
    private static final int DEVICE_NORMAL_POSITION_DX = 150;

    // --- LOTO information form (post-Continue) field offsets -----------------
    private static final int LOCK_BOX_DX = 110;
    private static final int OWNER_DX = 248;
    private static final int WHY_DX = 158;
    private static final int WHY_DY = 22;
    private static final int REQUESTED_BY_NAME_DX = 143;
    private static final int REQUESTED_BY_NAME_DY = 37;

    private final SikuliDriver driver;
    private final RedTagAutomationProperties properties;

    /** Opens a fresh "Issue New LOTO" builder with no standard procedure. */
    public String openLotoBuilder() {
        driver.click(RedTagPattern.LOTO_PROCEDURES_TAB);
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.NEW_ISOLATION_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
        // Side-dropdown: LOTO is the only option (see create-loto.md step 3).
        driver.click(RedTagPattern.NEW_ISO_LOTO_OPTION);
        driver.sleep(properties.getInterStepDelayMs());
        driver.click(RedTagPattern.ISSUE_LOTO_NO_STANDARD_BUTTON);
        driver.waitFor(RedTagPattern.LOTO_BUILDER_TITLE, 15);
        return "LOTO builder opened";
    }

    /** Fills the LOTO builder header: Job Description, LOTO Type, Equipment Description. */
    public String fillHeader(LotoDto loto) {
        driver.pasteAt(RedTagPattern.LOTO_BUILDER_JOB_DESCRIPTION_LABEL,
                JOB_DESCRIPTION_DX, 0, nullToEmpty(loto.getWorkScope()));
        driver.pasteAt(RedTagPattern.LOTO_BUILDER_LOTO_TYPE_LABEL,
                LOTO_TYPE_DX, 0, LOTO_TYPE_TEXT);
        driver.pasteAt(RedTagPattern.LOTO_BUILDER_EQUIPMENT_DESCRIPTION_LABEL,
                EQUIPMENT_DESCRIPTION_DX, 0, nullToEmpty(loto.getEquipmentSystem()));
        return "LOTO header filled";
    }

    /** Adds every isolation point through the "Add a Device Manually" dialog. */
    public String addPoints(List<LotoPointDto> points) {
        if (points == null || points.isEmpty()) {
            return "No LOTO points to add";
        }
        int added = 0;
        for (LotoPointDto point : points) {
            addPoint(point);
            added++;
        }
        return "Added " + added + " LOTO point(s)";
    }

    private void addPoint(LotoPointDto point) {
        driver.click(RedTagPattern.LOTO_BUILDER_ADD_DEVICE_MANUALLY_BUTTON);
        driver.waitFor(RedTagPattern.ADD_DEVICE_TITLE, 10);

        driver.pasteAt(RedTagPattern.ADD_DEVICE_DESCRIPTION_LABEL,
                DEVICE_DESCRIPTION_DX, 0, nullToEmpty(point.getDescription()));
        driver.pasteAt(RedTagPattern.ADD_DEVICE_LARGE_DESCRIPTION_LABEL,
                DEVICE_LARGE_DESCRIPTION_DX, DEVICE_LARGE_DESCRIPTION_DY, largeDescription(point));
        driver.pasteAt(RedTagPattern.ADD_DEVICE_PNID_LABEL,
                DEVICE_PNID_DX, 0, nullToEmpty(point.getTagNumber()));
        driver.pasteAt(RedTagPattern.ADD_DEVICE_LOCATION_LABEL,
                DEVICE_LOCATION_DX, 0, nullToEmpty(point.getSpecificLocation()));
        driver.pasteAt(RedTagPattern.ADD_DEVICE_ISOLATED_POSITION_LABEL,
                DEVICE_ISOLATED_POSITION_DX, 0, isolatedPosition(point));
        driver.pasteAt(RedTagPattern.ADD_DEVICE_NORMAL_POSITION_LABEL,
                DEVICE_NORMAL_POSITION_DX, 0, normalPosition(point));

        driver.click(RedTagPattern.ADD_DEVICE_OK_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
    }

    /** Clicks Continue on the builder and waits for the LOTO information form. */
    public String openLotoDetails() {
        driver.click(RedTagPattern.LOTO_BUILDER_CONTINUE_BUTTON);
        driver.waitFor(RedTagPattern.LOTO_DETAILS_DIALOG_TITLE, 15);
        return "LOTO information form opened";
    }

    /**
     * Fills the LOTO information form. Per create-loto.md the owner of the LOTO
     * and the "Requested By" name are the same person (the LOTO requestor), and
     * "Why is this job being performed" repeats the job description.
     *
     * <p>The owner / requested-by fields are scrollable dropdowns; pasting the
     * requestor name selects it when the text matches an entry — otherwise the
     * operator may need to pick it manually (run with manual confirmation on for
     * the first builds).
     */
    public String fillLotoDetails(LotoDto loto) {
        String owner = nullToEmpty(loto.getLotoRequestor());
        String lockBox = loto.getBoxNumber() != null ? String.valueOf(loto.getBoxNumber()) : "";
        driver.pasteAt(RedTagPattern.LOTO_DETAILS_LOCK_BOX_LABEL, LOCK_BOX_DX, 0, lockBox);
        driver.pasteAt(RedTagPattern.LOTO_DETAILS_OWNER_LABEL, OWNER_DX, 0, owner);
        driver.pasteAt(RedTagPattern.LOTO_DETAILS_WHY_LABEL, WHY_DX, WHY_DY, nullToEmpty(loto.getWorkScope()));
        driver.pasteAt(RedTagPattern.LOTO_DETAILS_REQUESTED_BY_HEADER,
                REQUESTED_BY_NAME_DX, REQUESTED_BY_NAME_DY, owner);
        return "LOTO information form filled";
    }

    /**
     * Submits the LOTO information form and dismisses the optional post-save
     * "procedure was modified" warning (the LOTO is still saved when it appears).
     */
    public String submitLotoDetails() {
        driver.click(RedTagPattern.LOTO_DETAILS_OK_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
        if (driver.exists(RedTagPattern.LOTO_SUBMISSION_WARNING_OK, 3)) {
            driver.click(RedTagPattern.LOTO_SUBMISSION_WARNING_OK);
            driver.sleep(properties.getInterStepDelayMs());
        }
        return "LOTO submitted";
    }

    /**
     * Reads the Red Tag number of the just-created LOTO from the first row of the
     * LOTO Procedures list via OCR. Assumes the list is ungrouped so the newest
     * LOTO is the top row.
     */
    public String readPermitNumber() {
        Match header = driver.waitFor(RedTagPattern.LOTO_NUMBER_COLUMN_HEADER, 10);
        Region firstRow = driver.region(header.x - 6, header.y + header.h + 2,
                header.w + 12, header.h + 6);
        String text = driver.readText(firstRow);
        String digits = text == null ? "" : text.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            throw new AutomationException(
                    "Could not read the new LOTO number from the list. If the list is grouped "
                            + "by Status, ungroup it (drag the Status header out of the yellow "
                            + "band) so the newest LOTO is the first row, then retry this step.");
        }
        if (digits.length() > 6) {
            digits = digits.substring(digits.length() - 6);
        }
        log.info("[RedTag] Read LOTO number from list: {}", digits);
        return digits;
    }

    // --- field-value helpers -------------------------------------------------

    /**
     * The "Isolation Device Large Description" field carries the resolved
     * zero-energy sentence: the template phrase with each placeholder replaced
     * by an equipment tag number — e.g. "Open VCD100 valve then verify gauge
     * VCND001 shows 0".
     *
     * <p>{@code ZeroEnergyDto.method} is already fully resolved upstream by
     * {@code ZeroEnergyMapper} (it parses the template's phrase segments and
     * substitutes tag numbers), so it is used directly. The flat
     * {@code zeroEnergyMethod} string is only a fallback for older points whose
     * {@code zeroEnergy} object is not populated.
     */
    private String largeDescription(LotoPointDto point) {
        if (point.getZeroEnergy() != null
                && point.getZeroEnergy().getMethod() != null
                && !point.getZeroEnergy().getMethod().isBlank()) {
            return point.getZeroEnergy().getMethod();
        }
        return nullToEmpty(point.getZeroEnergyMethod());
    }

    private String isolatedPosition(LotoPointDto point) {
        if (point.getIsoPos() != null && point.getIsoPos().getName() != null) {
            return point.getIsoPos().getName();
        }
        return nullToEmpty(point.getIsolatedPosition());
    }

    private String normalPosition(LotoPointDto point) {
        if (point.getNormPos() != null && point.getNormPos().getName() != null) {
            return point.getNormPos().getName();
        }
        return nullToEmpty(point.getNormalPosition());
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
