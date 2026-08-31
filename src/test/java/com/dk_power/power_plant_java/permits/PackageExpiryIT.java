package com.dk_power.power_plant_java.permits;

import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
import com.dk_power.power_plant_java.sevice.angular.permits.PackageExpiryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Automatic package expiry.
 *
 * <p>A permit authorises twelve hours; past sixteen the paperwork has lapsed. These cover the parts
 * that make an automatic status write safe rather than reckless — that it cascades, that it does
 * NOT overreach into asserting the crew came off the job, that an unreadable date is skipped rather
 * than guessed at, and that a wrong expiry is reversible.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:pkg-expiry-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false",
        // The sweep is driven explicitly here; the hourly schedule must not race the assertions.
        "permits.package.expiry.enabled=false"
})
@DisplayName("Package expiry")
class PackageExpiryIT {

    private static final DateTimeFormatter US = DateTimeFormatter.ofPattern("MM/dd/uuuu");

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private DailyPermitPackageRepo packageRepo;
    @Autowired private SafeWorkRepo safeWorkRepo;
    @Autowired private PackageExpiryService expiryService;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    private MockHttpSession session;

    @BeforeEach
    void setup() throws Exception {
        session = new MockHttpSession();
        mockMvc.perform(post("/api/auth/login")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\":\"admin\",\"password\":\"admin\"}"))
                .andExpect(status().isOk());
    }

    /** A package whose work window opened {@code daysAgo} days back, with one Safe Work on it. */
    private DailyPermitPackage packageDatedDaysAgo(String name, Integer daysAgo) {
        DailyPermitPackage pkg = new DailyPermitPackage();
        pkg.setName(name);
        pkg.setDate(daysAgo == null ? null : LocalDate.now().minusDays(daysAgo).format(US));
        pkg.setTime("07:00");
        DailyPermitPackage saved = packageRepo.save(pkg);

        SafeWork sw = new SafeWork();
        sw.setWorkScope(name + " permit");
        sw.setDailyPermitPackage(saved);
        safeWorkRepo.save(sw);
        return saved;
    }

    private String statusOf(DailyPermitPackage pkg) {
        DailyPermitPackage fresh = packageRepo.findById(pkg.getId()).orElseThrow();
        return fresh.getPackageStatus() != null ? fresh.getPackageStatus().getName() : "Building";
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a package past its window expires, and its permits go with it")
    void expiresAndCascades() {
        DailyPermitPackage pkg = packageDatedDaysAgo("expiry-it overdue", 3);

        Map<String, Object> result = expiryService.runNow(false);
        assertThat((int) result.get("expired")).isGreaterThanOrEqualTo(1);
        assertThat(statusOf(pkg)).isEqualTo("Expired");

        List<SafeWork> permits = safeWorkRepo.findAll().stream()
                .filter(p -> p.getDailyPermitPackage() != null
                        && p.getDailyPermitPackage().getId().equals(pkg.getId()))
                .toList();
        assertThat(permits).isNotEmpty();
        for (SafeWork permit : permits) {
            assertThat(permit.getPermitStatus()).isNotNull();
            assertThat(permit.getPermitStatus().getName())
                    .as("closing a package cascades to its permits; expiring has to as well, or the "
                            + "permits stay 'open' forever with no package to close them")
                    .isEqualTo("Expired");
        }
    }

    @Test
    @DisplayName("a package still inside its window is left alone")
    void leavesLiveWorkAlone() {
        DailyPermitPackage pkg = packageDatedDaysAgo("expiry-it today", 0);
        expiryService.runNow(false);
        assertThat(statusOf(pkg))
                .as("today's package is inside the 16h window and must not be touched")
                .isEqualTo("Building");
    }

    @Test
    @DisplayName("a package with no readable date is skipped, not guessed at")
    void skipsUndatedRatherThanGuessing() {
        DailyPermitPackage pkg = packageDatedDaysAgo("expiry-it undated", null);

        Map<String, Object> result = expiryService.runNow(false);

        assertThat((int) result.get("skippedUndated")).isGreaterThanOrEqualTo(1);
        assertThat(statusOf(pkg))
                .as("'we cannot read the date' is not evidence the window closed — guessing would "
                        + "expire live work")
                .isEqualTo("Building");
    }

    @Test
    @DisplayName("expiry does not sign personnel off")
    void doesNotSignPersonnelOff() {
        DailyPermitPackage pkg = packageDatedDaysAgo("expiry-it personnel", 3);
        DailyPermitPackage withCrew = packageRepo.findById(pkg.getId()).orElseThrow();
        withCrew.signOnPerson("Test Person", "Worker", "Test Co", "tester", false);
        packageRepo.save(withCrew);
        assertThat(packageRepo.findById(pkg.getId()).orElseThrow().getSignedOnPersonnel()).isNotEmpty();

        expiryService.runNow(false);

        assertThat(statusOf(pkg)).isEqualTo("Expired");
        assertThat(packageRepo.findById(pkg.getId()).orElseThrow().getSignedOnPersonnel())
                .as("a timer cannot know the crew came off the job; wiping the sign-on list would "
                        + "destroy the only record of who was in the field")
                .isNotEmpty();
    }

    @Test
    @DisplayName("an expired package can be re-activated, so a wrong expiry is not a dead end")
    void expiredPackageCanBeReactivated() throws Exception {
        DailyPermitPackage pkg = packageDatedDaysAgo("expiry-it reactivate", 3);
        expiryService.runNow(false);
        assertThat(statusOf(pkg)).isEqualTo("Expired");

        mockMvc.perform(post("/ng/daily-permit-packages/" + pkg.getId() + "/activate").session(session))
                .andExpect(status().isOk());

        assertThat(statusOf(pkg))
                .as("without Expired in activatePackage's allowed-from set, work the timer caught "
                        + "mid-shift could never be resumed")
                .isEqualTo("Active");
    }

    @Test
    @DisplayName("a dry run reports without writing")
    void dryRunWritesNothing() {
        DailyPermitPackage pkg = packageDatedDaysAgo("expiry-it dry run", 3);

        Map<String, Object> result = expiryService.runNow(true);

        assertThat((int) result.get("dueCount")).isGreaterThanOrEqualTo(1);
        assertThat((int) result.get("expired")).isZero();
        assertThat(statusOf(pkg)).isEqualTo("Building");
    }
}
