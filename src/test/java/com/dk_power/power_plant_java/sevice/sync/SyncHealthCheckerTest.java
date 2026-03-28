package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SyncHealthCheckerTest {

    @Mock
    private SyncConfig syncConfig;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private EntityTableRegistry entityTableRegistry;

    @Mock
    private SharePointSyncSettings sharePointSyncSettings;

    @Mock
    private FieldChangeRepository fieldChangeRepository;

    @Test
    void getLocalStatsUsesPendingQueueSemantics() {
        SyncHealthChecker checker = new SyncHealthChecker(
            syncConfig,
            jdbcTemplate,
            restTemplate,
            entityTableRegistry,
            sharePointSyncSettings,
            fieldChangeRepository
        );

        when(entityTableRegistry.getEntityTypeToTableMap()).thenReturn(Map.of());
        when(fieldChangeRepository.countPendingChangesFor("SERVER")).thenReturn(7L);

        SyncHealthChecker.LocalSyncStats stats = ReflectionTestUtils.invokeMethod(checker, "getLocalStats");

        assertThat(stats).isNotNull();
        assertThat(stats.getPendingSyncCount()).isEqualTo(7L);
        verify(fieldChangeRepository).countPendingChangesFor("SERVER");
    }

    @Test
    void compareSyncStatusTreatsRecentBacklogAsCatchingUp() {
        SyncHealthChecker checker = new SyncHealthChecker(
            syncConfig,
            jdbcTemplate,
            restTemplate,
            entityTableRegistry,
            sharePointSyncSettings,
            fieldChangeRepository
        );

        SyncHealthChecker.SyncHealthResult result = new SyncHealthChecker.SyncHealthResult();
        SyncHealthChecker.LocalSyncStats local = new SyncHealthChecker.LocalSyncStats();
        local.setPendingSyncCount(3L);
        local.setLatestChangeTime(Instant.now().minusSeconds(60));
        local.setEntityCounts(Map.of("WorkRequest", 10L));
        local.setFileCount(5L);

        SyncHealthChecker.ServerSyncStats server = new SyncHealthChecker.ServerSyncStats();
        server.setPendingChangesForClient(0L);
        server.setEntityCounts(Map.of("WorkRequest", 10L));
        server.setTotalEntities(10L);
        server.setFileCount(5L);

        ReflectionTestUtils.invokeMethod(checker, "compareSyncStatus", result, local, server);

        assertThat(result.isBacklogDetected()).isTrue();
        assertThat(result.getSyncStatus()).isEqualTo(SyncHealthChecker.SyncStatus.POSSIBLY_OUT_OF_SYNC);
        assertThat(result.getMessage()).contains("catching up");
        assertThat(result.getServerPendingChangesForClient()).isZero();
    }

    @Test
    void compareSyncStatusTreatsOldBacklogAsOutOfSync() {
        SyncHealthChecker checker = new SyncHealthChecker(
            syncConfig,
            jdbcTemplate,
            restTemplate,
            entityTableRegistry,
            sharePointSyncSettings,
            fieldChangeRepository
        );

        SyncHealthChecker.SyncHealthResult result = new SyncHealthChecker.SyncHealthResult();
        SyncHealthChecker.LocalSyncStats local = new SyncHealthChecker.LocalSyncStats();
        local.setPendingSyncCount(2L);
        local.setLatestChangeTime(Instant.now().minusSeconds(3600));
        local.setEntityCounts(Map.of("WorkRequest", 10L));
        local.setFileCount(5L);

        SyncHealthChecker.ServerSyncStats server = new SyncHealthChecker.ServerSyncStats();
        server.setPendingChangesForClient(0L);
        server.setEntityCounts(Map.of("WorkRequest", 10L));
        server.setTotalEntities(10L);
        server.setFileCount(5L);

        ReflectionTestUtils.invokeMethod(checker, "compareSyncStatus", result, local, server);

        assertThat(result.isBacklogDetected()).isTrue();
        assertThat(result.getSyncStatus()).isEqualTo(SyncHealthChecker.SyncStatus.OUT_OF_SYNC);
        assertThat(result.getMessage()).contains("backlog has not cleared");
    }

    @Test
    void compareSyncStatusReturnsInSyncWhenBacklogIsClearAndCountsMatch() {
        SyncHealthChecker checker = new SyncHealthChecker(
            syncConfig,
            jdbcTemplate,
            restTemplate,
            entityTableRegistry,
            sharePointSyncSettings,
            fieldChangeRepository
        );

        SyncHealthChecker.SyncHealthResult result = new SyncHealthChecker.SyncHealthResult();
        SyncHealthChecker.LocalSyncStats local = new SyncHealthChecker.LocalSyncStats();
        local.setPendingSyncCount(0L);
        local.setEntityCounts(Map.of("WorkRequest", 10L));
        local.setFileCount(5L);

        SyncHealthChecker.ServerSyncStats server = new SyncHealthChecker.ServerSyncStats();
        server.setPendingChangesForClient(0L);
        server.setEntityCounts(Map.of("WorkRequest", 10L));
        server.setTotalEntities(10L);
        server.setFileCount(5L);

        ReflectionTestUtils.invokeMethod(checker, "compareSyncStatus", result, local, server);

        assertThat(result.isBacklogDetected()).isFalse();
        assertThat(result.getSyncStatus()).isEqualTo(SyncHealthChecker.SyncStatus.IN_SYNC);
        assertThat(result.getMessage()).contains("counts match");
    }
}
