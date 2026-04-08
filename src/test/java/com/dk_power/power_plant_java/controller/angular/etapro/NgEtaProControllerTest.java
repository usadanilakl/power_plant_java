package com.dk_power.power_plant_java.controller.angular.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.repository.etapro.EtaProPointRepo;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Smoke tests for {@link NgEtaProController}. Verifies the feature-flag activation
 * and that all endpoints return the expected JSON envelope shape.
 *
 * We do NOT test actual scraping (that would require Excel COM automation). The
 * scrape endpoints are only exercised indirectly via {@code /scrape/status}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "etapro.enabled=true",
        // Point to non-existent paths so the startup validation logs warnings
        // but the service still starts cleanly (directories get auto-created)
        "etapro.excel.template.path=${java.io.tmpdir}/etapro-test-nonexistent.xlsm",
        "etapro.script.path=${java.io.tmpdir}/etapro-test-nonexistent.ps1",
        "etapro.signal.path=${java.io.tmpdir}/etapro-test-signal",
        "etapro.output.path=${java.io.tmpdir}/etapro-test-output",
        // Disable scheduled scrape to avoid background process startup during tests
        "spring.task.scheduling.enabled=false"
})
class NgEtaProControllerTest {

    // SikuliX-backed bean fails on headless test runners — mock it out so context loads
    @MockBean
    private RedTagAutomationService redTagAutomationService;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EtaProPointRepo pointRepo;

    @Autowired
    private EtaProReadingRepo readingRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Hard-delete (not soft) to clear any leftover rows from previous runs
        // — soft-deleted rows still occupy the unique constraint on point_id
        jdbcTemplate.update("DELETE FROM eta_pro_reading");
        jdbcTemplate.update("DELETE FROM eta_pro_point");
    }

    @AfterEach
    void cleanUp() {
        jdbcTemplate.update("DELETE FROM eta_pro_reading");
        jdbcTemplate.update("DELETE FROM eta_pro_point");
    }

    // ── Points CRUD ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void getAllPoints_returnsEmptyListInitially() throws Exception {
        mockMvc.perform(get("/ng/etapro/points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData").isArray())
                .andExpect(jsonPath("$.message").exists());
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

        // POST — create
        mockMvc.perform(post("/ng/etapro/points")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.pointId").value("1GT1.MW"))
                .andExpect(jsonPath("$.responseData.unit").value("MW"))
                .andExpect(jsonPath("$.responseData.active").value(true));

        // GET all — should contain the new point
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
    void getPointsByCategory_filtersCorrectly() throws Exception {
        savePoint("1GT1.MW", "Turbine", true);
        savePoint("1HRSG.PRESS", "HRSG", true);

        mockMvc.perform(get("/ng/etapro/points/category/Turbine"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.length()").value(1))
                .andExpect(jsonPath("$.responseData[0].pointId").value("1GT1.MW"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void deletePoint_softDeletes() throws Exception {
        EtaProPoint saved = savePoint("DELETE.ME", "Test", true);

        mockMvc.perform(delete("/ng/etapro/points/" + saved.getId()))
                .andExpect(status().isOk());

        // After soft delete, point should not appear in getAll
        mockMvc.perform(get("/ng/etapro/points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.length()").value(0));
    }

    // ── Status endpoint ─────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void getScrapeStatus_returnsStatusShape() throws Exception {
        mockMvc.perform(get("/ng/etapro/scrape/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.processRunning").exists())
                .andExpect(jsonPath("$.responseData.scrapeInProgress").exists())
                .andExpect(jsonPath("$.responseData.lastStatus").exists());
    }

    // ── Readings endpoints ─────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void getLatestReadings_returnsEmptyListWhenNoData() throws Exception {
        mockMvc.perform(get("/ng/etapro/readings/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData").isArray());
    }

    @Test
    @WithMockUser(roles = "USER")
    void getReadingsPaginated_returnsPageShape() throws Exception {
        mockMvc.perform(get("/ng/etapro/readings/paginated")
                        .param("page", "1")
                        .param("pageSize", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseData.content").isArray())
                .andExpect(jsonPath("$.responseData.totalElements").exists());
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
}
