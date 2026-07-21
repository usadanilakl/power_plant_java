package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.PmOccurrenceDto;
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
 * Builds and maintains the recurring-PM catalog: scan a trailing year of work orders led by lead
 * operators, dedupe into unique items, and keep those that recur. See
 * project/features/maximo/pm-auto-assignment-design.md.
 *
 * Identity: {@code pmnum} when the WO carries one, else {@code "D:" + normalized description} — because
 * pmnum is sparsely populated at this plant. An item is "recurring" if it appears ≥2× in the year OR
 * has a pmnum (PM-master-generated). Cadence is inferred from occurrence spacing; the operator sets
 * the day/night shift.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RecurringPmService {

    private static final int CATALOG_YEARS = 1;
    private static final int PAGE_SIZE = 2000;  // big pages — the instance honors them; ~8k+ WOs/yr at JG
    private static final int MAX_PAGES = 25;     // 2000*25 = 50k WO safety ceiling

    private static final int OCCURRENCE_YEARS = 2;       // per-PM history lookback
    private static final int OCCURRENCE_MAX_PAGES = 3;   // one PM's WOs fit easily; bound runaway LIKE matches
    private static final Set<String> OPEN_STATUSES = Set.of("WSCH", "WAPPR", "APPR", "INPRG");

    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoBundleService bundles;
    private final RecurringPmRepo repo;

    // ── Catalog build ──────────────────────────────────────────────────────────

    /**
     * Rebuild the catalog from Maximo: fetch ~1 year of JG work orders (paged), dedupe by
     * pmnum-or-description, keep recurring items (≥2 occurrences or has pmnum), infer cadence, and
     * upsert. Manually-classified rows keep their cadence/shift. Returns a summary map.
     *
     * Scope is WOs LED BY LEAD OPERATORS (any worktype): the target is recurring PMs the operators
     * own. "Recurring" = the deduped item appears ≥2× in the year OR has a pmnum. WAPPR/WSCH WOs are
     * matched against this catalog by pmnum or description, even though they're currently unassigned.
     */
    public Map<String, Object> refreshCatalog() {
        List<String> personIds = bundles.leadOperators().stream()
                .map(User::getMaximoPersonid)
                .filter(Objects::nonNull).filter(s -> !s.isBlank()).distinct()
                .collect(Collectors.toList());
        if (personIds.isEmpty()) {
            log.warn("[PM] refreshCatalog: no lead operators with a Maximo personid");
            return Map.of("scanned", 0, "candidates", 0, "recurring", 0, "created", 0, "updated", 0);
        }

        backfillKeys(); // migrate any pre-existing rows that predate pm_key

        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setLeadIn(personIds);
        c.setReportdateFrom(LocalDate.now().minusYears(CATALOG_YEARS) + "T00:00:00");
        List<MaximoWorkOrderDto> wos = workOrders.listAllByCriteria(c, PAGE_SIZE, MAX_PAGES);

        // Group by stable key (newest-first thanks to -reportdate ordering).
        Map<String, List<MaximoWorkOrderDto>> byKey = new LinkedHashMap<>();
        for (MaximoWorkOrderDto w : wos) {
            String key = keyFor(w.getPmnum(), w.getDescription());
            if (key == null) continue;
            byKey.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
        }

        LocalDateTime now = LocalDateTime.now();
        int created = 0, updated = 0, recurring = 0;
        Set<String> seenKeys = new HashSet<>();
        for (Map.Entry<String, List<MaximoWorkOrderDto>> e : byKey.entrySet()) {
            String key = e.getKey();
            List<MaximoWorkOrderDto> occ = e.getValue();
            String realPmnum = occ.stream().map(MaximoWorkOrderDto::getPmnum)
                    .filter(p -> p != null && !p.isBlank()).findFirst().orElse(null);

            boolean isRecurring = occ.size() >= 2 || realPmnum != null;
            if (!isRecurring) continue; // single occurrence with no pmnum → one-off, skip
            recurring++;

            MaximoWorkOrderDto latest = occ.get(0); // newest
            List<LocalDate> dates = occ.stream()
                    .map(w -> parseDate(w.getTargetStart() != null ? w.getTargetStart() : w.getReportdate()))
                    .filter(Objects::nonNull).sorted().collect(Collectors.toList());
            Integer medianGap = medianGapDays(dates);

            RecurringPm row = repo.findFirstByPmKey(key).orElse(null);
            boolean isNew = row == null;
            if (isNew) {
                row = RecurringPm.builder().pmKey(key).shift(ShiftPreference.EITHER)
                        .classificationLocked(Boolean.FALSE).build();
            }
            row.setPmnum(realPmnum);
            row.setPmDescription(latest.getDescription());
            row.setLead(latest.getLeadCraft());
            row.setOccurrenceCount(occ.size());
            row.setLastWonum(latest.getWonum());
            row.setLastTargetDate(dates.isEmpty() ? null : dates.get(dates.size() - 1));
            row.setIntervalDays(medianGap);
            if (!Boolean.TRUE.equals(row.getClassificationLocked())) {
                row.setCadence(cadenceFor(medianGap));
            }
            row.setCatalogRefreshedAt(now);
            repo.save(row);
            seenKeys.add(key);
            if (isNew) created++; else updated++;
        }

        // Self-heal: drop catalog rows that no lead operator has performed in the scan window. Guarded so a
        // transient empty/partial Maximo response can never wipe the catalog — only prune when this scan
        // actually returned WOs and produced at least one recurring item.
        int pruned = 0;
        if (!wos.isEmpty() && recurring > 0) {
            for (RecurringPm stale : repo.findAllByOrderByPmnumAsc()) {
                if (stale.getPmKey() != null && !seenKeys.contains(stale.getPmKey())
                        && !Boolean.TRUE.equals(stale.getManuallyAdded())) {   // never prune manual conversions
                    stale.setDeleted(true);
                    repo.save(stale);
                    pruned++;
                }
            }
        }

        log.info("[PM] refreshCatalog: scanned {} WOs, {} unique items, {} recurring ({} new, {} updated, {} pruned)",
                wos.size(), byKey.size(), recurring, created, updated, pruned);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scanned", wos.size());
        summary.put("candidates", byKey.size());
        summary.put("recurring", recurring);
        summary.put("created", created);
        summary.put("updated", updated);
        summary.put("pruned", pruned);
        return summary;
    }

    /** One-time migration: rows created before pm_key existed have it null — backfill from pmnum/description. */
    private void backfillKeys() {
        for (RecurringPm r : repo.findAllByOrderByPmnumAsc()) {
            if (r.getPmKey() == null || r.getPmKey().isBlank()) {
                String key = keyFor(r.getPmnum(), r.getPmDescription());
                if (key != null) { r.setPmKey(key); repo.save(r); }
            }
        }
    }

    // ── Reads / edits ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecurringPmDto> getCatalog() {
        return repo.findAllByOrderByPmnumAsc().stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Set the operator's shift, optional cadence override, and preferred day-of-week; locks the row
     * against refresh overwrite. {@code shift}/{@code cadence} are applied only when non-null;
     * {@code preferredDayOfWeek} is applied as given (null clears it — "no preferred day").
     */
    public RecurringPmDto updateClassification(Long id, ShiftPreference shift, RecurrenceCadence cadence,
                                               Integer preferredDayOfWeek) {
        RecurringPm row = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unknown recurring-PM id: " + id));
        if (shift != null) row.setShift(shift);
        if (cadence != null) row.setCadence(cadence);
        row.setPreferredDayOfWeek(
                (preferredDayOfWeek != null && preferredDayOfWeek >= 1 && preferredDayOfWeek <= 7)
                        ? preferredDayOfWeek : null);
        row.setClassificationLocked(Boolean.TRUE);
        return toDto(repo.save(row));
    }

    /** All catalog rows (for the assignment matcher to build pmnum + description lookups). */
    @Transactional(readOnly = true)
    public List<RecurringPm> allCatalog() {
        return repo.findAllByOrderByPmnumAsc();
    }

    /**
     * Manually convert a work order into a recurring-PM catalog entry — for PMs the auto-refresh didn't
     * classify as recurring (single occurrence, no pmnum, or led by a non-operator). Idempotent by pmKey:
     * re-adding an existing key just flags it manual + locked. The row is marked {@code manuallyAdded} so
     * the refresh prune never drops it, and {@code classificationLocked} so refresh won't overwrite the
     * operator's shift/cadence. Future WOs with the same pmnum/description then match it as recurring.
     */
    public RecurringPmDto manualAdd(String pmnum, String description, String lead, String wonum) {
        String key = keyFor(pmnum, description);
        if (key == null) {
            throw new IllegalArgumentException("A PM number or description is required to make a recurring task");
        }
        RecurringPm row = repo.findFirstByPmKey(key).orElse(null);
        if (row == null) {
            row = RecurringPm.builder().pmKey(key)
                    .shift(ShiftPreference.EITHER).cadence(RecurrenceCadence.OTHER)
                    .occurrenceCount(1).build();
        }
        row.setManuallyAdded(Boolean.TRUE);
        row.setClassificationLocked(Boolean.TRUE);
        if (pmnum != null && !pmnum.isBlank()) row.setPmnum(pmnum.trim());
        if (description != null && !description.isBlank()
                && (row.getPmDescription() == null || row.getPmDescription().isBlank())) {
            row.setPmDescription(description);
        }
        if (lead != null && !lead.isBlank() && (row.getLead() == null || row.getLead().isBlank())) row.setLead(lead);
        if (wonum != null && !wonum.isBlank() && (row.getLastWonum() == null || row.getLastWonum().isBlank())) row.setLastWonum(wonum);
        if (row.getShift() == null) row.setShift(ShiftPreference.EITHER);
        if (row.getCadence() == null) row.setCadence(RecurrenceCadence.OTHER);
        if (row.getOccurrenceCount() == null) row.setOccurrenceCount(1);
        row.setCatalogRefreshedAt(LocalDateTime.now());
        return toDto(repo.save(row));
    }

    /**
     * Real Maximo work orders for one catalog PM — its occurrence history + upcoming items. Matched by
     * pmnum when the PM has one, else by description (most PMs here have no pmnum). Newest first; each row
     * flagged {@code open} (WSCH/WAPPR/APPR/INPRG → upcoming/active) vs history. Live, authoritative — no
     * forecast (the PM master {@code mxapipm} is not authorized on this instance).
     */
    @Transactional(readOnly = true)
    public List<PmOccurrenceDto> occurrences(Long id) {
        RecurringPm pm = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unknown recurring-PM id: " + id));

        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        if (pm.getPmnum() != null && !pm.getPmnum().isBlank()) {
            c.setPmnum(pm.getPmnum().trim());
        } else if (pm.getPmDescription() != null && !pm.getPmDescription().isBlank()) {
            // Phrase, not word bucket: these are THIS PM's own generated WOs, so the description must appear
            // intact. A word bucket would drag in any WO that happens to share the same words.
            c.setDescriptionPhrase(pm.getPmDescription().trim());
        } else {
            return List.of();
        }
        c.setReportdateFrom(LocalDate.now().minusYears(OCCURRENCE_YEARS) + "T00:00:00");
        List<MaximoWorkOrderDto> wos = workOrders.listAllByCriteria(c, PAGE_SIZE, OCCURRENCE_MAX_PAGES);

        List<PmOccurrenceDto> out = new ArrayList<>();
        for (MaximoWorkOrderDto w : wos) {
            LocalDate d = firstDate(w.getTargetStart(), w.getSchedstart(), w.getReportdate());
            String status = w.getStatus();
            out.add(PmOccurrenceDto.builder()
                    .wonum(w.getWonum())
                    .href(w.getHref())
                    .status(status)
                    .date(d == null ? null : d.toString())
                    .lead(w.getLeadCraft())
                    .open(status != null && OPEN_STATUSES.contains(status.trim().toUpperCase()))
                    .build());
        }
        // Newest first (null dates last). The UI splits open=upcoming vs history and re-orders upcoming.
        out.sort(Comparator.comparing((PmOccurrenceDto o) -> o.getDate() == null ? "" : o.getDate()).reversed());
        return out;
    }

    private static LocalDate firstDate(String... isos) {
        for (String s : isos) { LocalDate d = parseDate(s); if (d != null) return d; }
        return null;
    }

    // ── Keys / cadence inference ─────────────────────────────────────────────────

    /** Stable dedupe key: pmnum when present, else "D:"+normalized description; null if neither. */
    public static String keyFor(String pmnum, String description) {
        if (pmnum != null && !pmnum.isBlank()) return pmnum.trim();
        String d = normDesc(description);
        return d == null ? null : "D:" + d;
    }

    /** Normalize a description for matching: lowercase, trimmed, collapsed whitespace. */
    public static String normDesc(String s) {
        if (s == null) return null;
        String t = s.trim().toLowerCase().replaceAll("\\s+", " ");
        return t.isEmpty() ? null : t;
    }

    static Integer medianGapDays(List<LocalDate> sortedDates) {
        if (sortedDates == null || sortedDates.size() < 2) return null;
        List<Long> gaps = new ArrayList<>();
        for (int i = 1; i < sortedDates.size(); i++) {
            long d = java.time.temporal.ChronoUnit.DAYS.between(sortedDates.get(i - 1), sortedDates.get(i));
            if (d > 0) gaps.add(d);
        }
        if (gaps.isEmpty()) return null;
        Collections.sort(gaps);
        return (int) (long) gaps.get(gaps.size() / 2);
    }

    static RecurrenceCadence cadenceFor(Integer medianGapDays) {
        if (medianGapDays == null) return RecurrenceCadence.OTHER;
        int d = medianGapDays;
        if (d <= 2) return RecurrenceCadence.DAY;
        if (d <= 10) return RecurrenceCadence.WEEK;
        if (d <= 45) return RecurrenceCadence.MONTH;
        return RecurrenceCadence.OTHER;
    }

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
                .pmKey(r.getPmKey())
                .pmnum(r.getPmnum())
                .pmDescription(r.getPmDescription())
                .lead(r.getLead())
                .cadence(r.getCadence())
                .intervalDays(r.getIntervalDays())
                .classificationLocked(r.getClassificationLocked())
                .shift(r.getShift())
                .preferredDayOfWeek(r.getPreferredDayOfWeek())
                .occurrenceCount(r.getOccurrenceCount())
                .lastWonum(r.getLastWonum())
                .lastTargetDate(r.getLastTargetDate())
                .catalogRefreshedAt(r.getCatalogRefreshedAt())
                .manuallyAdded(r.getManuallyAdded())
                .formKey(r.getFormKey())
                .formKeys(r.getFormKeyList())
                .build();
    }

    /** Assign (or clear, when blank) a SINGLE completion form. Back-compat wrapper over {@link #assignForms}. */
    public RecurringPmDto assignForm(Long id, String formKey) {
        return assignForms(id, (formKey == null || formKey.isBlank()) ? java.util.List.of() : java.util.List.of(formKey.trim()));
    }

    /** Assign the completion form(s) a PM offers (empty/null clears them). The operator picks one at completion. */
    public RecurringPmDto assignForms(Long id, java.util.List<String> formKeys) {
        RecurringPm row = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unknown recurring-PM id: " + id));
        row.setFormKeyList(formKeys);
        return toDto(repo.save(row));
    }

    /**
     * Find the recurring-PM catalog row for a work order (pmnum first, then normalized description) — used to
     * look up the WO's assigned completion form. Read-only.
     */
    @Transactional(readOnly = true)
    public Optional<RecurringPm> findForWorkOrder(String pmnum, String description) {
        if (pmnum != null && !pmnum.isBlank()) {
            Optional<RecurringPm> byPm = repo.findFirstByPmKey(pmnum.trim());
            if (byPm.isPresent()) return byPm;
        }
        String nd = normDesc(description);
        return (nd == null) ? Optional.empty() : repo.findFirstByPmKey("D:" + nd);
    }
}
