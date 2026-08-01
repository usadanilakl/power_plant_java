package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.schedule.Crew;
import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.entities.schedule.CrewRotation;
import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.repository.schedule.CrewRepo;
import com.dk_power.power_plant_java.repository.schedule.OnCallRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.schedule.ReliefRotationRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleDayOverrideRepo;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
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
 * Exercises the crew-level placement chain through the real service with mocked repos: ROTATING
 * (crew rotation), FIXED (non-rotating), RELIEF (not scheduled), PTO, and event flags.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleMaterialisationService")
class ScheduleMaterialisationServiceTest {

    /** Epoch day 0 → cycleDay 0 with offset 0. */
    private static final LocalDate DAY0 = LocalDate.ofEpochDay(0);

    @Mock private CrewAssignmentRepo assignmentRepo;
    @Mock private ScheduleEventRepo eventRepo;
    @Mock private PtoRequestRepo ptoRepo;
    @Mock private CoverageSignupRepo signupRepo;
    @Mock private ScheduleDayOverrideRepo overrideRepo;
    @Mock private OnCallRotationRepo onCallRepo;
    @Mock private ReliefRotationRepo reliefRepo;
    @Mock private CrewRepo crewRepo;
    @Mock private UserRepo userRepo;
    @Mock private ShiftDayService shiftDayService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ScheduleMaterialisationService service;

    @BeforeEach
    void setUp() {
        service = new ScheduleMaterialisationService(
                assignmentRepo, eventRepo, ptoRepo, signupRepo, overrideRepo,
                onCallRepo, reliefRepo, crewRepo, userRepo, shiftDayService, objectMapper);
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
    @DisplayName("ROTATING assignment places the person on the crew rotation's shift, with position")
    void rotatingPlacesWholeCrewShift() {
        User u = user(1L, "Kody Ziegler");
        when(assignmentRepo.findActiveOverlapping(any(), any()))
                .thenReturn(List.of(rotating(u, crewA(), "LEAD")));

        service.materializeRange(DAY0, DAY0);

        ArgumentCaptor<List<ShiftEntry>> dayCap = listCaptor();
        verify(shiftDayService).applyMaterializedDay(eq(DAY0), dayCap.capture(),
                any(), any(), any(), any(), any(), any(), any(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(dayCap.getValue()).hasSize(1);
        assertThat(dayCap.getValue().get(0).getUserId()).isEqualTo(1L);
        assertThat(dayCap.getValue().get(0).getPosition()).isEqualTo("LEAD");
    }

    @Test
    @DisplayName("FIXED (non-rotating) assignment places the person on its fixed shift")
    void fixedPlacesOnFixedShift() {
        User u = user(2L, "Day Lead");
        CrewAssignment a = new CrewAssignment();
        a.setUser(u);
        a.setAssignmentType(CrewAssignment.Type.FIXED);
        a.setFixedShift(CrewRotation.Shift.NIGHT);
        a.setPosition("AO");
        a.setIsActive(true);
        when(assignmentRepo.findActiveOverlapping(any(), any())).thenReturn(List.of(a));

        service.materializeRange(DAY0, DAY0);

        ArgumentCaptor<List<ShiftEntry>> dayCap = listCaptor();
        ArgumentCaptor<List<ShiftEntry>> nightCap = listCaptor();
        verify(shiftDayService).applyMaterializedDay(eq(DAY0), dayCap.capture(), nightCap.capture(),
                any(), any(), any(), any(), any(), any(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(dayCap.getValue()).isEmpty();
        assertThat(nightCap.getValue()).extracting(ShiftEntry::getUserId).containsExactly(2L);
    }

    @Test
    @DisplayName("RELIEF assignment is never auto-scheduled onto a shift")
    void reliefIsNotScheduled() {
        User u = user(3L, "Relief Op");
        CrewAssignment a = new CrewAssignment();
        a.setUser(u);
        a.setAssignmentType(CrewAssignment.Type.RELIEF);
        a.setIsActive(true);
        when(assignmentRepo.findActiveOverlapping(any(), any())).thenReturn(List.of(a));

        service.materializeRange(DAY0, DAY0);

        verify(shiftDayService, never()).applyMaterializedDay(any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("approved PTO moves a rostered person into the PTO bucket")
    void approvedPtoMovesToPtoBucket() {
        User u = user(1L, "Kody Ziegler");
        when(assignmentRepo.findActiveOverlapping(any(), any()))
                .thenReturn(List.of(rotating(u, crewA(), "LEAD")));
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
    @DisplayName("leaves a day with no v2 opinion untouched")
    void emptyDayIsNotWritten() {
        service.materializeRange(DAY0, DAY0);
        verify(shiftDayService, never()).applyMaterializedDay(any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("holiday week: a 4×10 (Mon–Thu) worker gains Friday (Mon–Fri that week)")
    void holidayWeekAddsFriday() {
        User u = user(5L, "Mechanic");
        when(assignmentRepo.findActiveOverlapping(any(), any())).thenReturn(List.of(fixedDay(u, "MON,TUE,WED,THU")));
        when(eventRepo.findOverlapping(any(), any())).thenReturn(List.of(holidayOn(DAY0)));  // Thu holiday

        LocalDate friday = DAY0.plusDays(1);   // DAY0 (epoch 0) is a Thursday
        service.materializeRange(friday, friday);

        ArgumentCaptor<List<ShiftEntry>> dayCap = listCaptor();
        verify(shiftDayService).applyMaterializedDay(eq(friday), dayCap.capture(), any(), any(), any(),
                any(), any(), any(), any(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(dayCap.getValue()).extracting(ShiftEntry::getUserId).containsExactly(5L);
    }

    @Test
    @DisplayName("holiday itself is off for fixed day staff (paid holiday), even on a normal work day")
    void holidayDayIsOff() {
        User u = user(5L, "Mechanic");
        when(assignmentRepo.findActiveOverlapping(any(), any())).thenReturn(List.of(fixedDay(u, "MON,TUE,WED,THU")));
        when(eventRepo.findOverlapping(any(), any())).thenReturn(List.of(holidayOn(DAY0)));  // Thu holiday

        service.materializeRange(DAY0, DAY0);   // Thursday — normally worked by a Mon–Thu person

        ArgumentCaptor<List<ShiftEntry>> dayCap = listCaptor();
        verify(shiftDayService).applyMaterializedDay(eq(DAY0), dayCap.capture(), any(), any(), any(),
                any(), any(), any(), any(), eq(ScheduleMaterialisationService.SOURCE));
        assertThat(dayCap.getValue()).isEmpty();
    }

    // ---- fixtures -----------------------------------------------------------

    private User user(long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        return u;
    }

    private CrewAssignment fixedDay(User u, String daysCsv) {
        CrewAssignment a = new CrewAssignment();
        a.setUser(u);
        a.setAssignmentType(CrewAssignment.Type.FIXED);
        a.setFixedShift(CrewRotation.Shift.DAY);
        a.setFixedDaysOfWeek(daysCsv);
        a.setGroupLabel("Maintenance");
        a.setIsActive(true);
        return a;
    }

    private ScheduleEvent holidayOn(LocalDate date) {
        ScheduleEvent e = new ScheduleEvent();
        e.setEventType(ScheduleEvent.Type.HOLIDAY);
        e.setTitle("Holiday");
        e.setStartDate(date);
        e.setEndDate(date);
        return e;
    }

    /** Crew A: rotation with day-0 = Day, offset 0. */
    private Crew crewA() {
        CrewRotation rot = new CrewRotation();
        rot.setId(10L);
        rot.setName("2-2-3");
        rot.setPatternLengthDays(8);
        rot.setIsActive(true);
        try {
            rot.setRotationCells(objectMapper.writeValueAsString(
                    List.of(PatternCell.builder().dayIndex(0).shift("D").build())));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        Crew c = new Crew();
        c.setId(20L);
        c.setName("Crew A");
        c.setRotation(rot);
        c.setOffsetDays(0);
        c.setIsActive(true);
        return c;
    }

    private CrewAssignment rotating(User u, Crew crew, String position) {
        CrewAssignment a = new CrewAssignment();
        a.setUser(u);
        a.setCrew(crew);
        a.setPosition(position);
        a.setAssignmentType(CrewAssignment.Type.ROTATING);
        a.setIsActive(true);
        return a;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static ArgumentCaptor<List<ShiftEntry>> listCaptor() {
        return ArgumentCaptor.forClass((Class) List.class);
    }
}
