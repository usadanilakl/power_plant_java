package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoOverviewDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Cross-source aggregations that combine local User data with Maximo queries.
 * Today: only "WOs assigned to Lead Operators". Future bundles (open SRs for a
 * crew, WOs for an asset group, etc.) plug in here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaximoBundleService {

    public static final String LEAD_OPERATOR_ROLE = "LEAD_OPERATOR";

    private final UserRepo userRepo;
    private final MaximoWorkOrderAdapter workOrders;

    /**
     * All active local users whose role list contains LEAD_OPERATOR.
     * Filtering happens in memory because `users.role` is a comma-separated string —
     * JPA can't do an exact match on a substring without a brittle LIKE clause.
     */
    public List<User> leadOperators() {
        return userRepo.findByIsActiveTrue().stream()
                .filter(u -> u.hasRole(LEAD_OPERATOR_ROLE))
                .sorted(Comparator.comparing(
                        u -> u.getName() == null ? "" : u.getName().toLowerCase()))
                .collect(Collectors.toList());
    }

    /**
     * All work orders Maximo has assigned to ANY Lead Operator (by `spi:lead`).
     * Single Maximo call via OSLC `in [...]`. Returns empty list if no Lead Operators
     * exist locally or none have a Maximo personid.
     *
     * @param status optional Maximo status filter (e.g. "APPR"); null/blank = all statuses
     */
    public List<MaximoWorkOrderDto> leadOperatorWorkOrders(int pageSize, String status) {
        List<String> personIds = leadOperators().stream()
                .map(User::getMaximoPersonid)
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
        if (personIds.isEmpty()) {
            log.debug("[Bundle] No Lead Operators have a Maximo personid; returning empty list");
            return List.of();
        }
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setLeadIn(personIds);
        if (status != null && !status.isBlank()) c.setStatus(status);
        return workOrders.listByCriteria(c, pageSize);
    }

    /** Back-compat: no status filter. */
    public List<MaximoWorkOrderDto> leadOperatorWorkOrders(int pageSize) {
        return leadOperatorWorkOrders(pageSize, null);
    }

    /** Open WO statuses (needs-doing/in-progress) that count toward overdue/due/upcoming buckets. */
    private static final List<String> OPEN_STATUSES = List.of("WSCH", "WAPPR", "APPR", "INPRG");
    /** Page through the tracked pool's WOs so a large roster's backlog isn't silently truncated (like the PM services). */
    private static final int OVERVIEW_MAX_PAGES = 25;

    /**
     * The Electron overview: the tracked people's work orders bucketed by due status relative to the
     * current ISO week (Mon–Sun). {@code mode="people"} tracks the given {@code personids} verbatim;
     * anything else (default {@code "leads"}) tracks the local Lead Operators' Maximo personids.
     *
     * <p>Buckets (server clock):
     * <ul>
     *   <li>overdue — open WO whose target start is before today</li>
     *   <li>dueThisWeek — open WO whose target start is today..Sunday</li>
     *   <li>upcoming — open WO due after Sunday, or with no target start</li>
     *   <li>completedThisWeek — COMP WO whose statusdate is on/after Monday</li>
     * </ul>
     * Returns empty buckets (never null) when the resolved people set is empty. The completed-this-week
     * query is best-effort: a failure there (e.g. a status-date field quirk) leaves the open buckets intact.
     */
    public MaximoOverviewDto overview(String mode, List<String> personids, int pageSize) {
        boolean people = "people".equalsIgnoreCase(mode);
        List<String> ids = resolvePersonIds(mode, personids);

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);
        LocalDate lastWeekStart = weekStart.minusWeeks(1);   // previous Monday

        MaximoOverviewDto.MaximoOverviewDtoBuilder b = MaximoOverviewDto.builder()
                .mode(people ? "people" : "leads")
                .asOf(today.toString()).weekStart(weekStart.toString()).weekEnd(weekEnd.toString())
                .personCount(ids.size())
                .overdue(new ArrayList<>()).dueThisWeek(new ArrayList<>())
                .completedThisWeek(new ArrayList<>()).completedLastWeek(new ArrayList<>()).upcoming(new ArrayList<>());
        if (ids.isEmpty()) {
            log.debug("[Bundle] overview: no tracked personids (mode={}) — empty buckets", mode);
            return b.build();
        }

        // Open WOs for the tracked people. Page through the whole set — a full lead roster's open
        // backlog can exceed one page, and single-page listByCriteria would silently truncate the buckets.
        MaximoWorkOrderCriteria open = new MaximoWorkOrderCriteria();
        open.setLeadIn(ids);
        open.setStatusIn(OPEN_STATUSES);
        List<MaximoWorkOrderDto> openWos = workOrders.listAllByCriteria(open, pageSize, OVERVIEW_MAX_PAGES);

        List<MaximoWorkOrderDto> overdue = new ArrayList<>();
        List<MaximoWorkOrderDto> due = new ArrayList<>();
        List<MaximoWorkOrderDto> upcoming = new ArrayList<>();
        for (MaximoWorkOrderDto w : openWos) {
            LocalDate d = parseDate(w.getTargetStart());
            if (d == null) upcoming.add(w);
            else if (d.isBefore(today)) overdue.add(w);
            else if (!d.isAfter(weekEnd)) due.add(w);
            else upcoming.add(w);
        }
        Comparator<MaximoWorkOrderDto> byTargetAsc =
                Comparator.comparing(w -> w.getTargetStart() == null ? "" : w.getTargetStart());
        overdue.sort(byTargetAsc);
        due.sort(byTargetAsc);
        // Upcoming: no-target rows sink to the bottom, otherwise soonest first.
        upcoming.sort(Comparator
                .comparing((MaximoWorkOrderDto w) -> w.getTargetStart() == null || w.getTargetStart().isBlank())
                .thenComparing(w -> w.getTargetStart() == null ? "" : w.getTargetStart()));

        // Completed in the last two ISO weeks (best-effort — a status-date quirk mustn't break the open buckets),
        // then split into this-week vs last-week in Java.
        List<MaximoWorkOrderDto> completedThisWeek = new ArrayList<>();
        List<MaximoWorkOrderDto> completedLastWeek = new ArrayList<>();
        try {
            MaximoWorkOrderCriteria comp = new MaximoWorkOrderCriteria();
            comp.setLeadIn(ids);
            comp.setStatus("COMP");
            // statusdate is a Maximo DATETIME — compare against a FULL datetime literal (the convention the
            // reportdate/schedstart ranges use); a bare date can silently match nothing on this OSLC layer.
            comp.setStatusdateFrom(lastWeekStart + "T00:00:00");
            comp.setStatusdateTo(weekEnd + "T23:59:59");
            for (MaximoWorkOrderDto w : workOrders.listAllByCriteria(comp, pageSize, OVERVIEW_MAX_PAGES)) {
                LocalDate sd = parseDate(w.getStatusDate());
                if (sd != null && sd.isBefore(weekStart)) completedLastWeek.add(w);
                else completedThisWeek.add(w);   // this week (or unparseable statusdate — Maximo already scoped it)
            }
            Comparator<MaximoWorkOrderDto> byStatusDateDesc = Comparator
                    .comparing((MaximoWorkOrderDto w) -> w.getStatusDate() == null ? "" : w.getStatusDate())
                    .reversed();
            completedThisWeek.sort(byStatusDateDesc);
            completedLastWeek.sort(byStatusDateDesc);
        } catch (Exception e) {
            log.warn("[Bundle] overview: completed-work query failed: {}", e.getMessage());
        }

        return b.overdue(overdue).dueThisWeek(due)
                .completedThisWeek(completedThisWeek).completedLastWeek(completedLastWeek)
                .upcoming(upcoming).build();
    }

    /** Resolve the tracked personid set: mode="people" → the given ids (cleaned), else the Lead Operators'. */
    private List<String> resolvePersonIds(String mode, List<String> personids) {
        if ("people".equalsIgnoreCase(mode)) {
            return personids == null ? List.of() : personids.stream()
                    .filter(s -> s != null && !s.isBlank()).map(String::trim).distinct().collect(Collectors.toList());
        }
        return leadOperators().stream().map(User::getMaximoPersonid)
                .filter(Objects::nonNull).filter(s -> !s.isBlank()).distinct().collect(Collectors.toList());
    }

    /**
     * Work orders for the tracked people, optionally narrowed to one status (blank = ALL statuses). Single
     * page, newest-first — drives the "All" tab, whose status filter defaults to APPR but can be changed or
     * cleared. A blank status returns the most-recent WOs across every status (dominated by history), so the
     * caller should show a truncation hint when the result hits the page cap.
     */
    public List<MaximoWorkOrderDto> peopleWorkOrders(String mode, List<String> personids, String status, int pageSize) {
        List<String> ids = resolvePersonIds(mode, personids);
        if (ids.isEmpty()) return List.of();
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setLeadIn(ids);
        if (status != null && !status.isBlank()) c.setStatus(status.trim().toUpperCase());
        return workOrders.listByCriteria(c, pageSize);
    }

    /** First 10 chars of a Maximo ISO datetime → LocalDate, or null if unparseable/blank. */
    private static LocalDate parseDate(String iso) {
        if (iso == null || iso.length() < 10) return null;
        try {
            return LocalDate.parse(iso.substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }
}
