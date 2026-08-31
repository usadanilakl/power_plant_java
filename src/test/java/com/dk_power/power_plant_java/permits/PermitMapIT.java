package com.dk_power.power_plant_java.permits;

import com.fasterxml.jackson.databind.JsonNode;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end coverage for the permits map: {@code GET /ng/work-areas/permit-map} and
 * {@code POST /ng/work-areas/permit-map/assign}.
 *
 * <p>The unit test for {@link com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaLocationResolver}
 * proves the matching rules in isolation. This proves the parts that only fail at runtime and that
 * no amount of compiling catches:
 *
 * <ul>
 *   <li>the JPQL actually parses and runs against the real entity model — {@code createQuery}
 *       strings are compiled on first execution, so a typo ships silently and 500s in production;</li>
 *   <li>the placement ladder picks the rule it should, end to end through the controller;</li>
 *   <li>assigning really writes the FK, and the item moves from "unplaced" to placed-by-AREA.</li>
 * </ul>
 *
 * <p>Same shape as the LOTO ITs: in-memory H2 so a running desktop's file DB stays unlocked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:permit-map-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Permits map")
class PermitMapIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private com.dk_power.power_plant_java.repository.permits.SafeWorkRepo safeWorkRepo;
    @Autowired private com.dk_power.power_plant_java.sevice.pwa.PwaReferenceDataService pwaReferenceDataService;
    @Autowired private com.dk_power.power_plant_java.repository.permits.WorkRequestRepo workRequestRepo;

    // SikuliX grabs a screen on construction and throws in a headless JVM, which fails the whole
    // context. Same mock the LOTO ITs use.
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    private JsonNode permitMap() throws Exception {
        String body = mockMvc.perform(get("/ng/work-areas/permit-map").session(session))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).path("responseData");
    }

    private long createWorkArea(String name) throws Exception {
        String body = mockMvc.perform(post("/ng/work-areas")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("name", name))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).path("responseData").path("id").asLong();
    }

    /** A work request with a location string and NO work-area FK — the PWA/SharePoint shape. */
    private long createWorkRequest(String scope, String location) throws Exception {
        String payload = objectMapper.writeValueAsString(java.util.List.of(
                java.util.Map.of("workScope", scope, "location", location, "status", "Active")));
        String body = mockMvc.perform(post("/ng/work-requests")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).path("responseData").get(0).path("id").asLong();
    }

    private JsonNode findItem(JsonNode arrayNode, long id) {
        for (JsonNode node : arrayNode) {
            if (node.path("layer").asText().equals("WR") && node.path("id").asLong() == id) return node;
        }
        return null;
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("the endpoint runs: every layer query parses and executes against the real schema")
    void endpointRuns() throws Exception {
        JsonNode data = permitMap();
        // A 200 with these three arrays present means all five layer queries plus the three
        // lookup projections executed. Bad JPQL would have thrown and been turned into a 400.
        assertThat(data.has("areas")).isTrue();
        assertThat(data.has("items")).isTrue();
        assertThat(data.has("unplaced")).isTrue();
    }

    @Test
    @DisplayName("a request whose location text names an area is placed there, marked TEXT")
    void placesByLocationText() throws Exception {
        long areaId = createWorkArea("Turbine Deck");
        // Exactly what the PWA composes when the payload reaches us without a workAreaId.
        long wrId = createWorkRequest("map-it text match", "Turbine Deck - east side by the rail");

        JsonNode placed = findItem(permitMap().path("items"), wrId);
        assertThat(placed)
                .as("work request %d should have been placed from its location text", wrId)
                .isNotNull();
        assertThat(placed.path("matchedBy").asText()).isEqualTo("TEXT");
        assertThat(placed.path("workAreaIds").get(0).asLong()).isEqualTo(areaId);
    }

    @Test
    @DisplayName("a request matching no area is reported as unplaced, never silently dropped")
    void reportsUnplaced() throws Exception {
        long wrId = createWorkRequest("map-it no match", "somewhere nobody ever named");

        JsonNode data = permitMap();
        assertThat(findItem(data.path("items"), wrId))
                .as("it matched no area, so it must not appear as placed")
                .isNull();
        assertThat(findItem(data.path("unplaced"), wrId))
                .as("an open request that could not be placed has to stay visible")
                .isNotNull();
    }

    @Test
    @DisplayName("assigning from the map writes the FK and re-places the item as AREA")
    void assignPlacesTheItem() throws Exception {
        long areaId = createWorkArea("Coal Yard North");
        long wrId = createWorkRequest("map-it assign", "no area name in this text at all");

        assertThat(findItem(permitMap().path("unplaced"), wrId)).isNotNull();

        String payload = objectMapper.writeValueAsString(java.util.Map.of(
                "workAreaId", areaId,
                "items", java.util.List.of(java.util.Map.of("layer", "WR", "id", wrId))));
        String body = mockMvc.perform(post("/ng/work-areas/permit-map/assign")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(body).path("responseData").path("assigned").asInt()).isEqualTo(1);

        JsonNode data = permitMap();
        assertThat(findItem(data.path("unplaced"), wrId))
                .as("it has an area now, so it must have left the unplaced list")
                .isNull();
        JsonNode placed = findItem(data.path("items"), wrId);
        assertThat(placed).isNotNull();
        assertThat(placed.path("matchedBy").asText())
                .as("a written FK outranks every guess")
                .isEqualTo("AREA");
        assertThat(placed.path("workAreaIds").get(0).asLong()).isEqualTo(areaId);
    }

    @Test
    @DisplayName("a work request that HAS a work area still lists with its area attached")
    void listingKeepsTheWorkAreaOnRequestsThatHaveOne() throws Exception {
        // Asserts the contract: a request that has a work area lists WITH that area, fully mapped.
        //
        // Context — WorkRequestMapper embeds a full WorkAreaDto, and WorkAreaMapper reads
        // WorkArea.constantLotos and .locations (both lazy @ManyToMany). With
        // spring.jpa.open-in-view=false the controllers were mapping DETACHED entities, so every
        // request that had an area threw LazyInitializationException and the per-row catch returned
        // it stripped of its associations — 117 ERRORs in one afternoon's production log. Only
        // requests WITH an area were affected, which is why it stayed rare; the map's assign feature
        // is exactly what makes that the common case.
        //
        // HONEST LIMIT: this test does not reproduce that detachment. Reverting the controller fix
        // leaves it green, so the MockMvc harness keeps the persistence context open somewhere the
        // real request does not. It guards the contract, not the specific defect — the defect's
        // evidence is the production stack trace, and the fix is to map inside the service
        // transaction, which is correct independently of what this harness can observe.
        long areaId = createWorkArea("Precipitator Row B");
        long wrId = createWorkRequest("map-it listing keeps area", "no area name in this text");

        mockMvc.perform(post("/ng/work-areas/permit-map/assign")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "workAreaId", areaId,
                                "items", java.util.List.of(java.util.Map.of("layer", "WR", "id", wrId))))))
                .andExpect(status().isOk());

        for (String path : java.util.List.of(
                "/ng/work-requests/get-all-by-status/Active",
                "/ng/work-requests/get-all",
                "/ng/work-requests/get-by-id/" + wrId)) {
            String body = mockMvc.perform(get(path).session(session))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            JsonNode data = objectMapper.readTree(body).path("responseData");
            JsonNode row = data.isArray() ? findById(data, wrId) : data;

            assertThat(row).as("%s did not return work request %d", path, wrId).isNotNull();
            assertThat(row.path("workArea").path("id").asLong())
                    .as("%s dropped the work area — it is mapping detached entities again", path)
                    .isEqualTo(areaId);
            // Sharper than the id check: an ATTACHED work area yields [] for an area with no
            // locations, a DETACHED one yields null (WorkAreaMapper's backstop). So this asserts
            // the mapping really happened inside a session, not merely that it survived.
            // hasNonNull, not path(...).isNull(): a field Jackson omitted comes back as a
            // MissingNode, whose isNull() is false — so the obvious spelling passes either way.
            assertThat(row.path("workArea").hasNonNull("constantLotoIds"))
                    .as("%s mapped the work area outside a session — constantLotos, the association "
                            + "that threw in production, came back null", path)
                    .isTrue();
            assertThat(row.path("workArea").hasNonNull("locationIds"))
                    .as("%s mapped the work area outside a session — its lazy lists came back null", path)
                    .isTrue();
        }
    }

    private JsonNode findById(JsonNode arrayNode, long id) {
        for (JsonNode node : arrayNode) {
            if (node.path("id").asLong() == id) return node;
        }
        return null;
    }

    /**
     * A Safe Work with no package and no status — "Building", i.e. open. Created through JPA so the
     * entity listeners behave exactly as they do in production.
     */
    private long createLooseSafeWork(String scope, String location, boolean deleted) {
        com.dk_power.power_plant_java.entities.permits.SafeWork sw =
                new com.dk_power.power_plant_java.entities.permits.SafeWork();
        sw.setWorkScope(scope);
        sw.setLocation(location);
        sw.setDeleted(deleted);
        return safeWorkRepo.save(sw).getId();
    }

    private JsonNode findAny(JsonNode arrayNode, String layer, long id) {
        for (JsonNode node : arrayNode) {
            if (node.path("layer").asText().equals(layer) && node.path("id").asLong() == id) return node;
        }
        return null;
    }

    @Test
    @DisplayName("soft-deleted permits are not listed on the map at all")
    void softDeletedPermitsAreNotListed() throws Exception {
        // The bug this guards. @Where(deleted...) lives on BaseIdEntity, a @MappedSuperclass, and
        // Hibernate does NOT inherit it — SafeWork/HotWork/ConfinedSpace never re-declared it, so
        // every query on them returns deleted rows unless it filters explicitly. The map listed
        // them, and staging one came back "SW #... no longer exists" from the assign endpoint's own
        // delete check: listed by one query, rejected by the next.
        long deletedId = createLooseSafeWork("map-it deleted", "nowhere", true);
        long liveId = createLooseSafeWork("map-it live", "nowhere", false);

        JsonNode data = permitMap();
        assertThat(findAny(data.path("items"), "SW", deletedId)).isNull();
        assertThat(findAny(data.path("unplaced"), "SW", deletedId))
                .as("a deleted permit must not reach the map, not even as unplaced")
                .isNull();
        assertThat(findAny(data.path("unplaced"), "SW", liveId))
                .as("the live one still has to show")
                .isNotNull();
    }

    @Test
    @DisplayName("cleanup finds permits with no package and closes them")
    void cleanupClosesOrphanedPermits() throws Exception {
        long orphanId = createLooseSafeWork("map-it orphan", "nowhere", false);

        String scan = mockMvc.perform(get("/ng/job-logs/maintenance/stranded-permits").session(session))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode rows = objectMapper.readTree(scan).path("responseData").path("rows");
        JsonNode found = null;
        for (JsonNode row : rows) {
            if (row.path("id").asLong() == orphanId && "SW".equals(row.path("layer").asText())) found = row;
        }
        assertThat(found).as("a permit with no package can never be closed by anything else").isNotNull();
        assertThat(found.path("reason").asText()).isEqualTo("ORPHANED");

        mockMvc.perform(post("/ng/job-logs/maintenance/close-stranded-permits?dryRun=false").session(session))
                .andExpect(status().isOk());

        assertThat(findAny(permitMap().path("unplaced"), "SW", orphanId))
                .as("once closed it is no longer open work and leaves the map")
                .isNull();
    }

    @Test
    @DisplayName("a dry run reports without changing anything")
    void cleanupDryRunChangesNothing() throws Exception {
        long orphanId = createLooseSafeWork("map-it dry run", "nowhere", false);

        mockMvc.perform(post("/ng/job-logs/maintenance/close-stranded-permits").session(session))
                .andExpect(status().isOk());

        assertThat(findAny(permitMap().path("unplaced"), "SW", orphanId))
                .as("a dry run must leave the permit exactly as it was")
                .isNotNull();
    }

    @Test
    @DisplayName("the PWA work-area payload carries the hazard profile and LOTO ids")
    void pwaPayloadCarriesHazardProfile() throws Exception {
        // The PWA wizard seeds a new request's hazards the moment the requester picks an area on
        // the map. That is only possible if the reference payload actually carries them — it used
        // to stop at isConfinedSpace.
        String body = objectMapper.writeValueAsString(java.util.Map.of(
                "name", "map-it payload area",
                "constantHazards", java.util.Map.of("highTemp", true, "fireHazard", true)));
        mockMvc.perform(post("/ng/work-areas")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Called with no transaction open, exactly as the live endpoint and the offline snapshot
        // builder do. Reading a lazy association here would throw LazyInitializationException —
        // which is why constantLotoIds comes from a projection, not from the entity.
        java.util.List<java.util.Map<String, Object>> areas = pwaReferenceDataService.getWorkAreas();

        java.util.Map<String, Object> row = areas.stream()
                .filter(a -> "map-it payload area".equals(a.get("name")))
                .findFirst().orElse(null);
        assertThat(row).as("the area we just created should be in the PWA payload").isNotNull();
        assertThat(row).containsKeys("constantHazards", "constantHotWorkMeasures",
                "constantConfinedSpaceHazards", "constantLotoIds", "isConfinedSpace");
        assertThat(objectMapper.valueToTree(row.get("constantHazards")).path("highTemp").asBoolean())
                .as("the hazards the area actually carries have to survive into the payload")
                .isTrue();
    }

    @Test
    @DisplayName("a request covering several areas is drawn on every one of them")
    void multiAreaRequestDrawsOnAllAreas() throws Exception {
        long a1 = createWorkArea("map-it multi alpha");
        long a2 = createWorkArea("map-it multi beta");
        long wrId = createWorkRequest("map-it multi", "no area name in this text");

        // Assign the primary through the map, then declare the second area on the request itself —
        // which is what the PWA does when the requester picks two areas.
        mockMvc.perform(post("/ng/work-areas/permit-map/assign")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "workAreaId", a1,
                                "items", java.util.List.of(java.util.Map.of("layer", "WR", "id", wrId))))))
                .andExpect(status().isOk());

        com.dk_power.power_plant_java.entities.permits.WorkRequest wr =
                workRequestRepo.findById(wrId).orElseThrow();
        com.dk_power.power_plant_java.entities.permits.pojo.WorkRequestArea second =
                new com.dk_power.power_plant_java.entities.permits.pojo.WorkRequestArea();
        second.setId(a2);
        second.setName("map-it multi beta");
        second.setConfinedSpaceEntry(true);
        wr.setWorkAreas(java.util.List.of(second));
        workRequestRepo.save(wr);

        JsonNode placed = findItem(permitMap().path("items"), wrId);
        assertThat(placed).isNotNull();
        java.util.List<Long> ids = new java.util.ArrayList<>();
        placed.path("workAreaIds").forEach(n -> ids.add(n.asLong()));
        assertThat(ids)
                .as("work covering two areas is happening in both, so it is drawn on both")
                .contains(a1, a2);

        assertThat(workRequestRepo.findById(wrId).orElseThrow().getIsConfinedSpaceEntryRequired())
                .as("an area needing entry has to turn the request's own flag on — that boolean is "
                        + "what SharePoint, the PA flow and the permit generator all read")
                .isTrue();
    }

    @Test
    @DisplayName("a stale reference rejects the whole batch, leaving the good rows untouched")
    void assignIsAllOrNothing() throws Exception {
        long areaId = createWorkArea("Ash Silo Base");
        long wrId = createWorkRequest("map-it batch", "no area name here either");

        String payload = objectMapper.writeValueAsString(java.util.Map.of(
                "workAreaId", areaId,
                "items", java.util.List.of(
                        java.util.Map.of("layer", "WR", "id", wrId),
                        java.util.Map.of("layer", "WR", "id", 999999999L))));
        mockMvc.perform(post("/ng/work-areas/permit-map/assign")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());

        // Validate-then-write: the good row must NOT have been assigned, because a partially
        // applied batch is exactly what the rollback-only trap used to turn into a lost sweep.
        assertThat(findItem(permitMap().path("unplaced"), wrId))
                .as("nothing should have been written when the batch was rejected")
                .isNotNull();
    }
}
