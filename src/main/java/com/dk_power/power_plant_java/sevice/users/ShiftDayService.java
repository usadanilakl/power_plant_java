package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.dto.users.ScheduleImportRequest;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.ShiftDayRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final ShiftDayRepo shiftDayRepo;
    private final UserRepo userRepo;
    private final UserMatchService matchService;
    private final ObjectMapper objectMapper;

    public int importSchedule(ScheduleImportRequest request) {
        if (request == null || request.getPersons() == null || request.getPersons().isEmpty()) return 0;

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
        for (Map.Entry<LocalDate, DayBucket> e : buckets.entrySet()) {
            persistDay(e.getKey(), e.getValue(), request.getSource(), now);
            written++;
        }
        log.info("[Schedule] Imported {} day rows from source={}", written, request.getSource());
        return written;
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

    private void persistDay(LocalDate date, DayBucket bucket, String source, LocalDateTime now) {
        ShiftDay row = shiftDayRepo.findFirstByDate(date).orElseGet(() -> ShiftDay.builder()
                .date(date)
                .year(date.getYear())
                .build());

        row.setDayShiftJson(writeJson(bucket.day));
        row.setNightShiftJson(writeJson(bucket.night));
        row.setUnscheduledJson(writeJson(bucket.unscheduled));
        row.setPtoJson(writeJson(bucket.pto));
        row.setTrainingJson(writeJson(bucket.training));
        if (!bucket.onCallManagers.isEmpty()) {
            ShiftEntry ocm = bucket.onCallManagers.get(0);
            row.setOnCallManagerName(ocm.getName());
            row.setOnCallManagerUserId(ocm.getUserId());
        } else {
            row.setOnCallManagerName(null);
            row.setOnCallManagerUserId(null);
        }
        row.setSource(source);
        row.setLastSyncedAt(now);
        shiftDayRepo.save(row);
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
                .lastSyncedAt(row.getLastSyncedAt())
                .build();
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
