package com.dk_power.power_plant_java.controller.angular.admin;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Without @ActiveProfiles this inherits spring.profiles.active=prod,hub,server from
// application.properties — this test writes FieldChange rows and deletes in @AfterEach,
// so it was operating on the production H2 file.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NgAdminFunctionalitiesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FieldChangeRepository fieldChangeRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void tearDown() {
        fieldChangeRepository.deleteAll();
        jdbcTemplate.update("DELETE FROM work_request WHERE id IN (900000011)");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getSyncAuditEntityReportReturnsPayload() throws Exception {
        seedChange("WorkRequest", 900000011L, "company", null, "\"Acme\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T10:00:00Z"));

        mockMvc.perform(get("/ng/admin/sync-audit/entity")
                .param("entityType", "WorkRequest")
                .param("entityId", "900000011"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseData.entityType").value("WorkRequest"))
            .andExpect(jsonPath("$.responseData.entityId").value(900000011L));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void reconstructEndpointReturnsSnapshot() throws Exception {
        seedChange("WorkRequest", 900000011L, "company", null, "\"Acme\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T10:00:00Z"));

        mockMvc.perform(get("/ng/admin/sync-audit/reconstruct")
                .param("entityType", "WorkRequest")
                .param("entityId", "900000011")
                .param("asOf", "2026-03-27T10:30:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseData.entityType").value("WorkRequest"))
            .andExpect(jsonPath("$.responseData.reconstructedFields.company").value("\"Acme\""));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void incidentReportExportReturnsAttachment() throws Exception {
        seedChange("WorkRequest", 900000011L, "company", null, "\"Acme\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T10:00:00Z"));

        mockMvc.perform(get("/ng/admin/sync-audit/incident-report")
                .param("entityType", "WorkRequest")
                .param("entityId", "900000011")
                .param("asOf", "2026-03-27T10:30:00Z"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", "attachment; filename=\"sync-incident-WorkRequest-900000011.json\""))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("\"entityReport\"")));
    }

    private void seedChange(String entityType,
                            Long entityId,
                            String fieldName,
                            String oldValue,
                            String newValue,
                            String machineId,
                            String machineName,
                            FieldChange.ChangeType changeType,
                            Instant timestamp) {
        FieldChange change = new FieldChange(entityType, entityId, fieldName, oldValue, newValue, machineId, machineName, changeType);
        change.setTimestamp(timestamp);
        change.setReceivedAt(timestamp);
        fieldChangeRepository.save(change);
    }
}
