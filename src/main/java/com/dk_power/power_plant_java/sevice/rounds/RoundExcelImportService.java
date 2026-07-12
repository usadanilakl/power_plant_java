package com.dk_power.power_plant_java.sevice.rounds;

import com.dk_power.power_plant_java.entities.rounds.ImportedRoundQuestion;
import com.dk_power.power_plant_java.repository.rounds.ImportedRoundQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Imports a manually-exported WebView-AMS rounds Excel into the staging table. Each file is one round; each unique
 * (Loc/Asset, Label) is one question (the export repeats questions across response dates — we dedupe to the question
 * catalog, keeping the response rows only for optional history backfill elsewhere).
 *
 * <p>Far more reliable than parsing the scraped single-line report headers: the Excel carries category, tag, sample
 * response (type/unit), and the authoritative alarm config in separate columns. Rows are parsed by
 * {@link RoundExcelRowParser} and upserted by {@code sourceWebviewKey} so re-importing refreshes unprocessed rows
 * without clobbering ones already turned into questions.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoundExcelImportService {

    private final ImportedRoundQuestionRepository stagingRepo;
    private final RoundExcelRowParser rowParser;

    private static final int COL_LOC = 0, COL_LABEL = 1, COL_RESPONSE = 2, COL_ALARM = 3;

    public Map<String, Object> importWorkbook(MultipartFile file) throws Exception {
        String roundName = humanRoundName(file.getOriginalFilename());
        int created = 0, updated = 0, skipped = 0;
        Set<String> seen = new LinkedHashSet<>();
        DataFormatter fmt = new DataFormatter();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            int first = sheet.getFirstRowNum();
            for (int r = first + 1; r <= sheet.getLastRowNum(); r++) { // row 0 = header
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String a = cell(fmt, row, COL_LOC);
                String b = cell(fmt, row, COL_LABEL);
                String c = cell(fmt, row, COL_RESPONSE);
                String d = cell(fmt, row, COL_ALARM);
                if (blank(a) && blank(b)) continue;

                String key = keyFor(roundName, a, b);
                if (!seen.add(key)) continue; // first occurrence wins (later rows are older responses)

                RoundExcelRowParser.ParsedRow ph = rowParser.parse(a, b, c, d);
                ImportedRoundQuestion existing = stagingRepo.findFirstBySourceWebviewKey(key);
                if (existing == null) {
                    ImportedRoundQuestion rowEnt = new ImportedRoundQuestion();
                    rowEnt.setSourceWebviewKey(key);
                    apply(rowEnt, ph, a, b, roundName);
                    rowEnt.setStatus("NEW");
                    rowEnt.setImportedAt(LocalDateTime.now());
                    rowEnt.setUpdatedAt(LocalDateTime.now());
                    stagingRepo.save(rowEnt);
                    created++;
                } else {
                    if ("PROCESSED".equals(existing.getStatus())) {
                        if (!Objects.equals(existing.getSourceRaw(), rawOf(a, b, c, d))) {
                            existing.setChangedSinceProcessed(true);
                            existing.setUpdatedAt(LocalDateTime.now());
                            stagingRepo.save(existing);
                        }
                    } else {
                        apply(existing, ph, a, b, roundName);
                        existing.setUpdatedAt(LocalDateTime.now());
                        stagingRepo.save(existing);
                    }
                    updated++;
                }
            }
        }
        return Map.of("created", created, "updated", updated, "skipped", skipped, "round", roundName, "message", "ok");
    }

    private void apply(ImportedRoundQuestion e, RoundExcelRowParser.ParsedRow ph, String a, String b, String roundName) {
        e.setCategory(ph.getCategory());
        e.setTagCode(ph.getTagCode());
        e.setPrompt(ph.getPrompt());
        e.setLowLimit(ph.getLowLimit());
        e.setHighLimit(ph.getHighLimit());
        e.setUnit(ph.getUnit());
        e.setExpectedValue(ph.getExpectedValue());
        e.setSampleValue(ph.getSampleValue());
        e.setAlarmConfigRaw(ph.getAlarmConfigRaw());
        e.setSuggestedType(ph.getSuggestedType());
        e.setSourceRound(roundName);
        e.setSourceRaw(rawOf(a, b, ph.getSampleValue(), ph.getAlarmConfigRaw()));
    }

    private String rawOf(String a, String b, String c, String d) {
        return String.join(" | ", n(a), n(b), n(c), n(d)).trim();
    }

    /** Stable dedupe/link key per (round, loc, label); hashed-truncated to fit the 512-char unique column. */
    private String keyFor(String roundName, String a, String b) {
        String key = (n(roundName) + "::" + n(a) + "::" + n(b)).trim();
        if (key.length() > 500) key = key.substring(0, 480) + "#" + Integer.toHexString(key.hashCode());
        return key;
    }

    private String humanRoundName(String filename) {
        if (filename == null || filename.isBlank()) return "Imported Round";
        String base = filename;
        int slash = Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\'));
        if (slash >= 0) base = base.substring(slash + 1);
        int dot = base.lastIndexOf('.');
        if (dot > 0) base = base.substring(0, dot);
        base = base.replace('_', ' ').replace('-', ' ').trim();
        StringBuilder sb = new StringBuilder();
        for (String w : base.split("\\s+")) {
            if (w.isEmpty()) continue;
            sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(' ');
        }
        return sb.toString().trim();
    }

    private static String cell(DataFormatter fmt, Row row, int col) {
        Cell c = row.getCell(col);
        return c == null ? "" : fmt.formatCellValue(c);
    }

    private static String n(String s) { return s == null ? "" : s; }
    private static boolean blank(String s) { return s == null || s.trim().isEmpty(); }
}
