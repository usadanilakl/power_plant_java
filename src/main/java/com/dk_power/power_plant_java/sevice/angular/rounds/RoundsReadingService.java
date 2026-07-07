package com.dk_power.power_plant_java.sevice.angular.rounds;

import com.dk_power.power_plant_java.dto.rounds.RoundsReportDto;
import com.dk_power.power_plant_java.dto.rounds.TrendPointDto;
import com.dk_power.power_plant_java.dto.rounds.TrendSeriesDto;
import com.dk_power.power_plant_java.dto.rounds.TrendSeriesMetaDto;
import com.dk_power.power_plant_java.entities.rounds.RoundsReading;
import com.dk_power.power_plant_java.repository.rounds.RoundsReadingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Builds and serves the {@link RoundsReading} projection behind the WebView AMS
 * trend tool. Extraction turns a scraped {@link RoundsReportDto} snapshot into
 * one numeric reading per (question, shift), upserting by natural key so
 * re-processing the same shift is idempotent (newest scrape wins).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RoundsReadingService {

    private static final Pattern NUMERIC = Pattern.compile("-?\\d+(\\.\\d+)?");
    private static final Pattern ORDINAL = Pattern.compile("\\s*\\(\\d+\\)\\s*$");
    private static final Pattern UNIT = Pattern.compile(
        "\\b(psig|psia|psid|psi|inches|inch|ppb|ppm|gpm|scfm|°?F|%|mV|volts?|amps?|hz|rpm|gal|pH)\\b",
        Pattern.CASE_INSENSITIVE);

    private final RoundsReadingRepository repo;

    // ── Extraction ────────────────────────────────────────────────────────

    /**
     * Upsert numeric readings from one shift-aggregated snapshot. Requires the
     * DTO's {@code shiftKeys} (aligned to rows) to date each shift; rows without
     * a valid key, and non-numeric cells, are skipped. Older snapshots never
     * overwrite a newer reading (last-writer-wins by {@code scrapedAt}).
     *
     * @return number of readings inserted or updated
     */
    public int extractFrom(RoundsReportDto dto) {
        List<String> columns = dto.getColumns();
        List<List<String>> rows = dto.getRows();
        List<String> shiftKeys = dto.getShiftKeys();
        if (columns == null || rows == null || shiftKeys == null || columns.isEmpty()) return 0;

        String scrapedAt = dto.getScrapedAt() == null ? "" : dto.getScrapedAt();
        int touched = 0;

        for (int r = 0; r < rows.size(); r++) {
            if (r >= shiftKeys.size()) break;
            String sk = shiftKeys.get(r);
            if (sk == null || !sk.contains("|")) continue;         // pass-through / undated row
            String[] parts = sk.split("\\|", 2);
            LocalDate shiftDate;
            try {
                shiftDate = LocalDate.parse(parts[0].trim());
            } catch (Exception e) {
                continue;
            }
            String shift = "Night".equalsIgnoreCase(parts[1].trim()) ? "Night" : "Day";
            LocalDateTime shiftTime = shiftDate.atTime("Night".equals(shift) ? 18 : 6, 0);

            List<String> row = rows.get(r);
            for (int c = 1; c < columns.size() && c < row.size(); c++) {
                Double num = parseNumeric(row.get(c));
                if (num == null) continue;
                String header = columns.get(c);
                String key = stripOrdinal(header);
                if (key.isEmpty()) continue;
                if (upsert(key, header, shiftDate, shift, shiftTime, num, row.get(c).trim(), scrapedAt)) {
                    touched++;
                }
            }
        }
        return touched;
    }

    /** Insert or last-writer-wins update a single reading. Returns true if it wrote. */
    private boolean upsert(String key, String header, LocalDate shiftDate, String shift,
                           LocalDateTime shiftTime, double value, String raw, String scrapedAt) {
        RoundsReading e = repo.findByQuestionKeyAndShiftDateAndShift(key, shiftDate, shift).orElse(null);
        if (e == null) {
            e = new RoundsReading();
            e.setQuestionKey(key);
            e.setShiftDate(shiftDate);
            e.setShift(shift);
        } else if (e.getScrapedAt() != null && scrapedAt.compareTo(e.getScrapedAt()) < 0) {
            return false; // stored reading is from a newer scrape — keep it
        }
        e.setQuestionLabel(header);
        e.setCategory(parseCategory(key));
        e.setUnit(parseUnit(header));
        e.setShiftTime(shiftTime);
        e.setValue(value);
        e.setRawValue(raw.length() > 128 ? raw.substring(0, 128) : raw);
        e.setScrapedAt(scrapedAt.isEmpty() ? null : scrapedAt);
        repo.save(e);
        return true;
    }

    /** Wipe the projection (used before a full rebuild from all snapshots). */
    public void clearAll() {
        repo.deleteAllInBatch();
    }

    // ── Queries ───────────────────────────────────────────────────────────

    /** Available trend series (numeric questions with stored readings), for the picker. */
    @Transactional(readOnly = true)
    public List<TrendSeriesMetaDto> listSeries() {
        return repo.findSeriesMeta().stream()
            .map(m -> new TrendSeriesMetaDto(
                m.getQuestionKey(), m.getLabel(), m.getCategory(), m.getUnit(),
                m.getPoints(), m.getLastReading() == null ? null : m.getLastReading().toString()))
            .toList();
    }

    /** Chart-ready series for the requested question keys over a time window. */
    @Transactional(readOnly = true)
    public List<TrendSeriesDto> getTrend(List<String> keys, LocalDateTime from, LocalDateTime to) {
        // Seed in requested order so the chart legend is stable / predictable.
        Map<String, TrendSeriesDto> byKey = new LinkedHashMap<>();
        for (String k : keys) {
            TrendSeriesDto s = new TrendSeriesDto();
            s.setKey(k);
            s.setLabel(k);
            byKey.put(k, s);
        }
        List<RoundsReading> readings =
            repo.findByQuestionKeyInAndShiftTimeBetweenOrderByShiftTimeAsc(keys, from, to);
        for (RoundsReading rr : readings) {
            TrendSeriesDto s = byKey.get(rr.getQuestionKey());
            if (s == null) continue;
            s.setLabel(rr.getQuestionLabel());   // rows are ascending → ends on the latest label
            s.setUnit(rr.getUnit());
            s.setCategory(rr.getCategory());
            s.getPoints().add(new TrendPointDto(
                rr.getShiftTime().toString(), rr.getValue(), rr.getShift(), rr.getRawValue()));
        }
        return byKey.values().stream().toList();
    }

    // ── Header parsing helpers ────────────────────────────────────────────

    static String stripOrdinal(String header) {
        if (header == null) return "";
        return ORDINAL.matcher(header).replaceAll("").trim();
    }

    static Double parseNumeric(String cell) {
        if (cell == null) return null;
        String v = cell.replace(",", "").trim();
        if (v.isEmpty() || !NUMERIC.matcher(v).matches()) return null;
        try {
            return Double.valueOf(v);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Best-effort unit from the header (first recognized token), else null. */
    static String parseUnit(String header) {
        if (header == null) return null;
        Matcher m = UNIT.matcher(header);
        return m.find() ? m.group(1) : null;
    }

    /**
     * Best-effort grouping label: the leading run of ALL-CAPS/number words
     * (e.g. "UNIT 1 CEMS", "SCR", "AMMONIA", "DEMINERALIZED WATER"); falls back
     * to the first two words when the header starts in mixed case.
     */
    static String parseCategory(String key) {
        if (key == null || key.isEmpty()) return "";
        String[] words = key.split("\\s+");
        StringBuilder cat = new StringBuilder();
        for (String w : words) {
            if (w.startsWith("(") || w.chars().anyMatch(Character::isLowerCase)) break;
            if (cat.length() > 0) cat.append(' ');
            cat.append(w);
        }
        if (cat.length() > 0) return cat.toString();
        // mixed-case header — use the first two words as a coarse group
        StringBuilder fb = new StringBuilder(words[0]);
        if (words.length > 1) fb.append(' ').append(words[1]);
        return fb.toString();
    }
}
