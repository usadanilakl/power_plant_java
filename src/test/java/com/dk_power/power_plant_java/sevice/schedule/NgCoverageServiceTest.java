package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSeatSummaryDto;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CoverageRequestRepo;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Open-seat arithmetic is the contract behind the coverage chips and the manager list, so it gets
 * its own tests: required-minus-approved per (date, shift), CANCELLED requests excluded, and the
 * per-day operator query. Also pins the duplicate-signup guard.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NgCoverageService seat math")
class NgCoverageServiceTest {

    private static final LocalDate D0 = LocalDate.of(2026, 8, 1);

    @Mock private CoverageRequestRepo requestRepo;
    @Mock private CoverageSignupRepo signupRepo;
    @Mock private PtoRequestRepo ptoRepo;
    @Mock private UserRepo userRepo;
    @Mock private ScheduleMaterialisationService materialisation;

    private NgCoverageService service;

    @BeforeEach
    void setUp() {
        service = new NgCoverageService(requestRepo, signupRepo, ptoRepo, userRepo, materialisation);
    }

    @Test
    @DisplayName("seatSummary = required minus approved per day, per shift, over the range")
    void seatSummarySubtractsApproved() {
        CoverageRequest r = coverage(1L, D0, D0.plusDays(2), "DAY", 2, "OPEN");
        when(requestRepo.findOverlapping(D0, D0.plusDays(2))).thenReturn(List.of(r));
        CoverageSignup approvedOnD0 = signup(D0, "DAY", "APPROVED");
        when(signupRepo.findByDateBetweenAndStatus(D0, D0.plusDays(2), "APPROVED")).thenReturn(List.of(approvedOnD0));

        List<CoverageSeatSummaryDto> out = service.seatSummary(D0, D0.plusDays(2));

        assertThat(out).hasSize(3);
        assertThat(out.get(0).getDate()).isEqualTo(D0);
        assertThat(out.get(0).getDayRequired()).isEqualTo(2);
        assertThat(out.get(0).getDayOpen()).isEqualTo(1);   // 2 required − 1 approved
        assertThat(out.get(1).getDayOpen()).isEqualTo(2);   // nothing approved on day 2
        assertThat(out.get(0).getNightRequired()).isZero();
        assertThat(out.get(0).getNightOpen()).isZero();
    }

    @Test
    @DisplayName("seatSummary ignores CANCELLED requests — no phantom demand")
    void seatSummaryIgnoresCancelled() {
        CoverageRequest cancelled = coverage(2L, D0, D0, "DAY", 5, "CANCELLED");
        when(requestRepo.findOverlapping(D0, D0)).thenReturn(List.of(cancelled));

        assertThat(service.seatSummary(D0, D0)).isEmpty();
    }

    @Test
    @DisplayName("openForDate reports a request's remaining seats for that specific day")
    void openForDateComputesRemaining() {
        CoverageRequest r = coverage(5L, D0, D0, "NIGHT", 3, "OPEN");
        when(requestRepo.findOverlapping(D0, D0)).thenReturn(List.of(r));
        when(signupRepo.countByCoverageRequest_IdAndDateAndStatus(eq(5L), eq(D0), eq("APPROVED"))).thenReturn(1L);

        List<CoverageRequestDto> out = service.openForDate(D0);

        assertThat(out).hasSize(1);
        assertThat(out.get(0).getOpenForDate()).isEqualTo(2);   // 3 required − 1 approved
    }

    @Test
    @DisplayName("signUp rejects a duplicate active signup for the same user + day")
    void signUpBlocksDuplicate() {
        User u = new User();
        u.setId(9L);
        CoverageRequest r = coverage(7L, D0, D0.plusDays(1), "DAY", 2, "OPEN");
        when(requestRepo.findById(7L)).thenReturn(Optional.of(r));
        CoverageSignup existing = new CoverageSignup();
        existing.setUser(u);
        existing.setDate(D0);
        existing.setStatus("PENDING");
        when(signupRepo.findByCoverageRequest_Id(7L)).thenReturn(List.of(existing));

        assertThatThrownBy(() -> service.signUp(7L, D0, u, "PWA"))
                .isInstanceOf(IllegalStateException.class);
    }

    // ---- fixtures -----------------------------------------------------------

    private static CoverageRequest coverage(long id, LocalDate start, LocalDate end,
                                            String shift, int required, String status) {
        CoverageRequest r = new CoverageRequest();
        r.setId(id);
        r.setStartDate(start);
        r.setEndDate(end);
        r.setShift(shift);
        r.setRequiredCount(required);
        r.setStatus(status);
        return r;
    }

    private static CoverageSignup signup(LocalDate date, String shift, String status) {
        CoverageSignup s = new CoverageSignup();
        s.setDate(date);
        s.setShift(shift);
        s.setStatus(status);
        return s;
    }
}
