package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies that resetSequences() generates the correct SQL for various scenarios.
 * Uses mocks instead of a real H2 instance because H2's RESTART WITH semantics
 * don't match PostgreSQL's, and this code only ever runs against PG.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class H2ToPostgresMigrationServiceSequenceTest {

    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private EntityTableRegistry entityTableRegistry;
    @Mock private SharePointSyncOrchestrator sharePointSyncOrchestrator;

    private H2ToPostgresMigrationService service;

    @BeforeEach
    void setUp() {
        service = new H2ToPostgresMigrationService(jdbcTemplate, entityTableRegistry, sharePointSyncOrchestrator);
    }

    private void mockTablesWithIdColumn(List<String> tables) {
        when(jdbcTemplate.queryForList(
            anyString(),
            eq(String.class)
        )).thenReturn(tables);
    }

    private void mockMaxSuffix(String table, Long value) {
        when(jdbcTemplate.queryForObject(
            anyString(),
            eq(Long.class),
            any(), any(), any()
        )).thenReturn(value);
    }

    @Test
    void resetSequences_usesFallbackDevice99_whenMachineIdMissing() {
        // No machine-id.properties on disk → readDeviceNumber returns -1 → fallback 99
        // Empty table list → no rows scanned, but id_seq still RESTART
        mockTablesWithIdColumn(Collections.emptyList());
        // Identity sequences query returns empty (PG-only catalog tables)
        when(jdbcTemplate.queryForList(anyString())).thenReturn(Collections.emptyList());

        ReflectionTestUtils.invokeMethod(service, "resetSequences");

        // Even with no rows, id_seq must be restarted to a known state (1)
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, atLeastOnce()).execute(sqlCaptor.capture());
        assertThat(sqlCaptor.getAllValues()).anyMatch(s -> s.contains("ALTER SEQUENCE id_seq RESTART WITH 1"));
    }

    @Test
    void resetSequences_advancesIdSeq_pastMaxSuffix() {
        mockTablesWithIdColumn(List.of("equipment"));
        // Simulate device 99 with max suffix 250
        mockMaxSuffix("equipment", 250L);
        when(jdbcTemplate.queryForList(anyString())).thenReturn(Collections.emptyList());

        ReflectionTestUtils.invokeMethod(service, "resetSequences");

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, atLeastOnce()).execute(sqlCaptor.capture());
        // Restart should be 251 (max suffix + 1)
        assertThat(sqlCaptor.getAllValues()).anyMatch(s -> s.contains("ALTER SEQUENCE id_seq RESTART WITH 251"));
    }

    @Test
    void resetSequences_propagatesIdentitySequenceFailures() {
        mockTablesWithIdColumn(Collections.emptyList());
        // Identity sequence query returns one row
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.<java.util.Map<String, Object>>of(
            java.util.Map.of("seq_name", "hub_stored_backups_id_seq",
                "table_name", "hub_stored_backups",
                "column_name", "id")
        ));
        // MAX(id) query returns 42 → restart should be 43
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(42L);
        // Only the identity sequence ALTER throws — id_seq RESTART succeeds
        doThrow(new RuntimeException("permission denied"))
            .when(jdbcTemplate).execute("ALTER SEQUENCE hub_stored_backups_id_seq RESTART WITH 43");

        // resetSequences must throw — failures cannot be silently swallowed
        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(service, "resetSequences"))
            .hasMessageContaining("Failed to reset")
            .hasMessageContaining("hub_stored_backups_id_seq");
    }

    @Test
    void resetSequences_skipsIdentityDiscovery_onNonPostgres() {
        mockTablesWithIdColumn(Collections.emptyList());
        // pg_class query throws (e.g., on H2 dialect) — must be caught and skipped
        when(jdbcTemplate.queryForList(anyString()))
            .thenThrow(new RuntimeException("relation pg_class does not exist"));

        // Should not throw — id_seq reset still happens, identity discovery is skipped gracefully
        ReflectionTestUtils.invokeMethod(service, "resetSequences");

        verify(jdbcTemplate, atLeastOnce()).execute(anyString());
    }
}
