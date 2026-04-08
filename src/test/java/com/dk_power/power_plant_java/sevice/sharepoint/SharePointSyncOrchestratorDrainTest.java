package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the drain-barrier race-closing behavior for SharePointSyncOrchestrator.
 *
 * The key invariant: once clientSyncInProgress is set and waitForActiveSyncsToDrain()
 * returns, no SharePoint sync operation may still be in the "past the pause check"
 * state. A sync that was mid-registration must either (a) observe the flag and bail
 * before executing any DB work, or (b) have already drained before the barrier returned.
 */
@ExtendWith(MockitoExtension.class)
class SharePointSyncOrchestratorDrainTest {

    @Mock private SharePointSyncSettings syncSettings;
    @Mock private SyncConfig syncConfig;
    @Mock private CentralSyncService centralSyncService;
    @Mock private SharePointFieldMergeService fieldMergeService;

    private SharePointSyncOrchestrator orchestrator;

    @BeforeEach
    void setUp() {
        orchestrator = new SharePointSyncOrchestrator(
            Collections.emptyList(),
            syncSettings,
            syncConfig,
            centralSyncService,
            fieldMergeService);
    }

    @Test
    void waitForActiveSyncsToDrain_returnsImmediately_whenNoActiveSyncs() {
        boolean drained = orchestrator.waitForActiveSyncsToDrain(1000);
        assertThat(drained).isTrue();
    }

    @Test
    void waitForActiveSyncsToDrain_returnsFalse_onTimeout() throws Exception {
        // Use reflection to simulate an in-flight sync that never finishes
        var field = SharePointSyncOrchestrator.class.getDeclaredField("activeSyncCount");
        field.setAccessible(true);
        var counter = (java.util.concurrent.atomic.AtomicInteger) field.get(orchestrator);
        counter.incrementAndGet();
        try {
            long start = System.currentTimeMillis();
            boolean drained = orchestrator.waitForActiveSyncsToDrain(300);
            long elapsed = System.currentTimeMillis() - start;

            assertThat(drained).isFalse();
            assertThat(elapsed).isGreaterThanOrEqualTo(300);
        } finally {
            counter.decrementAndGet();
        }
    }

    @Test
    void drainBarrier_unblocksOnce_lastInFlightSyncCompletes() throws Exception {
        var field = SharePointSyncOrchestrator.class.getDeclaredField("activeSyncCount");
        field.setAccessible(true);
        var counter = (java.util.concurrent.atomic.AtomicInteger) field.get(orchestrator);

        counter.incrementAndGet();

        CountDownLatch barrierReturned = new CountDownLatch(1);
        Thread waiter = new Thread(() -> {
            orchestrator.waitForActiveSyncsToDrain(5000);
            barrierReturned.countDown();
        });
        waiter.start();

        // Barrier must NOT return while count > 0
        assertThat(barrierReturned.await(200, TimeUnit.MILLISECONDS)).isFalse();

        // Release the in-flight sync
        counter.decrementAndGet();

        // Barrier must now return promptly
        assertThat(barrierReturned.await(1, TimeUnit.SECONDS)).isTrue();
    }

    @Test
    void setClientSyncInProgress_andIsClientSyncInProgress_areConsistent() {
        assertThat(orchestrator.isClientSyncInProgress()).isFalse();

        orchestrator.setClientSyncInProgress(true);
        assertThat(orchestrator.isClientSyncInProgress()).isTrue();

        orchestrator.setClientSyncInProgress(false);
        assertThat(orchestrator.isClientSyncInProgress()).isFalse();
    }
}
