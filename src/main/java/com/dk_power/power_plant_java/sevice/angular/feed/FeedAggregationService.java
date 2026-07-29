package com.dk_power.power_plant_java.sevice.angular.feed;

import com.dk_power.power_plant_java.dto.feed.FeedItemDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.repository.messaging.ConversationRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.users.ShiftDayRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Read-only aggregator that merges "what changed recently" across several independent domains into a
 * single, timestamp-sorted feed for the Electron shell's Updates/News section.
 *
 * <p>Detection is essentially free: every domain here is a JPA entity whose changes are already
 * recorded (via {@code dateModified}/{@code lastMessageAt} for lists, and via the {@code FieldChange}
 * log for schedule deltas). There is no new persistence and nothing is synced — this is a projection
 * over data the desktop already holds.
 *
 * <p>Each source is queried defensively: a failure in one source is logged and skipped rather than
 * failing the whole feed. PJM day-ahead and Cork-Board actions are Electron-only and merged
 * client-side, so they are absent here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeedAggregationService {

    private final WorkRequestRepo workRequestRepo;
    private final ConversationRepo conversationRepo;
    private final ShiftDayRepo shiftDayRepo;
    private final FieldChangeRepository fieldChangeRepository;
    private final ObjectMapper objectMapper;

    private static final TypeReference<List<ShiftEntry>> SHIFT_ENTRY_LIST = new TypeReference<>() {};

    /** How many rows to pull per list source before the global merge/cap. */
    private static final int PER_SOURCE_LIMIT = 15;
    /** Fallback total cap when the caller doesn't specify one. */
    private static final int DEFAULT_TOTAL_LIMIT = 60;
    /** created ≈ modified within this window ⇒ treat the item as NEW rather than UPDATED. */
    private static final Duration NEW_WINDOW = Duration.ofSeconds(5);

    /** Work-request statuses that are done — excluded from the "active only" feed. */
    private static final Set<String> TERMINAL_WR_STATUSES = Set.of(
            "closed", "cancelled", "canceled", "revoked", "completed", "complete",
            "archived", "rejected", "denied", "void", "voided", "done");

    /** How far back schedule *changes* are surfaced, and the cap on schedule items. */
    private static final int SCHEDULE_WINDOW_DAYS = 5;
    private static final int SCHEDULE_MAX_ITEMS = 30;
    /** ShiftDay roster fields (property names, per FieldChange.fieldName) → human label, in display order. */
    private static final Map<String, String> ROSTER_FIELDS = new LinkedHashMap<>();
    static {
        ROSTER_FIELDS.put("dayShiftJson", "Day");
        ROSTER_FIELDS.put("nightShiftJson", "Night");
        ROSTER_FIELDS.put("unscheduledJson", "Unscheduled");
        ROSTER_FIELDS.put("ptoJson", "PTO");
        ROSTER_FIELDS.put("trainingJson", "Training");
    }
    private static final DateTimeFormatter SCHEDULE_DATE_FMT =
            DateTimeFormatter.ofPattern("MMM d (EEE)", Locale.US);

    /**
     * Merged, newest-first feed.
     *
     * @param since optional lower bound for the list sources — items older than this are dropped
     *              (null = no bound). Schedule changes always use their own {@value #SCHEDULE_WINDOW_DAYS}-day window.
     * @param limit total cap; ≤ 0 uses {@link #DEFAULT_TOTAL_LIMIT}
     */
    @Transactional(readOnly = true)
    public List<FeedItemDto> recent(LocalDateTime since, int limit) {
        int cap = limit <= 0 ? DEFAULT_TOTAL_LIMIT : limit;
        List<ScoredItem> all = new ArrayList<>();

        try {
            all.addAll(workRequestItems(since));
        } catch (Exception e) {
            log.warn("[Feed] work-request source failed: {}", e.getMessage());
        }
        try {
            all.addAll(conversationItems(since));
        } catch (Exception e) {
            log.warn("[Feed] conversation source failed: {}", e.getMessage());
        }
        try {
            all.addAll(scheduleItems());
        } catch (Exception e) {
            log.warn("[Feed] schedule source failed: {}", e.getMessage());
        }

        return all.stream()
                .sorted(Comparator.comparing(ScoredItem::ts).reversed())
                .limit(cap)
                .map(ScoredItem::item)
                .toList();
    }

    // ---------------------------------------------------------------- Work Requests (active only)

    private List<ScoredItem> workRequestItems(LocalDateTime since) {
        // Over-fetch, then keep only non-terminal ("active") requests, newest first.
        List<WorkRequest> rows = workRequestRepo.findAll(
                PageRequest.of(0, PER_SOURCE_LIMIT * 3, Sort.by(Sort.Direction.DESC, "dateModified"))
        ).getContent();

        List<ScoredItem> out = new ArrayList<>();
        for (WorkRequest wr : rows) {
            if (out.size() >= PER_SOURCE_LIMIT) break;

            String status = wr.getPermitStatus() != null ? wr.getPermitStatus().getName() : null;
            if (isTerminalStatus(status)) continue;

            LocalDateTime ts = wr.getDateModified() != null ? wr.getDateModified() : wr.getDateCreated();
            if (ts == null || (since != null && ts.isBefore(since))) continue;

            String title = firstNonBlank(wr.getWorkScope(), wr.getAffectedEquipment(), "Work Request #" + wr.getId());
            String actor = firstNonBlank(wr.getSubmitterName(), wr.getRequestedBy(), wr.getCreatedBy());

            out.add(new ScoredItem(ts, FeedItemDto.builder()
                    .id("WORK_REQUEST:" + wr.getId())
                    .category("WORK_REQUEST")
                    .entityType("WorkRequest")
                    .entityId(wr.getId())
                    .title(truncate(title, 120))
                    .summary(joinParts(status, wr.getLocation(), actor == null ? null : "by " + actor))
                    .timestamp(ts.toString())
                    .changeType(changeType(wr.getDateCreated(), wr.getDateModified()))
                    .actor(actor)
                    .severity(Boolean.TRUE.equals(wr.getIsHotWorkRequired()) ? "warning" : "info")
                    .build()));
        }
        return out;
    }

    /** True when the status marks a finished request (null / unknown statuses are treated as active). */
    private static boolean isTerminalStatus(String status) {
        return status != null && TERMINAL_WR_STATUSES.contains(status.trim().toLowerCase(Locale.US));
    }

    // ---------------------------------------------------------------- Plant Conversations

    private List<ScoredItem> conversationItems(LocalDateTime since) {
        List<Conversation> rows = conversationRepo.findAll(
                PageRequest.of(0, PER_SOURCE_LIMIT, Sort.by(Sort.Direction.DESC, "lastMessageAt"))
        ).getContent();

        List<ScoredItem> out = new ArrayList<>();
        for (Conversation c : rows) {
            LocalDateTime ts = c.getLastMessageAt() != null ? c.getLastMessageAt() : c.getDateModified();
            if (ts == null || (since != null && ts.isBefore(since))) continue;

            String on = "On " + c.getEntityType() + " #" + c.getEntityId();
            String status = c.getStatus() == Conversation.Status.CLOSED ? "Closed" : null;

            out.add(new ScoredItem(ts, FeedItemDto.builder()
                    .id("CONVERSATION:" + c.getId())
                    .category("CONVERSATION")
                    .entityType("Conversation")
                    .entityId(c.getId())
                    .title(truncate(firstNonBlank(c.getSubject(), "Conversation #" + c.getId()), 120))
                    .summary(joinParts(on, status))
                    .timestamp(ts.toString())
                    .changeType(changeType(c.getDateCreated(), c.getLastMessageAt()))
                    .actor(c.getCreatedBy())
                    .severity("info")
                    .build()));
        }
        return out;
    }

    // ---------------------------------------------------------------- Schedule changes (per-day deltas, 5 days)

    /**
     * One item per schedule-change event in the last {@value #SCHEDULE_WINDOW_DAYS} days, reconstructed
     * from the {@link FieldChange} log so we can show <em>who</em> changed on <em>which day</em>.
     *
     * <p>Each roster field ({@code dayShiftJson} etc.) records the old/new JSON roster; diffing them by
     * person name yields "+added / −removed" per shift. FieldChanges from the same save share a
     * timestamp, so we group by (ShiftDay, timestamp) to combine Day/Night/… deltas into one item.
     *
     * <p>Note: brand-new ShiftDay rows emit only a {@code _entity_} CREATE marker (no per-field deltas),
     * so a first-ever import of a date shows nothing here — the common case (edits to already-seeded
     * days) is fully covered. Also bounded by FieldChange retention, which may prune very old changes.
     */
    private List<ScoredItem> scheduleItems() {
        Instant windowStart = Instant.now().minus(Duration.ofDays(SCHEDULE_WINDOW_DAYS));
        List<FieldChange> changes =
                fieldChangeRepository.findByEntityTypeAndTimestampAfterOrderByTimestampAsc("ShiftDay", windowStart);

        // Group roster-field changes by (entityId, timestamp) = one save event on one day.
        Map<String, List<FieldChange>> groups = new LinkedHashMap<>();
        for (FieldChange fc : changes) {
            if (fc.getFieldName() == null || !ROSTER_FIELDS.containsKey(fc.getFieldName())) continue;
            if (fc.getEntityId() == null || fc.getTimestamp() == null) continue;
            groups.computeIfAbsent(fc.getEntityId() + "|" + fc.getTimestamp(), k -> new ArrayList<>()).add(fc);
        }
        if (groups.isEmpty()) return List.of();

        // Resolve each ShiftDay's calendar date in one batch.
        Set<Long> ids = groups.values().stream()
                .map(g -> g.get(0).getEntityId()).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, LocalDate> dateById = new HashMap<>();
        for (ShiftDay sd : shiftDayRepo.findAllById(ids)) {
            if (sd.getDate() != null) dateById.put(sd.getId(), sd.getDate());
        }

        List<ScoredItem> out = new ArrayList<>();
        for (List<FieldChange> group : groups.values()) {
            FieldChange first = group.get(0);
            LocalDate date = dateById.get(first.getEntityId());
            if (date == null) continue; // day was deleted since — skip

            // Combine per-shift deltas in canonical field order.
            List<String> parts = new ArrayList<>();
            Map<String, FieldChange> byField = new TreeMap<>();
            for (FieldChange fc : group) byField.put(fc.getFieldName(), fc);
            for (Map.Entry<String, String> rf : ROSTER_FIELDS.entrySet()) {
                FieldChange fc = byField.get(rf.getKey());
                if (fc == null) continue;
                String delta = describeDelta(rf.getValue(), fc.getOldValue(), fc.getNewValue());
                if (delta != null) parts.add(delta);
            }
            if (parts.isEmpty()) continue; // e.g. only a reorder — no person actually moved

            LocalDateTime ts = LocalDateTime.ofInstant(first.getTimestamp(), ZoneId.systemDefault());
            out.add(new ScoredItem(ts, FeedItemDto.builder()
                    .id("SCHEDULE:" + first.getEntityId() + ":" + first.getTimestamp())
                    .category("SCHEDULE")
                    .entityType("ShiftDay")
                    .entityId(first.getEntityId())
                    .title("Schedule — " + date.format(SCHEDULE_DATE_FMT))
                    .summary(truncate(String.join(" · ", parts), 240))
                    .timestamp(ts.toString())
                    .changeType("UPDATED")
                    .actor(first.getOriginMachineName())
                    .severity("info")
                    .build()));
        }

        // Newest-first, capped so a big revision can't crowd out the rest of the feed.
        return out.stream()
                .sorted(Comparator.comparing(ScoredItem::ts).reversed())
                .limit(SCHEDULE_MAX_ITEMS)
                .toList();
    }

    /** "Day: +Smith, −Jones" for a roster field, or null if no person was added/removed. */
    private String describeDelta(String label, String oldJson, String newJson) {
        List<String> oldNames = names(oldJson);
        List<String> newNames = names(newJson);
        Set<String> oldLc = oldNames.stream().map(this::norm).collect(Collectors.toSet());
        Set<String> newLc = newNames.stream().map(this::norm).collect(Collectors.toSet());

        List<String> added = newNames.stream().filter(n -> !oldLc.contains(norm(n))).toList();
        List<String> removed = oldNames.stream().filter(n -> !newLc.contains(norm(n))).toList();
        if (added.isEmpty() && removed.isEmpty()) return null;

        List<String> tokens = new ArrayList<>();
        added.forEach(n -> tokens.add("+" + n));
        removed.forEach(n -> tokens.add("−" + n)); // − minus sign
        return label + ": " + String.join(", ", tokens);
    }

    /** Person names in a roster JSON blob (the raw String value stored on the FieldChange). */
    private List<String> names(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, SHIFT_ENTRY_LIST).stream()
                    .map(ShiftEntry::getName)
                    .filter(n -> n != null && !n.isBlank())
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private String norm(String name) { return name == null ? "" : name.trim().toLowerCase(Locale.US); }

    // ---------------------------------------------------------------- helpers

    private static String changeType(LocalDateTime created, LocalDateTime modified) {
        if (created == null || modified == null) return "UPDATED";
        return Duration.between(created, modified).abs().compareTo(NEW_WINDOW) <= 0 ? "NEW" : "UPDATED";
    }

    private static String firstNonBlank(String... vals) {
        if (vals == null) return null;
        for (String v : vals) if (v != null && !v.isBlank()) return v;
        return null;
    }

    /** Joins the non-blank parts with " · " (drops nulls/blanks). */
    private static String joinParts(String... parts) {
        List<String> kept = new ArrayList<>();
        if (parts != null) {
            for (String p : parts) if (p != null && !p.isBlank()) kept.add(p);
        }
        return String.join(" · ", kept);
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    /** Pairs a feed item with its real {@link LocalDateTime} so merge-sort doesn't rely on string order. */
    private record ScoredItem(LocalDateTime ts, FeedItemDto item) {}
}
