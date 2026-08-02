package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.dto.schedule.ScheduleEventFlag;
import com.dk_power.power_plant_java.dto.users.ScheduleImportRequest;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.ShiftDayRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Persists schedule snapshots imported from the SharePoint Ops Schedule Excel.
 * Source data arrives per-person; rows are stored per-day for fast "who is on
 * shift now / next" queries.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ShiftDayService {

    private static final TypeReference<List<ShiftEntry>> ENTRY_LIST = new TypeReference<>() {};
    private static final TypeReference<List<ScheduleEventFlag>> EVENT_FLAG_LIST = new TypeReference<>() {};

    private final ShiftDayRepo shiftDayRepo;
    private final UserRepo userRepo;
    private final UserMatchService matchService;
    private final ObjectMapper objectMapper;
    /**
     * Optional — used only on hub deployments where Supabase is configured, to mirror ShiftDay
     * writes into {@code public.plant_schedule_day} so the PWA can read schedule when the hub is
     * unreachable. Absent on desktop installs (SupabaseAdminClient not present); mirror silently
     * skipped in that case.
     */
    private final ObjectProvider<SupabaseAdminClient> supabaseProvider;

    /**
     * When schedule v2 owns ShiftDay (see {@code ScheduleMaterialisationService}), the v1 SharePoint
     * import stands down. Read directly (not via that service) to avoid a bean cycle.
     */
    @Value("${schedule.v2.enabled:false}")
    private boolean scheduleV2Enabled;
    @Value("${schedule.v2.rollback:false}")
    private boolean scheduleV2Rollback;

    public int importSchedule(ScheduleImportRequest request) {
        if (request == null || request.getPersons() == null || request.getPersons().isEmpty()) return 0;

        // Coexistence: when schedule v2 is authoritative (flag on, not rolled back), the v1 SharePoint
        // import does NOT write ShiftDay — the materialiser owns it. This prevents v1 and v2 from
        // clobbering the same shift_days row. (A fleet-wide flag flip handles peer nodes; a single
        // flag-off desktop could still push SP rows via CRDT, which is the normal cutover model.)
        if (scheduleV2Enabled && !scheduleV2Rollback) {
            log.info("[Schedule] schedule.v2 active — v1 SharePoint import standing down (not writing "
                    + "ShiftDay); {} person(s) in payload ignored.", request.getPersons().size());
            return 0;
        }

        List<User> candidates = userRepo.findByIsActiveTrue();
        Map<String, ShiftEntry> resolvedNames = new HashMap<>();

        Map<LocalDate, DayBucket> buckets = new TreeMap<>();
        for (ScheduleImportRequest.PersonSchedule person : request.getPersons()) {
            if (person == null || person.getName() == null || person.getSchedule() == null) continue;

            ShiftEntry entry = resolvedNames.computeIfAbsent(person.getName(), n -> resolve(n, person.getGroup(), candidates));
            ShiftEntry perGroupEntry = entry.getGroup() != null && entry.getGroup().equals(person.getGroup())
                    ? entry
                    : copyWithGroup(entry, person.getGroup());

            for (ScheduleImportRequest.DayCode dc : person.getSchedule()) {
                if (dc == null || dc.getDate() == null || dc.getShift() == null) continue;
                buckets.computeIfAbsent(dc.getDate(), DayBucket::new).add(dc.getShift(), perGroupEntry);
            }
        }

        LocalDateTime now = LocalDateTime.now();
        int written = 0;
        List<Map<String, Object>> supabaseRows = new ArrayList<>();
        for (Map.Entry<LocalDate, DayBucket> e : buckets.entrySet()) {
            if (persistDay(e.getKey(), e.getValue(), request.getSource(), now)) {
                supabaseRows.add(toSupabaseRow(e.getKey(), e.getValue(), request.getSource(), now, null));
                written++;
            }
        }
        log.info("[Schedule] Imported {} changed day rows from source={} ({} total in bucket)",
                written, request.getSource(), buckets.size());
        mirrorToSupabase(supabaseRows);
        return written;
    }

    /**
     * Best-effort mirror to Supabase {@code plant_schedule_day} so the PWA can read schedule when
     * the hub is unreachable. Runs after the H2 write; failures are logged but do NOT roll back
     * the hub transaction — Supabase downtime shouldn't block plant operations.
     */
    private void mirrorToSupabase(List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return;
        SupabaseAdminClient sb = supabaseProvider.getIfAvailable();
        if (sb == null || !sb.isEnabled()) return;
        try {
            sb.upsertPlantScheduleDays(rows);
            log.info("[Schedule] Mirrored {} day rows to Supabase", rows.size());
        } catch (Exception e) {
            log.warn("[Schedule] Supabase mirror failed (H2 write already committed): {}", e.getMessage());
        }
    }

    private Map<String, Object> toSupabaseRow(LocalDate date, DayBucket bucket, String source,
                                              LocalDateTime now, String eventFlagsJson) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("shift_date", date.toString());
        row.put("shift_year", date.getYear());
        row.put("day_shift_json", bucket.day);
        row.put("night_shift_json", bucket.night);
        row.put("unscheduled_json", bucket.unscheduled);
        row.put("pto_json", bucket.pto);
        row.put("training_json", bucket.training);
        // Always send on_call_manager_* — even null — unlike the JSON bucket columns above which are
        // always-present arrays anyway. PostgREST's merge-duplicates upsert only touches columns
        // present in the request body, so omitting the key when there's no OCM (as this used to do)
        // left a STALE on_call_manager_name/_user_id in Supabase after the day's OCM was cleared —
        // the row never actually tombstoned. Sending explicit nulls fixes that.
        ShiftEntry ocm = bucket.onCallManagers.isEmpty() ? null : bucket.onCallManagers.get(0);
        row.put("on_call_manager_name", ocm != null ? ocm.getName() : null);
        row.put("on_call_manager_user_id", ocm != null ? ocm.getUserId() : null);
        row.put("source", source);
        // Only send event_flags when present: v1 rows (null) must NOT reference the column so the
        // mirror keeps working on Supabase instances where the v2 migration hasn't been applied yet.
        // Pass the PARSED list (not the raw string) so it lands as a jsonb array like the other columns.
        if (eventFlagsJson != null && !eventFlagsJson.isBlank()) {
            row.put("event_flags_json", readEventFlags(eventFlagsJson));
        }
        row.put("last_synced_at", now.atOffset(java.time.ZoneOffset.UTC).toString());
        return row;
    }

    private ShiftEntry resolve(String name, String group, List<User> candidates) {
        UserMatchService.Match m = matchService.match(name, candidates);
        if (m == null) return ShiftEntry.builder().name(name).group(group).build();
        return ShiftEntry.builder()
                .name(name)
                .group(group)
                .userId(m.user.getId())
                .matchConfidence(m.confidence)
                .build();
    }

    private ShiftEntry copyWithGroup(ShiftEntry base, String group) {
        return ShiftEntry.builder()
                .name(base.getName())
                .group(group)
                .userId(base.getUserId())
                .matchConfidence(base.getMatchConfidence())
                .build();
    }

    /** @return true if the row was written (dirty or new); false if it was a no-op (unchanged). */
    private boolean persistDay(LocalDate date, DayBucket bucket, String source, LocalDateTime now) {
        ShiftDay existing = shiftDayRepo.findFirstByDate(date).orElse(null);

        String newDay = writeJson(bucket.day);
        String newNight = writeJson(bucket.night);
        String newUnscheduled = writeJson(bucket.unscheduled);
        String newPto = writeJson(bucket.pto);
        String newTraining = writeJson(bucket.training);
        String newOcmName = bucket.onCallManagers.isEmpty() ? null : bucket.onCallManagers.get(0).getName();
        Long newOcmId = bucket.onCallManagers.isEmpty() ? null : bucket.onCallManagers.get(0).getUserId();

        // No-op refresh detection: if the row exists and every synced field matches, skip save()
        // entirely so the @PostUpdate listener never fires. lastSyncedAt is @JsonIgnore (not
        // tracked) so we don't count it as a change and don't need to bump it either.
        if (existing != null
                && Objects.equals(existing.getDayShiftJson(), newDay)
                && Objects.equals(existing.getNightShiftJson(), newNight)
                && Objects.equals(existing.getUnscheduledJson(), newUnscheduled)
                && Objects.equals(existing.getPtoJson(), newPto)
                && Objects.equals(existing.getTrainingJson(), newTraining)
                && Objects.equals(existing.getOnCallManagerName(), newOcmName)
                && Objects.equals(existing.getOnCallManagerUserId(), newOcmId)
                && Objects.equals(existing.getSource(), source)) {
            return false;
        }

        ShiftDay row = existing != null ? existing : ShiftDay.builder()
                .date(date)
                .year(date.getYear())
                .build();

        row.setDayShiftJson(newDay);
        row.setNightShiftJson(newNight);
        row.setUnscheduledJson(newUnscheduled);
        row.setPtoJson(newPto);
        row.setTrainingJson(newTraining);
        row.setOnCallManagerName(newOcmName);
        row.setOnCallManagerUserId(newOcmId);
        row.setSource(source);
        row.setLastSyncedAt(now);
        shiftDayRepo.save(row);
        return true;
    }

    /**
     * Schedule v2 materialiser entry point: upsert one fully-computed day. Mirrors {@link
     * #persistDay}'s no-op short-circuit — if the row exists and every synced field (including
     * {@code eventFlagsJson}) already matches, {@code save()} is skipped so the {@code @PostUpdate}
     * sync listener never fires and no FieldChange is emitted.
     *
     * <p>Supabase mirroring is intentionally NOT done here: the write flows through CRDT sync to the
     * hub, whose scheduled scanner ({@code HubScheduleSupabaseMirrorService}) picks up the dirty row
     * and mirrors it (that scanner is also the mirror trigger for rows that arrive purely via sync).
     *
     * <p>Looks up the existing row itself (one SELECT per call) — callers materialising a whole range
     * should use {@link #preloadRange} + the {@link #applyMaterializedDay(LocalDate, List, List, List,
     * List, List, String, Long, String, String, ShiftDay)} overload instead, to avoid a per-day query.
     *
     * @return true if the row was written (dirty or new); false if it was a no-op (unchanged).
     */
    public boolean applyMaterializedDay(LocalDate date,
                                        List<ShiftEntry> day, List<ShiftEntry> night,
                                        List<ShiftEntry> unscheduled, List<ShiftEntry> pto,
                                        List<ShiftEntry> training,
                                        String ocmName, Long ocmId,
                                        String eventFlagsJson, String source) {
        return applyMaterializedDay(date, day, night, unscheduled, pto, training, ocmName, ocmId,
                eventFlagsJson, source, shiftDayRepo.findFirstByDate(date).orElse(null));
    }

    /**
     * Batch-aware variant of {@link #applyMaterializedDay(LocalDate, List, List, List, List, List,
     * String, Long, String, String)}: takes the existing row (or {@code null} if none) instead of
     * looking it up, so a caller materialising a whole date range can preload every existing row once
     * via {@link #preloadRange} and issue zero per-day SELECTs.
     *
     * @return true if the row was written (dirty or new); false if it was a no-op (unchanged).
     */
    public boolean applyMaterializedDay(LocalDate date,
                                        List<ShiftEntry> day, List<ShiftEntry> night,
                                        List<ShiftEntry> unscheduled, List<ShiftEntry> pto,
                                        List<ShiftEntry> training,
                                        String ocmName, Long ocmId,
                                        String eventFlagsJson, String source,
                                        ShiftDay existing) {
        String newDay = writeJson(day);
        String newNight = writeJson(night);
        String newUnscheduled = writeJson(unscheduled);
        String newPto = writeJson(pto);
        String newTraining = writeJson(training);
        String newEventFlags = (eventFlagsJson == null || eventFlagsJson.isBlank()) ? null : eventFlagsJson;

        if (existing != null
                && Objects.equals(existing.getDayShiftJson(), newDay)
                && Objects.equals(existing.getNightShiftJson(), newNight)
                && Objects.equals(existing.getUnscheduledJson(), newUnscheduled)
                && Objects.equals(existing.getPtoJson(), newPto)
                && Objects.equals(existing.getTrainingJson(), newTraining)
                && Objects.equals(existing.getOnCallManagerName(), ocmName)
                && Objects.equals(existing.getOnCallManagerUserId(), ocmId)
                && Objects.equals(existing.getEventFlagsJson(), newEventFlags)
                && Objects.equals(existing.getSource(), source)) {
            return false;
        }

        ShiftDay row = existing != null ? existing : ShiftDay.builder()
                .date(date)
                .year(date.getYear())
                .build();

        row.setDayShiftJson(newDay);
        row.setNightShiftJson(newNight);
        row.setUnscheduledJson(newUnscheduled);
        row.setPtoJson(newPto);
        row.setTrainingJson(newTraining);
        row.setOnCallManagerName(ocmName);
        row.setOnCallManagerUserId(ocmId);
        row.setEventFlagsJson(newEventFlags);
        row.setSource(source);
        row.setLastSyncedAt(LocalDateTime.now());
        shiftDayRepo.save(row);
        return true;
    }

    /**
     * Preloads every existing {@code ShiftDay} row in {@code [from, to]} keyed by date, for a batch
     * materialisation run to pass into the {@code ShiftDay}-accepting {@link #applyMaterializedDay}
     * overload — replacing what would otherwise be one {@code findFirstByDate} SELECT per day.
     */
    @Transactional(readOnly = true)
    public Map<LocalDate, ShiftDay> preloadRange(LocalDate from, LocalDate to) {
        Map<LocalDate, ShiftDay> byDate = new HashMap<>();
        for (ShiftDay row : shiftDayRepo.findByDateBetweenOrderByDateAsc(from, to)) {
            byDate.put(row.getDate(), row);
        }
        return byDate;
    }

    /**
     * Build a Supabase-shaped row from a stored ShiftDay entity. Used by the hub-side scheduled
     * mirror scanner ({@code HubScheduleSupabaseMirrorService}) to re-push rows that arrived via
     * CRDT sync (which bypasses {@link #importSchedule}).
     */
    public Map<String, Object> toSupabaseRow(ShiftDay row) {
        DayBucket bucket = new DayBucket(row.getDate());
        bucket.day.addAll(readJson(row.getDayShiftJson()));
        bucket.night.addAll(readJson(row.getNightShiftJson()));
        bucket.unscheduled.addAll(readJson(row.getUnscheduledJson()));
        bucket.pto.addAll(readJson(row.getPtoJson()));
        bucket.training.addAll(readJson(row.getTrainingJson()));
        if (row.getOnCallManagerName() != null) {
            bucket.onCallManagers.add(ShiftEntry.builder()
                    .name(row.getOnCallManagerName())
                    .userId(row.getOnCallManagerUserId())
                    .build());
        }
        LocalDateTime stamp = row.getLastSyncedAt() != null ? row.getLastSyncedAt() : LocalDateTime.now();
        return toSupabaseRow(row.getDate(), bucket, row.getSource(), stamp, row.getEventFlagsJson());
    }

    /** Public wrapper so the hub-side scheduled mirror can push rows directly. */
    public void mirrorRowsToSupabase(List<Map<String, Object>> rows) {
        mirrorToSupabase(rows);
    }

    /**
     * Latest {@code dateModified} across the whole {@code shift_days} table, or {@code null} if
     * the table is empty. Used by Electron auto-refresh to skip a SharePoint round-trip when local
     * data is already fresh (another desktop pushed and CRDT sync propagated it here).
     */
    @Transactional(readOnly = true)
    public LocalDateTime getMaxDateModified() {
        return shiftDayRepo.findMaxDateModified().orElse(null);
    }

    @Transactional(readOnly = true)
    public ShiftDayDto getByDate(LocalDate date) {
        return shiftDayRepo.findFirstByDate(date).map(this::toDto).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ShiftDayDto> getRange(LocalDate from, LocalDate to) {
        return shiftDayRepo.findByDateBetweenOrderByDateAsc(from, to).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ShiftDayDto> getYear(int year) {
        return shiftDayRepo.findByYearOrderByDateAsc(year).stream().map(this::toDto).toList();
    }

    /**
     * Distinct names in stored shift entries that did not resolve to a User row.
     * Used by the admin triage UI — these names need either a User created or a
     * manual mapping.
     */
    @Transactional(readOnly = true)
    public Set<String> unresolvedNames(LocalDate from, LocalDate to) {
        Set<String> unresolved = new TreeSet<>();
        for (ShiftDay row : shiftDayRepo.findByDateBetweenOrderByDateAsc(from, to)) {
            collectUnresolved(row.getDayShiftJson(), unresolved);
            collectUnresolved(row.getNightShiftJson(), unresolved);
            collectUnresolved(row.getUnscheduledJson(), unresolved);
            collectUnresolved(row.getPtoJson(), unresolved);
            collectUnresolved(row.getTrainingJson(), unresolved);
            if (row.getOnCallManagerName() != null && row.getOnCallManagerUserId() == null) {
                unresolved.add(row.getOnCallManagerName());
            }
        }
        return unresolved;
    }

    private void collectUnresolved(String json, Set<String> out) {
        for (ShiftEntry e : readJson(json)) {
            if (e.getUserId() == null && e.getName() != null) out.add(e.getName());
        }
    }

    private ShiftDayDto toDto(ShiftDay row) {
        return ShiftDayDto.builder()
                .id(row.getId())
                .date(row.getDate())
                .year(row.getYear())
                .dayShift(readJson(row.getDayShiftJson()))
                .nightShift(readJson(row.getNightShiftJson()))
                .unscheduled(readJson(row.getUnscheduledJson()))
                .pto(readJson(row.getPtoJson()))
                .training(readJson(row.getTrainingJson()))
                .onCallManagerName(row.getOnCallManagerName())
                .onCallManagerUserId(row.getOnCallManagerUserId())
                .source(row.getSource())
                .eventFlags(readEventFlags(row.getEventFlagsJson()))
                .lastSyncedAt(row.getLastSyncedAt())
                .build();
    }

    private List<ScheduleEventFlag> readEventFlags(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, EVENT_FLAG_LIST);
        } catch (Exception e) {
            log.warn("[Schedule] Failed to parse event flags JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String writeJson(List<ShiftEntry> entries) {
        if (entries == null || entries.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(entries);
        } catch (Exception e) {
            log.error("[Schedule] Failed to serialize shift entries: {}", e.getMessage());
            return null;
        }
    }

    private List<ShiftEntry> readJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, ENTRY_LIST);
        } catch (Exception e) {
            log.warn("[Schedule] Failed to parse shift entries JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /** Per-day collector. Shift codes: D day, N night, U unscheduled, P PTO, T training, OCM on-call manager. */
    private static class DayBucket {
        final LocalDate date;
        final List<ShiftEntry> day = new ArrayList<>();
        final List<ShiftEntry> night = new ArrayList<>();
        final List<ShiftEntry> unscheduled = new ArrayList<>();
        final List<ShiftEntry> pto = new ArrayList<>();
        final List<ShiftEntry> training = new ArrayList<>();
        final List<ShiftEntry> onCallManagers = new ArrayList<>();

        DayBucket(LocalDate date) { this.date = date; }

        void add(String code, ShiftEntry e) {
            switch (code.toUpperCase()) {
                case "D" -> day.add(e);
                case "N" -> night.add(e);
                case "U" -> unscheduled.add(e);
                case "P" -> pto.add(e);
                case "T" -> training.add(e);
                case "OCM" -> onCallManagers.add(e);
                default -> { /* unknown code — silently skip */ }
            }
        }
    }
}
