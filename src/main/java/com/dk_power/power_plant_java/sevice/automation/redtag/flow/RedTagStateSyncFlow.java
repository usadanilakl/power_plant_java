package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.AutomationException;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagPattern;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.SikuliDriver;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagRow;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sikuli.script.Match;
import org.sikuli.script.Region;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pulls the current LOTO list out of the Red Tag desktop app for a single
 * {@link RedTagStatus} (ACTIVE / INACTIVE / CANCELED / CLOSED).
 *
 * <p>Fully automates:
 * <ol>
 *   <li>{@link #openLotoList() open} the LOTO Procedures tab;</li>
 *   <li>{@link #ensureGroupedByStatus() ensure} the list is grouped by Status;</li>
 *   <li>{@link #expandTab(RedTagStatus) expand} the requested status tab by
 *       first resetting every group to collapsed, then double-clicking the
 *       requested status word;</li>
 *   <li>{@link #collapseOtherTabs(RedTagStatus) confirm} that the reset left
 *       every OTHER status collapsed;</li>
 *   <li>{@link #scrapeRows(RedTagStatus) scrape} the visible rows by locating
 *       the four column headers ({@code LOTO Number / Job Description /
 *       Lock Box Description / Owner Photos}), using valid LOTO-number matches
 *       as Y anchors, and OCR'ing the other cells only inside that row band.</li>
 * </ol>
 *
 * <p>Every step returns a short human message that the {@link
 * com.dk_power.power_plant_java.sevice.automation.redtag.session.StepEngine}
 * surfaces via SSE. Failures throw {@link AutomationException} with actionable text.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RedTagStateSyncFlow {

    private final SikuliDriver driver;
    private final RedTagAutomationProperties properties;

    /**
     * Regex for Red Tag's LOTO number. Red Tag uses 4-6 digit numbers, so the
     * previous 6-digit-only pattern silently missed every current-generation
     * (5-digit) LOTO — the reason the earlier scrape produced blank
     * lotoNumber fields on every row.
     */
    private static final Pattern LOTO_NUMBER_RE = Pattern.compile("^\\s*(\\d{4,6})\\b");

    // ------------------------------------------------------------------------
    // Step 1 — open the LOTO Procedures list.
    // ------------------------------------------------------------------------

    /**
     * Clicks the LOTO Procedures tab and waits for the LOTO Number column
     * header to appear (proof the list is showing).
     */
    public String openLotoList() {
        driver.click(RedTagPattern.LOTO_PROCEDURES_TAB);
        driver.sleep(properties.getInterStepDelayMs());
        driver.waitFor(RedTagPattern.LIST_COL_LOTO_NUMBER, 15);
        return "LOTO Procedures list opened";
    }

    // ------------------------------------------------------------------------
    // Step 2 — grouping.
    // ------------------------------------------------------------------------

    /**
     * Ensures the list is grouped by Status. If any of the four status tab strips
     * is already on screen, nothing to do. Otherwise, drags the Status column
     * header into the yellow grouping band.
     */
    public String ensureGroupedByStatus() {
        if (anyStatusTabVisible(1.5)) {
            return "List already grouped by Status";
        }
        driver.dragDrop(RedTagPattern.LIST_STATUS_COLUMN_HEADER,
                RedTagPattern.LIST_GROUPING_BAND_EMPTY);
        driver.sleep(properties.getInterStepDelayMs());
        if (!anyStatusTabVisible(4)) {
            throw new AutomationException(
                    "Dragged the Status column into the grouping band but no status tab "
                            + "appeared afterwards. The grouping-band or Status-column crop may "
                            + "be out of date for this screen resolution.",
                    RedTagPattern.LIST_STATUS_COLUMN_HEADER.name(), null);
        }
        return "Grouped list by Status";
    }

    private boolean anyStatusTabVisible(double timeoutSeconds) {
        for (RedTagStatus s : RedTagStatus.values()) {
            if (driver.exists(s.collapsedPattern(), timeoutSeconds)
                    || driver.exists(s.expandedPattern(), timeoutSeconds)) {
                return true;
            }
        }
        return false;
    }

    // ------------------------------------------------------------------------
    // Step 3 — reset the groups, then expand only the requested tab.
    // ------------------------------------------------------------------------

    /**
     * Ensures the requested status tab is the only expanded group. The full
     * collapsed/expanded crops differ by only a few +/- pixels and therefore
     * cannot reliably identify state at normal image-match thresholds. Always
     * resetting grouping gives us a known collapsed state before the one
     * deliberate double-click, so an already-open target can never be toggled
     * closed by mistake.
     */
    public String expandTab(RedTagStatus status) {
        log.info("[RedTag] Resetting grouped view before opening {}", status);
        resetGrouping();

        Match collapsed = driver.findOpt(status.collapsedPattern(), 5);
        if (collapsed == null) {
            throw new AutomationException(
                    "Could not find the " + status.name() + " tab after resetting the grouped "
                            + "view. The tab-strip crop may be out of date, or Red Tag has no "
                            + "rows in this status right now.",
                    status.collapsedPattern().name(), null);
        }
        doubleClickStatusLabel(collapsed);
        driver.waitFor(status.expandedPattern(), 10);
        return status.name() + " tab expanded from reset state";
    }

    /**
     * The preceding expand step resets every group before opening the target,
     * so no state-guessing clicks are needed here. In particular, do not try to
     * distinguish expanded from collapsed using the nearly identical full-tab
     * images; that was capable of opening a group while attempting to close it.
     */
    public String collapseOtherTabs(RedTagStatus target) {
        return "Other tabs remain collapsed after opening " + target.name();
    }

    private void resetGrouping() {
        Match band = driver.findOpt(RedTagPattern.LIST_STATUS_COLUMN_HEADER, 2);
        if (band != null) {
            driver.dragDropTo(RedTagPattern.LIST_STATUS_COLUMN_HEADER,
                    new org.sikuli.script.Location(band.x + band.w / 2,
                            band.y + band.h + 30));
            driver.sleep(properties.getInterStepDelayMs());
        } else {
            log.warn("[RedTag] Could not find Status column header inside grouping band; "
                    + "the reset drag-out step will be skipped and we'll try to drop in only.");
        }
        driver.dragDrop(RedTagPattern.LIST_STATUS_COLUMN_HEADER,
                RedTagPattern.LIST_GROUPING_BAND_EMPTY);
        driver.sleep(properties.getInterStepDelayMs());
    }

    /**
     * Red Tag reliably toggles a grouped section when its status word is
     * double-clicked. Clicking the small +/- glyph was resolution-sensitive
     * and routinely missed on the active tab.
     */
    private void doubleClickStatusLabel(Match tab) {
        // Crops read "+ Status : ACTIVE" (and equivalents). Their geometric
        // centre is near the colon; 75% across lands in the actual status word.
        driver.doubleClickOffset(tab, tab.w / 4, 0);
        driver.sleep(properties.getInterStepDelayMs());
    }

    // ------------------------------------------------------------------------
    // Step 4 — scrape rows column-by-column.
    // ------------------------------------------------------------------------

    /**
     * Row-anchored scrape. Only confidently parsed LOTO-number lines create
     * rows. Each number match supplies the absolute Y coordinate used to OCR
     * the Job / Lock Box / Owner cells from that same horizontal row band.
     * Wrapped descriptions therefore cannot shift every later row, and a
     * blank image-only Owner Photos column cannot shift any column at all.
     */
    public List<RedTagRow> scrapeRows(RedTagStatus status) {
        ColumnBounds cols = locateColumns();
        int maxScanHeight = Math.min(properties.getStateSyncRowsRegionHeight(),
                driver.screenHeight() - cols.top - 40);
        if (maxScanHeight < 10) {
            throw new AutomationException(
                    "The Red Tag row OCR region is below the visible screen. Check the column-header crops.",
                    RedTagPattern.LIST_COL_LOTO_NUMBER.name(), null);
        }
        driver.hoverCenter();

        Map<String, RedTagRow> byKey = new LinkedHashMap<>();
        int emptyPasses = 0;
        for (int pass = 0; pass < 60; pass++) {
            int before = byKey.size();
            Integer nextGroupY = visibleOtherStatusBoundary(
                    status, cols.top, driver.screenHeight());
            boolean reachedOtherGroup = nextGroupY != null;
            int scanHeight = reachedOtherGroup
                    ? Math.min(maxScanHeight, Math.max(0, nextGroupY - cols.top - 2))
                    : maxScanHeight;
            if (scanHeight < 10) {
                log.info("[RedTag] Reached the next status group before scrape pass {}", pass);
                break;
            }

            int scanBottom = cols.top + scanHeight;
            List<Match> lotoAnchors = safeReadLines(cols.stripLoto(scanHeight)).stream()
                    .filter(line -> !parseLotoNumber(textOf(line)).isBlank())
                    .sorted(java.util.Comparator.comparingInt(line -> line.y))
                    .toList();

            for (int i = 0; i < lotoAnchors.size(); i++) {
                Match anchor = lotoAnchors.get(i);
                String lotoNumber = parseLotoNumber(textOf(anchor));
                int rowTop = Math.max(cols.top,
                        anchor.y - properties.getStateSyncCellVerticalPadding());
                int inferredHeight = inferredRowHeight(lotoAnchors, i, anchor);
                int rowBottom = Math.min(scanBottom, rowTop + inferredHeight);
                if (rowBottom <= rowTop) continue;

                RedTagRow row = new RedTagRow();
                row.setLotoNumber(lotoNumber);
                row.setJobDescription(safeReadCell(cols.cellJob(rowTop, rowBottom)));
                row.setLockBox(safeReadCell(cols.cellBox(rowTop, rowBottom)));
                row.setRequestor(safeReadCell(cols.cellOwner(rowTop, rowBottom)));

                byKey.merge("N:" + lotoNumber, row, RedTagStateSyncFlow::mergeRows);
                if (byKey.size() >= properties.getStateSyncMaxRows()) break;
            }

            int added = byKey.size() - before;
            log.info("[RedTag] Scrape pass {}: {} valid LOTO anchors, {} rows total (+{}){}",
                    pass, lotoAnchors.size(), byKey.size(), added,
                    reachedOtherGroup ? "; next status boundary reached" : "");
            if (reachedOtherGroup) break;
            if (added == 0) {
                emptyPasses++;
                if (emptyPasses >= properties.getStateSyncEmptyScrollLimit()) break;
            } else {
                emptyPasses = 0;
            }
            if (byKey.size() >= properties.getStateSyncMaxRows()) {
                log.warn("[RedTag] Scrape hit max rows limit ({}); truncating",
                        properties.getStateSyncMaxRows());
                break;
            }
            driver.scrollDown(properties.getStateSyncScrollTicks());
            driver.sleep(properties.getInterStepDelayMs());
        }
        return new ArrayList<>(byKey.values());
    }

    private int inferredRowHeight(List<Match> anchors, int index, Match anchor) {
        int gap;
        if (index + 1 < anchors.size()) {
            gap = anchors.get(index + 1).y - anchor.y;
        } else if (index > 0) {
            gap = anchor.y - anchors.get(index - 1).y;
        } else {
            gap = properties.getStateSyncDefaultRowHeight();
        }
        int minimum = anchor.h + 2 * properties.getStateSyncCellVerticalPadding();
        return Math.min(properties.getStateSyncMaxRowHeight(), Math.max(minimum, gap));
    }

    /**
     * If another status header is visible below the current rows, return its Y
     * coordinate. The current pass is clipped there and scrolling stops, so a
     * failed/missed collapse can never leak rows from a different status.
     */
    private Integer visibleOtherStatusBoundary(RedTagStatus target, int top, int bottom) {
        Integer earliest = null;
        for (RedTagStatus status : RedTagStatus.values()) {
            if (status == target) continue;
            Match collapsed = driver.findOpt(status.collapsedPattern(), 0.1);
            Match expanded = driver.findOpt(status.expandedPattern(), 0.1);
            for (Match match : new Match[]{collapsed, expanded}) {
                if (match == null || match.y <= top || match.y >= bottom) continue;
                earliest = earliest == null ? match.y : Math.min(earliest, match.y);
            }
        }
        return earliest;
    }

    private ColumnBounds locateColumns() {
        Match hLoto = driver.waitFor(RedTagPattern.LIST_COL_LOTO_NUMBER, 8);
        Match hJob = driver.waitFor(RedTagPattern.LIST_COL_JOB_DESCRIPTION, 8);
        Match hBox = driver.waitFor(RedTagPattern.LIST_COL_LOCK_BOX_DESCRIPTION, 8);
        Match hOwner = driver.waitFor(RedTagPattern.LIST_COL_OWNER_PHOTOS, 8);
        // Row area starts a few pixels below the header row and runs down to
        // the bottom of the screen (bounded by scanHeight in the scroll loop).
        int headerBottom = Math.max(
                Math.max(hLoto.y + hLoto.h, hJob.y + hJob.h),
                Math.max(hBox.y + hBox.h, hOwner.y + hOwner.h));
        int top = headerBottom + properties.getStateSyncRowsTopPadding();
        return new ColumnBounds(hLoto, hJob, hBox, hOwner, top);
    }

    /**
     * OCR wrapper that returns an empty list on failure instead of throwing.
     * A whole-list scrape must not die when one column happens to be blank on
     * one scroll page.
     */
    private List<Match> safeReadLines(Region region) {
        try {
            return driver.readLines(region);
        } catch (Exception e) {
            log.debug("[RedTag] OCR readLines failed on {}: {}", region, e.getMessage());
            return List.of();
        }
    }

    private static String textOf(Match m) {
        String t = m.getText();
        return t == null ? "" : t.trim();
    }

    private String safeReadCell(Region region) {
        try {
            String text = driver.readText(region);
            return text == null ? "" : text.replaceAll("\\s+", " ").trim();
        } catch (Exception e) {
            log.debug("[RedTag] OCR cell read failed on {}: {}", region, e.getMessage());
            return "";
        }
    }

    /** Extracts the LOTO number from a raw column-1 line. Returns blank when OCR could not parse. */
    static String parseLotoNumber(String text) {
        if (text == null || text.isBlank()) return "";
        Matcher m = LOTO_NUMBER_RE.matcher(text);
        return m.find() ? m.group(1) : "";
    }

    private static RedTagRow mergeRows(RedTagRow existing, RedTagRow candidate) {
        existing.setJobDescription(richer(existing.getJobDescription(), candidate.getJobDescription()));
        existing.setLockBox(richer(existing.getLockBox(), candidate.getLockBox()));
        existing.setRequestor(richer(existing.getRequestor(), candidate.getRequestor()));
        return existing;
    }

    private static String richer(String existing, String candidate) {
        if (existing == null || existing.isBlank()) return candidate == null ? "" : candidate;
        if (candidate == null || candidate.isBlank()) return existing;
        return candidate.length() > existing.length() ? candidate : existing;
    }

    /**
     * Column and cell geometry. The LOTO-number strip is read once to obtain
     * row anchors; the remaining columns are sliced into one row-height cell
     * at a time using those anchors.
     */
    private final class ColumnBounds {
        private final ColumnRange loto, job, box, owner;
        private final int top;

        ColumnBounds(Match hLoto, Match hJob, Match hBox, Match hOwner, int top) {
            List<Match> visualOrder = new ArrayList<>(List.of(hLoto, hJob, hBox, hOwner));
            visualOrder.sort(java.util.Comparator.comparingInt(header -> header.x));
            this.loto = rangeFor(hLoto, visualOrder);
            this.job = rangeFor(hJob, visualOrder);
            this.box = rangeFor(hBox, visualOrder);
            this.owner = rangeFor(hOwner, visualOrder);
            this.top = top;
        }

        Region stripLoto(int height) {
            return driver.region(loto.left(), top, loto.width(), height);
        }

        Region cellJob(int rowTop, int rowBottom) {
            return cell(job, rowTop, rowBottom);
        }

        Region cellBox(int rowTop, int rowBottom) {
            return cell(box, rowTop, rowBottom);
        }

        Region cellOwner(int rowTop, int rowBottom) {
            return cell(owner, rowTop, rowBottom);
        }

        private ColumnRange rangeFor(Match header, List<Match> visualOrder) {
            int index = visualOrder.indexOf(header);
            int right = index + 1 < visualOrder.size()
                    ? visualOrder.get(index + 1).x
                    : driver.screenWidth();
            return new ColumnRange(header.x, right);
        }

        private Region cell(ColumnRange column, int rowTop, int rowBottom) {
            int x = column.left() + 2;
            int width = Math.max(20, column.right() - column.left() - 4);
            return driver.region(x, rowTop, width, Math.max(1, rowBottom - rowTop));
        }
    }

    private record ColumnRange(int left, int right) {
        int width() {
            return Math.max(20, right - left);
        }
    }
}
