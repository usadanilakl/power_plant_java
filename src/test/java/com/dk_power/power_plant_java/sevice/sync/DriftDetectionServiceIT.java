package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.DriftKind;
import com.dk_power.power_plant_java.entities.sync.DriftRecord;
import com.dk_power.power_plant_java.entities.sync.DriftStatus;
import com.dk_power.power_plant_java.repository.sync.DriftRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Persisted drift detection lifecycle (Stream A, Inc 1): the content-hash oracle result is turned into
 * durable DriftRecords that open on first detection, preserve a user's triage while still drifting, and
 * auto-close when a later scan sees the row converge. The oracle itself is mocked so each scenario controls
 * exactly which ids drift.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:drift-detect-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Persisted drift detection lifecycle")
class DriftDetectionServiceIT {

    @Autowired
    private DriftRecordRepository repo;
    @Autowired
    private PlatformTransactionManager txManager;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private SyncComparisonService compare;
    private DriftDetectionService svc;

    @BeforeEach
    void wire() {
        compare = mock(SyncComparisonService.class);
        svc = new DriftDetectionService(compare, repo, mock(EntityTableRegistry.class), txManager);
    }

    private void stub(String type, List<Long> differing, List<Long> missingLocally, List<Long> missingOnHub) {
        when(compare.compareEntityTypeByContent(type)).thenReturn(
                SyncComparisonService.ContentDriftSummary.builder()
                        .entityType(type)
                        .differing(differing).missingLocally(missingLocally).missingOnHub(missingOnHub)
                        .build());
    }

    private DriftRecord row(String type, long id) {
        return repo.findByEntityTypeAndEntityIdAndFieldName(type, id, DriftRecord.ROW).orElseThrow();
    }

    @Test
    @DisplayName("new drift opens a FLAGGED row-level record per kind")
    void newDrift_flagsPerKind() {
        stub("LotoPoint", List.of(10L), List.of(20L), List.of(30L));

        DriftDetectionService.DriftScanResult r = svc.detectForType("LotoPoint");

        assertThat(r.flagged).isEqualTo(3);
        assertThat(row("LotoPoint", 10L).getKind()).isEqualTo(DriftKind.DIFFERING);
        assertThat(row("LotoPoint", 20L).getKind()).isEqualTo(DriftKind.MISSING_LOCALLY);
        assertThat(row("LotoPoint", 30L).getKind()).isEqualTo(DriftKind.MISSING_ON_HUB);
        assertThat(row("LotoPoint", 10L).getStatus()).isEqualTo(DriftStatus.FLAGGED);
        assertThat(row("LotoPoint", 10L).getFirstDetectedAt()).isNotNull();
    }

    @Test
    @DisplayName("a still-drifting row keeps an ACKNOWLEDGED status (no re-nag) but refreshes lastDetectedAt")
    void stillDrifting_preservesAcknowledged() {
        stub("Equipment", List.of(10L), List.of(), List.of());
        svc.detectForType("Equipment");
        // User acknowledges it.
        DriftRecord ack = row("Equipment", 10L);
        ack.setStatus(DriftStatus.ACKNOWLEDGED);
        repo.save(ack);
        java.time.Instant before = row("Equipment", 10L).getLastDetectedAt();

        DriftDetectionService.DriftScanResult r = svc.detectForType("Equipment"); // still drifting

        assertThat(r.flagged).as("not re-flagged").isZero();
        assertThat(r.stillDrifting).isEqualTo(1);
        assertThat(row("Equipment", 10L).getStatus()).as("triage preserved").isEqualTo(DriftStatus.ACKNOWLEDGED);
        assertThat(row("Equipment", 10L).getLastDetectedAt()).isAfterOrEqualTo(before);
    }

    @Test
    @DisplayName("a row that converges is auto-RECONCILED (AUTO_CONVERGED)")
    void converged_autoReconciles() {
        stub("Loto", List.of(10L), List.of(), List.of());
        svc.detectForType("Loto");
        stub("Loto", List.of(), List.of(), List.of()); // now in sync

        DriftDetectionService.DriftScanResult r = svc.detectForType("Loto");

        assertThat(r.reconciled).isEqualTo(1);
        assertThat(row("Loto", 10L).getStatus()).isEqualTo(DriftStatus.RECONCILED);
        assertThat(row("Loto", 10L).getResolution()).isEqualTo("AUTO_CONVERGED");
        assertThat(row("Loto", 10L).getResolvedAt()).isNotNull();
    }

    @Test
    @DisplayName("a reconciled row that drifts again is re-opened to FLAGGED with the prior resolution cleared")
    void reconciledThenDriftsAgain_reopens() {
        stub("ZeroEnergy", List.of(10L), List.of(), List.of());
        svc.detectForType("ZeroEnergy");
        stub("ZeroEnergy", List.of(), List.of(), List.of());
        svc.detectForType("ZeroEnergy"); // -> RECONCILED
        stub("ZeroEnergy", List.of(10L), List.of(), List.of());

        DriftDetectionService.DriftScanResult r = svc.detectForType("ZeroEnergy"); // drifts again

        assertThat(r.flagged).isEqualTo(1);
        assertThat(row("ZeroEnergy", 10L).getStatus()).isEqualTo(DriftStatus.FLAGGED);
        assertThat(row("ZeroEnergy", 10L).getResolvedAt()).as("prior resolution cleared").isNull();
        assertThat(row("ZeroEnergy", 10L).getResolution()).isNull();
    }
}
