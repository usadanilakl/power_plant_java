package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.RecurringPmDto;
import com.dk_power.power_plant_java.entities.maximo.RecurrenceCadence;
import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.entities.maximo.ShiftPreference;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.maximo.RecurringPmRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds and maintains the recurring-PM catalog: dedupe a trailing year of PM work orders (led by
 * lead operators) on {@code pmnum}, infer each PM's cadence from occurrence spacing, and let the
 * operator set the day/night shift. See project/features/maximo/pm-auto-assignment-design.md.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RecurringPmService {

    private static final int CATALOG_YEARS = 1;
    private static final int PAGE_SIZE = 200;
    private static final int MAX_PAGES = 50; // 200*50 = 10k WO safety ceiling

    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoBundleService bundles;
    private final RecurringPmRepo repo;

    // ── Catalog build ──────────────────────────────────────────────────────────

    /**
     * Rebuild the catalog from Maximo: fetch ~1 year of PM WOs for all lead operators (paged),
     * dedupe by pmnum, infer cadence, and upsert {@link RecurringPm} rows. Manually-classified rows
     * keep their cadence/shift. Returns a summary map.
     */
    public Map<String, Object> refreshCatalog() {
        List<String> personIds = bundles.leadOperators().stream()
                .map(User::getMaximoPersonid)
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
        if (personIds.isEmpty()) {
            log.warn("[PM] refreshCatalog: no lead operators with a Maximo personid");
            return Map.of("scanned", 0, "pmCount", 0, "created", 0, "updated", 0);
        }

        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setWorktype("PM");
        c.setLeadIn(personIds);
        c.setReportdateFrom(LocalDate.now().minusYears(CATALOG_YEARS) + "T00:00:00");

        List<MaximoWorkOrderDto> wos = workOrders.listAllByCriteria(c, PAGE_SIZE, MAX_PAGES);

        // Group by pmnum (skip one-off PMs with no pmnum). WOs arrive newest-first (-reportdate).
        Map<String, List<MaximoWorkOrderDto>> byPm = new LinkedHashMap<>();
        for (MaximoWorkOrderDto w : wos) {
            String pm = w.getPmnum();
            if (pm == null || pm.isBlank()) continue;
            byPm.computeIfAbsent(pm.trim(), k -> new ArrayList<>()).add(w);
        }

        LocalDateTime now = LocalDateTime.now();
        int created = 0, updated = 0;
        for (Map.Entry<String, List<MaximoWorkOrderDto>> e : byPm.entrySet()) {
            String pmnum = e.getKey();
            List<MaximoWorkOrderDto> occ = e.getValue();
            MaximoWorkOrderDto latest = occ.get(0); // newest (orderBy -reportdate)

            List<LocalDate> dates = occ.stream()
                    .map(w -> parseDate(w.getTargetStart() != null ? w.getTargetStart() : w.getReportdate()))
                    .filter(Objects::nonNull)
                    .sorted()
                    .collect(Collectors.toList());
            Integer medianGap = medianGapDays(dates);
            RecurrenceCadence inferred = cadenceFor(medianGap);

            RecurringPm row = repo.findFirstByPmnum(pmnum).orElse(null);
            boolean isNew = row == null;
            if (isNew) {
                row = RecurringPm.builder().pmnum(pmnum).shift(ShiftPreference.EITHER)
                        .classificationLocked(Boolean.FALSE).build();
            }
            row.setPmDescription(latest.getDescription());
            row.setLead(latest.getLeadCraft()); // MaximoWorkOrderDto maps spi:lead -> leadCraft
            row.setOccurrenceCount(occ.size());
            row.setLastWonum(latest.getWonum());
            row.setLastTargetDate(dates.isEmpty() ? null : dates.get(dates.size() - 1));
            row.setIntervalDays(medianGap);
            // Don't clobber an operator's manual cadence/shift on refresh.
            if (!Boolean.TRUE.equals(row.getClassificationLocked())) {
                row.setCadence(inferred);
            }
            row.setCatalogRefreshedAt(now);
            repo.save(row);
            if (isNew) created++; else updated++;
        }

        log.info("[PM] refreshCatalog: scanned {} WOs, {} unique PMs ({} new, {} updated)",
                wos.size(), byPm.size(), created, updated);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scanned", wos.size());
        summary.put("pmCount", byPm.size());
        summary.put("created", created);
        summary.put("updated", updated);
        return summary;
    }

    // ── Reads / edits ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecurringPmDto> getCatalog() {
        return repo.findAllByOrderByPmnumAsc().stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Set the operator's shift + (optional) cadence override; locks the row against refresh overwrite. */
    public RecurringPmDto updateClassification(String pmnum, ShiftPreference shift, RecurrenceCadence cadence) {
        RecurringPm row = repo.findFirstByPmnum(pmnum)
                .orElseThrow(() -> new IllegalArgumentException("Unknown pmnum: " + pmnum));
        if (shift != null) row.setShift(shift);
        if (cadence != null) row.setCadence(cadence);
        row.setClassificationLocked(Boolean.TRUE);
        return toDto(repo.save(row));
    }

    /** pmnum → row, for the assignment filter. */
    @Transactional(readOnly = true)
    public Map<String, RecurringPm> catalogByPmnum() {
        Map<String, RecurringPm> m = new HashMap<>();
        for (RecurringPm r : repo.findAllByOrderByPmnumAsc()) m.put(r.getPmnum(), r);
        return m;
    }

    // ── Cadence inference ──────────────────────────────────────────────────────

    /** Median gap (days) between sorted occurrence dates, or null if fewer than 2. */
    static Integer medianGapDays(List<LocalDate> sortedDates) {
        if (sortedDates == null || sortedDates.size() < 2) return null;
        List<Long> gaps = new ArrayList<>();
        for (int i = 1; i < sortedDates.size(); i++) {
            long d = java.time.temporal.ChronoUnit.DAYS.between(sortedDates.get(i - 1), sortedDates.get(i));
            if (d > 0) gaps.add(d);
        }
        if (gaps.isEmpty()) return null;
        Collections.sort(gaps);
        long median = gaps.get(gaps.size() / 2);
        return (int) median;
    }

    /** Bucket a median gap into a cadence. Null/no-signal → OTHER. */
    static RecurrenceCadence cadenceFor(Integer medianGapDays) {
        if (medianGapDays == null) return RecurrenceCadence.OTHER;
        int d = medianGapDays;
        if (d <= 2) return RecurrenceCadence.DAY;
        if (d <= 10) return RecurrenceCadence.WEEK;   // weekly ~7
        if (d <= 45) return RecurrenceCadence.MONTH;  // monthly ~28-31
        return RecurrenceCadence.OTHER;               // quarterly/annual/irregular
    }

    /** Parse the leading yyyy-MM-dd of a Maximo ISO datetime (e.g. "2026-06-02T00:00:00-05:00"). */
    static LocalDate parseDate(String iso) {
        if (iso == null || iso.length() < 10) return null;
        try {
            return LocalDate.parse(iso.substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }

    private RecurringPmDto toDto(RecurringPm r) {
        return RecurringPmDto.builder()
                .id(r.getId())
                .pmnum(r.getPmnum())
                .pmDescription(r.getPmDescription())
                .lead(r.getLead())
                .cadence(r.getCadence())
                .intervalDays(r.getIntervalDays())
                .classificationLocked(r.getClassificationLocked())
                .shift(r.getShift())
                .occurrenceCount(r.getOccurrenceCount())
                .lastWonum(r.getLastWonum())
                .lastTargetDate(r.getLastTargetDate())
                .catalogRefreshedAt(r.getCatalogRefreshedAt())
                .build();
    }
}
