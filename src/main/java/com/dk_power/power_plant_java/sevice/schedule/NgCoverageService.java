package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSeatSummaryDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSignupDto;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CoverageRequestRepo;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
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
import java.util.List;

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
    private final ScheduleMaterialisationService materialisation;

    // ---- manager: coverage requests ----------------------------------------

    public CoverageRequestDto createCoverage(CoverageRequestDto dto) {
        if (dto.getStartDate() == null) throw new IllegalArgumentException("startDate is required");
        LocalDate end = dto.getEndDate() != null ? dto.getEndDate() : dto.getStartDate();
        if (end.isBefore(dto.getStartDate())) throw new IllegalArgumentException("endDate cannot be before startDate");
        CoverageRequest r = new CoverageRequest();
        r.setStartDate(dto.getStartDate());
        r.setEndDate(end);
        r.setShift(dto.getShift());
        r.setRequiredCount(dto.getRequiredCount() == null || dto.getRequiredCount() < 1 ? 1 : dto.getRequiredCount());
        r.setReason(dto.getReason() == null ? CoverageRequest.Reason.MANUAL : dto.getReason());
        r.setStatus(CoverageRequest.Status.OPEN);
        r.setFilledCount(0);
        if (dto.getPtoRequestId() != null) ptoRepo.findById(dto.getPtoRequestId()).ifPresent(r::setPtoRequest);
        return toDto(requestRepo.save(r));
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
            rematerialize();
            return true;
        }).orElse(false);
    }

    // ---- manager: signups ---------------------------------------------------

    @Transactional(readOnly = true)
    public List<CoverageSignupDto> listSignups(Long requestId) {
        return signupRepo.findByCoverageRequest_Id(requestId).stream().map(this::toDto).toList();
    }

    public boolean approveSignup(Long signupId) {
        return signupRepo.findById(signupId).map(s -> {
            if (CoverageSignup.Status.APPROVED.equals(s.getStatus())) return true;   // idempotent
            CoverageRequest req = s.getCoverageRequest();
            // Don't overstaff: only approve while a seat remains for this request on this day.
            if (req != null && s.getDate() != null && req.getRequiredCount() != null) {
                long approved = signupRepo.countByCoverageRequest_IdAndDateAndStatus(
                        req.getId(), s.getDate(), CoverageSignup.Status.APPROVED);
                if (approved >= req.getRequiredCount()) {
                    throw new IllegalStateException("No open seat remaining for " + s.getDate());
                }
            }
            s.setStatus(CoverageSignup.Status.APPROVED);
            User approver = currentUser();
            if (approver != null) s.setApprovedBy(approver);
            s.setApprovedAt(LocalDateTime.now());
            signupRepo.save(s);
            recomputeFilled(req);
            rematerialize();
            return true;
        }).orElse(false);
    }

    public boolean rejectSignup(Long signupId) {
        return signupRepo.findById(signupId).map(s -> {
            s.setStatus(CoverageSignup.Status.REJECTED);
            signupRepo.save(s);
            recomputeFilled(s.getCoverageRequest());
            rematerialize();
            return true;
        }).orElse(false);
    }

    // ---- operator -----------------------------------------------------------

    /** Per-day open-seat counts across the range — the chip data. Only days with demand are emitted. */
    @Transactional(readOnly = true)
    public List<CoverageSeatSummaryDto> seatSummary(LocalDate from, LocalDate to) {
        List<CoverageSeatSummaryDto> out = new ArrayList<>();
        if (from == null || to == null || to.isBefore(from)) return out;

        List<CoverageRequest> reqs = requestRepo.findOverlapping(from, to).stream()
                .filter(r -> CoverageRequest.Status.OPEN.equals(r.getStatus()))
                .toList();
        List<CoverageSignup> approved = signupRepo.findByDateBetweenAndStatus(from, to, CoverageSignup.Status.APPROVED);

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            int dayReq = 0, nightReq = 0;
            for (CoverageRequest r : reqs) {
                if (!covers(r, d)) continue;
                int req = r.getRequiredCount() == null ? 0 : r.getRequiredCount();
                if (CoverageRequest.ShiftType.NIGHT.equals(r.getShift())) nightReq += req;
                else dayReq += req;
            }
            if (dayReq == 0 && nightReq == 0) continue;
            final LocalDate day = d;
            int dayApproved = (int) approved.stream()
                    .filter(s -> day.equals(s.getDate()) && !CoverageRequest.ShiftType.NIGHT.equals(s.getShift())).count();
            int nightApproved = (int) approved.stream()
                    .filter(s -> day.equals(s.getDate()) && CoverageRequest.ShiftType.NIGHT.equals(s.getShift())).count();
            out.add(CoverageSeatSummaryDto.builder()
                    .date(d)
                    .dayRequired(dayReq).dayOpen(Math.max(0, dayReq - dayApproved))
                    .nightRequired(nightReq).nightOpen(Math.max(0, nightReq - nightApproved))
                    .build());
        }
        return out;
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
     * Sign a user up for one open seat on one day. Creates a PENDING signup (manager approves later).
     * Guards against a duplicate active signup for the same user+request+day.
     *
     * @throws IllegalArgumentException if the request is missing / cancelled / date out of range
     * @throws IllegalStateException    if the user already has an active signup for that day
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
        boolean dup = signupRepo.findByCoverageRequest_Id(coverageRequestId).stream().anyMatch(s ->
                s.getUser() != null && user.getId().equals(s.getUser().getId())
                        && date.equals(s.getDate())
                        && !CoverageSignup.Status.WITHDRAWN.equals(s.getStatus())
                        && !CoverageSignup.Status.REJECTED.equals(s.getStatus()));
        if (dup) throw new IllegalStateException("Already signed up for this day");

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

    private void rematerialize() {
        try {
            materialisation.materializeDefaultHorizon();
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
