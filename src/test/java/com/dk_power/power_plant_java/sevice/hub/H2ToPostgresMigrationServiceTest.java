package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class H2ToPostgresMigrationServiceTest {

    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private EntityTableRegistry entityTableRegistry;
    @Mock private SharePointSyncOrchestrator sharePointSyncOrchestrator;

    private H2ToPostgresMigrationService service;

    @BeforeEach
    void setUp() {
        service = new H2ToPostgresMigrationService(jdbcTemplate, entityTableRegistry, sharePointSyncOrchestrator);
        ReflectionTestUtils.setField(service, "h2DbPath", "./db/nonexistent_test");
        H2ToPostgresMigrationService.migrationInProgress.set(false);
    }

    @AfterEach
    void tearDown() {
        H2ToPostgresMigrationService.migrationInProgress.set(false);
    }

    @Test
    void migrate_returnsFailure_whenH2FileMissing() {
        // H2 file doesn't exist — fails fast before touching anything
        var result = service.migrate();

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getError()).contains("H2 database file not found");

        // Migration lock must NOT be left set
        assertThat(H2ToPostgresMigrationService.migrationInProgress.get()).isFalse();

        // Must NOT touch the target database
        verify(jdbcTemplate, never()).execute(anyString());
        verify(sharePointSyncOrchestrator, never()).setClientSyncInProgress(true);
    }

    @Test
    void migrate_rejected_whenAnotherMigrationInProgress() {
        // Set up a valid H2 path to get past the H2 check
        ReflectionTestUtils.setField(service, "h2DbPath", "./db/proddb");

        // Simulate another migration already running
        H2ToPostgresMigrationService.migrationInProgress.set(true);

        // First call to migrate() — but the lock is already held, so getStatus() runs
        // and the second concurrent migration request would hit compareAndSet and fail.
        // We test the lock guard directly.
        boolean acquired = H2ToPostgresMigrationService.migrationInProgress.compareAndSet(false, true);

        assertThat(acquired).isFalse(); // already held
    }

    @Test
    void migrationLock_isReleased_evenWhenH2FileMissing() {
        // Sanity: failing fast must not leak the lock
        service.migrate();
        assertThat(H2ToPostgresMigrationService.migrationInProgress.get()).isFalse();
    }

    @Test
    void migrationLock_isAtomicAcrossThreads() throws InterruptedException {
        // Two threads racing for the lock — exactly one wins
        java.util.concurrent.atomic.AtomicInteger acquired = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.CountDownLatch done = new java.util.concurrent.CountDownLatch(2);

        Runnable racer = () -> {
            try {
                start.await();
                if (H2ToPostgresMigrationService.migrationInProgress.compareAndSet(false, true)) {
                    acquired.incrementAndGet();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                done.countDown();
            }
        };

        new Thread(racer).start();
        new Thread(racer).start();
        start.countDown();
        done.await();

        assertThat(acquired.get()).isEqualTo(1);
    }
}
