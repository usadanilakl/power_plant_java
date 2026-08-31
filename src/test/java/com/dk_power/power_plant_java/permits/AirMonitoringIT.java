package com.dk_power.power_plant_java.permits;

import com.dk_power.power_plant_java.dto.permits.AirTestDto;
import com.dk_power.power_plant_java.dto.permits.MonitoredAreaDto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.repository.permits.ConfinedSpaceRepo;
import com.dk_power.power_plant_java.entities.permits.MonitoredArea;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
import com.dk_power.power_plant_java.repository.permits.MonitoredAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.permits.NgAirMonitoringService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Air monitoring: the derived list and its two asymmetric rules.
 *
 * <p>The rules are the whole design, and both of them are about not fighting the operator:
 * a manual removal survives regeneration, and a manual addition is never auto-removed.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:air-monitoring-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Air monitoring")
class AirMonitoringIT {

    @Autowired private NgAirMonitoringService service;
    @Autowired private ConfinedSpaceRepo confinedSpaceRepo;
    @Autowired private HotWorkRepo hotWorkRepo;
    @Autowired private MonitoredAreaRepo monitoredAreaRepo;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    private ConfinedSpace openConfinedSpace(String space) {
        ConfinedSpace cs = new ConfinedSpace();
        cs.setSpace(space);
        cs.setWorkScope("air-it " + space);
        return confinedSpaceRepo.save(cs);
    }

    private HotWork openHotWork(String location) {
        HotWork hw = new HotWork();
        hw.setLocation(location);
        hw.setWorkScope("air-it " + location);
        return hotWorkRepo.save(hw);
    }

    private MonitoredAreaDto find(String name) {
        return service.list(true).stream()
                .filter(a -> name.equals(a.getName())).findFirst().orElse(null);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("open confined spaces AND hot works both land on the list")
    void derivesFromBothPermitTypes() {
        openConfinedSpace("air-it vessel A");
        openHotWork("air-it deck B");

        service.refreshFromPermits();

        assertThat(find("air-it vessel A"))
                .as("a confined space is the obvious case")
                .isNotNull();
        assertThat(find("air-it deck B"))
                .as("hot work needs monitoring too — the half the abandoned Space feature never had")
                .isNotNull();
    }

    @Test
    @DisplayName("refreshing twice does not duplicate an entry")
    void refreshIsIdempotent() {
        openConfinedSpace("air-it idempotent");
        service.refreshFromPermits();
        service.refreshFromPermits();
        service.refreshFromPermits();

        long count = service.list(true).stream()
                .filter(a -> "air-it idempotent".equals(a.getName())).count();
        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("a manual removal survives the next refresh")
    void manualRemovalIsRemembered() {
        openConfinedSpace("air-it removed");
        service.refreshFromPermits();
        MonitoredAreaDto area = find("air-it removed");
        assertThat(area).isNotNull();

        service.remove(area.getId());
        service.refreshFromPermits();

        // Regeneration runs repeatedly. Without remembering the removal the operator would have to
        // take this off again after every single refresh until the permit closed.
        MonitoredAreaDto after = find("air-it removed");
        assertThat(after).isNotNull();
        assertThat(after.getManuallyRemoved()).isTrue();
        assertThat(after.getRequiresMonitoring()).isFalse();
        assertThat(service.list(false).stream().map(MonitoredAreaDto::getName))
                .doesNotContain("air-it removed");
    }

    @Test
    @DisplayName("a manually added area is never retired by the sweep")
    void manualAdditionsSurviveRefresh() {
        MonitoredAreaDto manual = new MonitoredAreaDto();
        manual.setName("air-it manual");
        manual.setRequiresMonitoring(Boolean.TRUE);
        service.save(manual);

        service.refreshFromPermits();

        // Nothing about a permit closing proves a space somebody added by hand stopped needing
        // monitoring, and the two mistakes do not cost the same.
        MonitoredAreaDto after = find("air-it manual");
        assertThat(after).isNotNull();
        assertThat(after.getRequiresMonitoring()).isTrue();
    }

    @Test
    @DisplayName("closing the source permit retires its entry but keeps it readable")
    void closedPermitRetiresItsEntry() {
        ConfinedSpace cs = openConfinedSpace("air-it closing");
        service.refreshFromPermits();
        assertThat(find("air-it closing").getRequiresMonitoring()).isTrue();

        cs.setDeleted(Boolean.TRUE);
        confinedSpaceRepo.save(cs);
        service.refreshFromPermits();

        MonitoredAreaDto after = find("air-it closing");
        assertThat(after).as("retired, not deleted — its readings must stay reachable").isNotNull();
        assertThat(after.getRequiresMonitoring()).isFalse();
    }

    @Test
    @DisplayName("a never-tested area is overdue, not fine")
    void neverTestedIsOverdue() {
        openConfinedSpace("air-it untested");
        service.refreshFromPermits();

        MonitoredAreaDto area = find("air-it untested");
        assertThat(area.getLastTest()).isNull();
        assertThat(area.getOverdue())
                .as("a space nobody has ever tested is the MOST overdue thing on the list")
                .isTrue();
    }

    @Test
    @DisplayName("a test is recorded with its own moment, and clears the overdue flag")
    void recordingATestClearsOverdue() {
        openConfinedSpace("air-it tested");
        service.refreshFromPermits();
        MonitoredAreaDto area = find("air-it tested");

        AirTestDto test = new AirTestDto();
        test.setMonitoredAreaId(area.getId());
        // Taken two hours ago, submitted now — the offline case.
        Instant taken = Instant.now().minus(2, ChronoUnit.HOURS);
        test.setTestedAt(taken);
        test.setTestedBy("Tester One");
        test.setMeterSerial("MX6-1234");
        test.setOxygen("20.9");
        test.setLel("0");
        test.setResult("PASS");
        service.recordTest(test);

        MonitoredAreaDto after = find("air-it tested");
        assertThat(after.getLastTest()).isNotNull();
        assertThat(after.getLastTest().getTestedBy()).isEqualTo("Tester One");
        assertThat(after.getLastTest().getTestedAt())
                .as("the moment of the READING, not of the upload — a basement test synced hours "
                        + "later must keep when the atmosphere was actually safe")
                .isCloseTo(taken, org.assertj.core.api.Assertions.within(2, ChronoUnit.SECONDS));
        assertThat(after.getOverdue()).isFalse();
        assertThat(after.getHoursSinceLastTest()).isEqualTo(2L);
    }

    @Test
    @DisplayName("a test older than the interval is overdue again")
    void staleTestGoesOverdue() {
        openConfinedSpace("air-it stale");
        service.refreshFromPermits();
        MonitoredAreaDto area = find("air-it stale");

        AirTestDto test = new AirTestDto();
        test.setMonitoredAreaId(area.getId());
        test.setTestedAt(Instant.now().minus(20, ChronoUnit.HOURS));
        test.setResult("PASS");
        service.recordTest(test);

        assertThat(find("air-it stale").getOverdue())
                .as("20 hours against a 12-hour default interval")
                .isTrue();
    }

    @Test
    @DisplayName("recording against an unknown area is refused rather than silently dropped")
    void unknownAreaIsRefused() {
        AirTestDto test = new AirTestDto();
        test.setMonitoredAreaId(999999999L);
        test.setResult("PASS");

        assertThat(org.assertj.core.api.Assertions.catchThrowable(() -> service.recordTest(test)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("a retried submission updates the reading instead of duplicating it")
    void retryIsIdempotent() {
        openConfinedSpace("air-it retry");
        service.refreshFromPermits();
        MonitoredAreaDto area = find("air-it retry");

        AirTestDto first = new AirTestDto();
        first.setMonitoredAreaId(area.getId());
        first.setClientUuid("air-it-uuid-1");
        first.setTestedAt(Instant.now().minus(1, ChronoUnit.HOURS));
        first.setTestedBy("Tester");
        first.setResult("PASS");
        service.recordTest(first);

        // Same reading sent again: the phone never saw the first response and retried.
        service.recordTest(first);

        assertThat(service.testsFor(area.getId()))
                .as("one reading, submitted twice, is still one reading")
                .hasSize(1);
    }

    @Test
    @DisplayName("a reading dated in the future is recorded as now")
    void futureReadingIsClamped() {
        openConfinedSpace("air-it future");
        service.refreshFromPermits();
        MonitoredAreaDto area = find("air-it future");

        AirTestDto test = new AirTestDto();
        test.setMonitoredAreaId(area.getId());
        // A wrong device clock, or a mistyped year. Left alone it would mark the area "not overdue"
        // until that moment arrived — the system confidently calling an untested space fine.
        test.setTestedAt(Instant.now().plus(3, ChronoUnit.DAYS));
        test.setResult("PASS");
        service.recordTest(test);

        MonitoredAreaDto after = find("air-it future");
        assertThat(after.getLastTest().getTestedAt()).isBeforeOrEqualTo(Instant.now().plusSeconds(5));
        assertThat(after.getHoursSinceLastTest())
                .as("never negative")
                .isGreaterThanOrEqualTo(0L);
    }

    @Test
    @DisplayName("duplicate derived entries collapse onto the smallest id")
    void duplicatesCollapseDeterministically() {
        ConfinedSpace cs = openConfinedSpace("air-it dupe");
        service.refreshFromPermits();

        // Simulate the partition case: a second node derived the same permit into its own row, and
        // sync kept both.
        MonitoredArea second = new MonitoredArea();
        second.setSourceType("CONFINED_SPACE");
        second.setSourcePermitId(cs.getId());
        second.setName("air-it dupe");
        second.setRequiresMonitoring(Boolean.TRUE);
        monitoredAreaRepo.save(second);

        service.refreshFromPermits();

        long active = service.list(false).stream()
                .filter(a -> "air-it dupe".equals(a.getName())).count();
        assertThat(active)
                .as("every node picks the same survivor, so the list shows one entry")
                .isEqualTo(1);
    }

    @Test
    @DisplayName("a removal on either copy survives the collapse")
    void removalSurvivesDuplicateCollapse() {
        ConfinedSpace cs = openConfinedSpace("air-it dupe removed");
        service.refreshFromPermits();

        MonitoredArea second = new MonitoredArea();
        second.setSourceType("CONFINED_SPACE");
        second.setSourcePermitId(cs.getId());
        second.setName("air-it dupe removed");
        second.setRequiresMonitoring(Boolean.FALSE);
        second.setManuallyRemoved(Boolean.TRUE);
        monitoredAreaRepo.save(second);

        service.refreshFromPermits();

        assertThat(service.list(false).stream().map(MonitoredAreaDto::getName))
                .as("somebody took this off on one node; the collapse must not undo that")
                .doesNotContain("air-it dupe removed");
    }

    @Test
    @DisplayName("test history is newest first")
    void historyIsNewestFirst() {
        openConfinedSpace("air-it history");
        service.refreshFromPermits();
        MonitoredAreaDto area = find("air-it history");

        for (int hoursAgo : new int[] {5, 1, 3}) {
            AirTestDto test = new AirTestDto();
            test.setMonitoredAreaId(area.getId());
            test.setTestedAt(Instant.now().minus(hoursAgo, ChronoUnit.HOURS));
            test.setTestedBy("t-" + hoursAgo);
            service.recordTest(test);
        }

        List<AirTestDto> history = service.testsFor(area.getId());
        assertThat(history).hasSize(3);
        assertThat(history.get(0).getTestedBy()).isEqualTo("t-1");
        assertThat(history.get(2).getTestedBy()).isEqualTo("t-5");
    }
}
