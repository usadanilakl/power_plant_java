package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * The client receive ack-gate (D6): a change pulled from the hub is acknowledged ONLY once it is
 * genuinely resolved. Deferred changes (a parent that hasn't arrived, an incomplete ManyToMany) are
 * kept pending so the hub re-sends them; and a change that never resolves is bounded — dead-lettered,
 * then acked — rather than either silently dropped or re-pulled forever.
 *
 * <p>This exercises the loop in {@code CentralSyncService.receiveIncomingChangesInBatches} in isolation:
 * a {@code @SpyBean} stubs the HTTP seams (fetch/count/ack) and the apply outcome, so the test drives
 * exactly which changes defer and asserts what gets acknowledged. The apply path's own disposition
 * contract is covered separately by {@code FieldSyncServiceDispositionIT}; this covers the loop that
 * consumes it — the give-up budget, the no-progress yield, and the terminal-only ack.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ackgate-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Client receive ack-gate (D6)")
class ClientAckGateReceiveIT {

    @SpyBean private CentralSyncService central;
    @MockBean private SyncDeadLetterService syncDeadLetterService;
    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private static FieldChange fc(String val) {
        FieldChange c = new FieldChange("LotoPoint", 1L, "description", null, "\"" + val + "\"",
                "REMOTE", "remote", FieldChange.ChangeType.UPDATE);
        c.setId(UUID.randomUUID());
        c.setTimestamp(Instant.now());
        return c;
    }

    @SuppressWarnings("unchecked")
    private static List<UUID> allAcked(ArgumentCaptor<List<UUID>> cap) {
        return cap.getAllValues().stream().flatMap(List::stream).toList();
    }

    @Test
    @DisplayName("a deferred change is NOT acked while a terminal one in the same batch IS")
    void deferredNotAcked_terminalAcked() {
        FieldChange applied = fc("applied");
        FieldChange orphan = fc("orphan");

        doReturn(2L).when(central).getPendingChangeCountFromServer();
        doReturn(List.of(applied, orphan)).doReturn(List.of())
                .when(central).fetchBatchFromServer(anyInt(), anyInt());
        doAnswer(inv -> { Set<UUID> deferred = inv.getArgument(1); deferred.add(orphan.getId()); return 1; })
                .when(central).applyIncomingChanges(anyList(), anySet());
        doNothing().when(central).acknowledgeChangesToServer(anyList());

        central.receiveIncomingChangesInBatches();

        ArgumentCaptor<List<UUID>> cap = ArgumentCaptor.forClass(List.class);
        verify(central, atLeastOnce()).acknowledgeChangesToServer(cap.capture());
        List<UUID> acked = allAcked(cap);
        assertThat(acked).as("the resolved change is acknowledged").contains(applied.getId());
        assertThat(acked).as("the deferred change must NOT be acked, so the hub keeps it pending and re-sends it")
                .doesNotContain(orphan.getId());
    }

    @Test
    @DisplayName("an all-deferred batch acks nothing and yields (morePending) instead of spinning")
    void allDeferred_yieldsWithoutAcking() {
        FieldChange orphan = fc("orphan-only");

        doReturn(1L).when(central).getPendingChangeCountFromServer();
        doReturn(List.of(orphan)).when(central).fetchBatchFromServer(anyInt(), anyInt());
        doAnswer(inv -> { Set<UUID> deferred = inv.getArgument(1); deferred.add(orphan.getId()); return 0; })
                .when(central).applyIncomingChanges(anyList(), anySet());

        CentralSyncService.BatchedReceiveResult r = central.receiveIncomingChangesInBatches();

        assertThat(r.morePending)
                .as("re-fetching page 0 would return the identical batch — must yield to the next cycle, not spin")
                .isTrue();
        verify(central, never()).acknowledgeChangesToServer(anyList());
    }

    @Test
    @DisplayName("a fully-deferred page does not block healthy changes queued behind it (head-of-line fix)")
    void fullyDeferredPage_doesNotBlockHealthyBehind() {
        FieldChange d1 = fc("d1"), d2 = fc("d2");   // page 0: both defer (e.g. a parent not yet arrived)
        FieldChange h1 = fc("h1"), h2 = fc("h2");   // page 1: healthy, queued BEHIND the deferred page

        doReturn(2).when(central).getReceiveBatchSize();
        doReturn(4L).when(central).getPendingChangeCountFromServer();
        doReturn(List.of(d1, d2)).when(central).fetchBatchFromServer(eq(0), anyInt());
        doReturn(List.of(h1, h2)).doReturn(List.of()).when(central).fetchBatchFromServer(eq(1), anyInt());
        doReturn(List.of()).when(central).fetchBatchFromServer(eq(2), anyInt());
        doAnswer(inv -> {
            List<FieldChange> b = inv.getArgument(0);
            Set<UUID> deferred = inv.getArgument(1);
            int applied = 0;
            for (FieldChange c : b) {
                if (c == d1 || c == d2) deferred.add(c.getId()); else applied++;
            }
            return applied;
        }).when(central).applyIncomingChanges(anyList(), anySet());
        doNothing().when(central).acknowledgeChangesToServer(anyList());

        central.receiveIncomingChangesInBatches();

        ArgumentCaptor<List<UUID>> cap = ArgumentCaptor.forClass(List.class);
        verify(central, atLeastOnce()).acknowledgeChangesToServer(cap.capture());
        List<UUID> acked = allAcked(cap);
        assertThat(acked)
                .as("the healthy changes queued behind the all-deferred page get through THIS drain, "
                        + "not after ~MAX_DEFERRALS cycles")
                .contains(h1.getId(), h2.getId());
        assertThat(acked)
                .as("the deferred page stays pending (not acked), to be retried next cycle")
                .doesNotContain(d1.getId(), d2.getId());
    }

    @Test
    @DisplayName("after MAX_DEFERRALS cycles an unresolved change is dead-lettered THEN acked (bounded, not silent)")
    void giveUp_deadLettersThenAcks() {
        FieldChange stuck = fc("stuck");

        doReturn(1L).when(central).getPendingChangeCountFromServer();
        doReturn(List.of(stuck)).when(central).fetchBatchFromServer(anyInt(), anyInt());
        doAnswer(inv -> { Set<UUID> deferred = inv.getArgument(1); deferred.add(stuck.getId()); return 0; })
                .when(central).applyIncomingChanges(anyList(), anySet());
        doNothing().when(central).acknowledgeChangesToServer(anyList());

        // Each cycle advances this id's attempt counter exactly once (per-drain counting). MAX_DEFERRALS
        // is 15 — on the 15th the give-up valve fires.
        for (int i = 0; i < 15; i++) central.receiveIncomingChangesInBatches();

        verify(syncDeadLetterService, times(1)).recordUnresolvedAfterRetries(any(FieldChange.class), eq(15));
        ArgumentCaptor<List<UUID>> cap = ArgumentCaptor.forClass(List.class);
        verify(central, atLeastOnce()).acknowledgeChangesToServer(cap.capture());
        assertThat(allAcked(cap))
                .as("acked only AFTER being recorded to the dead-letter table — bounded retry, never a silent drop")
                .contains(stuck.getId());
    }
}
