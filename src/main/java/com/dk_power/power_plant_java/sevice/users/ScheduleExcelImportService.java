package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.dto.users.ScheduleImportRequest;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Hub-side import of the SharePoint "OPS Schedule {year}.xlsx" into {@link com.dk_power.power_plant_java
 * .entities.users.ShiftDay} via {@link ShiftDayService}. Faithful Java/POI port of the Electron
 * {@code PersonnelManager} parser (electron-manager/src/main/managers/personnel.manager.ts).
 *
 * The spreadsheet is a visual grid (one block per month; people in name/override row pairs; columns =
 * days; cells = shift codes D/N/U/P/T/OCM; a left "group" column carries A/B/C/D/Relief/On Call
 * Manager). People rotate crews across months, so each month is parsed with its own row layout.
 *
 * ⚠️ The layout heuristics are brittle (as in the original). Validate against the real workbook by
 * running POST /ng/schedule/import-from-sharepoint and checking the Schedule tab.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleExcelImportService {

    private static final Set<String> VALID_SHIFTS = Set.of("D", "N", "U", "P", "T", "OCM");
    private static final String[] MONTH_NAMES = {"January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"};
    private static final Pattern NON_NAME = Pattern.compile(
            "^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|January|February|March|April|May|June|July|August|September|October|November|December|Outage)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DIGITS = Pattern.compile("^\\d+$");
    private static final Pattern GROUP_AD = Pattern.compile("^[A-D]$", Pattern.CASE_INSENSITIVE);
    private static final Pattern GROUP_REL = Pattern.compile("^rel(ief)?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern GROUP_OCM = Pattern.compile("^(on\\s*call\\s*manager|ocm)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern REL_ONLY = Pattern.compile("^relief$", Pattern.CASE_INSENSITIVE);
    private static final Pattern OCM_ONLY = Pattern.compile("^on\\s*call\\s*manager$", Pattern.CASE_INSENSITIVE);

    private final SharePointCertificateAccess sharePoint;
    private final ShiftDayService shiftDayService;

    @Value("${sync.role:}")
    private String syncRole;

    private static String schedulePath(int year) {
        return "/sites/JG/External/60 - Operations/60.05 Ops schedule/" + year + "/OPS Schedule " + year + ".xlsx";
    }

    /** Hub-only daily refresh (06:30). The catalog/assignment only need it occasionally. */
    @Scheduled(cron = "0 30 6 * * *")
    public void scheduledImport() {
        if (!"hub".equalsIgnoreCase(syncRole)) return;
        if (!sharePoint.isAvailable()) {
            log.debug("[Schedule] scheduledImport skipped — SharePoint certificate access not available");
            return;
        }
        try {
            int rows = importNow();
            log.info("[Schedule] scheduledImport wrote {} day rows", rows);
        } catch (Exception e) {
            log.warn("[Schedule] scheduledImport failed: {}", e.getMessage());
        }
    }

    /** Download + parse the current-year Ops Schedule and persist via ShiftDayService. Returns day rows written. */
    public int importNow() {
        int year = LocalDate.now().getYear();
        byte[] bytes = sharePoint.downloadFileByServerRelativeUrl(schedulePath(year));
        List<ScheduleImportRequest.PersonSchedule> persons = parse(bytes, year);
        ScheduleImportRequest req = new ScheduleImportRequest(year, "sharepoint-cert", persons);
        return shiftDayService.importSchedule(req);
    }

    // ── Parsing (ported from personnel.manager.ts) ──────────────────────────────

    private List<ScheduleImportRequest.PersonSchedule> parse(byte[] bytes, int year) {
        String[][] data;
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            boolean leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
            Sheet sheet = wb.getSheet(leap ? "Leap" : "Non Leap");
            if (sheet == null) sheet = wb.getSheetAt(0);
            if (sheet == null) throw new IllegalStateException("Schedule workbook has no sheets");
            data = toGrid(sheet);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to read schedule workbook: " + e.getMessage(), e);
        }
        if (data.length < 5) throw new IllegalStateException("Schedule sheet has too few rows");

        Map<Integer, MonthRange> monthRanges = new HashMap<>();
        for (int m = 0; m < 12; m++) {
            MonthRange r = findMonthColumns(data, m);
            if (r != null) monthRanges.put(m, r);
        }
        if (monthRanges.isEmpty()) {
            log.warn("[Schedule] No month blocks found in workbook");
            return List.of();
        }

        // Canonical roster from the current month if present, else the earliest available month.
        int currentMonth = LocalDate.now().getMonthValue() - 1;
        if (!monthRanges.containsKey(currentMonth)) {
            currentMonth = monthRanges.keySet().stream().min(Integer::compareTo).orElse(-1);
        }
        if (currentMonth < 0) return List.of();

        Map<Integer, MonthMaps> monthMaps = new HashMap<>();
        for (Map.Entry<Integer, MonthRange> e : monthRanges.entrySet()) {
            monthMaps.put(e.getKey(), buildMonthMaps(data, e.getValue()));
        }
        MonthMaps currentMaps = monthMaps.get(currentMonth);
        if (currentMaps == null) return List.of();

        // Day columns for the entire calendar year.
        List<ScheduleDay> scheduleDays = new ArrayList<>();
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            int month = d.getMonthValue() - 1;
            MonthRange range = monthRanges.get(month);
            if (range == null) continue;
            int col = findDayColumn(data[range.dayNumberRow], range.startCol, range.endCol, d.getDayOfMonth());
            if (col >= 0) scheduleDays.add(new ScheduleDay(col, d, month));
        }

        List<ScheduleImportRequest.PersonSchedule> out = new ArrayList<>();
        for (String name : currentMaps.namesInOrder) {
            int currentRow = currentMaps.nameToRow.get(name);
            String group = currentMaps.rowToGroup.getOrDefault(currentRow, "");

            List<ScheduleImportRequest.DayCode> schedule = new ArrayList<>();
            for (ScheduleDay sd : scheduleDays) {
                MonthMaps mMap = monthMaps.get(sd.month);
                boolean useOther = mMap != null && sd.month != currentMonth;
                int row = useOther ? mMap.nameToRow.getOrDefault(name, currentRow) : currentRow;
                Set<Integer> personRows = useOther ? mMap.personRows : currentMaps.personRows;
                String shift = getBestShift(data, row, sd.col, personRows);
                if (!shift.isBlank()) {
                    schedule.add(new ScheduleImportRequest.DayCode(sd.date, shift));
                }
            }
            out.add(new ScheduleImportRequest.PersonSchedule(name, group, schedule));
        }
        log.info("[Schedule] Parsed {} people across {} months ({} day-columns)",
                out.size(), monthRanges.size(), scheduleDays.size());
        return out;
    }

    private MonthMaps buildMonthMaps(String[][] data, MonthRange range) {
        Map<String, Integer> nameToRow = new LinkedHashMap<>();
        Map<Integer, String> rowToGroup = new HashMap<>();
        List<String> namesInOrder = new ArrayList<>();
        Set<Integer> personRows = new HashSet<>();
        String currentGroup = "";

        for (int r = range.dataStartRow; r < data.length; r++) {
            String normalized = findGroupLabelInRow(data[r], range.groupCol);
            if (normalized != null) currentGroup = normalized;

            String nameCell = safe(data, r, range.nameCol).trim();
            if (nameCell.isEmpty()) continue;
            if (NON_NAME.matcher(nameCell).find()) continue;
            if (DIGITS.matcher(nameCell).matches()) continue;

            nameToRow.put(nameCell, r);
            rowToGroup.put(r, currentGroup);
            namesInOrder.add(nameCell);
            personRows.add(r);
        }
        return new MonthMaps(nameToRow, rowToGroup, namesInOrder, personRows);
    }

    private String getBestShift(String[][] data, int row, int col, Set<Integer> personRows) {
        if (col < 0 || row < 0 || row >= data.length) return "";
        String main = safe(data, row, col).trim().toUpperCase();
        if (row + 1 < data.length && !personRows.contains(row + 1)) {
            String override = safe(data, row + 1, col).trim().toUpperCase();
            if (VALID_SHIFTS.contains(override)) return override;
        }
        if (VALID_SHIFTS.contains(main)) return main;
        return "";
    }

    private MonthRange findMonthColumns(String[][] data, int month) {
        String monthName = MONTH_NAMES[month];
        for (int r = 0; r < Math.min(data.length, 5); r++) {
            for (int c = 0; c < data[r].length; c++) {
                String cell = safe(data, r, c).trim();
                if (!cell.equalsIgnoreCase(monthName)) continue;

                int dayNumberRow = r + 2;
                if (dayNumberRow >= data.length) return null;

                int firstDayCol = -1, lastDayCol = -1;
                for (int dc = c; dc < data[dayNumberRow].length; dc++) {
                    Integer val = asInt(safe(data, dayNumberRow, dc));
                    if (val != null && val >= 1 && val <= 31) {
                        if (firstDayCol < 0) firstDayCol = dc;
                        else if (val == 1 && lastDayCol >= 0) break; // reset to 1 → next month
                        lastDayCol = dc;
                    }
                }
                if (firstDayCol < 0) return null;

                int groupCol = Math.max(0, firstDayCol - 2);
                int nameCol = Math.max(0, firstDayCol - 1);

                boolean nameFound = false;
                for (int testR = dayNumberRow + 1; testR < Math.min(dayNumberRow + 10, data.length); testR++) {
                    String t = safe(data, testR, nameCol).trim();
                    if (!t.isEmpty() && !DIGITS.matcher(t).matches() && !VALID_SHIFTS.contains(t.toUpperCase())) {
                        nameFound = true; break;
                    }
                }
                if (!nameFound) {
                    outer:
                    for (int nc = firstDayCol - 1; nc >= Math.max(0, firstDayCol - 5); nc--) {
                        for (int testR = dayNumberRow + 1; testR < Math.min(dayNumberRow + 10, data.length); testR++) {
                            String t = safe(data, testR, nc).trim();
                            if (t.length() > 1 && !DIGITS.matcher(t).matches() && !VALID_SHIFTS.contains(t.toUpperCase())) {
                                nameCol = nc;
                                groupCol = nc > 0 ? nc - 1 : 0;
                                break outer;
                            }
                        }
                    }
                }
                return new MonthRange(firstDayCol, lastDayCol, nameCol, groupCol, dayNumberRow, dayNumberRow + 1);
            }
        }
        return null;
    }

    private int findDayColumn(String[] dayRow, int startCol, int endCol, int targetDay) {
        for (int c = startCol; c <= endCol && c < dayRow.length; c++) {
            Integer v = asInt(dayRow[c]);
            if (v != null && v == targetDay) return c;
        }
        return -1;
    }

    private String findGroupLabelInRow(String[] row, int primaryCol) {
        if (primaryCol >= 0 && primaryCol < row.length) {
            String direct = normalizeGroupLabel(row[primaryCol]);
            if (direct != null) return direct;
        }
        for (int c = 0; c < row.length; c++) {
            if (c == primaryCol) continue;
            String s = row[c] == null ? "" : row[c].trim();
            if (REL_ONLY.matcher(s).matches()) return "Rel";
            if (OCM_ONLY.matcher(s).matches()) return "OCM";
        }
        return null;
    }

    private String normalizeGroupLabel(String raw) {
        String s = raw == null ? "" : raw.trim();
        if (s.isEmpty()) return null;
        if (GROUP_AD.matcher(s).matches()) return s.toUpperCase();
        if (GROUP_REL.matcher(s).matches()) return "Rel";
        if (GROUP_OCM.matcher(s).matches()) return "OCM";
        return null;
    }

    // ── grid helpers ───────────────────────────────────────────────────────────

    private String[][] toGrid(Sheet sheet) {
        int lastRow = sheet.getLastRowNum();
        int maxCol = 0;
        for (int r = 0; r <= lastRow; r++) {
            Row row = sheet.getRow(r);
            if (row != null) maxCol = Math.max(maxCol, row.getLastCellNum());
        }
        DataFormatter fmt = new DataFormatter();
        String[][] grid = new String[lastRow + 1][Math.max(0, maxCol)];
        for (int r = 0; r <= lastRow; r++) {
            Row row = sheet.getRow(r);
            for (int c = 0; c < maxCol; c++) {
                String v = "";
                if (row != null) {
                    Cell cell = row.getCell(c);
                    if (cell != null) v = fmt.formatCellValue(cell);
                }
                grid[r][c] = v == null ? "" : v;
            }
        }
        return grid;
    }

    private static String safe(String[][] data, int r, int c) {
        if (r < 0 || r >= data.length || c < 0 || c >= data[r].length) return "";
        return data[r][c] == null ? "" : data[r][c];
    }

    private static Integer asInt(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isEmpty()) return null;
        try {
            return (int) Double.parseDouble(t); // tolerate "1", "1.0"
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // ── small structs ──────────────────────────────────────────────────────────

    private record MonthRange(int startCol, int endCol, int nameCol, int groupCol,
                              int dayNumberRow, int dataStartRow) {}

    private record ScheduleDay(int col, LocalDate date, int month) {}

    private static final class MonthMaps {
        final Map<String, Integer> nameToRow;
        final Map<Integer, String> rowToGroup;
        final List<String> namesInOrder;
        final Set<Integer> personRows;
        MonthMaps(Map<String, Integer> n, Map<Integer, String> g, List<String> o, Set<Integer> p) {
            this.nameToRow = n; this.rowToGroup = g; this.namesInOrder = o; this.personRows = p;
        }
    }
}
