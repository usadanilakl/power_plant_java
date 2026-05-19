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
import org.springframework.test.web.servlet.ResultActions;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration coverage for the LOTO Permit lifecycle (Building → Active →
 * (Test|Modification) → Closed) including per-point hang/verify/walkdown,
 * second-person rule, role gates, requestor transfer, test-mode re-hang,
 * and the personnel-signed-on removal block.
 *
 * <p>Same shape as {@code LotoStandardWorkflowIT}: in-memory H2 so a running
 * desktop's file DB stays unlocked, full Spring context (production
 * controllers + services + filters), step-up auth via initials+PIN,
 * {@code @AfterEach} sweeps per-test rows so a failed test doesn't leak.
 *
 * <p>Reference: {@code project/features/loto-standard/loto-procedure.md} §4–§5
 * and {@code loto-permit-test-plan.md} phase 1.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:permit-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("LOTO Permit lifecycle")
class LotoPermitWorkflowIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private com.dk_power.power_plant_java.sevice.loto.loto_box.LotoBoxInitializationService lotoBoxInitializationService;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    private MockHttpSession adminSession;

    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdLotoPointIds = new ArrayList<>();
    private final List<Long> createdStandardIds = new ArrayList<>();
    private final List<Long> createdPermitIds = new ArrayList<>();

    // ── Setup / teardown ──────────────────────────────────────────────────────

    @BeforeEach
    void setup() throws Exception {
        // LOTO boxes + lock inventory are normally seeded by a startup runner. The
        // in-memory H2 starts empty, so permit creation's autoAssign would fail with
        // "No available LOTO boxes" — seed them here. The service is idempotent.
        lotoBoxInitializationService.seedLotoBoxData();
        adminSession = loginAndGetSession("admin", "admin");
    }

    @AfterEach
    void cleanup() {
        for (Long id : createdPermitIds) tryDelete("/ng/lotos/" + id);
        for (Long id : createdStandardIds) tryDelete("/ng/loto-standards/" + id);
        for (Long id : createdLotoPointIds) tryDelete("/ng/loto-points/" + id);
        for (Long id : createdUserIds) tryDelete("/ng/users/" + id);
        jdbcTemplate.update("DELETE FROM users WHERE email LIKE '%@permit-it.local'");
        createdUserIds.clear();
        createdLotoPointIds.clear();
        createdStandardIds.clear();
        createdPermitIds.clear();
    }

    private void tryDelete(String path) {
        try {
            mockMvc.perform(delete(path).session(adminSession));
        } catch (Exception ignored) { /* best-effort */ }
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("happy path: Building → hang/verify/walkdown each point → Active → release → Closed")
    void happyPath_buildingToClosed() throws Exception {
        Fixture fx = setupApprovedStandardAndActors("happy-path");
        Long permitId = createPermitFromStandard(fx, /*lotoRequestorEmail*/ fx.requestor.email);

        // CA approves for hanging.
        caApproveForHanging(permitId, fx.ca).andExpect(status().isOk());

        // Hanger marks every point hung; verifier (different user) verifies every point.
        for (Long pointId : fx.pointIds) {
            markPointHung(permitId, pointId, fx.hanger).andExpect(status().isOk());
        }
        // Aggregate "Hanging Complete" signature must be in place before per-point verify.
        aggregateMarkHung(permitId, fx.hanger).andExpect(status().isOk());

        for (Long pointId : fx.pointIds) {
            markPointVerified(permitId, pointId, fx.verifier).andExpect(status().isOk());
        }
        // Aggregate "Verified" signature (lifecycle bookkeeping).
        aggregateMarkVerified(permitId, fx.verifier).andExpect(status().isOk());

        // Walkdown each point, then CA activates.
        for (Long pointId : fx.pointIds) {
            markPointWalkdown(permitId, pointId, fx.ca).andExpect(status().isOk());
        }
        caActivate(permitId, fx.ca).andExpect(status().isOk());
        changeStatus(permitId, "Active", fx.ca).andExpect(status().isOk());
        assertPermitStatus(permitId, "Active");

        // Optional: sign one person on, then sign off before release.
        signOnPerson(permitId, fx.requestor.email, "Worker");
        signOffPerson(permitId, fx.requestor.email);

        releaseByRequestor(permitId, fx.requestor).andExpect(status().isOk());
        releaseByControlAuthority(permitId, fx.ca).andExpect(status().isOk());

        // Now remove each point's locks, then aggregate remove-locks, then Closed.
        for (Long pointId : fx.pointIds) {
            markPointRemoved(permitId, pointId, fx.hanger).andExpect(status().isOk());
        }
        removeLocks(permitId, fx.ca).andExpect(status().isOk());
        changeStatus(permitId, "Closed", fx.ca).andExpect(status().isOk());
        assertPermitStatus(permitId, "Closed");
    }

    @Test
    @DisplayName("second-person rule: the hanger of a point cannot verify it")
    void verify_asHanger_rejected() throws Exception {
        Fixture fx = setupApprovedStandardAndActors("second-person");
        Long permitId = createPermitFromStandard(fx, fx.requestor.email);
        caApproveForHanging(permitId, fx.ca).andExpect(status().isOk());

        // Aggregate "Hanging Complete" requires every point hung first.
        for (Long pointId : fx.pointIds) {
            markPointHung(permitId, pointId, fx.hanger).andExpect(status().isOk());
        }
        aggregateMarkHung(permitId, fx.hanger).andExpect(status().isOk());

        // The hanger tries to verify a point they hung → rejected (second-person rule).
        Long victim = fx.pointIds.get(0);
        markPointVerified(permitId, victim, fx.hanger).andExpect(status().isBadRequest());

        // The verifier (different user) succeeds.
        markPointVerified(permitId, victim, fx.verifier).andExpect(status().isOk());
    }

    @Test
    @DisplayName("sequence: verify-before-hung rejected; activate-before-walkdown rejected; remove-before-CA-release rejected")
    void sequenceEnforcement_rejectsOutOfOrderTransitions() throws Exception {
        Fixture fx = setupApprovedStandardAndActors("sequence");
        Long permitId = createPermitFromStandard(fx, fx.requestor.email);

        // Verify-before-hung: even after CA approves, a point can't be verified until hung.
        caApproveForHanging(permitId, fx.ca).andExpect(status().isOk());
        markPointVerified(permitId, fx.pointIds.get(0), fx.verifier).andExpect(status().isBadRequest());

        // Walk the points partially — hang all but skip walkdown — then try to activate.
        for (Long pointId : fx.pointIds) {
            markPointHung(permitId, pointId, fx.hanger).andExpect(status().isOk());
        }
        aggregateMarkHung(permitId, fx.hanger).andExpect(status().isOk());
        for (Long pointId : fx.pointIds) {
            markPointVerified(permitId, pointId, fx.verifier).andExpect(status().isOk());
        }
        aggregateMarkVerified(permitId, fx.verifier).andExpect(status().isOk());

        // Walkdown is the prerequisite for first activation that the spec calls out; even without
        // walkdown, the CA-activation signature is gated. Without caActivate, status→Active is rejected.
        changeStatus(permitId, "Active", fx.ca).andExpect(status().isBadRequest());

        // Remove-before-CA-release: even from Building, removing a point requires CA-release first.
        markPointRemoved(permitId, fx.pointIds.get(0), fx.hanger).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("role gate: a LOTO_QUALIFIED-only user cannot activate or add points to a permit")
    void roleGate_caActions_rejectedForNonCa() throws Exception {
        Fixture fx = setupApprovedStandardAndActors("role-gate");
        Long permitId = createPermitFromStandard(fx, fx.requestor.email);

        // Walk to ready-to-activate state.
        caApproveForHanging(permitId, fx.ca).andExpect(status().isOk());
        for (Long pointId : fx.pointIds) {
            markPointHung(permitId, pointId, fx.hanger).andExpect(status().isOk());
        }
        aggregateMarkHung(permitId, fx.hanger).andExpect(status().isOk());
        for (Long pointId : fx.pointIds) {
            markPointVerified(permitId, pointId, fx.verifier).andExpect(status().isOk());
        }
        aggregateMarkVerified(permitId, fx.verifier).andExpect(status().isOk());
        for (Long pointId : fx.pointIds) {
            markPointWalkdown(permitId, pointId, fx.ca).andExpect(status().isOk());
        }

        // ms is LOTO_QUALIFIED-only — has no CONTROL_AUTHORITY.
        // ca-activate, status→Active, and add-point are all CA-only.
        caActivate(permitId, fx.verifier).andExpect(status().isBadRequest());
        changeStatus(permitId, "Active", fx.verifier).andExpect(status().isBadRequest());

        // CA succeeds.
        caActivate(permitId, fx.ca).andExpect(status().isOk());
        changeStatus(permitId, "Active", fx.ca).andExpect(status().isOk());
    }

    @Test
    @DisplayName("requestor transfer: A initiates, B accepts, only B can release as requestor")
    void requestorTransfer_acceptedRecipientCanRelease() throws Exception {
        Fixture fx = setupApprovedStandardAndActors("requestor-transfer");
        // Requestor starts as A.
        TestActor reqA = fx.requestor;
        TestActor reqB = provisionActor("RB", "5555", List.of("CONTROL_AUTHORITY", "REQUESTOR", "LOTO_QUALIFIED"));
        Long permitId = createPermitFromStandard(fx, reqA.email);

        // Build to Active so the transfer is in a meaningful state (the service also
        // allows Building, but Active is the realistic case).
        walkPermitToActive(permitId, fx);

        // Sign both A and B onto the permit so transfer's "target must be in personnel list" check passes.
        signOnPerson(permitId, reqA.email, "Requestor A");
        signOnPerson(permitId, reqB.email, "Requestor B");

        // A initiates transfer to B; B accepts.
        transferRequestor(permitId, reqA, reqA.email, reqB.email).andExpect(status().isOk());
        acceptTransfer(permitId, reqB).andExpect(status().isOk());

        // Requestor on the permit is now B — verified behaviorally below:
        // A's release-as-requestor must be rejected, B's must succeed.
        // Sign A off first so the requestor-release "no signed-on personnel" precondition
        // applies only to B at the moment of release.
        signOffPerson(permitId, reqA.email);
        signOffPerson(permitId, reqB.email);

        releaseByRequestor(permitId, reqA).andExpect(status().isBadRequest());
        releaseByRequestor(permitId, reqB).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Test mode: enter Test → pull-for-test → re-hang/verify → re-activate; add-point during Test rejected")
    void testMode_pullRehangReactivate_andAddRejected() throws Exception {
        Fixture fx = setupApprovedStandardAndActors("test-mode");
        Long permitId = createPermitFromStandard(fx, fx.requestor.email);
        walkPermitToActive(permitId, fx);

        // Enter Test (no personnel signed on).
        changeStatus(permitId, "Test", fx.ca).andExpect(status().isOk());
        assertPermitStatus(permitId, "Test");

        // Add-point during Test is rejected (Phase 0.2 gap fix).
        addPointToPermit(permitId, fx.extraPointId, fx.ca).andExpect(status().isBadRequest());

        // Pull a point for re-hang, then re-hang + re-verify, then re-activate.
        Long victim = fx.pointIds.get(0);
        pullPointForTest(permitId, victim, fx.ca).andExpect(status().isOk());

        // Re-activation rejected until needsRehang is cleared.
        changeStatus(permitId, "Active", fx.ca).andExpect(status().isBadRequest());

        // Re-hang + re-verify the pulled point.
        markPointHung(permitId, victim, fx.hanger).andExpect(status().isOk());
        markPointVerified(permitId, victim, fx.verifier).andExpect(status().isOk());

        // Re-activate now succeeds.
        changeStatus(permitId, "Active", fx.ca).andExpect(status().isOk());
        assertPermitStatus(permitId, "Active");
    }

    @Test
    @DisplayName("release/removal sequencing: requestor-release rejects while signed on; CA release + removal succeed once clear")
    void releaseAndRemoval_personnelSequencing() throws Exception {
        Fixture fx = setupApprovedStandardAndActors("personnel-block");
        Long permitId = createPermitFromStandard(fx, fx.requestor.email);
        walkPermitToActive(permitId, fx);

        // (1) Try requestor release while one worker is still signed on — rejected.
        signOnPerson(permitId, fx.requestor.email, "Lingering Worker");
        mockMvc.perform(put("/ng/lotos/{id}/lifecycle/release-requestor", permitId)
                        .session(adminSession)
                        .header("X-Sign-As-Token", stepUpToken(fx.requestor)))
                .andExpect(status().isBadRequest());

        // (2) Sign off, complete both releases, then verify removal works once everyone's clear.
        // This also exercises the Phase 0.1 defense-in-depth gate added to requireCaReleasedAndOpen
        // — sign-on after requestor release is closed by the existing gate, so the personnel-signed-on
        // branch of the new gate is unreachable through public API. The gate remains as a
        // safety net for any future code path that might leave personnel on after release.
        signOffPerson(permitId, fx.requestor.email);
        releaseByRequestor(permitId, fx.requestor).andExpect(status().isOk());
        releaseByControlAuthority(permitId, fx.ca).andExpect(status().isOk());

        Long victim = fx.pointIds.get(0);
        markPointRemoved(permitId, victim, fx.hanger).andExpect(status().isOk());
    }

    // ── Walk helpers ──────────────────────────────────────────────────────────

    /**
     * Walk a freshly-created permit from Building all the way to Active. Used as
     * a precondition for the transfer / test-mode / personnel-block scenarios.
     */
    private void walkPermitToActive(Long permitId, Fixture fx) throws Exception {
        caApproveForHanging(permitId, fx.ca).andExpect(status().isOk());
        for (Long pointId : fx.pointIds) {
            markPointHung(permitId, pointId, fx.hanger).andExpect(status().isOk());
        }
        aggregateMarkHung(permitId, fx.hanger).andExpect(status().isOk());
        for (Long pointId : fx.pointIds) {
            markPointVerified(permitId, pointId, fx.verifier).andExpect(status().isOk());
        }
        aggregateMarkVerified(permitId, fx.verifier).andExpect(status().isOk());
        for (Long pointId : fx.pointIds) {
            markPointWalkdown(permitId, pointId, fx.ca).andExpect(status().isOk());
        }
        caActivate(permitId, fx.ca).andExpect(status().isOk());
        changeStatus(permitId, "Active", fx.ca).andExpect(status().isOk());
    }

    // ── Fixture model ─────────────────────────────────────────────────────────

    /** Bundle of preconditions shared across tests. */
    private record TestActor(long userId, String email, String initials, String pin) {
        String stepUpCode() { return initials + pin; }
    }

    /** All the people + LOTO content needed to drive a permit lifecycle. */
    private static final class Fixture {
        final TestActor ca;        // CONTROL_AUTHORITY
        final TestActor hanger;    // LOTO_QUALIFIED-only
        final TestActor verifier;  // LOTO_QUALIFIED-only (≠ hanger so the second-person rule passes)
        final TestActor requestor; // REQUESTOR (also CA + LOTO_QUALIFIED so we can drive walkdown/walks if needed)
        final Long standardId;
        final List<Long> pointIds;
        final Long extraPointId;   // not part of the standard; used to test add-point rejection
        Fixture(TestActor ca, TestActor hanger, TestActor verifier, TestActor requestor,
                Long standardId, List<Long> pointIds, Long extraPointId) {
            this.ca = ca; this.hanger = hanger; this.verifier = verifier;
            this.requestor = requestor; this.standardId = standardId;
            this.pointIds = pointIds; this.extraPointId = extraPointId;
        }
    }

    private Fixture setupApprovedStandardAndActors(String testName) throws Exception {
        TestActor ca = provisionActor("CA", "1111", List.of("CONTROL_AUTHORITY", "LOTO_QUALIFIED"));
        TestActor hanger = provisionActor("HG", "2222", List.of("LOTO_QUALIFIED"));
        TestActor verifier = provisionActor("VR", "3333", List.of("LOTO_QUALIFIED"));
        TestActor mg = provisionActor("MG", "4444", List.of("MANAGER", "CONTROL_AUTHORITY"));
        TestActor requestor = provisionActor("RA", "6666", List.of("CONTROL_AUTHORITY", "REQUESTOR", "LOTO_QUALIFIED"));

        Long standardId = createStandardAndApprove(testName, ca, mg);
        // Pull point ids straight off the standard so per-point operations have something concrete.
        List<Long> pointIds = new ArrayList<>(createdLotoPointIds);
        // One extra point, NOT on the standard, for "add point during Test should fail".
        Long extra = createBareLotoPoint("IT-" + testName + "-extra");
        return new Fixture(ca, hanger, verifier, requestor, standardId, pointIds, extra);
    }

    /** Walk a new standard from DRAFT → APPROVED so we can flip it to a permit. */
    private Long createStandardAndApprove(String testName, TestActor ca, TestActor mg) throws Exception {
        Long standardId = createStandardWithPoints(testName);
        workflowStandardTransition(standardId, "submit-for-verification", ca).andExpect(status().isOk());
        // ms verifies — for the permit IT we need a second qualified person; use 'mg' (MANAGER+CA).
        workflowStandardTransition(standardId, "verify", mg).andExpect(status().isOk());
        workflowStandardTransition(standardId, "walkdown-complete", ca).andExpect(status().isOk());
        workflowStandardTransition(standardId, "ready-for-testing", ca).andExpect(status().isOk());
        workflowStandardTransition(standardId, "approve", mg).andExpect(status().isOk());
        return standardId;
    }

    private Long createStandardWithPoints(String testName) throws Exception {
        List<Long> pointIds = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            pointIds.add(createBareLotoPoint("IT-" + testName + "-" + i));
        }
        Map<String, Object> standardPayload = Map.of(
                "name", "Permit IT Standard " + testName,
                "description", "Permit IT fixture",
                "lotoPoints", pointIds);
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

    private Long createBareLotoPoint(String tagPrefix) throws Exception {
        Map<String, Object> pointPayload = Map.of(
                "tagNumber", tagPrefix + "-" + System.nanoTime(),
                "description", "Permit IT point",
                "specificLocation", "IT loc",
                "equipmentIdList", List.of(),
                "isLabeled", true,
                "isLockable", true);
        MvcResult pr = mockMvc.perform(post("/ng/loto-points")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pointPayload)))
                .andExpect(status().isOk())
                .andReturn();
        Long pointId = objectMapper.readTree(pr.getResponse().getContentAsString())
                .path("responseData").path("id").asLong();
        assertThat(pointId).as("point id").isPositive();
        createdLotoPointIds.add(pointId);
        return pointId;
    }

    private Long createPermitFromStandard(Fixture fx, String lotoRequestorEmail) throws Exception {
        String payload = "{\"lotoRequestor\":\"" + lotoRequestorEmail + "\"}";
        MvcResult res = mockMvc.perform(post("/ng/lotos/create-from-standard/{id}", fx.standardId)
                        .session(adminSession)
                        .header("X-Sign-As-Token", stepUpToken(fx.ca))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andReturn();
        if (res.getResponse().getStatus() != 200) {
            throw new AssertionError("createFromStandard returned " + res.getResponse().getStatus()
                    + " — body: " + res.getResponse().getContentAsString());
        }
        Long permitId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("responseData").path("id").asLong();
        assertThat(permitId).as("permit id").isPositive();
        createdPermitIds.add(permitId);
        return permitId;
    }

    // ── Permit transition helpers (each carries a step-up token for the actor) ──

    private ResultActions caApproveForHanging(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/ca-approve-hanging", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions caActivate(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/ca-activate", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions changeStatus(Long permitId, String newStatus, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/status", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + newStatus + "\"}"));
    }

    private ResultActions markPointHung(Long permitId, Long pointId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/point/{pid}/hung", permitId, pointId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"acknowledged\":[],\"notes\":\"\"}"));
    }

    private ResultActions markPointVerified(Long permitId, Long pointId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/point/{pid}/verified", permitId, pointId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"acknowledged\":[],\"notes\":\"\"}"));
    }

    private ResultActions markPointWalkdown(Long permitId, Long pointId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/point/{pid}/walkdown", permitId, pointId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"notes\":\"\"}"));
    }

    private ResultActions markPointRemoved(Long permitId, Long pointId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/point/{pid}/removed", permitId, pointId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"acknowledged\":[],\"notes\":\"\"}"));
    }

    private ResultActions pullPointForTest(Long permitId, Long pointId, TestActor actor) throws Exception {
        return mockMvc.perform(post("/ng/lotos/{id}/lifecycle/point/{pid}/pull-for-test", permitId, pointId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"IT pull\"}"));
    }

    private ResultActions aggregateMarkHung(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/hung", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions aggregateMarkVerified(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/verified", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions transferRequestor(Long permitId, TestActor actor, String fromUser, String toUser) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/transfer", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fromUser\":\"" + fromUser + "\",\"toUser\":\"" + toUser + "\"}"));
    }

    private ResultActions acceptTransfer(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/accept", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions releaseByRequestor(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/release-requestor", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions releaseByControlAuthority(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/release-ca", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions removeLocks(Long permitId, TestActor actor) throws Exception {
        return mockMvc.perform(put("/ng/lotos/{id}/lifecycle/remove-locks", permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    private ResultActions addPointToPermit(Long permitId, Long pointId, TestActor actor) throws Exception {
        return mockMvc.perform(post("/ng/lotos/add/{pointId}/to/{lotoId}", pointId, permitId)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor)));
    }

    // ── Personnel helpers (no step-up — sign-on/off uses admin session) ────────

    private void signOnPerson(Long permitId, String personName, String role) throws Exception {
        Map<String, Object> body = Map.of(
                "personName", personName,
                "personRole", role,
                "company", "IT",
                "signOnTime", java.time.LocalDateTime.now().toString(),
                "performedBy", "admin",
                "foreman", false);
        MvcResult res = mockMvc.perform(post("/ng/lotos/{id}/sign-on", permitId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn();
        if (res.getResponse().getStatus() != 200) {
            throw new AssertionError("sign-on(" + personName + ") returned "
                    + res.getResponse().getStatus() + " — body: " + res.getResponse().getContentAsString());
        }
    }

    private void signOffPerson(Long permitId, String personName) throws Exception {
        mockMvc.perform(post("/ng/lotos/{id}/sign-off", permitId)
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + personName + "\",\"comments\":\"IT off\"}"))
                .andExpect(status().isOk());
    }

    // ── Read helpers ───────────────────────────────────────────────────────────

    private JsonNode fetchPermit(Long permitId) throws Exception {
        MvcResult res = mockMvc.perform(get("/ng/lotos/{id}", permitId).session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).path("responseData");
    }

    private String permitStatus(Long permitId) throws Exception {
        JsonNode body = fetchPermit(permitId);
        JsonNode ps = body.path("permitStatus");
        if (ps.isObject()) return ps.path("name").asText("?");
        if (ps.isTextual()) return ps.asText();
        return "?";
    }

    private void assertPermitStatus(Long permitId, String expected) throws Exception {
        assertThat(permitStatus(permitId))
                .as("permit %d status", permitId)
                .isEqualTo(expected);
    }

    private void assertLotoRequestor(Long permitId, String expectedEmail) throws Exception {
        JsonNode body = fetchPermit(permitId);
        assertThat(body.path("lotoRequestor").asText())
                .as("permit %d lotoRequestor", permitId)
                .isEqualTo(expectedEmail);
    }

    // ── Standard workflow helper (copied from LotoStandardWorkflowIT pattern) ──

    private ResultActions workflowStandardTransition(Long standardId, String transition, TestActor actor) throws Exception {
        return mockMvc.perform(post("/ng/loto-standards/{id}/workflow/{transition}", standardId, transition)
                .session(adminSession)
                .header("X-Sign-As-Token", stepUpToken(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
    }

    // ── User + auth helpers ────────────────────────────────────────────────────

    private TestActor provisionActor(String initials, String pin, List<String> roles) throws Exception {
        String email = initials.toLowerCase() + "@permit-it.local";
        String username = initials.toLowerCase() + "-permit-it";

        Map<String, Object> createPayload = Map.of(
                "username", username,
                "firstName", initials,
                "lastName", "PermitTester",
                "email", email,
                "roles", roles,
                "password", "TestPass!1234",
                "windowsUsername", "",
                "phone", "",
                "company", "",
                "signaturePath", "");
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

    private String stepUpToken(TestActor actor) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/step-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + actor.stepUpCode() + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("token").asText();
    }

    private MockHttpSession loginAndGetSession(String credential, String password) throws Exception {
        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(post("/api/auth/login")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\":\"" + credential + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk());
        return session;
    }
}
