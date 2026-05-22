package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagPattern;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.SikuliDriver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    /**
     * Clicks Continue on the LOTO builder.
     *
     * <p>NOTE: the "Information" form shown after Continue (lock box, requestor,
     * work scope, requested-by) and the final save / permit-number read-back are
     * not yet scripted — no screenshots of those screens have been supplied.
     * Capture them and extend this method to finish full end-to-end automation.
     */
    public String clickContinue() {
        driver.click(RedTagPattern.LOTO_BUILDER_CONTINUE_BUTTON);
        driver.sleep(properties.getInterStepDelayMs());
        return "Clicked Continue — finish the Information form manually "
                + "(post-Continue screens not yet captured)";
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
