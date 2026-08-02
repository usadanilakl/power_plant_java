package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSeatSummaryDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSignupDto;
import com.dk_power.power_plant_java.dto.schedule.EligibilityCellDto;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CoverageRequestRepo;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Schedule v2 coverage — managers post extra-headcount {@link CoverageRequest}s; operators sign up
 * ({@link CoverageSignup}); managers approve/reject. Approved signups feed the materialiser (the
 * coverer is placed into that day's shift), so approve/reject/cancel re-materialise the horizon.
 *
 * <p>Open seats for a (date, shift) = summed {@code requiredCount} of OPEN requests covering that
 * date/shift, minus approved signups on it. Chips render {@code openX} counts; the day view lists
 * per-request {@code openForDate}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NgCoverageService {

    private final CoverageRequestRepo requestRepo;
    private final CoverageSignupRepo signupRepo;
    private final PtoRequestRepo ptoRepo;
    private final UserRepo userRepo;
    private final CrewAssignmentRepo assignmentRepo;
    private final ShiftDayService shiftDayService;
    private final ScheduleMaterialisationService materialisation;
    private final PtoNotificationService notificationService;

    // ---- manager: coverage requests ----------------------------------------

    public CoverageRequestDto createCoverage(CoverageRequestDto dto) {
        if (dto.getStartDate() == null) throw new IllegalArgumentException("startDate is required");
        LocalDate end = dto.getEndDate() != null ? dto.getEndDate() : dto.getStartDate();
        if (end.isBefore(dto.getStartDate())) throw new IllegalArgumentException("endDate cannot be before startDate");
        CoverageRequest r = new CoverageRequest();
        r.setStartDate(dto.getStartDate());
        r.setEndDate(end);
        r.setShift(dto.getShift());
        String cd = dto.getDiscipline() == null ? CoverageRequest.Discipline.OPS : dto.getDiscipline();
        r.setDiscipline(cd);
        r.setPosition(CoverageRequest.Discipline.OPS.equals(cd) ? dto.getPosition() : null);
        r.setRequiredCount(dto.getRequiredCount() == null || dto.getRequiredCount() < 1 ? 1 : dto.getRequiredCount());
        r.setReason(dto.getReason() == null ? CoverageRequest.Reason.MANUAL : dto.getReason());
        r.setStatus(CoverageRequest.Status.OPEN);
        r.setFilledCount(0);
        if (dto.getPtoRequestId() != null) ptoRepo.findById(dto.getPtoRequestId()).ifPresent(r::setPtoRequest);
        return toDto(requestRepo.save(r));
    }

    /**
     * Upsert one coverage "need" cell for a single day — {@code (date, discipline, shift) → count} —
     * the fast inline entry from the admin grid header. Reuses one MANUAL single-day request per cell;
     * {@code count <= 0} clears it. Defining a need doesn't place anyone (only approved signups do), so
     * no re-materialise.
     */
    public CoverageRequestDto setDayNeed(LocalDate date, String discipline, String position, String shift, int count) {
        if (date == null) throw new IllegalArgumentException("date is required");
        String disc = discipline == null ? CoverageRequest.Discipline.OPS : discipline;
        String pos = CoverageRequest.Discipline.OPS.equals(disc) ? position : null;
        String sh = CoverageRequest.ShiftType.NIGHT.equals(shift)
                ? CoverageRequest.ShiftType.NIGHT : CoverageRequest.ShiftType.DAY;
        CoverageRequest existing = requestRepo.findOverlapping(date, date).stream()
                .filter(r -> date.equals(r.getStartDate()) && date.equals(r.getEndDate())
                        && CoverageRequest.Reason.MANUAL.equals(r.getReason())
                        && sh.equals(r.getShift()) && disc.equals(nz(r.getDiscipline()))
                        && java.util.Objects.equals(pos, r.getPosition()))
                .findFirst().orElse(null);
        if (count <= 0) {
            if (existing != null) {
                existing.setStatus(CoverageRequest.Status.CANCELLED);
                existing.setDeleted(true);
                requestRepo.save(existing);
            }
            return null;
        }
        CoverageRequest r = existing != null ? existing : new CoverageRequest();
        r.setStartDate(date);
        r.setEndDate(date);
        r.setShift(sh);
        r.setDiscipline(disc);
        r.setPosition(pos);
        r.setReason(CoverageRequest.Reason.MANUAL);
        r.setRequiredCount(count);
        if (r.getStatus() == null) r.setStatus(CoverageRequest.Status.OPEN);
        if (r.getFilledCount() == null) r.setFilledCount(0);
        return toDto(requestRepo.save(r));
    }

    private static String nz(String discipline) {
        return discipline == null ? CoverageRequest.Discipline.OPS : discipline;
    }

    // ---- coverage eligibility (who can cover) --------------------------------

    /**
     * For each day in the range, the userIds of people who are <b>off</b> that day AND <b>qualified</b>
     * to cover an open coverage need — by the Lead→CRO→AO cover-up hierarchy for ops (a rank-r person
     * covers a need position Q when rank(Q) ≥ r), or same-discipline for Mechanic/I&C/Manager. Shared by
     * the admin grid, the PWA, and Electron so the hierarchy lives in one place.
     */
    @Transactional(readOnly = true)
    public Map<LocalDate, Set<Long>> eligibleCoverersByDate(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) return Map.of();

        // Roster: userId → discipline + ops rank (first active assignment wins, deterministically).
        Map<Long, String> disc = new HashMap<>();
        Map<Long, Integer> rank = new HashMap<>();
        for (CrewAssignment a : orderedActiveAssignments()) {
            User u = a.getUser();
            if (u == null || u.getId() == null || disc.containsKey(u.getId())) continue;
            String[] dr = deriveDiscipline(a.getPosition());
            disc.put(u.getId(), dr[0]);
            rank.put(u.getId(), Integer.parseInt(dr[1]));
        }

        // Who is working each day (from the materialised ShiftDay).
        Map<LocalDate, Set<Long>> working = new HashMap<>();
        for (ShiftDayDto d : shiftDayService.getRange(from, to)) {
            if (d.getDate() == null) continue;
            Set<Long> ids = new HashSet<>();
            collectIds(d.getDayShift(), ids);
            collectIds(d.getNightShift(), ids);
            working.put(d.getDate(), ids);
        }

        DayNeeds needs = computeDayNeeds(from, to);
        Map<LocalDate, Integer> opsMaxRank = needs.opsMaxRank();
        Map<LocalDate, Set<String>> needDisc = needs.needDisc();

        Map<LocalDate, Set<Long>> out = new LinkedHashMap<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            int maxOps = opsMaxRank.getOrDefault(d, -1);
            Set<String> discs = needDisc.getOrDefault(d, Set.of());
            if (maxOps < 0 && discs.isEmpty()) continue;
            Set<Long> work = working.getOrDefault(d, Set.of());
            Set<Long> eligible = new HashSet<>();
            for (Map.Entry<Long, String> pe : disc.entrySet()) {
                Long uid = pe.getKey();
                if (work.contains(uid)) continue;   // working — not off
                boolean ok = CoverageRequest.Discipline.OPS.equals(pe.getValue())
                        ? maxOps >= rank.get(uid)
                        : discs.contains(pe.getValue());
                if (ok) eligible.add(uid);
            }
            if (!eligible.isEmpty()) out.put(d, eligible);
        }
        return out;
    }

    /**
     * Per-person, per-day open-seat counts (day/night) the operator is off + qualified to cover — the
     * data behind the grid's seat marker (green day count / blue night count / split when both). Same
     * off + cover-up-hierarchy rule as {@link #eligibleCoverersByDate}, broken out by shift and counting
     * REMAINING seats (required minus approved) across the needs this person's position can fill.
     */
    @Transactional(readOnly = true)
    public List<EligibilityCellDto> eligibilityDetail(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) return List.of();

        Map<Long, String> disc = new HashMap<>();
        Map<Long, Integer> rank = new HashMap<>();
        for (CrewAssignment a : orderedActiveAssignments()) {
            User u = a.getUser();
            if (u == null || u.getId() == null || disc.containsKey(u.getId())) continue;
            String[] dr = deriveDiscipline(a.getPosition());
            disc.put(u.getId(), dr[0]);
            rank.put(u.getId(), Integer.parseInt(dr[1]));
        }

        Map<LocalDate, Set<Long>> working = new HashMap<>();
        for (ShiftDayDto d : shiftDayService.getRange(from, to)) {
            if (d.getDate() == null) continue;
            Set<Long> ids = new HashSet<>();
            collectIds(d.getDayShift(), ids);
            collectIds(d.getNightShift(), ids);
            working.put(d.getDate(), ids);
        }

        Map<String, Integer> approvedByReqDate = new HashMap<>();
        for (CoverageSignup s : signupRepo.findByDateBetweenAndStatus(from, to, CoverageSignup.Status.APPROVED)) {
            if (s.getCoverageRequest() != null && s.getCoverageRequest().getId() != null && s.getDate() != null) {
                approvedByReqDate.merge(s.getCoverageRequest().getId() + "|" + s.getDate(), 1, Integer::sum);
            }
        }

        // Per day: OPS remaining seats by position rank [0,1,2] for day + night; non-ops by discipline.
        Map<LocalDate, int[]> opsDay = new HashMap<>();
        Map<LocalDate, int[]> opsNight = new HashMap<>();
        Map<LocalDate, Map<String, Integer>> nonOpsDay = new HashMap<>();
        Map<LocalDate, Map<String, Integer>> nonOpsNight = new HashMap<>();
        for (CoverageRequest r : requestRepo.findOverlapping(from, to)) {
            if (!CoverageRequest.Status.OPEN.equals(r.getStatus())) continue;
            int req = r.getRequiredCount() == null ? 0 : r.getRequiredCount();
            if (req < 1 || r.getStartDate() == null) continue;
            String rdisc = nz(r.getDiscipline());
            boolean night = CoverageRequest.ShiftType.NIGHT.equals(r.getShift());
            int pr = Math.min(2, Math.max(0, CoverageRequest.Position.rank(r.getPosition())));
            LocalDate end = r.getEndDate() != null ? r.getEndDate() : r.getStartDate();
            LocalDate d = r.getStartDate().isBefore(from) ? from : r.getStartDate();
            for (; !d.isAfter(end) && !d.isAfter(to); d = d.plusDays(1)) {
                int remaining = Math.max(0, req - approvedByReqDate.getOrDefault(r.getId() + "|" + d, 0));
                if (remaining == 0) continue;
                if (CoverageRequest.Discipline.OPS.equals(rdisc)) {
                    (night ? opsNight : opsDay).computeIfAbsent(d, k -> new int[3])[pr] += remaining;
                } else {
                    (night ? nonOpsNight : nonOpsDay).computeIfAbsent(d, k -> new HashMap<>()).merge(rdisc, remaining, Integer::sum);
                }
            }
        }

        List<EligibilityCellDto> out = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            Set<Long> work = working.getOrDefault(d, Set.of());
            int[] od = opsDay.get(d);
            int[] on = opsNight.get(d);
            Map<String, Integer> nd = nonOpsDay.getOrDefault(d, Map.of());
            Map<String, Integer> nn = nonOpsNight.getOrDefault(d, Map.of());
            for (Map.Entry<Long, String> pe : disc.entrySet()) {
                Long uid = pe.getKey();
                if (work.contains(uid)) continue;   // working that day — not off
                int dayCnt, nightCnt;
                if (CoverageRequest.Discipline.OPS.equals(pe.getValue())) {
                    int r = rank.getOrDefault(uid, 2);
                    dayCnt = sumFromRank(od, r);
                    nightCnt = sumFromRank(on, r);
                } else {
                    dayCnt = nd.getOrDefault(pe.getValue(), 0);
                    nightCnt = nn.getOrDefault(pe.getValue(), 0);
                }
                if (dayCnt > 0 || nightCnt > 0) {
                    out.add(EligibilityCellDto.builder().date(d.toString()).userId(uid).day(dayCnt).night(nightCnt).build());
                }
            }
        }
        return out;
    }

    /** Sum of open seats for a person of ops rank {@code r}: they cover needs at rank r..2 (Lead>CRO>AO). */
    private static int sumFromRank(int[] byRank, int r) {
        if (byRank == null) return 0;
        int sum = 0;
        for (int i = Math.max(0, r); i < byRank.length; i++) sum += byRank[i];
        return sum;
    }

    /**
     * The dates one user is eligible to cover in the range (off + qualified) — the PWA operator view.
     * Resolves this one user's discipline/rank directly instead of building (and discarding) the
     * whole-roster {@link #eligibleCoverersByDate} map just to filter one id out of it.
     */
    @Transactional(readOnly = true)
    public List<LocalDate> eligibleDatesForUser(Long userId, LocalDate from, LocalDate to) {
        List<LocalDate> out = new ArrayList<>();
        if (userId == null || from == null || to == null || to.isBefore(from)) return out;

        String[] dr = resolveUserDisciplineRank(userId);
        if (dr == null) return out;   // not on the active roster — never eligible
        String discipline = dr[0];
        int rank = Integer.parseInt(dr[1]);

        Set<LocalDate> working = new HashSet<>();
        for (ShiftDayDto d : shiftDayService.getRange(from, to)) {
            if (d.getDate() == null) continue;
            if (containsUser(d.getDayShift(), userId) || containsUser(d.getNightShift(), userId)) {
                working.add(d.getDate());
            }
        }

        DayNeeds needs = computeDayNeeds(from, to);
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (working.contains(d)) continue;   // working that day — not off
            boolean ok = CoverageRequest.Discipline.OPS.equals(discipline)
                    ? needs.opsMaxRank().getOrDefault(d, -1) >= rank
                    : needs.needDisc().getOrDefault(d, Set.of()).contains(discipline);
            if (ok) out.add(d);
        }
        return out;
    }

    /** Open needs per day across the range: the max needed ops rank + the set of needed non-ops
     *  disciplines. Shared by {@link #eligibleCoverersByDate} and {@link #eligibleDatesForUser}. */
    private DayNeeds computeDayNeeds(LocalDate from, LocalDate to) {
        Map<LocalDate, Integer> opsMaxRank = new HashMap<>();
        Map<LocalDate, Set<String>> needDisc = new HashMap<>();
        // Approved signups per (request, date) so a FILLED seat no longer registers as an open need —
        // this is what makes the ＋ "can cover" marker disappear once all the spots are actually taken.
        Map<String, Integer> approvedByReqDate = new HashMap<>();
        for (CoverageSignup s : signupRepo.findByDateBetweenAndStatus(from, to, CoverageSignup.Status.APPROVED)) {
            if (s.getCoverageRequest() != null && s.getCoverageRequest().getId() != null && s.getDate() != null) {
                approvedByReqDate.merge(s.getCoverageRequest().getId() + "|" + s.getDate(), 1, Integer::sum);
            }
        }
        for (CoverageRequest r : requestRepo.findOverlapping(from, to)) {
            if (!CoverageRequest.Status.OPEN.equals(r.getStatus())) continue;
            int req = r.getRequiredCount() == null ? 0 : r.getRequiredCount();
            if (req < 1 || r.getStartDate() == null) continue;
            String rdisc = nz(r.getDiscipline());
            LocalDate end = r.getEndDate() != null ? r.getEndDate() : r.getStartDate();
            LocalDate d = r.getStartDate().isBefore(from) ? from : r.getStartDate();
            for (; !d.isAfter(end) && !d.isAfter(to); d = d.plusDays(1)) {
                if (approvedByReqDate.getOrDefault(r.getId() + "|" + d, 0) >= req) continue;   // seat filled
                if (CoverageRequest.Discipline.OPS.equals(rdisc)) {
                    opsMaxRank.merge(d, CoverageRequest.Position.rank(r.getPosition()), Math::max);
                } else {
                    needDisc.computeIfAbsent(d, k -> new HashSet<>()).add(rdisc);
                }
            }
        }
        return new DayNeeds(opsMaxRank, needDisc);
    }

    private record DayNeeds(Map<LocalDate, Integer> opsMaxRank, Map<LocalDate, Set<String>> needDisc) {}

    /**
     * Active assignments ordered so the first one seen per user deterministically wins: a non-RELIEF
     * assignment beats RELIEF, and within that the most senior (lowest-rank) position wins. Without
     * this, "first active assignment" depended on unspecified DB/JPA row order.
     */
    private List<CrewAssignment> orderedActiveAssignments() {
        List<CrewAssignment> roster = new ArrayList<>(assignmentRepo.findByIsActiveTrue());
        roster.sort(Comparator
                .comparing((CrewAssignment a) -> CrewAssignment.Type.RELIEF.equals(a.getAssignmentType()))
                .thenComparingInt(a -> Integer.parseInt(deriveDiscipline(a.getPosition())[1])));
        return roster;
    }

    /** One user's {discipline, opsRank} from their active roster assignment, or null if not on it. */
    private String[] resolveUserDisciplineRank(Long userId) {
        if (userId == null) return null;
        for (CrewAssignment a : orderedActiveAssignments()) {
            User u = a.getUser();
            if (u != null && userId.equals(u.getId())) return deriveDiscipline(a.getPosition());
        }
        return null;
    }

    /**
     * Whether {@code userId} may cover a need of the given discipline/position on {@code date} — off
     * that day AND qualified by the cover-up hierarchy (an ops person of rank r covers a need position
     * Q when rank(Q) &ge; r; a non-ops need requires the same discipline). The single authoritative
     * write-time gate for the SPECIFIC request, so a stale/forged client can't sign an AO up for a Lead
     * seat even though the day-wide eligibility set would include them for some other need.
     */
    @Transactional(readOnly = true)
    public boolean userCanCover(Long userId, LocalDate date, String discipline, String position) {
        if (userId == null || date == null) return false;
        String[] dr = resolveUserDisciplineRank(userId);
        if (dr == null) return false;   // not on the active roster
        for (ShiftDayDto d : shiftDayService.getRange(date, date)) {
            if (containsUser(d.getDayShift(), userId) || containsUser(d.getNightShift(), userId)) {
                return false;   // working that day — not off
            }
        }
        String needDisc = nz(discipline);
        if (CoverageRequest.Discipline.OPS.equals(needDisc)) {
            return CoverageRequest.Discipline.OPS.equals(dr[0])
                    && CoverageRequest.Position.rank(position) >= Integer.parseInt(dr[1]);
        }
        return needDisc.equals(dr[0]);
    }

    /** Human label for a coverage need, for messages: Lead / CRO / AO / Mechanic / I&C / Manager. */
    private static String coverLabel(String discipline, String position) {
        String disc = nz(discipline);
        if (CoverageRequest.Discipline.MECHANIC.equals(disc)) return "Mechanic";
        if (CoverageRequest.Discipline.IC.equals(disc)) return "I&C";
        if (CoverageRequest.Discipline.MANAGER.equals(disc)) return "Manager";
        String p = position == null ? "" : position.toLowerCase();
        if (p.contains("lead")) return "Lead";
        if (p.contains("control room") || p.equals("cro")) return "CRO";
        if (p.contains("auxiliary") || p.equals("ao")) return "AO";
        return "Operator";
    }

    /** Roster position → {discipline, opsRank}. Lead=0 covers all, CRO=1, AO=2; crafts rank 0. */
    private static String[] deriveDiscipline(String position) {
        String p = position == null ? "" : position.toLowerCase();
        if (p.contains("lead")) return new String[]{CoverageRequest.Discipline.OPS, "0"};
        if (p.contains("control room") || p.equals("cro")) return new String[]{CoverageRequest.Discipline.OPS, "1"};
        if (p.contains("auxiliary") || p.equals("ao")) return new String[]{CoverageRequest.Discipline.OPS, "2"};
        if (p.contains("mechanic")) return new String[]{CoverageRequest.Discipline.MECHANIC, "0"};
        if (p.contains("i&c") || p.equals("ic")) return new String[]{CoverageRequest.Discipline.IC, "0"};
        return new String[]{CoverageRequest.Discipline.MANAGER, "0"};
    }

    private static void collectIds(List<ShiftEntry> list, Set<Long> ids) {
        if (list == null) return;
        for (ShiftEntry e : list) if (e != null && e.getUserId() != null) ids.add(e.getUserId());
    }

    private static boolean containsUser(List<ShiftEntry> list, Long userId) {
        if (list == null || userId == null) return false;
        for (ShiftEntry e : list) if (e != null && userId.equals(e.getUserId())) return true;
        return false;
    }

    @Transactional(readOnly = true)
    public List<CoverageRequestDto> listCoverage(LocalDate from, LocalDate to) {
        List<CoverageRequest> rows = (from != null && to != null)
                ? requestRepo.findOverlapping(from, to)
                : requestRepo.findAll();
        return rows.stream().map(this::toDto).toList();
    }

    public boolean cancelCoverage(Long id) {
        return requestRepo.findById(id).map(r -> {
            r.setStatus(CoverageRequest.Status.CANCELLED);
            r.setDeleted(true);
            requestRepo.save(r);
            // Withdraw any still-active signups so the materialiser stops placing cancelled coverers
            // and they no longer consume open-seat counts on a shared date/shift.
            for (CoverageSignup s : signupRepo.findByCoverageRequest_Id(id)) {
                if (!CoverageSignup.Status.WITHDRAWN.equals(s.getStatus())
                        && !CoverageSignup.Status.REJECTED.equals(s.getStatus())) {
                    s.setStatus(CoverageSignup.Status.WITHDRAWN);
                    signupRepo.save(s);
                }
            }
            rematerializeRange(r.getStartDate(), r.getEndDate());
            return true;
        }).orElse(false);
    }

    /** Cancel all coverage requests tied to a PTO (withdrawing their non-terminal signups) — used to
     *  reconcile PTO reject/re-approve so stale coverage never lingers once the PTO is no longer
     *  APPROVED. No-op if nothing was ever created for it. */
    public void cancelCoverageForPto(Long ptoRequestId) {
        if (ptoRequestId == null) return;
        for (CoverageRequest r : requestRepo.findByPtoRequest_Id(ptoRequestId)) {
            if (!CoverageRequest.Status.CANCELLED.equals(r.getStatus())) {
                cancelCoverage(r.getId());
            }
        }
    }

    // ---- manager: signups ---------------------------------------------------

    @Transactional(readOnly = true)
    public List<CoverageSignupDto> listSignups(Long requestId) {
        return signupRepo.findByCoverageRequest_Id(requestId).stream().map(this::toDto).toList();
    }

    /** All signups over a date range (any status) — the admin grid "Sign-ups" overlay. */
    @Transactional(readOnly = true)
    public List<CoverageSignupDto> listSignups(LocalDate from, LocalDate to) {
        return signupRepo.findByDateBetweenFetch(from, to).stream().map(this::toDto).toList();
    }

    public boolean approveSignup(Long signupId) {
        return signupRepo.findById(signupId).map(s -> {
            if (CoverageSignup.Status.APPROVED.equals(s.getStatus())) return true;   // idempotent
            CoverageRequest req = s.getCoverageRequest();
            Long userId = s.getUser() != null ? s.getUser().getId() : null;

            // Authoritative eligibility gate for THIS need's discipline/position — the Lead>CRO>AO +
            // discipline hierarchy governs the write, not just the "who can cover" display list.
            if (userId != null && s.getDate() != null && req != null
                    && !userCanCover(userId, s.getDate(), req.getDiscipline(), req.getPosition())) {
                throw new IllegalStateException("User " + userId + " is not eligible to cover this "
                        + coverLabel(req.getDiscipline(), req.getPosition()) + " seat on " + s.getDate());
            }

            // Don't let the materialiser silently pull someone off a conflicting base shift — if
            // they're already scheduled a different shift that day, the approval must be rejected
            // (or the coverer reassigned) rather than moved without anyone deciding to move them.
            if (userId != null && s.getDate() != null && s.getShift() != null) {
                String baseShift = materialisation.scheduledShiftForUser(userId, s.getDate());
                if (baseShift != null && !baseShift.equals(s.getShift())) {
                    throw new IllegalStateException("User " + userId + " is already scheduled for the "
                            + baseShift + " shift on " + s.getDate() + "; cannot approve as " + s.getShift()
                            + " coverage");
                }
            }

            // One seat per person per day: don't approve a second coverage for a user already approved
            // to cover a different need that date (defends against double signups created before the
            // signUp cross-request guard, which the materialiser would otherwise collapse into one).
            if (userId != null && s.getDate() != null) {
                boolean alreadyCovering = signupRepo.findByUser_IdAndDate(userId, s.getDate()).stream()
                        .anyMatch(o -> !o.getId().equals(s.getId())
                                && CoverageSignup.Status.APPROVED.equals(o.getStatus()));
                if (alreadyCovering) {
                    throw new IllegalStateException("User " + userId + " is already approved to cover "
                            + s.getDate() + "; cannot approve a second seat that day");
                }
            }

            // Don't overstaff: only approve while a seat remains for this request on this day.
            long approvedBefore = 0;
            if (req != null && s.getDate() != null && req.getRequiredCount() != null) {
                approvedBefore = signupRepo.countByCoverageRequest_IdAndDateAndStatus(
                        req.getId(), s.getDate(), CoverageSignup.Status.APPROVED);
                if (approvedBefore >= req.getRequiredCount()) {
                    throw new IllegalStateException("No open seat remaining for " + s.getDate());
                }
            }
            s.setStatus(CoverageSignup.Status.APPROVED);
            User approver = currentUser();
            if (approver != null) s.setApprovedBy(approver);
            s.setApprovedAt(LocalDateTime.now());
            signupRepo.save(s);
            recomputeFilled(req);

            // Seat just filled? Auto-reject the remaining PENDING signups for the same request/day so
            // they don't linger as phantom demand, and best-effort notify the ones who missed out.
            if (req != null && s.getDate() != null && req.getRequiredCount() != null
                    && approvedBefore + 1 >= req.getRequiredCount()) {
                for (CoverageSignup other : signupRepo.findByCoverageRequest_IdAndDateAndStatus(
                        req.getId(), s.getDate(), CoverageSignup.Status.PENDING)) {
                    if (other.getId().equals(s.getId())) continue;
                    other.setStatus(CoverageSignup.Status.REJECTED);
                    signupRepo.save(other);
                    try {
                        notificationService.sendSignupAutoRejected(other.getUser(), other.getDate(), other.getShift());
                    } catch (Exception e) {
                        log.warn("[ScheduleV2] Auto-reject notification failed (non-fatal) for signup {}: {}",
                                other.getId(), e.getMessage());
                    }
                }
            }
            rematerializeRange(s.getDate(), s.getDate());
            return true;
        }).orElse(false);
    }

    public boolean rejectSignup(Long signupId) {
        return signupRepo.findById(signupId).map(s -> {
            s.setStatus(CoverageSignup.Status.REJECTED);
            signupRepo.save(s);
            recomputeFilled(s.getCoverageRequest());
            rematerializeRange(s.getDate(), s.getDate());
            return true;
        }).orElse(false);
    }

    // ---- operator -----------------------------------------------------------

    /**
     * Per-day open-seat counts across the range — the chip data. Only days with demand are emitted.
     *
     * <p>Required/approved are bucketed by (shift, discipline, position) before subtracting so an
     * approved signup for one discipline can never mask an open seat for a different one (e.g. an
     * approved Mechanic can't hide an open OPS seat on the same day/shift) — the totals below are the
     * sum of each bucket's own {@code max(0, required - approved)}, not a single range-wide subtraction.
     */
    @Transactional(readOnly = true)
    public List<CoverageSeatSummaryDto> seatSummary(LocalDate from, LocalDate to) {
        List<CoverageSeatSummaryDto> out = new ArrayList<>();
        if (from == null || to == null || to.isBefore(from)) return out;

        List<CoverageRequest> reqs = requestRepo.findOverlapping(from, to).stream()
                .filter(r -> CoverageRequest.Status.OPEN.equals(r.getStatus()))
                .toList();
        List<CoverageSignup> approved = signupRepo.findByDateBetweenAndStatus(from, to, CoverageSignup.Status.APPROVED);

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            Map<String, Integer> reqByBucket = new HashMap<>();
            for (CoverageRequest r : reqs) {
                if (!covers(r, d)) continue;
                int req = r.getRequiredCount() == null ? 0 : r.getRequiredCount();
                if (req <= 0) continue;
                reqByBucket.merge(bucketKey(r.getShift(), r.getDiscipline(), r.getPosition()), req, Integer::sum);
            }
            if (reqByBucket.isEmpty()) continue;

            final LocalDate day = d;
            Map<String, Integer> approvedByBucket = new HashMap<>();
            for (CoverageSignup s : approved) {
                if (!day.equals(s.getDate())) continue;
                CoverageRequest sr = s.getCoverageRequest();
                String disc = sr != null ? sr.getDiscipline() : null;
                String pos = sr != null ? sr.getPosition() : null;
                approvedByBucket.merge(bucketKey(s.getShift(), disc, pos), 1, Integer::sum);
            }

            int dayReq = 0, dayOpen = 0, nightReq = 0, nightOpen = 0;
            for (Map.Entry<String, Integer> e : reqByBucket.entrySet()) {
                int required = e.getValue();
                int bucketApproved = approvedByBucket.getOrDefault(e.getKey(), 0);
                int open = Math.max(0, required - bucketApproved);
                if (e.getKey().startsWith(CoverageRequest.ShiftType.NIGHT + "|")) {
                    nightReq += required; nightOpen += open;
                } else {
                    dayReq += required; dayOpen += open;
                }
            }
            out.add(CoverageSeatSummaryDto.builder()
                    .date(d)
                    .dayRequired(dayReq).dayOpen(dayOpen)
                    .nightRequired(nightReq).nightOpen(nightOpen)
                    .build());
        }
        return out;
    }

    /** (shift, discipline, position) bucket key — position only matters for OPS. */
    private static String bucketKey(String shift, String discipline, String position) {
        String sh = CoverageRequest.ShiftType.NIGHT.equals(shift)
                ? CoverageRequest.ShiftType.NIGHT : CoverageRequest.ShiftType.DAY;
        String disc = nz(discipline);
        String pos = CoverageRequest.Discipline.OPS.equals(disc) && position != null ? position : "";
        return sh + "|" + disc + "|" + pos;
    }

    /** OPEN coverage requests covering a single day, each with its remaining open seats for that day. */
    @Transactional(readOnly = true)
    public List<CoverageRequestDto> openForDate(LocalDate date) {
        List<CoverageRequestDto> out = new ArrayList<>();
        for (CoverageRequest r : requestRepo.findOverlapping(date, date)) {
            if (!CoverageRequest.Status.OPEN.equals(r.getStatus())) continue;
            int req = r.getRequiredCount() == null ? 0 : r.getRequiredCount();
            int approved = (int) signupRepo.countByCoverageRequest_IdAndDateAndStatus(
                    r.getId(), date, CoverageSignup.Status.APPROVED);
            CoverageRequestDto d = toDto(r);
            d.setDate(date);
            d.setOpenForDate(Math.max(0, req - approved));
            out.add(d);
        }
        return out;
    }

    /**
     * The open needs on {@code date} that THIS user may actually pick up — off that day AND qualified
     * by the cover-up hierarchy (an ops person of rank r covers a need position Q when rank(Q) &ge; r;
     * a non-ops need requires the same discipline). This is the operator self-service list: the PWA
     * shows only what the signed-in person can cover, and each row carries its discipline/position so
     * the card can be labelled (Lead / CRO / AO / Mechanic / I&amp;C / Manager) instead of a bare "Day shift".
     */
    @Transactional(readOnly = true)
    public List<CoverageRequestDto> openForDateForUser(LocalDate date, User user) {
        if (date == null || user == null || user.getId() == null) return List.of();
        List<CoverageRequestDto> open = openForDate(date).stream()
                .filter(r -> r.getOpenForDate() != null && r.getOpenForDate() > 0).toList();
        if (open.isEmpty()) return open;

        String[] dr = resolveUserDisciplineRank(user.getId());
        if (dr == null) return List.of();   // not on the active roster — can't cover anything
        // Working that day (in either shift bucket) means they're not off, so can't cover.
        for (ShiftDayDto d : shiftDayService.getRange(date, date)) {
            if (containsUser(d.getDayShift(), user.getId()) || containsUser(d.getNightShift(), user.getId())) {
                return List.of();
            }
        }
        String myDisc = dr[0];
        int myRank = Integer.parseInt(dr[1]);

        List<CoverageRequestDto> out = new ArrayList<>();
        for (CoverageRequestDto r : open) {
            String needDisc = nz(r.getDiscipline());
            boolean ok = CoverageRequest.Discipline.OPS.equals(needDisc)
                    ? (CoverageRequest.Discipline.OPS.equals(myDisc)
                            && CoverageRequest.Position.rank(r.getPosition()) >= myRank)
                    : needDisc.equals(myDisc);
            if (ok) out.add(r);
        }
        return out;
    }

    /**
     * One-click sign-up from the schedule grid: pick the best open need this user can cover on
     * {@code date} (preferring the seat matching their own position) and sign them up. Drives the
     * "click the ＋ next to your name to pick up the shift" flow.
     */
    public CoverageSignupDto quickSignUp(LocalDate date, String shift, User user, String via) {
        if (user == null || user.getId() == null) throw new IllegalStateException("Not signed in");
        List<CoverageRequestDto> eligible = openForDateForUser(date, user);
        // Optional shift filter — the grid chooser passes DAY/NIGHT when both are open that day.
        String want = CoverageRequest.ShiftType.NIGHT.equals(shift) ? CoverageRequest.ShiftType.NIGHT
                : CoverageRequest.ShiftType.DAY.equals(shift) ? CoverageRequest.ShiftType.DAY : null;
        if (want != null) {
            eligible = eligible.stream().filter(r -> want.equals(r.getShift())).toList();
        }
        if (eligible.isEmpty()) {
            String w = want == null ? "" : (CoverageRequest.ShiftType.NIGHT.equals(want) ? "night " : "day ");
            throw new IllegalStateException("There is no " + w + "coverage you can pick up on " + date);
        }
        String[] dr = resolveUserDisciplineRank(user.getId());
        Integer myRank = dr != null ? Integer.valueOf(dr[1]) : null;
        // Prefer the seat matching the person's own position; otherwise the first eligible need.
        CoverageRequestDto pick = eligible.stream()
                .filter(r -> myRank != null && CoverageRequest.Discipline.OPS.equals(nz(r.getDiscipline()))
                        && CoverageRequest.Position.rank(r.getPosition()) == myRank)
                .findFirst().orElse(eligible.get(0));
        return signUp(pick.getId(), date, user, via);
    }

    /**
     * Withdraw a NOT-yet-approved signup — lets an operator change or remove their own pending pick-up.
     * Only the signup's owner may withdraw (via a step-up swap this is the PIN'd operator); an APPROVED
     * signup is locked (a manager must change it). Re-materialises the affected day.
     */
    public boolean withdrawSignup(Long signupId, User requester) {
        return signupRepo.findById(signupId).map(s -> {
            if (s.getUser() == null || requester == null || requester.getId() == null
                    || !requester.getId().equals(s.getUser().getId())) {
                throw new IllegalStateException("You can only change your own sign-up");
            }
            if (CoverageSignup.Status.APPROVED.equals(s.getStatus())) {
                throw new IllegalStateException("This is already approved — ask a manager to change it");
            }
            if (CoverageSignup.Status.WITHDRAWN.equals(s.getStatus())
                    || CoverageSignup.Status.REJECTED.equals(s.getStatus())) {
                return true;   // already gone — idempotent
            }
            s.setStatus(CoverageSignup.Status.WITHDRAWN);
            signupRepo.save(s);
            recomputeFilled(s.getCoverageRequest());
            rematerializeRange(s.getDate(), s.getDate());
            return true;
        }).orElse(false);
    }

    /**
     * Sign a user up for one open seat on one day. Creates a PENDING signup (manager approves later).
     * Guards against a duplicate active signup for the same user+request+day.
     *
     * @throws IllegalArgumentException if the request is missing / cancelled / date out of range
     * @throws IllegalStateException    if the user already has an active signup for that day, or is
     *                                   not an eligible coverer for that day
     */
    public CoverageSignupDto signUp(Long coverageRequestId, LocalDate date, User user, String via) {
        CoverageRequest r = requestRepo.findById(coverageRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Coverage request not found"));
        if (!CoverageRequest.Status.OPEN.equals(r.getStatus())) {
            throw new IllegalArgumentException("Coverage request is not open");
        }
        if (date == null || date.isBefore(r.getStartDate()) || date.isAfter(r.getEndDate())) {
            throw new IllegalArgumentException("Date is outside the coverage window");
        }
        // One coverage seat per person per day — a person works a single shift, so an active signup on
        // ANY request that day (not just this one) blocks a second. This prevents a user filling both a
        // DAY and a NIGHT need on the same date (separate requests), which the materialiser would then
        // silently collapse into one placement while seatSummary counted both seats filled.
        if (user != null && user.getId() != null) {
            boolean dup = signupRepo.findByUser_IdAndDate(user.getId(), date).stream().anyMatch(s ->
                    !CoverageSignup.Status.WITHDRAWN.equals(s.getStatus())
                            && !CoverageSignup.Status.REJECTED.equals(s.getStatus()));
            if (dup) throw new IllegalStateException("Already signed up to cover this day");
        }

        // Authoritative eligibility gate for THIS specific need (discipline + position), enforced here
        // so the write can't be made by an ineligible user via a stale/forged client-side list — an AO
        // can't take a Lead seat even though they're off + eligible for some AO need the same day.
        if (user != null && user.getId() != null
                && !userCanCover(user.getId(), date, r.getDiscipline(), r.getPosition())) {
            throw new IllegalStateException("You are not eligible to cover this "
                    + coverLabel(r.getDiscipline(), r.getPosition()) + " seat on " + date);
        }

        CoverageSignup s = new CoverageSignup();
        s.setCoverageRequest(r);
        s.setUser(user);
        s.setDate(date);
        s.setShift(r.getShift());
        s.setStatus(CoverageSignup.Status.PENDING);
        s.setSignedUpVia(via);
        return toDto(signupRepo.save(s));
    }

    // ---- helpers ------------------------------------------------------------

    private void recomputeFilled(CoverageRequest r) {
        if (r == null) return;
        long approved = signupRepo.findByCoverageRequest_IdAndStatus(r.getId(), CoverageSignup.Status.APPROVED).size();
        r.setFilledCount((int) approved);
        requestRepo.save(r);
    }

    /** Re-materialise just the touched window — avoids rebuilding the whole horizon for one signup
     *  approval/rejection or one request cancellation. */
    private void rematerializeRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) return;
        LocalDate lo = from.isAfter(to) ? to : from;
        LocalDate hi = from.isAfter(to) ? from : to;
        try {
            materialisation.materializeRange(lo, hi);
        } catch (Exception e) {
            log.warn("[ScheduleV2] Coverage re-materialisation failed (change committed): {}", e.getMessage());
        }
    }

    private static boolean covers(CoverageRequest r, LocalDate d) {
        return r.getStartDate() != null && !d.isBefore(r.getStartDate())
                && r.getEndDate() != null && !d.isAfter(r.getEndDate());
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud)) return null;
        return userRepo.findById(cud.getId()).orElse(null);
    }

    private String displayName(User u) {
        if (u == null) return null;
        if (u.getName() != null && !u.getName().isBlank()) return u.getName();
        String first = u.getFirstName() == null ? "" : u.getFirstName();
        String last = u.getLastName() == null ? "" : u.getLastName();
        String full = (first + " " + last).trim();
        return full.isBlank() ? ("User " + u.getId()) : full;
    }

    private CoverageRequestDto toDto(CoverageRequest r) {
        return CoverageRequestDto.builder()
                .id(r.getId())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .shift(r.getShift())
                .discipline(r.getDiscipline())
                .position(r.getPosition())
                .requiredCount(r.getRequiredCount())
                .reason(r.getReason())
                .status(r.getStatus())
                .approvedCount(r.getFilledCount())
                .ptoRequestId(r.getPtoRequest() != null ? r.getPtoRequest().getId() : null)
                .build();
    }

    private CoverageSignupDto toDto(CoverageSignup s) {
        return CoverageSignupDto.builder()
                .id(s.getId())
                .coverageRequestId(s.getCoverageRequest() != null ? s.getCoverageRequest().getId() : null)
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .userName(displayName(s.getUser()))
                .date(s.getDate())
                .shift(s.getShift())
                .status(s.getStatus())
                .signedUpVia(s.getSignedUpVia())
                .approvedByUserId(s.getApprovedBy() != null ? s.getApprovedBy().getId() : null)
                .approvedByName(displayName(s.getApprovedBy()))
                .approvedAt(s.getApprovedAt())
                .build();
    }
}
