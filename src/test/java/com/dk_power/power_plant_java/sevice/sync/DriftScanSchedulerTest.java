package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriftScanSchedulerTest {

    @Mock
    private DriftDetectionService driftDetectionService;

    @Mock
    private SyncConfig syncConfig;

    private DriftScanScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DriftScanScheduler(driftDetectionService, syncConfig);
        ReflectionTestUtils.setField(scheduler, "enabled", true);
    }

    @Test
    void scheduledScanDoesNothingWhenDriftScanningIsDisabled() {
        ReflectionTestUtils.setField(scheduler, "enabled", false);

        scheduler.scheduledScan();

        verifyNoInteractions(syncConfig, driftDetectionService);
    }

    @Test
    void scheduledScanDoesNothingInHubMode() {
        when(syncConfig.isHubMode()).thenReturn(true);

        scheduler.scheduledScan();

        verify(syncConfig).isHubMode();
        verify(syncConfig, never()).isServerSyncConfigured();
        verifyNoInteractions(driftDetectionService);
    }

    @Test
    void scheduledScanDoesNothingWhenServerSyncIsUnconfigured() {
        when(syncConfig.isHubMode()).thenReturn(false);
        when(syncConfig.isServerSyncConfigured()).thenReturn(false);

        scheduler.scheduledScan();

        verify(syncConfig).isHubMode();
        verify(syncConfig).isServerSyncConfigured();
        verify(syncConfig, never()).getSyncServerUrl();
        verifyNoInteractions(driftDetectionService);
    }

    @Test
    void scheduledScanDoesNothingWhenConfiguredUrlIsWhitespace() {
        when(syncConfig.isHubMode()).thenReturn(false);
        when(syncConfig.isServerSyncConfigured()).thenReturn(true);
        when(syncConfig.getSyncServerUrl()).thenReturn("   ");

        scheduler.scheduledScan();

        verifyNoInteractions(driftDetectionService);
    }

    @Test
    void scheduledScanRunsForConfiguredClient() {
        when(syncConfig.isHubMode()).thenReturn(false);
        when(syncConfig.isServerSyncConfigured()).thenReturn(true);
        when(syncConfig.getSyncServerUrl()).thenReturn("https://hub.example.test");
        when(driftDetectionService.detectAll())
            .thenReturn(new DriftDetectionService.DriftScanResult());

        scheduler.scheduledScan();

        verify(syncConfig, never()).isServerSyncEnabled();
        verify(driftDetectionService).detectAll();
    }
}
