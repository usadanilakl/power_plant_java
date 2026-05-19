package com.dk_power.power_plant_java.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandardStatus;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration coverage for the LOTO Standard development workflow
 * (DRAFT → PENDING_VERIFICATION → VERIFIED → WALKDOWN_COMPLETE →
 * READY_FOR_TESTING → APPROVED, plus NEW_PENDING_REAPPROVAL on edit).
 *
 * <p>Boots the full Spring context with an in-memory H2 (so a running dev
 * backend doesn't lock the test DB). Every test authenticates as the seeded
 * admin via {@code /api/auth/login}, provisions test users via the admin
 * API, and exchanges initials+PIN codes for step-up tokens via
 * {@code /api/auth/step-up}. Nothing is mocked beyond the GUI-dependent
 * RedTagAutomationService — these tests exercise the production
 * controllers, services, repos, and {@code StepUpAuthFilter}.
 *
 * <p>Each test cleans up its own users + standard in {@code @AfterEach} so
 * a failed test doesn't leak rows.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
// Override the file-based H2 from application-test.properties with an
// in-memory instance so the test can run even while a dev backend has the
// file DB locked. Each test JVM gets its own DB.
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:workflow-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("LOTO Standard development workflow")
class LotoStandardWorkflowIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;

    // Sikuli (screen automation) refuses to init in a headless JVM. The real
    // service is only used by Red Tag automation, which is irrelevant to the
    // LOTO Standard workflow under test — mock it out so the context boots.
    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    /** Persistent session for the seeded admin, used by every privileged request. */
    private MockHttpSession adminSession;

    /** Tracks state created by each test for @AfterEach cleanup. */
    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdLotoPointIds = new ArrayList<>();
    private final List<Long> createdStandardIds = new ArrayList<>();

    // ── Setup / teardown ──────────────────────────────────────────────────────

    @BeforeEach
    void loginAsSeededAdmin() throws Exception {
        adminSession = loginAndGetSession("admin", "admin");
    }

    @AfterEach
    void cleanup() {
        for (Long id : createdStandardIds) tryDelete("/ng/loto-standards/" + id);
        for (Long id : createdLotoPointIds) tryDelete("/ng/loto-points/" + id);
        for (Long id : createdUserIds) tryDelete("/ng/users/" + id);

        jdbcTemplate.update("DELETE FROM users WHERE email LIKE '%@workflow-it.local'");

        createdUserIds.clear();
        createdLotoPointIds.clear();
        createdStandardIds.clear();
    }

    private void tryDelete(String path) {
        try {
            mockMvc.perform(delete(path).session(adminSession));
        } catch (Exception ignored) { /* best-effort */ }
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("happy path: DRAFT → APPROVED with one CA + a second verifier + a MANAGER")
    void happyPath_draftToApproved() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = createStandard("happy-path");
        assertStatus(standardId, LotoStandardStatus.DRAFT);

        workflowTransition(standardId, "submit-for-verification", dk).andExpect(status().isOk());
        assertStatus(standardId, LotoStandardStatus.PENDING_VERIFICATION);

        workflowTransition(standardId, "verify", ms).andExpect(status().isOk());
        assertStatus(standardId, LotoStandardStatus.VERIFIED);

        workflowTransition(standardId, "walkdown-complete", dk).andExpect(status().isOk());
        assertStatus(standardId, LotoStandardStatus.WALKDOWN_COMPLETE);
        workflowTransition(standardId, "ready-for-testing", dk).andExpect(status().isOk());
        assertStatus(standardId, LotoStandardStatus.READY_FOR_TESTING);

        workflowTransition(standardId, "approve", mg).andExpect(status().isOk());
        assertStatus(standardId, LotoStandardStatus.APPROVED);
    }

    @Test
    @DisplayName("second-person rule: submitter cannot verify their own standard")
    void verify_asSubmitter_rejected() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));

        Long standardId = createStandard("submitter-verifies-self");
        workflowTransition(standardId, "submit-for-verification", dk).andExpect(status().isOk());

        workflowTransition(standardId, "verify", dk)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());

        assertStatus(standardId, LotoStandardStatus.PENDING_VERIFICATION);
    }

    @Test
    @DisplayName("role gate: a CA without the MANAGER role cannot approve a standard")
    void approve_asNonManager_rejected() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));

        Long standardId = createStandard("approve-as-non-manager");
        workflowTransition(standardId, "submit-for-verification", dk).andExpect(status().isOk());
        workflowTransition(standardId, "verify", ms).andExpect(status().isOk());
        workflowTransition(standardId, "walkdown-complete", dk).andExpect(status().isOk());
        workflowTransition(standardId, "ready-for-testing", dk).andExpect(status().isOk());

        workflowTransition(standardId, "approve", dk)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());

        assertStatus(standardId, LotoStandardStatus.READY_FOR_TESTING);
    }

    @Test
    @DisplayName("edit on APPROVED standard captures pending-change rows; status stays APPROVED with pendingReviewSince set")
    void editingApprovedStandard_capturesPendingChanges() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("pending-capture", dk, ms, mg);
        assertStatus(standardId, LotoStandardStatus.APPROVED);

        Long pointId = createdLotoPointIds.get(0);
        Map<String, Object> updatePayload = Map.of(
                "id", pointId,
                "tagNumber", "EDITED-" + pointId,
                "description", "modified by pending-review test",
                "zeroEnergyMethod", "modified ZE"
        );
        mockMvc.perform(put("/ng/loto-points")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk());

        // Standard stays APPROVED — but pendingReviewSince is set, and the
        // pending-changes endpoint surfaces the per-field diff rows.
        assertThat(currentStatus(standardId))
                .as("APPROVED standard remains APPROVED while in pending review")
                .isEqualTo(LotoStandardStatus.APPROVED);
        assertThat(pendingReviewSince(standardId))
                .as("pendingReviewSince should be set after an edit")
                .isNotNull();

        JsonNode pending = getPendingChanges(standardId);
        assertThat(pending.isArray()).isTrue();
        assertThat(pending.size())
                .as("at least one pending-change row should exist (description + zeroEnergyMethod changed)")
                .isGreaterThanOrEqualTo(1);
        // Every change starts in PENDING resolution
        for (JsonNode c : pending) {
            assertThat(c.path("resolution").asText())
                    .isEqualTo("PENDING");
        }
    }

    @Test
    @DisplayName("close review as minor: standard stays APPROVED, pendingReviewSince clears, EDIT_ACCEPTED_AS_MINOR event logged")
    void closeReview_asMinor_keepsApproved() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("close-as-minor", dk, ms, mg);
        editFirstPoint(standardId, "minor description tweak");

        // Resolve every pending row as KEPT (or DISMISSED — either works for close).
        // Run under DK's step-up identity so requireAnyRole(CA, MANAGER) is satisfied.
        JsonNode pending = getPendingChanges(standardId);
        for (JsonNode c : pending) {
            mockMvc.perform(post("/ng/loto-standards/pending-changes/{id}/keep", c.path("id").asLong())
                            .session(adminSession)
                            .header("X-Sign-As-Token", stepUpToken(dk)))
                    .andExpect(status().isOk());
        }

        // Close as minor — no re-approval.
        mockMvc.perform(post("/ng/loto-standards/{id}/workflow/close-review", standardId)
                        .session(adminSession)
                        .header("X-Sign-As-Token", stepUpToken(dk))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requireReapproval\":false}"))
                .andExpect(status().isOk());

        assertStatus(standardId, LotoStandardStatus.APPROVED);
        assertThat(pendingReviewSince(standardId)).isNull();

        List<String> events = historyEventTypes(standardId);
        assertThat(events).contains("EDIT_PENDING_REVIEW", "EDIT_ACCEPTED_AS_MINOR");
        assertThat(events)
                .as("close-as-minor should NOT flip the standard to re-approval")
                .doesNotContain("EDIT_REQUIRES_REAPPROVAL");
    }

    @Test
    @DisplayName("close review as substantive: standard flips to NEW_PENDING_REAPPROVAL, EDIT_REQUIRES_REAPPROVAL event logged")
    void closeReview_requiringReapproval_flipsToNewPending() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("close-requires-reapproval", dk, ms, mg);
        editFirstPoint(standardId, "substantive zero-energy method change");

        JsonNode pending = getPendingChanges(standardId);
        for (JsonNode c : pending) {
            mockMvc.perform(post("/ng/loto-standards/pending-changes/{id}/keep", c.path("id").asLong())
                            .session(adminSession)
                            .header("X-Sign-As-Token", stepUpToken(dk)))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/ng/loto-standards/{id}/workflow/close-review", standardId)
                        .session(adminSession)
                        .header("X-Sign-As-Token", stepUpToken(dk))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requireReapproval\":true}"))
                .andExpect(status().isOk());

        assertStatus(standardId, LotoStandardStatus.NEW_PENDING_REAPPROVAL);
        assertThat(pendingReviewSince(standardId)).isNull();
        assertThat(historyEventTypes(standardId)).contains("EDIT_REQUIRES_REAPPROVAL");
    }

    @Test
    @DisplayName("close review while changes remain PENDING is rejected")
    void closeReview_withUnresolvedChanges_rejected() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("close-with-unresolved", dk, ms, mg);
        editFirstPoint(standardId, "unresolved test");

        // Do NOT resolve any pending rows. Step-up as DK so the role gate
        // passes — we want the reject to come from the "unresolved" check,
        // not from authorization.
        mockMvc.perform(post("/ng/loto-standards/{id}/workflow/close-review", standardId)
                        .session(adminSession)
                        .header("X-Sign-As-Token", stepUpToken(dk))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requireReapproval\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("pending")));

        // State unchanged: still APPROVED, still in pending-review window.
        assertStatus(standardId, LotoStandardStatus.APPROVED);
        assertThat(pendingReviewSince(standardId)).isNotNull();
    }

    @Test
    @DisplayName("workflow history records every transition with the right performer")
    void workflowHistory_recordsAllTransitions() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = createStandard("history-sanity");
        workflowTransition(standardId, "submit-for-verification", dk).andExpect(status().isOk());
        workflowTransition(standardId, "verify", ms).andExpect(status().isOk());
        workflowTransition(standardId, "walkdown-complete", dk).andExpect(status().isOk());
        workflowTransition(standardId, "ready-for-testing", dk).andExpect(status().isOk());
        workflowTransition(standardId, "approve", mg).andExpect(status().isOk());

        MvcResult historyRes = mockMvc.perform(get("/ng/loto-standards/{id}/workflow/history", standardId)
                        .session(adminSession))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(historyRes.getResponse().getContentAsString());
        JsonNode events = body.path("responseData");
        assertThat(events.isArray()).isTrue();

        List<String> types = new ArrayList<>();
        for (JsonNode e : events) {
            String t = e.path("eventType").asText("?");
            if ("?".equals(t)) t = e.path("type").asText("?");
            types.add(t);
        }

        assertThat(types).contains(
                "SUBMITTED_FOR_VERIFICATION", "VERIFIED", "WALKDOWN_COMPLETE",
                "READY_FOR_TESTING", "APPROVED");
    }

    // ── Model B2: propose-then-apply on APPROVED standard-level edits ─────────

    @Test
    @DisplayName("B2: prose edit on APPROVED standard does NOT mutate the standard — proposal recorded instead")
    void b2_proseEditOnApproved_doesNotMutateStandard() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("b2-propose", dk, ms, mg);
        String originalText = installProcedureText(standardId);

        String proposedText = "PROPOSED install procedure " + System.currentTimeMillis();
        mockMvc.perform(put("/ng/loto-standards/{id}/procedural-text", standardId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"installProcedureText\":\"" + proposedText + "\"}"))
                .andExpect(status().isOk());

        // Standard's installProcedureText is UNCHANGED — proposal recorded only.
        assertThat(installProcedureText(standardId))
                .as("APPROVED standard text must not change until reviewer accepts")
                .isEqualTo(originalText);

        JsonNode pending = getPendingChanges(standardId);
        assertThat(pending.isArray()).isTrue();
        assertThat(pending.size())
                .as("one proposal row for the prose edit")
                .isGreaterThanOrEqualTo(1);
        boolean found = false;
        for (JsonNode c : pending) {
            if ("installProcedureText".equals(c.path("fieldName").asText())) {
                assertThat(c.path("newValue").asText()).isEqualTo(proposedText);
                assertThat(c.path("resolution").asText()).isEqualTo("PENDING");
                found = true;
            }
        }
        assertThat(found).as("a proposal for installProcedureText must exist").isTrue();
    }

    @Test
    @DisplayName("B2: keep + close-as-minor applies the proposal — standard text is now the new value")
    void b2_keepThenCloseAsMinor_appliesProposal() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("b2-keep-close-minor", dk, ms, mg);

        String proposedText = "ACCEPTED install procedure";
        mockMvc.perform(put("/ng/loto-standards/{id}/procedural-text", standardId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"installProcedureText\":\"" + proposedText + "\"}"))
                .andExpect(status().isOk());

        JsonNode pending = getPendingChanges(standardId);
        for (JsonNode c : pending) {
            if ("installProcedureText".equals(c.path("fieldName").asText())) {
                mockMvc.perform(post("/ng/loto-standards/pending-changes/{id}/keep", c.path("id").asLong())
                                .session(adminSession)
                                .header("X-Sign-As-Token", stepUpToken(dk)))
                        .andExpect(status().isOk());
            }
        }

        mockMvc.perform(post("/ng/loto-standards/{id}/workflow/close-review", standardId)
                        .session(adminSession)
                        .header("X-Sign-As-Token", stepUpToken(dk))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requireReapproval\":false}"))
                .andExpect(status().isOk());

        assertStatus(standardId, LotoStandardStatus.APPROVED);
        assertThat(installProcedureText(standardId))
                .as("KEPT proposal must be applied to the standard on close")
                .isEqualTo(proposedText);
    }

    @Test
    @DisplayName("B2: dismiss + close discards the proposal — standard text unchanged")
    void b2_dismissThenClose_discardsProposal() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("b2-dismiss", dk, ms, mg);
        String originalText = installProcedureText(standardId);

        mockMvc.perform(put("/ng/loto-standards/{id}/procedural-text", standardId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"installProcedureText\":\"DISMISSED proposal text\"}"))
                .andExpect(status().isOk());

        JsonNode pending = getPendingChanges(standardId);
        for (JsonNode c : pending) {
            if ("installProcedureText".equals(c.path("fieldName").asText())) {
                mockMvc.perform(post("/ng/loto-standards/pending-changes/{id}/dismiss", c.path("id").asLong())
                                .session(adminSession)
                                .header("X-Sign-As-Token", stepUpToken(dk)))
                        .andExpect(status().isOk());
            }
        }

        mockMvc.perform(post("/ng/loto-standards/{id}/workflow/close-review", standardId)
                        .session(adminSession)
                        .header("X-Sign-As-Token", stepUpToken(dk))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requireReapproval\":false}"))
                .andExpect(status().isOk());

        assertStatus(standardId, LotoStandardStatus.APPROVED);
        assertThat(installProcedureText(standardId))
                .as("DISMISSED proposal must not change the standard")
                .isEqualTo(originalText);
    }

    @Test
    @DisplayName("B2: same field edited twice coalesces to a single proposal whose newValue is the latest")
    void b2_repeatedEditOnSameFieldCoalesces() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor ms = provisionActor("MS", "2222", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "3333", List.of("MANAGER", "CONTROL_AUTHORITY"));

        Long standardId = walkToApproved("b2-coalesce", dk, ms, mg);

        // Two edits to the same field (simulates an auto-save typing burst).
        for (String text : List.of("first draft", "second draft", "final draft")) {
            mockMvc.perform(put("/ng/loto-standards/{id}/procedural-text", standardId)
                            .session(adminSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"installProcedureText\":\"" + text + "\"}"))
                    .andExpect(status().isOk());
        }

        JsonNode pending = getPendingChanges(standardId);
        long installProseRows = 0;
        String latestNew = null;
        for (JsonNode c : pending) {
            if ("installProcedureText".equals(c.path("fieldName").asText())) {
                installProseRows++;
                latestNew = c.path("newValue").asText();
            }
        }
        assertThat(installProseRows)
                .as("typing burst must coalesce to one row per (field, user)")
                .isEqualTo(1L);
        assertThat(latestNew).isEqualTo("final draft");
    }

    @Test
    @DisplayName("send-back-to-draft from PENDING_VERIFICATION resets attribution")
    void sendBackToDraft_fromPendingVerification_returnsToDraft() throws Exception {
        TestActor dk = provisionActor("DK", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));

        Long standardId = createStandard("send-back-to-draft");
        workflowTransition(standardId, "submit-for-verification", dk).andExpect(status().isOk());
        assertStatus(standardId, LotoStandardStatus.PENDING_VERIFICATION);

        workflowTransition(standardId, "send-back-to-draft", dk).andExpect(status().isOk());
        assertStatus(standardId, LotoStandardStatus.DRAFT);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private record TestActor(long userId, String email, String initials, String pin) {
        String stepUpCode() { return initials + pin; }
    }

    private TestActor provisionActor(String initials, String pin, List<String> roles) throws Exception {
        String email = initials.toLowerCase() + "@workflow-it.local";
        String username = initials.toLowerCase() + "-it";

        Map<String, Object> createPayload = Map.of(
                "username", username,
                "firstName", initials,
                "lastName", "Tester",
                "email", email,
                "roles", roles,
                "password", "TestPass!1234",
                "windowsUsername", "",
                "phone", "",
                "company", "",
                "signaturePath", ""
        );
        MvcResult createRes = mockMvc.perform(post("/ng/users")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createPayload)))
                .andExpect(status().isOk())
                .andReturn();

        Long userId = objectMapper.readTree(createRes.getResponse().getContentAsString())
                .path("responseData").path("id").asLong();
        assertThat(userId).as("created user id").isPositive();
        createdUserIds.add(userId);

        mockMvc.perform(post("/api/auth/admin/users/{id}/initials", userId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"initials\":\"" + initials + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/admin/users/{id}/pin/set-test", userId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pin\":\"" + pin + "\"}"))
                .andExpect(status().isOk());

        return new TestActor(userId, email, initials, pin);
    }

    private Long createStandard(String testName) throws Exception {
        List<Long> pointIds = new ArrayList<>();
        for (int i = 1; i <= 4; i++) {
            Map<String, Object> pointPayload = Map.of(
                    "tagNumber", "IT-" + testName + "-" + i,
                    "description", "IT point " + i + " for " + testName,
                    "specificLocation", "IT location",
                    "equipmentIdList", List.of(),
                    "isLabeled", true,
                    "isLockable", true
            );
            MvcResult pr = mockMvc.perform(post("/ng/loto-points")
                            .session(adminSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(pointPayload)))
                    .andExpect(status().isOk())
                    .andReturn();
            Long pointId = objectMapper.readTree(pr.getResponse().getContentAsString())
                    .path("responseData").path("id").asLong();
            assertThat(pointId).as("loto point id").isPositive();
            pointIds.add(pointId);
            createdLotoPointIds.add(pointId);
        }

        Map<String, Object> standardPayload = Map.of(
                "name", "IT Standard " + testName,
                "description", "Integration-test fixture",
                "lotoPoints", pointIds
        );
        MvcResult sr = mockMvc.perform(post("/ng/loto-standards")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(standardPayload)))
                .andExpect(status().isOk())
                .andReturn();

        Long standardId = objectMapper.readTree(sr.getResponse().getContentAsString())
                .path("responseData").path("id").asLong();
        assertThat(standardId).as("standard id").isPositive();
        createdStandardIds.add(standardId);
        return standardId;
    }

    private org.springframework.test.web.servlet.ResultActions workflowTransition(
            Long standardId, String transition, TestActor actor) throws Exception {
        String token = stepUpToken(actor);
        MockHttpServletRequestBuilder req = post(
                "/ng/loto-standards/{id}/workflow/{transition}", standardId, transition)
                .session(adminSession)
                .header("X-Sign-As-Token", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}");
        return mockMvc.perform(req);
    }

    private String stepUpToken(TestActor actor) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/step-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + actor.stepUpCode() + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("token").asText();
    }

    /**
     * Log in by POSTing to /api/auth/login with a fresh MockHttpSession. The
     * controller writes the Spring SecurityContext into that session; we keep
     * the session reference and pass it via {@code .session(adminSession)} on
     * every subsequent request, which restores the auth context server-side.
     */
    private MockHttpSession loginAndGetSession(String credential, String password) throws Exception {
        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(post("/api/auth/login")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\":\"" + credential + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk());
        return session;
    }

    private String currentStatus(Long standardId) throws Exception {
        MvcResult res = mockMvc.perform(get("/ng/loto-standards/{id}", standardId)
                        .session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(res.getResponse().getContentAsString());
        JsonNode dev = body.path("responseData").path("developmentStatus");
        if (dev.isObject()) return dev.path("name").asText("?");
        if (dev.isTextual()) return dev.asText();
        return "?";
    }

    private void assertStatus(Long standardId, String expected) throws Exception {
        assertThat(currentStatus(standardId))
                .as("standard %d status", standardId)
                .isEqualTo(expected);
    }

    // ── Helpers for the pending-review tests ──────────────────────────────────

    /**
     * Walk a freshly-created standard all the way to APPROVED, using the three
     * given actors (dk = submitter, ms = verifier, mg = manager-approver).
     */
    private Long walkToApproved(String testName, TestActor dk, TestActor ms, TestActor mg) throws Exception {
        Long standardId = createStandard(testName);
        workflowTransition(standardId, "submit-for-verification", dk).andExpect(status().isOk());
        workflowTransition(standardId, "verify", ms).andExpect(status().isOk());
        workflowTransition(standardId, "walkdown-complete", dk).andExpect(status().isOk());
        workflowTransition(standardId, "ready-for-testing", dk).andExpect(status().isOk());
        workflowTransition(standardId, "approve", mg).andExpect(status().isOk());
        return standardId;
    }

    /**
     * Mutate the first LOTO point on the standard via PUT /ng/loto-points so
     * the pending-review capture service writes change rows. The {@code note}
     * is just baked into the description so the test reports something
     * distinguishing in the captured row.
     */
    private void editFirstPoint(Long standardId, String note) throws Exception {
        Long pointId = createdLotoPointIds.get(0);
        Map<String, Object> updatePayload = Map.of(
                "id", pointId,
                "tagNumber", "EDITED-" + pointId,
                "description", note,
                "zeroEnergyMethod", "ZE (" + note + ")"
        );
        mockMvc.perform(put("/ng/loto-points")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk());
    }

    /** Returns the current installProcedureText for the standard ("" if null). */
    private String installProcedureText(Long standardId) throws Exception {
        MvcResult res = mockMvc.perform(get("/ng/loto-standards/{id}", standardId)
                        .session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(res.getResponse().getContentAsString());
        JsonNode val = body.path("responseData").path("installProcedureText");
        if (val.isNull() || val.isMissingNode()) return "";
        return val.asText("");
    }

    /** Returns the LotoStandard.pendingReviewSince timestamp string (or null). */
    private String pendingReviewSince(Long standardId) throws Exception {
        MvcResult res = mockMvc.perform(get("/ng/loto-standards/{id}", standardId)
                        .session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(res.getResponse().getContentAsString());
        JsonNode val = body.path("responseData").path("pendingReviewSince");
        if (val.isNull() || val.isMissingNode()) return null;
        String s = val.asText("");
        return s.isEmpty() ? null : s;
    }

    /** Returns the responseData array of /ng/loto-standards/{id}/pending-changes. */
    private JsonNode getPendingChanges(Long standardId) throws Exception {
        MvcResult res = mockMvc.perform(get("/ng/loto-standards/{id}/pending-changes", standardId)
                        .session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).path("responseData");
    }

    /** Returns just the eventType strings from the workflow history. */
    private List<String> historyEventTypes(Long standardId) throws Exception {
        MvcResult res = mockMvc.perform(get("/ng/loto-standards/{id}/workflow/history", standardId)
                        .session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode events = objectMapper.readTree(res.getResponse().getContentAsString()).path("responseData");
        List<String> types = new ArrayList<>();
        for (JsonNode e : events) {
            String t = e.path("eventType").asText("?");
            if ("?".equals(t)) t = e.path("type").asText("?");
            types.add(t);
        }
        return types;
    }
}
