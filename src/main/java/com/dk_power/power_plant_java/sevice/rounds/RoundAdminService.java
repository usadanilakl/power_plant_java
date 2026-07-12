package com.dk_power.power_plant_java.sevice.rounds;

import com.dk_power.power_plant_java.dto.rounds.ImportedRoundQuestionDto;
import com.dk_power.power_plant_java.dto.rounds.RoundDto;
import com.dk_power.power_plant_java.dto.rounds.RoundQuestionDto;
import com.dk_power.power_plant_java.entities.rounds.*;
import com.dk_power.power_plant_java.repository.rounds.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Admin/authoring side of Rounds: import WebView-AMS report columns into staging, generate editable
 * {@link RoundQuestion}s (assigning a PhysicalObject), and manage {@link Round} definitions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoundAdminService {

    private final RoundsReportRepository reportRepo;
    private final ImportedRoundQuestionRepository stagingRepo;
    private final RoundRepository roundRepo;
    private final RoundQuestionRepository questionRepo;
    private final RoundHeaderParser parser;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    // ── Import ─────────────────────────────────────────────────────────────────

    /** Parse the latest scraped rounds report's columns into staging (upsert by sourceWebviewKey). */
    public Map<String, Object> importLatest() {
        RoundsReport report = reportRepo.findTopByOrderByIdDesc().orElse(null);
        if (report == null) return Map.of("created", 0, "updated", 0, "skipped", 0, "message", "No rounds report scraped yet");
        List<String> columns = readStringList(report.getColumnsJson());
        int created = 0, updated = 0, skipped = 0;
        for (int c = 1; c < columns.size(); c++) { // col 0 = Shift / Response Date
            String header = columns.get(c);
            RoundHeaderParser.ParsedHeader ph = parser.parse(header);
            if (ph.getQuestionKey() == null || ph.getQuestionKey().isBlank()) { skipped++; continue; }
            ImportedRoundQuestion existing = stagingRepo.findFirstBySourceWebviewKey(ph.getQuestionKey());
            if (existing == null) {
                ImportedRoundQuestion row = new ImportedRoundQuestion();
                row.setSourceWebviewKey(ph.getQuestionKey());
                applyParse(row, ph);
                row.setStatus("NEW");
                row.setImportedAt(LocalDateTime.now());
                row.setUpdatedAt(LocalDateTime.now());
                row.setSourceReportId(report.getId());
                row.setScrapedAt(report.getScrapedAt());
                stagingRepo.save(row);
                created++;
            } else {
                boolean headerChanged = !Objects.equals(existing.getSourceRaw(), ph.getSourceRaw());
                if ("PROCESSED".equals(existing.getStatus())) {
                    if (headerChanged) { existing.setChangedSinceProcessed(true); existing.setUpdatedAt(LocalDateTime.now()); stagingRepo.save(existing); }
                } else {
                    applyParse(existing, ph);
                    existing.setUpdatedAt(LocalDateTime.now());
                    existing.setSourceReportId(report.getId());
                    existing.setScrapedAt(report.getScrapedAt());
                    stagingRepo.save(existing);
                }
                updated++;
            }
        }
        return Map.of("created", created, "updated", updated, "skipped", skipped, "message", "ok");
    }

    @Transactional(readOnly = true)
    public List<ImportedRoundQuestionDto> listStaging(String status) {
        List<ImportedRoundQuestion> rows = (status == null || status.isBlank())
                ? stagingRepo.findAllByOrderByCategoryAscPromptAsc()
                : stagingRepo.findByStatusOrderByCategoryAscPromptAsc(status.toUpperCase());
        return rows.stream().map(this::toDto).toList();
    }

    public ImportedRoundQuestionDto ignoreStaging(Long id) {
        ImportedRoundQuestion row = stagingRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Staging row not found: " + id));
        row.setStatus("IGNORED");
        row.setUpdatedAt(LocalDateTime.now());
        return toDto(stagingRepo.save(row));
    }

    /** Generate an editable RoundQuestion from a staging row (defaults from the parse, overridable), into a round. */
    public RoundQuestionDto generateQuestion(GenerateQuestionRequest req) {
        Round round = roundRepo.findById(req.roundId()).orElseThrow(() -> new IllegalArgumentException("Round not found: " + req.roundId()));
        ImportedRoundQuestion staging = req.stagingId() == null ? null : stagingRepo.findById(req.stagingId()).orElse(null);

        RoundQuestion q = new RoundQuestion();
        q.setRound(round);
        q.setOrderIndex(nextOrder(round.getId()));
        q.setPrompt(firstNonBlank(req.prompt(), staging != null ? staging.getPrompt() : null));
        q.setAnswerType(parseType(req.answerType(), staging));
        q.setPhysicalObjectId(req.physicalObjectId());
        q.setUnit(firstNonBlank(req.unit(), staging != null ? staging.getUnit() : null));
        q.setLowLimit(req.lowLimit() != null ? req.lowLimit() : (staging != null ? staging.getLowLimit() : null));
        q.setHighLimit(req.highLimit() != null ? req.highLimit() : (staging != null ? staging.getHighLimit() : null));
        q.setExpectedValue(firstNonBlank(req.expectedValue(), staging != null ? staging.getExpectedValue() : null));
        q.setTrackIssues(req.trackIssues() == null || req.trackIssues());
        q.setChoicesJson(req.choicesJson());
        if (staging != null) {
            q.setTagCode(staging.getTagCode());
            q.setCategory(staging.getCategory());
            q.setSourceWebviewKey(staging.getSourceWebviewKey());
            q.setSourceWebviewRaw(staging.getSourceRaw());
        }
        q = questionRepo.save(q);

        if (staging != null) {
            staging.setStatus("PROCESSED");
            staging.setGeneratedQuestionId(q.getId());
            staging.setChangedSinceProcessed(false);
            staging.setUpdatedAt(LocalDateTime.now());
            stagingRepo.save(staging);
        }
        return toDto(q);
    }

    /**
     * Generate a question from each staging row in one shot, all bound to the same round + PhysicalObject. For
     * processing a whole system/equipment group ("all boiler-feed-pump readings") at once. Each question keeps its own
     * parsed defaults (prompt/type/limits); only the round + object are shared. Bad ids are skipped.
     */
    public List<RoundQuestionDto> generateBulk(BulkGenerateRequest req) {
        if (req.stagingIds() == null || req.stagingIds().isEmpty()) return List.of();
        List<RoundQuestionDto> out = new ArrayList<>();
        for (Long sid : req.stagingIds()) {
            try {
                out.add(generateQuestion(new GenerateQuestionRequest(
                        sid, req.roundId(), req.physicalObjectId(),
                        null, null, null, null, null, null, null, null)));
            } catch (Exception e) {
                log.warn("Bulk-generate skipped staging {}: {}", sid, e.getMessage());
            }
        }
        return out;
    }

    /** Mark many staging rows IGNORED at once. */
    public int ignoreBulk(List<Long> ids) {
        if (ids == null) return 0;
        int n = 0;
        for (Long id : ids) {
            ImportedRoundQuestion row = stagingRepo.findById(id).orElse(null);
            if (row != null) { row.setStatus("IGNORED"); row.setUpdatedAt(LocalDateTime.now()); stagingRepo.save(row); n++; }
        }
        return n;
    }

    // ── Rounds CRUD ────────────────────────────────────────────────────────────

    public RoundDto createRound(CreateRoundRequest req) {
        Round r = new Round();
        r.setName(req.name());
        r.setDescription(req.description());
        r.setArea(req.area());
        if (req.cadence() != null) r.setCadence(RoundCadence.valueOf(req.cadence()));
        if (req.shift() != null) r.setShift(RoundShift.valueOf(req.shift()));
        r.setIntervalHours(req.intervalHours());
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        return toSummaryDto(roundRepo.save(r));
    }

    @Transactional(readOnly = true)
    public List<RoundDto> listRounds() {
        return roundRepo.findByDeletedFalseOrderByNameAsc().stream().map(this::toSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public RoundDto getRound(Long id) {
        Round r = roundRepo.findById(id).filter(x -> !x.isDeleted()).orElse(null);
        if (r == null) return null;
        List<RoundQuestionDto> qs = questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(id).stream().map(this::toDto).toList();
        return new RoundDto(r.getId(), r.getName(), r.getDescription(), r.getArea(),
                r.getCadence() == null ? null : r.getCadence().name(),
                r.getShift() == null ? null : r.getShift().name(),
                r.getIntervalHours(), r.isActive(), r.getSourceTemplate(), qs.size(), qs);
    }

    public void deleteQuestion(Long id) {
        questionRepo.findById(id).ifPresent(q -> { q.setDeleted(true); questionRepo.save(q); });
    }

    /** Update a round's definition (schedule/name/area/active). Null fields are left unchanged. */
    public RoundDto updateRound(Long id, UpdateRoundRequest req) {
        Round r = roundRepo.findById(id).filter(x -> !x.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("Round not found: " + id));
        if (req.name() != null) r.setName(req.name());
        if (req.description() != null) r.setDescription(req.description());
        if (req.area() != null) r.setArea(req.area());
        if (req.cadence() != null) r.setCadence(RoundCadence.valueOf(req.cadence()));
        if (req.shift() != null) r.setShift(RoundShift.valueOf(req.shift()));
        if (req.intervalHours() != null) r.setIntervalHours(req.intervalHours());
        if (req.active() != null) r.setActive(req.active());
        r.setUpdatedAt(LocalDateTime.now());
        return getRound(roundRepo.save(r).getId());
    }

    /** Soft-delete a round (its questions are hidden with it). */
    public void deleteRound(Long id) {
        roundRepo.findById(id).ifPresent(r -> { r.setDeleted(true); r.setUpdatedAt(LocalDateTime.now()); roundRepo.save(r); });
    }

    /** Edit one question in place. Null fields unchanged; {@code physicalObjectId} = -1 clears the binding. */
    public RoundQuestionDto updateQuestion(Long id, UpdateQuestionRequest req) {
        RoundQuestion q = questionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + id));
        if (req.prompt() != null) q.setPrompt(req.prompt());
        if (req.answerType() != null) q.setAnswerType(RoundAnswerType.valueOf(req.answerType().toUpperCase()));
        if (req.unit() != null) q.setUnit(req.unit().isBlank() ? null : req.unit());
        if (req.category() != null) q.setCategory(req.category().isBlank() ? null : req.category());
        if (req.expectedValue() != null) q.setExpectedValue(req.expectedValue().isBlank() ? null : req.expectedValue());
        if (req.choicesJson() != null) q.setChoicesJson(req.choicesJson().isBlank() ? null : req.choicesJson());
        if (req.lowLimit() != null) q.setLowLimit(req.lowLimit() < -1e17 ? null : req.lowLimit());
        if (req.highLimit() != null) q.setHighLimit(req.highLimit() < -1e17 ? null : req.highLimit());
        if (req.trackIssues() != null) q.setTrackIssues(req.trackIssues());
        if (req.physicalObjectId() != null) q.setPhysicalObjectId(req.physicalObjectId() < 0 ? null : req.physicalObjectId());
        if (req.orderIndex() != null) q.setOrderIndex(req.orderIndex());
        if (req.predecessorQuestionId() != null) {
            // -1 clears the dependency; a self-reference is rejected (would never show)
            Long pid = req.predecessorQuestionId() < 0 ? null : req.predecessorQuestionId();
            if (pid != null && pid.equals(q.getId())) throw new IllegalArgumentException("A question can't depend on itself");
            q.setPredecessorQuestionId(pid);
            if (pid == null) { q.setShowWhenOp(null); q.setShowWhenValue(null); }
        }
        if (req.showWhenOp() != null) q.setShowWhenOp(req.showWhenOp().isBlank() ? null : req.showWhenOp().trim().toUpperCase());
        if (req.showWhenValue() != null) q.setShowWhenValue(req.showWhenValue().isBlank() ? null : req.showWhenValue());
        return toDto(questionRepo.save(q));
    }

    // ── Group operations (bulk over a round's category) ─────────────────────────

    /** Rename a group; if {@code toCategory} already exists this merges the two. Returns affected count. */
    public int renameGroup(Long roundId, String fromCategory, String toCategory) {
        List<RoundQuestion> qs = questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(roundId);
        String to = (toCategory == null || toCategory.isBlank()) ? null : toCategory.trim();
        int n = 0;
        for (RoundQuestion q : qs) {
            if (Objects.equals(nz(q.getCategory()), nz(fromCategory))) { q.setCategory(to); questionRepo.save(q); n++; }
        }
        return n;
    }

    /** Bind every question in a group to one PhysicalObject (null clears). Returns affected count. */
    public int assignGroupObject(Long roundId, String category, Long physicalObjectId) {
        Long poId = (physicalObjectId != null && physicalObjectId < 0) ? null : physicalObjectId;
        List<RoundQuestion> qs = questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(roundId);
        int n = 0;
        for (RoundQuestion q : qs) {
            if (Objects.equals(nz(q.getCategory()), nz(category))) { q.setPhysicalObjectId(poId); questionRepo.save(q); n++; }
        }
        return n;
    }

    /** Soft-delete every question in a group. Returns deleted count. */
    public int deleteGroup(Long roundId, String category) {
        List<RoundQuestion> qs = questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(roundId);
        int n = 0;
        for (RoundQuestion q : qs) {
            if (Objects.equals(nz(q.getCategory()), nz(category))) { q.setDeleted(true); questionRepo.save(q); n++; }
        }
        return n;
    }

    private static String nz(String s) { return s == null ? "" : s.trim(); }

    /** Set question order for a round from an ordered list of question ids. */
    public void reorderQuestions(Long roundId, List<Long> orderedIds) {
        if (orderedIds == null) return;
        int i = 0;
        for (Long qid : orderedIds) {
            RoundQuestion q = questionRepo.findById(qid).orElse(null);
            if (q != null && q.getRound() != null && roundId.equals(q.getRound().getId())) {
                q.setOrderIndex(i);
                questionRepo.save(q);
            }
            i++;
        }
    }

    /** Purge staging rows. status null/ALL → all non-processed (NEW+IGNORED); else that status. Never deletes PROCESSED. */
    public int purgeStaging(String status) {
        List<ImportedRoundQuestion> rows;
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            rows = stagingRepo.findAllByOrderByCategoryAscPromptAsc().stream()
                    .filter(r -> !"PROCESSED".equals(r.getStatus())).toList();
        } else if ("PROCESSED".equalsIgnoreCase(status)) {
            return 0; // guard: never bulk-delete processed rows (they link to generated questions)
        } else {
            rows = stagingRepo.findByStatusOrderByCategoryAscPromptAsc(status.toUpperCase());
        }
        stagingRepo.deleteAll(rows);
        return rows.size();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void applyParse(ImportedRoundQuestion row, RoundHeaderParser.ParsedHeader ph) {
        row.setSourceRaw(ph.getSourceRaw());
        row.setCategory(ph.getCategory());
        row.setTagCode(ph.getTagCode());
        row.setPrompt(ph.getPrompt());
        row.setLowLimit(ph.getLowLimit());
        row.setHighLimit(ph.getHighLimit());
        row.setUnit(ph.getUnit());
        row.setSuggestedType(ph.getSuggestedType());
    }

    private int nextOrder(Long roundId) {
        return questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(roundId).size();
    }

    private RoundAnswerType parseType(String override, ImportedRoundQuestion staging) {
        if (override != null && !override.isBlank()) {
            try { return RoundAnswerType.valueOf(override.toUpperCase()); } catch (IllegalArgumentException ignore) { /* fall through */ }
        }
        if (staging != null && staging.getSuggestedType() != null) return staging.getSuggestedType();
        return RoundAnswerType.TEXT;
    }

    private String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return (b != null && !b.isBlank()) ? b : null;
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return MAPPER.readValue(json, new TypeReference<List<String>>() {}); } catch (Exception e) { return List.of(); }
    }

    private ImportedRoundQuestionDto toDto(ImportedRoundQuestion r) {
        return new ImportedRoundQuestionDto(r.getId(), r.getSourceWebviewKey(), r.getSourceRaw(), r.getCategory(),
                r.getTagCode(), r.getPrompt(), r.getLowLimit(), r.getHighLimit(), r.getUnit(),
                r.getSuggestedType() == null ? null : r.getSuggestedType().name(),
                r.getStatus(), r.getGeneratedQuestionId(), r.isChangedSinceProcessed());
    }

    private RoundQuestionDto toDto(RoundQuestion q) {
        return new RoundQuestionDto(q.getId(), q.getRound() == null ? null : q.getRound().getId(), q.getOrderIndex(),
                q.getPrompt(), q.getAnswerType() == null ? null : q.getAnswerType().name(), q.getPhysicalObjectId(),
                q.getTagCode(), q.getUnit(), q.getLowLimit(), q.getHighLimit(), q.getExpectedValue(),
                q.isTrackIssues(), q.getChoicesJson(), q.getCategory(), q.getSourceWebviewKey(),
                q.getPredecessorQuestionId(), q.getShowWhenOp(), q.getShowWhenValue());
    }

    private RoundDto toSummaryDto(Round r) {
        return new RoundDto(r.getId(), r.getName(), r.getDescription(), r.getArea(),
                r.getCadence() == null ? null : r.getCadence().name(),
                r.getShift() == null ? null : r.getShift().name(),
                r.getIntervalHours(), r.isActive(), r.getSourceTemplate(),
                questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(r.getId()).size(), null);
    }

    // ── Request records ────────────────────────────────────────────────────────
    public record GenerateQuestionRequest(Long stagingId, Long roundId, Long physicalObjectId, String prompt,
                                          String answerType, String unit, Double lowLimit, Double highLimit,
                                          String expectedValue, Boolean trackIssues, String choicesJson) {}

    public record CreateRoundRequest(String name, String description, String area, String cadence, String shift,
                                     Integer intervalHours) {}

    public record UpdateRoundRequest(String name, String description, String area, String cadence, String shift,
                                     Integer intervalHours, Boolean active) {}

    public record UpdateQuestionRequest(String prompt, String answerType, String unit, String category,
                                        String expectedValue, String choicesJson, Double lowLimit, Double highLimit,
                                        Boolean trackIssues, Long physicalObjectId, Integer orderIndex,
                                        Long predecessorQuestionId, String showWhenOp, String showWhenValue) {}

    public record GroupRenameRequest(String fromCategory, String toCategory) {}
    public record GroupAssignObjectRequest(String category, Long physicalObjectId) {}

    public record BulkGenerateRequest(Long roundId, Long physicalObjectId, List<Long> stagingIds) {}
}
