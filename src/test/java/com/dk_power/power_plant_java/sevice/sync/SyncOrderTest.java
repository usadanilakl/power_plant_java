package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The total order must be strict and deterministic, and — the whole point — reach the SAME winner
 * regardless of the order changes are presented in. The permutation test is the one that would have
 * caught the coin-flip: it feeds the same conflicting set in many orders and asserts one winner.
 */
@DisplayName("SyncOrder total order")
class SyncOrderTest {

    private static FieldChange fc(String origin, long epochMilli, UUID id) {
        FieldChange c = new FieldChange("LotoPoint", 1L, "description", null, "\"" + origin + "\"",
                origin, origin, FieldChange.ChangeType.UPDATE);
        c.setTimestamp(Instant.ofEpochMilli(epochMilli));
        c.setId(id);
        return c;
    }

    @Test
    @DisplayName("newer timestamp wins")
    void timestampWins() {
        FieldChange older = fc("M1", 1000, UUID.randomUUID());
        FieldChange newer = fc("M2", 2000, UUID.randomUUID());
        assertThat(SyncOrder.incomingWins(newer, older)).isTrue();
        assertThat(SyncOrder.incomingWins(older, newer)).isFalse();
    }

    @Test
    @DisplayName("EQUAL timestamp: broken by machine id, then id — deterministic, not a coin flip")
    void tieBrokenDeterministically() {
        UUID idA = UUID.fromString("00000000-0000-0000-0000-00000000000a");
        UUID idB = UUID.fromString("00000000-0000-0000-0000-00000000000b");
        FieldChange a = fc("MACHINE-A", 5000, idA);
        FieldChange b = fc("MACHINE-B", 5000, idB);
        // MACHINE-B > MACHINE-A, so b wins — and it wins whichever way we ask.
        assertThat(SyncOrder.incomingWins(b, a)).isTrue();
        assertThat(SyncOrder.incomingWins(a, b)).isFalse();

        // Same machine + same timestamp: fall through to id.
        FieldChange sameMachineLowId = fc("MACHINE-A", 5000, idA);
        FieldChange sameMachineHighId = fc("MACHINE-A", 5000, idB);
        assertThat(SyncOrder.incomingWins(sameMachineHighId, sameMachineLowId)).isTrue();
        assertThat(SyncOrder.incomingWins(sameMachineLowId, sameMachineHighId)).isFalse();
    }

    @Test
    @DisplayName("the same change re-delivered does not win over itself")
    void identicalDoesNotReapply() {
        UUID id = UUID.randomUUID();
        FieldChange x = fc("M1", 3000, id);
        FieldChange same = fc("M1", 3000, id);
        assertThat(SyncOrder.incomingWins(same, x)).as("no pointless re-apply on exact tie").isFalse();
    }

    @Test
    @DisplayName("PERMUTATION: the same conflicting set yields ONE winner in every order (the coin-flip guard)")
    void permutationAlwaysAgrees() {
        List<FieldChange> conflicts = new ArrayList<>(List.of(
                fc("MACHINE-A", 5000, UUID.fromString("00000000-0000-0000-0000-000000000001")),
                fc("MACHINE-B", 5000, UUID.fromString("00000000-0000-0000-0000-000000000002")),
                fc("MACHINE-C", 5000, UUID.fromString("00000000-0000-0000-0000-000000000003")),
                fc("MACHINE-A", 4999, UUID.fromString("00000000-0000-0000-0000-000000000004")),
                fc("MACHINE-B", 5001, UUID.fromString("00000000-0000-0000-0000-000000000005"))));

        FieldChange expected = null; // reduce with max over the canonical order
        for (FieldChange c : conflicts) expected = SyncOrder.max(expected, c);

        for (int trial = 0; trial < 200; trial++) {
            List<FieldChange> shuffled = new ArrayList<>(conflicts);
            Collections.shuffle(shuffled);
            FieldChange winner = null;
            for (FieldChange c : shuffled) winner = SyncOrder.max(winner, c);
            assertThat(winner)
                    .as("the winner must not depend on arrival order — that dependence IS the bug")
                    .isSameAs(expected);
        }
        // The MACHINE-B @5001 change is unambiguously newest.
        assertThat(expected.getOriginMachineId()).isEqualTo("MACHINE-B");
        assertThat(expected.getTimestamp()).isEqualTo(Instant.ofEpochMilli(5001));
    }

    @Test
    @DisplayName("property: transitivity + antisymmetry on a shuffled sort")
    void totalOrderProperties() {
        List<FieldChange> list = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            list.add(fc("M" + (i % 3), 1000 + (i % 5), new UUID(0, i)));
        }
        List<FieldChange> a = new ArrayList<>(list);
        List<FieldChange> b = new ArrayList<>(list);
        Collections.shuffle(a);
        Collections.shuffle(b);
        a.sort(SyncOrder.TOTAL);
        b.sort(SyncOrder.TOTAL);
        // A total order sorts any permutation to the identical sequence.
        assertThat(a).containsExactlyElementsOf(b);
    }
}
