package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewPattern;
import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleDayOverrideRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Exercises the full per-day chain (pattern placement → coverage → PTO → override → event flags)
 * through the real service with mocked repos, so the wiring — not just the isolated math — is
 * verified. {@link SchedulePatternMathTest} covers the rotation arithmetic on its own.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleMaterialisationService")
class ScheduleMaterialisationServiceTest {

    /** Epoch day 0 → cycleDay 0 with offset 0, so grid day-0 cells apply. */
    private static final LocalDate DAY0 = LocalDate.ofEpochDay(0);

    @Mock private CrewAssignmentRepo assignmentRepo;
    @Mock private ScheduleEventRepo eventRepo;
    @Mock private PtoRequestRepo ptoRepo;
    @Mock private CoverageSignupRepo signupRepo;
    @Mock private ScheduleDayOverrideRepo overrideRepo;
    @Mock private ShiftDayService shiftDayService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ScheduleMaterialisationService service;

    @BeforeEach
    void setUp() {
        service = new ScheduleMaterialisationService(
                assignmentRepo, eventRepo, ptoRepo, signupRepo, overrideRepo, shiftDayService, objectMapper);
        ReflectionTestUtils.setField(service, "v2Enabled", true);
        ReflectionTestUtils.setField(service, "v2Rollback", false);
        ReflectionTestUtils.setField(service, "horizonDays", 180);
        ReflectionTestUtils.setField(service, "backfillDays", 7);
    }

    @Test
    @DisplayName("no-ops entirely and touches nothing when the flag is off")
    void disabledFlagIsInert() {
        ReflectionTestUtils.setField(service, "v2Enabled", false);
        assertThat(service.materializeRange(DAY0, DAY0)).isZero();
        verifyNoInteractions(assignmentRepo, eventRepo, ptoRepo, signupRepo, overrideRepo, shiftDayService);
    }

    @Test
    @DisplayName("places a LEAD onto the day shift per the grid's day-0 cell")
    void leadPlacedOnDayShift() {
        User u = user(1L, "Kody Ziegler");
        when(assignmentRepo.findActiveOverlapping(any(), any()))
                .thenReturn(List.of(assignment(u, crewA(), "LEAD")));

        service.materializeRange(DAY0, DAY0);

        ArgumentCaptor<List<ShiftEntry>> dayCap = listCaptor();
        verify(shiftDayService).applyMaterializedDay(eq(DAY0), dayCap.capture(),
                any(), any(), any(), any(), any(), any(), any(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(dayCap.getValue()).extracting(ShiftEntry::getUserId).containsExactly(1L);
    }

    @Test
    @DisplayName("places an AO onto the night shift per the grid's day-0 cell (role-differentiated)")
    void aoPlacedOnNightShift() {
        User u = user(2L, "Jane Doe");
        when(assignmentRepo.findActiveOverlapping(any(), any()))
                .thenReturn(List.of(assignment(u, crewA(), "AO")));

        service.materializeRange(DAY0, DAY0);

        ArgumentCaptor<List<ShiftEntry>> dayCap = listCaptor();
        ArgumentCaptor<List<ShiftEntry>> nightCap = listCaptor();
        verify(shiftDayService).applyMaterializedDay(eq(DAY0), dayCap.capture(), nightCap.capture(),
                any(), any(), any(), any(), any(), any(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(dayCap.getValue()).isEmpty();
        assertThat(nightCap.getValue()).extracting(ShiftEntry::getUserId).containsExactly(2L);
    }

    @Test
    @DisplayName("approved PTO moves the person out of their shift and into the PTO bucket")
    void approvedPtoMovesToPtoBucket() {
        User u = user(1L, "Kody Ziegler");
        when(assignmentRepo.findActiveOverlapping(any(), any()))
                .thenReturn(List.of(assignment(u, crewA(), "LEAD")));   // would be on DAY
        PtoRequest pto = new PtoRequest();
        pto.setUser(u);
        pto.setStartDate(DAY0.minusDays(1));
        pto.setEndDate(DAY0.plusDays(1));
        pto.setStatus(PtoRequest.Status.APPROVED);
        when(ptoRepo.findApprovedOverlapping(any(), any())).thenReturn(List.of(pto));

        service.materializeRange(DAY0, DAY0);

        ArgumentCaptor<List<ShiftEntry>> dayCap = listCaptor();
        ArgumentCaptor<List<ShiftEntry>> ptoCap = listCaptor();
        verify(shiftDayService).applyMaterializedDay(eq(DAY0), dayCap.capture(), any(), any(),
                ptoCap.capture(), any(), any(), any(), any(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(dayCap.getValue()).isEmpty();
        assertThat(ptoCap.getValue()).extracting(ShiftEntry::getUserId).containsExactly(1L);
    }

    @Test
    @DisplayName("folds overlapping events into eventFlags even on a day with no staff")
    void eventFlagsFoldedIn() {
        ScheduleEvent holiday = new ScheduleEvent();
        holiday.setEventType(ScheduleEvent.Type.HOLIDAY);
        holiday.setTitle("Independence Day");
        holiday.setStartDate(DAY0);
        holiday.setEndDate(DAY0);
        when(eventRepo.findOverlapping(any(), any())).thenReturn(List.of(holiday));

        service.materializeRange(DAY0, DAY0);

        ArgumentCaptor<String> flagsCap = ArgumentCaptor.forClass(String.class);
        verify(shiftDayService).applyMaterializedDay(eq(DAY0), any(), any(), any(), any(), any(),
                any(), any(), flagsCap.capture(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(flagsCap.getValue()).contains("HOLIDAY").contains("Independence Day");
    }

    @Test
    @DisplayName("leaves a day with no v2 opinion untouched (never blanks a ShiftDay)")
    void emptyDayIsNotWritten() {
        // All repos return empty (Mockito default for collections); no events.
        service.materializeRange(DAY0, DAY0);
        verify(shiftDayService, never()).applyMaterializedDay(any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any());
    }

    // ---- fixtures -----------------------------------------------------------

    private User user(long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        return u;
    }

    /** Crew A: cycle 8, day-0 LEAD=D and AO=N (only day-0 cells needed for DAY0 tests). */
    private CrewPattern crewA() {
        CrewPattern c = new CrewPattern();
        c.setId(10L);
        c.setName("Crew A");
        c.setPatternLengthDays(8);
        c.setIsActive(true);
        List<PatternCell> cells = List.of(
                PatternCell.builder().dayIndex(0).role("LEAD").shift("D").build(),
                PatternCell.builder().dayIndex(0).role("AO").shift("N").build());
        try {
            c.setPatternCells(objectMapper.writeValueAsString(cells));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        return c;
    }

    private CrewAssignment assignment(User u, CrewPattern crew, String role) {
        CrewAssignment a = new CrewAssignment();
        a.setUser(u);
        a.setCrew(crew);
        a.setRole(role);
        a.setPatternOffsetDays(0);
        a.setIsActive(true);
        return a;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static ArgumentCaptor<List<ShiftEntry>> listCaptor() {
        return ArgumentCaptor.forClass((Class) List.class);
    }
}
