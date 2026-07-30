package com.dk_power.power_plant_java.sevice.angular.feed;

import com.dk_power.power_plant_java.dto.feed.FeedItemDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.EnergizedWorkPermit;
import com.dk_power.power_plant_java.entities.permits.ExcavationPermit;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.entities.permits.VentingPermit;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.repository.messaging.ConversationRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.users.ShiftDayRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
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
import java.util.Set;
import java.util.TreeSet;
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
    private final EntityManager entityManager;

    private static final TypeReference<List<ShiftEntry>> SHIFT_ENTRY_LIST = new TypeReference<>() {};

    /** How many rows to keep per list source after filtering. */
    private static final int PER_SOURCE_LIMIT = 15;
    /** Fallback total cap when the caller doesn't specify one. */
    private static final int DEFAULT_TOTAL_LIMIT = 60;
    /** created ≈ modified within this window ⇒ treat the item as NEW rather than UPDATED. */
    private static final Duration NEW_WINDOW = Duration.ofSeconds(5);

    /** Permit statuses that are done — excluded wherever we filter to "active". */
    private static final Set<String> TERMINAL_STATUSES = Set.of(
            "closed", "cancelled", "canceled", "revoked", "completed", "complete",
            "archived", "rejected", "denied", "void", "voided", "done");

    /** Conversation {@code entityType} → permit entity class. Only these count as "permits". */
    private static final Map<String, Class<?>> PERMIT_TYPES = Map.of(
            "WorkRequest", WorkRequest.class,
            "Loto", Loto.class,
            "HotWork", HotWork.class,
            "SafeWork", SafeWork.class,
            "ConfinedSpace", ConfinedSpace.class,
            "Jha", Jha.class,
            "EnergizedWorkPermit", EnergizedWorkPermit.class,
            "ExcavationPermit", ExcavationPermit.class,
            "VentingPermit", VentingPermit.class);

    /** How far back schedule *changes* are surfaced, and the cap on affected-user items. */
    private static final int SCHEDULE_WINDOW_DAYS = 14;
    private static final int SCHEDULE_MAX_USERS = 30;
    /** ShiftDay roster fields whose changes count as a person being scheduled/unscheduled (property names). */
    private static final Set<String> ROSTER_FIELDS = Set.of(
            "dayShiftJson", "nightShiftJson", "unscheduledJson", "ptoJson", "trainingJson");
    private static final DateTimeFormatter SCHEDULE_DAY_FMT = DateTimeFormatter.ofPattern("MMM d", Locale.US);

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

    /** True when the status marks a finished permit (null / unknown statuses are treated as active). */
    private static boolean isTerminalStatus(String status) {
        return status != null && TERMINAL_STATUSES.contains(status.trim().toLowerCase(Locale.US));
    }

    // ---------------------------------------------------------------- Plant Conversations (active permits only)

    private List<ScoredItem> conversationItems(LocalDateTime since) {
        // Over-fetch: many recent conversations may hang off closed/non-permit entities, which we drop.
        List<Conversation> rows = conversationRepo.findAll(
                PageRequest.of(0, PER_SOURCE_LIMIT * 3, Sort.by(Sort.Direction.DESC, "lastMessageAt"))
        ).getContent();

        Map<String, Boolean> permitCache = new HashMap<>();
        List<ScoredItem> out = new ArrayList<>();
        for (Conversation c : rows) {
            if (out.size() >= PER_SOURCE_LIMIT) break;
            if (!isActivePermit(c.getEntityType(), c.getEntityId(), permitCache)) continue;

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

    /**
     * True iff the conversation target is a permit that is currently active. Non-permit targets
     * (e.g. LotoPoint, Equipment) and closed/deleted permits are excluded. Results are cached per call.
     */
    private boolean isActivePermit(String entityType, Long entityId, Map<String, Boolean> cache) {
        if (entityType == null || entityId == null) return false;
        Class<?> clazz = PERMIT_TYPES.get(entityType);
        if (clazz == null) return false; // not a permit type
        return cache.computeIfAbsent(entityType + "#" + entityId, k -> {
            try {
                Object e = entityManager.find(clazz, entityId); // @Where hides soft-deleted → null
                if (e instanceof BasePermitEntity p) {
                    String status = p.getPermitStatus() != null ? p.getPermitStatus().getName() : null;
                    return !isTerminalStatus(status);
                }
            } catch (Exception ex) {
                log.debug("[Feed] permit status lookup failed for {}#{}: {}", entityType, entityId, ex.getMessage());
            }
            return false;
        });
    }

    // ---------------------------------------------------------------- Schedule changes (per affected user, 2 weeks)

    /**
     * One item per <em>person</em> affected by any schedule change in the last {@value #SCHEDULE_WINDOW_DAYS}
     * days, reconstructed from the {@link FieldChange} log. Each item lists the calendar days that person was
     * scheduled/unscheduled on, timestamped with their most recent change (so the card shows "when last
     * changed" as a relative time).
     *
     * <p>Roster fields ({@code dayShiftJson} etc.) store the old/new JSON roster; diffing them by person name
     * yields who was added/removed. FieldChange retention is 30 days (desktop), so the 2-week window is fully
     * covered. Brand-new ShiftDay rows emit only a {@code _entity_} CREATE marker (no per-field delta), so a
     * first-ever import of a date isn't reflected — edits to already-seeded days (the common case) are.
     */
    private List<ScoredItem> scheduleItems() {
        Instant windowStart = Instant.now().minus(Duration.ofDays(SCHEDULE_WINDOW_DAYS));
        List<FieldChange> roster = fieldChangeRepository
                .findByEntityTypeAndTimestampAfterOrderByTimestampAsc("ShiftDay", windowStart).stream()
                .filter(fc -> fc.getFieldName() != null && ROSTER_FIELDS.contains(fc.getFieldName()))
                .filter(fc -> fc.getEntityId() != null && fc.getTimestamp() != null)
                .toList();
        if (roster.isEmpty()) return List.of();

        // Resolve each affected ShiftDay's calendar date in one batch.
        Set<Long> ids = roster.stream().map(FieldChange::getEntityId).collect(Collectors.toSet());
        Map<Long, LocalDate> dateById = new HashMap<>();
        for (ShiftDay sd : shiftDayRepo.findAllById(ids)) {
            if (sd.getDate() != null) dateById.put(sd.getId(), sd.getDate());
        }

        // Accumulate per person: which days they were affected on + their most recent change time.
        Map<String, UserAgg> byUser = new HashMap<>();
        for (FieldChange fc : roster) {
            LocalDate date = dateById.get(fc.getEntityId());
            if (date == null) continue; // day deleted since — skip
            for (Map.Entry<String, String> person : affectedNames(fc.getOldValue(), fc.getNewValue()).entrySet()) {
                UserAgg agg = byUser.computeIfAbsent(person.getKey(), k -> new UserAgg(person.getValue()));
                agg.days.add(date);
                if (agg.lastChange == null || fc.getTimestamp().isAfter(agg.lastChange)) agg.lastChange = fc.getTimestamp();
                if ((agg.display == null || agg.display.isBlank()) && person.getValue() != null) agg.display = person.getValue();
            }
        }
        if (byUser.isEmpty()) return List.of();

        List<ScoredItem> out = new ArrayList<>();
        for (Map.Entry<String, UserAgg> e : byUser.entrySet()) {
            UserAgg agg = e.getValue();
            if (agg.lastChange == null || agg.days.isEmpty()) continue;

            LocalDateTime ts = LocalDateTime.ofInstant(agg.lastChange, ZoneId.systemDefault());
            String days = agg.days.stream().map(d -> d.format(SCHEDULE_DAY_FMT)).collect(Collectors.joining(", "));

            out.add(new ScoredItem(ts, FeedItemDto.builder()
                    .id("SCHEDULE_USER:" + e.getKey())
                    .category("SCHEDULE")
                    .entityType("ShiftDay")
                    .title(firstNonBlank(agg.display, e.getKey()))
                    .summary(truncate(days, 240))
                    .timestamp(ts.toString())
                    .changeType("UPDATED")
                    .severity("info")
                    .build()));
        }

        // Newest-first (by each user's last change), capped.
        return out.stream()
                .sorted(Comparator.comparing(ScoredItem::ts).reversed())
                .limit(SCHEDULE_MAX_USERS)
                .toList();
    }

    /** Persons added or removed between two roster JSON blobs, as normalizedName → displayName. */
    private Map<String, String> affectedNames(String oldJson, String newJson) {
        List<String> oldNames = names(oldJson);
        List<String> newNames = names(newJson);
        Set<String> oldLc = oldNames.stream().map(this::norm).collect(Collectors.toSet());
        Set<String> newLc = newNames.stream().map(this::norm).collect(Collectors.toSet());

        Map<String, String> affected = new LinkedHashMap<>();
        for (String n : newNames) if (!oldLc.contains(norm(n))) affected.putIfAbsent(norm(n), n); // added
        for (String n : oldNames) if (!newLc.contains(norm(n))) affected.putIfAbsent(norm(n), n); // removed
        return affected;
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

    /** Per-person schedule-change accumulator over the window. */
    private static final class UserAgg {
        String display;
        final TreeSet<LocalDate> days = new TreeSet<>();
        Instant lastChange;
        UserAgg(String display) { this.display = display; }
    }

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
