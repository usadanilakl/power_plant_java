package com.dk_power.power_plant_java.permits;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.permits.pojo.WorkRequestArea;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The per-area record on a work request.
 *
 * <p>Pure model behaviour, so no Spring context. What matters here is the two summary booleans:
 * SharePoint, the Power Automate flow, the work-request table and the permit generator all read
 * {@code isHotWorkRequired} / {@code isConfinedSpaceEntryRequired}, and none of them knows about
 * areas. If those did not stay in step, a multi-area request would look like it needed neither.
 */
class WorkRequestAreasTest {

    private static WorkRequestArea area(long id, String name, boolean cs, boolean hw) {
        WorkRequestArea a = new WorkRequestArea();
        a.setId(id);
        a.setName(name);
        a.setConfinedSpaceEntry(cs);
        a.setHotWork(hw);
        return a;
    }

    @Test
    @DisplayName("areas round-trip through the JSON column")
    void roundTrips() {
        WorkRequest wr = new WorkRequest();
        wr.setWorkAreas(List.of(area(1, "Boiler", true, false), area(2, "Turbine Deck", false, true)));

        List<WorkRequestArea> read = wr.getWorkAreas();
        assertThat(read).hasSize(2);
        assertThat(read.get(0).getName()).isEqualTo("Boiler");
        assertThat(read.get(0).isConfinedSpaceEntry()).isTrue();
        assertThat(read.get(1).isHotWork()).isTrue();
    }

    @Test
    @DisplayName("one area needing hot work turns the request's own hot-work flag on")
    void derivesHotWorkFlag() {
        WorkRequest wr = new WorkRequest();
        wr.setWorkAreas(List.of(area(1, "A", false, false), area(2, "B", false, true)));
        assertThat(wr.getIsHotWorkRequired())
                .as("every existing consumer reads this boolean, not the areas")
                .isTrue();
    }

    @Test
    @DisplayName("one area needing entry turns the request's own confined-space flag on")
    void derivesConfinedSpaceFlag() {
        WorkRequest wr = new WorkRequest();
        wr.setWorkAreas(List.of(area(1, "A", true, false)));
        assertThat(wr.getIsConfinedSpaceEntryRequired()).isTrue();
    }

    @Test
    @DisplayName("a job-level Yes is never contradicted by areas that tick nothing")
    void neverDowngradesAJobLevelYes() {
        // The requester answered "yes, hot work" for the job as a whole. Ticking no individual area
        // is a gap in their answer, not a retraction of it — and the safe reading of a gap is that
        // the hazard stands.
        WorkRequest wr = new WorkRequest();
        wr.setIsHotWorkRequired(Boolean.TRUE);
        wr.setIsConfinedSpaceEntryRequired(Boolean.TRUE);
        wr.setWorkAreas(List.of(area(1, "A", false, false)));

        assertThat(wr.getIsHotWorkRequired()).isTrue();
        assertThat(wr.getIsConfinedSpaceEntryRequired()).isTrue();
    }

    @Test
    @DisplayName("no areas means no opinion, not an empty list")
    void emptyIsNull() {
        assertThat(WorkRequestArea.toJson(List.of())).isNull();
        assertThat(WorkRequestArea.toJson(null)).isNull();

        WorkRequest wr = new WorkRequest();
        assertThat(wr.getWorkAreas()).isEmpty();
    }

    @Test
    @DisplayName("unreadable JSON reads as no areas rather than failing the page")
    void survivesMalformedJson() {
        WorkRequest wr = new WorkRequest();
        wr.setWorkAreasJson("{not json at all");
        assertThat(wr.getWorkAreas()).isEmpty();
    }

    @Test
    @DisplayName("a blank or unreadable SharePoint envelope never wipes local areas")
    void envelopeNeverWipesOnBlankOrGarbage() {
        // The column is added to an existing list by the provisioner, so every row already in
        // SharePoint returns empty for it until it is written to. Treating that as "clear the
        // areas" would erase every multi-area declaration on the first sync pass after
        // provisioning — the exact failure applyDeclaredHazardsEnvelope already guards against.
        WorkRequest wr = new WorkRequest();
        wr.setWorkAreas(List.of(area(1, "Boiler", true, false)));

        for (String incoming : new String[] {null, "", "   ", "null", "{not json", "[oops"}) {
            wr.applyWorkAreasEnvelope(incoming);
            assertThat(wr.getWorkAreas())
                    .as("incoming value %s must be treated as no opinion", incoming)
                    .hasSize(1);
        }
    }

    @Test
    @DisplayName("an explicit empty array IS honoured - that is a real answer")
    void explicitEmptyArrayClears() {
        WorkRequest wr = new WorkRequest();
        wr.setWorkAreas(List.of(area(1, "Boiler", true, false)));
        wr.applyWorkAreasEnvelope("[]");
        assertThat(wr.getWorkAreas())
                .as("the requester removing the extra areas is a decision, not a gap")
                .isEmpty();
    }

    @Test
    @DisplayName("an envelope repairs stale summary flags on the way in")
    void envelopeRepairsSummaryFlags() {
        WorkRequest wr = new WorkRequest();
        wr.setIsHotWorkRequired(Boolean.FALSE);
        wr.applyWorkAreasEnvelope(WorkRequestArea.toJson(List.of(area(1, "A", false, true))));
        assertThat(wr.getIsHotWorkRequired())
                .as("SharePoint can carry these stale from before the envelope existed")
                .isTrue();
    }

    @Test
    @DisplayName("the primary area is the flagged one, else the first")
    void picksPrimary() {
        WorkRequestArea first = area(1, "A", false, false);
        WorkRequestArea second = area(2, "B", false, false);
        second.setPrimary(true);

        assertThat(WorkRequestArea.primaryOf(List.of(first, second)).getName()).isEqualTo("B");
        assertThat(WorkRequestArea.primaryOf(List.of(first)).getName()).isEqualTo("A");
        assertThat(WorkRequestArea.primaryOf(List.of())).isNull();
        assertThat(WorkRequestArea.primaryOf(null)).isNull();
    }
}
