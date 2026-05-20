package com.dk_power.power_plant_java.loto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration coverage for the Red Tag Standards backend (phases A + B):
 * the manual seed import (idempotent), per-row reconciliation against the
 * LOTO point database, and generating a native LotoStandard from selected
 * points.
 *
 * <p>In-memory H2 so a running desktop's file DB stays unlocked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:redtag-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Red Tag Standards backend")
class RedTagStandardIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    private MockHttpSession adminSession;

    @BeforeEach
    void loginAsSeededAdmin() throws Exception {
        adminSession = new MockHttpSession();
        mockMvc.perform(post("/api/auth/login")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\":\"admin\",\"password\":\"admin\"}"))
                .andExpect(status().isOk());
    }

    @AfterEach
    void cleanup() {
        // Each test starts from a clean Red Tag table so the idempotent import
        // assertions are deterministic regardless of run order.
        jdbcTemplate.update("DELETE FROM red_tag_standard");
    }

    @Test
    @DisplayName("manual import seeds the bundled standards and is idempotent")
    void importIsIdempotent() throws Exception {
        // First import — everything in the seed is created.
        JsonNode first = importSeed();
        int seeded = first.path("created").asInt();
        assertThat(seeded).as("seed has the full Red Tag standard set").isGreaterThanOrEqualTo(40);
        assertThat(first.path("skipped").asInt()).isZero();

        // Second import — nothing new, all skipped (no duplicates across sync clients).
        JsonNode second = importSeed();
        assertThat(second.path("created").asInt()).isZero();
        assertThat(second.path("skipped").asInt()).isEqualTo(seeded);

        // The list endpoint shows exactly the seeded count.
        JsonNode all = getJson("/ng/red-tag-standards");
        assertThat(all.size()).isEqualTo(seeded);
    }

    @Test
    @DisplayName("imported standard carries its parsed rows and source image")
    void importedStandardHasRowsAndImage() throws Exception {
        importSeed();
        long ccwId = findStandardIdByName("U2 Generator CCW");

        JsonNode dto = getJson("/ng/red-tag-standards/" + ccwId);
        assertThat(dto.path("unit").asText()).isEqualTo("U2");
        assertThat(dto.path("rows").isArray()).isTrue();
        assertThat(dto.path("rows").size())
                .as("U2 Generator CCW has 42 transcribed rows")
                .isEqualTo(42);
        assertThat(dto.path("rows").get(0).path("pnid").asText()).isEqualTo("02-VCCW364");
        assertThat(dto.path("sourceImageBase64").asText())
                .as("source image is stored inline as base64")
                .isNotBlank();
    }

    @Test
    @DisplayName("matches: a row whose PNID matches a LOTO point resolves MATCHED, others NONE")
    void matchesResolveByPnid() throws Exception {
        importSeed();
        long sealOilId = findStandardIdByName("Unit 2 Seal Oil");

        // Create a LOTO point whose tag number matches one Seal Oil PNID.
        createLotoPoint("02-VCMG103", "H2 ISOLATION existing point");

        JsonNode matches = getJson("/ng/red-tag-standards/" + sealOilId + "/matches");
        assertThat(matches.isArray()).isTrue();

        int matched = 0, none = 0;
        for (JsonNode m : matches) {
            String pnid = m.path("row").path("pnid").asText();
            String status = m.path("status").asText();
            if ("02-VCMG103".equals(pnid)) {
                assertThat(status).as("matching PNID row").isEqualTo("MATCHED");
                assertThat(m.path("matches").size()).isEqualTo(1);
                matched++;
            } else if ("NONE".equals(status)) {
                none++;
            }
        }
        assertThat(matched).as("exactly one row matched").isEqualTo(1);
        assertThat(none).as("the other 12 rows found no match").isEqualTo(12);
    }

    @Test
    @DisplayName("generate-standard creates a LotoStandard from selected points and stamps the link")
    void generateStandardFromSelectedPoints() throws Exception {
        importSeed();
        long generatorId = findStandardIdByName("Unit 2 Generator");

        // Create two LOTO points to feed the generated standard.
        long p1 = createLotoPoint("57GG-2", "U2 Generator Side Ground");
        long p2 = createLotoPoint("02SGJ02AA001", "CO2 actuation line iso valve");

        MvcResult res = mockMvc.perform(post("/ng/red-tag-standards/{id}/generate-standard", generatorId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Generated U2 Generator",
                                "lotoPointIds", List.of(p1, p2)))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode created = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("responseData");
        long newStandardId = created.path("id").asLong();
        assertThat(newStandardId).as("generated LotoStandard id").isPositive();

        // The Red Tag standard now links to the generated standard.
        JsonNode rtDto = getJson("/ng/red-tag-standards/" + generatorId);
        assertThat(rtDto.path("generatedStandardId").asLong()).isEqualTo(newStandardId);

        // The generated standard exists and carries the two points.
        JsonNode std = getJson("/ng/loto-standards/" + newStandardId);
        assertThat(std.path("lotoPoints").size()).isEqualTo(2);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private JsonNode importSeed() throws Exception {
        MvcResult res = mockMvc.perform(post("/ng/red-tag-standards/import").session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).path("responseData");
    }

    private JsonNode getJson(String path) throws Exception {
        MvcResult res = mockMvc.perform(get(path).session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).path("responseData");
    }

    private long findStandardIdByName(String name) throws Exception {
        for (JsonNode s : getJson("/ng/red-tag-standards")) {
            if (name.equals(s.path("name").asText())) return s.path("id").asLong();
        }
        throw new AssertionError("Red Tag standard not found: " + name);
    }

    private long createLotoPoint(String tagNumber, String description) throws Exception {
        MvcResult res = mockMvc.perform(post("/ng/loto-points")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "tagNumber", tagNumber,
                                "description", description,
                                "specificLocation", "RT-IT",
                                "equipmentIdList", List.of(),
                                "isLabeled", true,
                                "isLockable", true))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("responseData").path("id").asLong();
    }
}
