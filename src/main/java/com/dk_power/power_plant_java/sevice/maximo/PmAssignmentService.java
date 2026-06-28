package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.PmAssignRequest;
import com.dk_power.power_plant_java.dto.maximo.PmPendingAssignmentDto;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.entities.maximo.ShiftPreference;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes proposed assignees for WAPPR recurring-PM work orders (by matching the PM's shift against
 * the {@code ShiftDay} roster on the WO's due date) and applies approvals (set lead + changeStatus
 * APPR). See project/features/maximo/pm-auto-assignment-design.md.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PmAssignmentService {

    private static final int PAGE_SIZE = 200;
    private static final int MAX_PAGES = 25;

    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoBundleService bundles;
    private final RecurringPmService recurringPmService;
    private final ShiftDayService shiftDayService;
    private final UserRepo userRepo;

    /** WAPPR PM work orders that belong to the recurring catalog, each with a proposed assignee. */
    public List<PmPendingAssignmentDto> pendingAssignments() {
        List<String> personIds = bundles.leadOperators().stream()
                .map(User::getMaximoPersonid)
                .filter(Objects::nonNull).filter(s -> !s.isBlank()).distinct()
                .collect(Collectors.toList());
        if (personIds.isEmpty()) return List.of();

        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setStatus("WAPPR");
        c.setWorktype("PM");
        c.setLeadIn(personIds);
        List<MaximoWorkOrderDto> wos = workOrders.listAllByCriteria(c, PAGE_SIZE, MAX_PAGES);

        Map<String, RecurringPm> catalog = recurringPmService.catalogByPmnum();
        Map<Long, User> userCache = new HashMap<>();

        List<PmPendingAssignmentDto> out = new ArrayList<>();
        for (MaximoWorkOrderDto w : wos) {
            String pmnum = w.getPmnum();
            if (pmnum == null || pmnum.isBlank()) continue;
            RecurringPm pm = catalog.get(pmnum.trim());
            if (pm == null) continue; // not a known recurring PM — skip (safety boundary)

            LocalDate target = firstNonNullDate(w.getTargetStart(), w.getSchedstart(), w.getReportdate());
            if (target == null) target = LocalDate.now();
            ShiftPreference shift = pm.getShift() == null ? ShiftPreference.EITHER : pm.getShift();

            ShiftDayDto day = shiftDayService.getByDate(target);
            List<PmPendingAssignmentDto.PersonOption> candidates = peopleOnShift(day, shift, userCache);
            PmPendingAssignmentDto.PersonOption proposed = candidates.isEmpty() ? null : candidates.get(0);

            out.add(PmPendingAssignmentDto.builder()
                    .href(w.getHref())
                    .wonum(w.getWonum())
                    .pmnum(pmnum)
                    .description(w.getDescription())
                    .status(w.getStatus())
                    .targetDate(target.toString())
                    .shift(shift)
                    .cadence(pm.getCadence())
                    .currentLead(w.getLeadCraft())
                    .proposedPersonid(proposed == null ? null : proposed.getPersonid())
                    .proposedName(proposed == null ? null : proposed.getName())
                    .note(day == null ? "No schedule loaded for " + target
                            : (candidates.isEmpty() ? "No one on " + shift + " shift that day" : null))
                    .candidates(candidates)
                    .build());
        }
        return out;
    }

    /** Apply approvals: for each item set the lead (if given) then changeStatus → APPR. Per-item errors are collected. */
    public Map<String, Object> assign(PmAssignRequest req) {
        if (req == null || req.getItems() == null || req.getItems().isEmpty()) {
            return Map.of("approved", 0, "errors", List.of());
        }
        int approved = 0;
        List<Map<String, String>> errors = new ArrayList<>();
        for (PmAssignRequest.Item it : req.getItems()) {
            if (it == null || it.getHref() == null || it.getHref().isBlank()) continue;
            try {
                if (it.getPersonid() != null && !it.getPersonid().isBlank()) {
                    workOrders.setLead(it.getHref(), it.getPersonid());
                }
                workOrders.changeStatus(it.getHref(), "APPR", req.getMemo());
                approved++;
            } catch (Exception e) {
                log.warn("[PM] assign {} failed: {}", it.getHref(), e.getMessage());
                errors.add(Map.of("href", it.getHref(), "error", String.valueOf(e.getMessage())));
            }
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("approved", approved);
        res.put("errors", errors);
        return res;
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    /** People working the given shift on a day, resolved to a Maximo personid (deduped, order preserved). */
    private List<PmPendingAssignmentDto.PersonOption> peopleOnShift(ShiftDayDto day, ShiftPreference shift,
                                                                    Map<Long, User> userCache) {
        if (day == null) return List.of();
        List<ShiftEntry> entries = new ArrayList<>();
        switch (shift) {
            case DAY -> entries.addAll(nz(day.getDayShift()));
            case NIGHT -> entries.addAll(nz(day.getNightShift()));
            case EITHER -> { entries.addAll(nz(day.getDayShift())); entries.addAll(nz(day.getNightShift())); }
        }
        List<PmPendingAssignmentDto.PersonOption> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ShiftEntry e : entries) {
            if (e == null || e.getUserId() == null) continue;
            User u = userCache.computeIfAbsent(e.getUserId(), id -> userRepo.findById(id).orElse(null));
            if (u == null) continue;
            String pid = u.getMaximoPersonid();
            if (pid == null || pid.isBlank() || !seen.add(pid)) continue;
            String name = (u.getName() != null && !u.getName().isBlank()) ? u.getName() : e.getName();
            out.add(PmPendingAssignmentDto.PersonOption.builder().personid(pid).name(name).build());
        }
        return out;
    }

    private static List<ShiftEntry> nz(List<ShiftEntry> l) { return l == null ? List.of() : l; }

    private static LocalDate firstNonNullDate(String... isos) {
        for (String s : isos) {
            LocalDate d = RecurringPmService.parseDate(s);
            if (d != null) return d;
        }
        return null;
    }
}
