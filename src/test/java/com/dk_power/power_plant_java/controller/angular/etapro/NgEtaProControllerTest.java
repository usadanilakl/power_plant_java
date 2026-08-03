package com.dk_power.power_plant_java.controller.angular.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.repository.etapro.EtaProPointRepo;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
import com.dk_power.power_plant_java.repository.etapro.EtaProScrapeJobRepo;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Smoke tests for the rewritten {@link NgEtaProController}. Covers points CRUD,
 * history job submission/listing/cancellation, live start/stop/status, and readings
 * queries. Does NOT exercise actual scraping (would require Excel COM automation).
 */
// Without @ActiveProfiles this inherits spring.profiles.active=prod,hub,server from
// application.properties and boots against the production H2 file and the live hub.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "etapro.enabled=true",
        "etapro.live.template.path=${java.io.tmpdir}/etapro-test-live.xlsm",
        "etapro.history.template.path=${java.io.tmpdir}/etapro-test-history.xlsm",
        "etapro.script.path=${java.io.tmpdir}/etapro-test.ps1",
        "etapro.signal.path=${java.io.tmpdir}/etapro-test-signal",
        "etapro.output.path=${java.io.tmpdir}/etapro-test-output",
        // Prevent the worker thread from actually invoking the engine during tests
        "etapro.live.interval.ms=3600000",
        "spring.task.scheduling.enabled=false"
})
class NgEtaProControllerTest {

    // Mock out beans that don't load in headless mode
    @MockBean
    private RedTagAutomationService redTagAutomationService;

    @Autowired private MockMvc mockMvc;
    @Autowired private EtaProPointRepo pointRepo;
    @Autowired private EtaProReadingRepo readingRepo;
    @Autowired private EtaProScrapeJobRepo jobRepo;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM eta_pro_scrape_job_point_ids");
        jdbcTemplate.update("DELETE FROM eta_pro_scrape_job");
        jdbcTemplate.update("DELETE FROM eta_pro_reading");
        jdbcTemplate.update("DELETE FROM eta_pro_point");
    }

    @AfterEach
    void cleanUp() {
        jdbcTemplate.update("DELETE FROM eta_pro_scrape_job_point_ids");
        jdbcTemplate.update("DELETE FROM eta_pro_scrape_job");
        jdbcTemplate.update("DELETE FROM eta_pro_reading");
        jdbcTemplate.update("DELETE FROM eta_pro_point");
    }

    // ── Points CRUD ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void getAllPoints_returnsEmptyListInitially() throws Exception {
        mockMvc.perform(get("/ng/etapro/points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData").isArray());
    }

    @Test
    @WithMockUser(roles = "USER")
    void createAndRetrievePoint() throws Exception {
        Map<String, Object> dto = Map.of(
                "pointId", "1GT1.MW",
                "description", "Gas Turbine 1 MW",
                "unit", "MW",
                "category", "Turbine",
                "active", true
        );

        mockMvc.perform(post("/ng/etapro/points")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.pointId").value("1GT1.MW"));

        mockMvc.perform(get("/ng/etapro/points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData[0].pointId").value("1GT1.MW"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getActivePoints_filtersInactive() throws Exception {
        savePoint("ACTIVE.1", "Turbine", true);
        savePoint("INACTIVE.1", "Turbine", false);

        mockMvc.perform(get("/ng/etapro/points/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.length()").value(1))
                .andExpect(jsonPath("$.responseData[0].pointId").value("ACTIVE.1"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void deletePoint_softDeletes() throws Exception {
        EtaProPoint saved = savePoint("DELETE.ME", "Test", true);

        mockMvc.perform(delete("/ng/etapro/points/" + saved.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/ng/etapro/points"))
                .andExpect(jsonPath("$.responseData.length()").value(0));
    }

    // ── History jobs ────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void submitJob_returnsCreatedJobWithBatchPlan() throws Exception {
        Map<String, Object> req = Map.of(
                "pointIds", List.of("P1", "P2", "P3"),
                "rangeStart", "2026-04-01T00:00:00",
                "rangeEnd",   "2026-04-03T00:00:00"
        );

        mockMvc.perform(post("/ng/etapro/jobs")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.mode").value("HISTORY"))
                .andExpect(jsonPath("$.responseData.status").value("PENDING"))
                // 3 points × 2 days = 2 batches (1 point group × 2 day slices)
                .andExpect(jsonPath("$.responseData.batchesTotal").value(2))
                .andExpect(jsonPath("$.responseData.batchesCompleted").value(0));
    }

    @Test
    @WithMockUser(roles = "USER")
    void submitJob_rejectsInvalidRange() throws Exception {
        Map<String, Object> req = Map.of(
                "pointIds", List.of("P1"),
                "rangeStart", "2026-04-02T00:00:00",
                "rangeEnd",   "2026-04-01T00:00:00"  // end before start
        );

        mockMvc.perform(post("/ng/etapro/jobs")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "USER")
    void listJobs_returnsPage() throws Exception {
        saveJob("P1");

        mockMvc.perform(get("/ng/etapro/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.content").isArray())
                .andExpect(jsonPath("$.responseData.content.length()").value(1));
    }

    @Test
    @WithMockUser(roles = "USER")
    void cancelJob_setsStatusCancelled() throws Exception {
        EtaProScrapeJob job = saveJob("P1");

        mockMvc.perform(delete("/ng/etapro/jobs/" + job.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/ng/etapro/jobs/" + job.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.status").value("CANCELLED"));
    }

    // ── Live mode ───────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void liveStatus_initiallyInactive() throws Exception {
        // Ensure previous tests don't leak live state
        mockMvc.perform(post("/ng/etapro/live/stop"));

        mockMvc.perform(get("/ng/etapro/live/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.active").value(false));
    }

    @Test
    @WithMockUser(roles = "USER")
    void startLive_activatesSubscription() throws Exception {
        Map<String, Object> req = Map.of("pointIds", List.of("P1", "P2"));

        mockMvc.perform(post("/ng/etapro/live/start")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.active").value(true))
                .andExpect(jsonPath("$.responseData.pointIds.length()").value(2));

        mockMvc.perform(post("/ng/etapro/live/stop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.active").value(false));
    }

    @Test
    @WithMockUser(roles = "USER")
    void startLive_rejectsEmptyPointList() throws Exception {
        Map<String, Object> req = Map.of("pointIds", List.of());

        mockMvc.perform(post("/ng/etapro/live/start")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── Readings ────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void getLatestReadings_returnsArray() throws Exception {
        mockMvc.perform(get("/ng/etapro/readings/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData").isArray());
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private EtaProPoint savePoint(String pointId, String category, boolean active) {
        EtaProPoint p = new EtaProPoint();
        p.setPointId(pointId);
        p.setCategory(category);
        p.setActive(active);
        p.setUnit("MW");
        return pointRepo.save(p);
    }

    private EtaProScrapeJob saveJob(String pointId) {
        EtaProScrapeJob j = new EtaProScrapeJob();
        j.setMode(EtaProScrapeJob.Mode.HISTORY);
        j.setStatus(EtaProScrapeJob.Status.PENDING);
        j.setRangeStart(LocalDateTime.of(2026, 4, 1, 0, 0));
        j.setRangeEnd(LocalDateTime.of(2026, 4, 2, 0, 0));
        j.getPointIds().add(pointId);
        j.setBatchesTotal(1);
        return jobRepo.save(j);
    }
}
