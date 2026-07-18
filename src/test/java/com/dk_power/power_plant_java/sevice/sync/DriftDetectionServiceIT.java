package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.DriftKind;
import com.dk_power.power_plant_java.entities.sync.DriftPeer;
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
 * Persisted drift detection lifecycle (Stream A, Inc 1): the drift oracles' results are turned into durable
 * DriftRecords that open on first detection, preserve a user's triage while still drifting, and auto-close
 * when a later scan sees the row converge — per PEER (hub via content-hash, SharePoint via 3-way verify).
 * The oracles are mocked so each scenario controls exactly which ids drift.
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
    private EntityVerificationService verify;
    private DriftDetectionService svc;

    @BeforeEach
    void wire() {
        compare = mock(SyncComparisonService.class);
        verify = mock(EntityVerificationService.class);
        svc = new DriftDetectionService(compare, verify, repo, mock(EntityTableRegistry.class), txManager);
    }

    private void stubHub(String type, List<Long> differing, List<Long> missingLocally, List<Long> missingOnHub) {
        when(compare.compareEntityTypeByContent(type)).thenReturn(
                SyncComparisonService.ContentDriftSummary.builder()
                        .entityType(type)
                        .differing(differing).missingLocally(missingLocally).missingOnHub(missingOnHub)
                        .build());
    }

    private void stubSp(String type, boolean spReachable, List<Long> missingFromSp) {
        when(verify.isSpBacked(type)).thenReturn(true);
        List<EntityVerificationService.EntityVerificationStatus> issues = missingFromSp.stream()
                .map(id -> EntityVerificationService.EntityVerificationStatus.builder()
                        .entityId(id).spStatus("MISSING_FROM_SP").overallStatus("MISSING_FROM_SP").build())
                .toList();
        when(verify.verify(type, null)).thenReturn(
                EntityVerificationService.VerificationResult.builder()
                        .entityType(type).spBacked(true).hubReachable(true).spReachable(spReachable)
                        .issues(issues).build());
    }

    private DriftRecord row(String type, long id, DriftPeer peer) {
        return repo.findByEntityTypeAndEntityIdAndFieldNameAndPeer(type, id, DriftRecord.ROW, peer).orElseThrow();
    }

    @Test
    @DisplayName("HUB: new drift opens a FLAGGED row-level record per kind")
    void hub_newDrift_flagsPerKind() {
        stubHub("LotoPoint", List.of(10L), List.of(20L), List.of(30L));

        DriftDetectionService.DriftScanResult r = svc.detectHubForType("LotoPoint");

        assertThat(r.flagged).isEqualTo(3);
        assertThat(row("LotoPoint", 10L, DriftPeer.HUB).getKind()).isEqualTo(DriftKind.DIFFERING);
        assertThat(row("LotoPoint", 20L, DriftPeer.HUB).getKind()).isEqualTo(DriftKind.MISSING_LOCALLY);
        assertThat(row("LotoPoint", 30L, DriftPeer.HUB).getKind()).isEqualTo(DriftKind.MISSING_ON_PEER);
        assertThat(row("LotoPoint", 10L, DriftPeer.HUB).getStatus()).isEqualTo(DriftStatus.FLAGGED);
    }

    @Test
    @DisplayName("HUB: a still-drifting row keeps an ACKNOWLEDGED status (no re-nag) but refreshes lastDetectedAt")
    void hub_stillDrifting_preservesAcknowledged() {
        stubHub("Equipment", List.of(10L), List.of(), List.of());
        svc.detectHubForType("Equipment");
        DriftRecord ack = row("Equipment", 10L, DriftPeer.HUB);
        ack.setStatus(DriftStatus.ACKNOWLEDGED);
        repo.save(ack);
        java.time.Instant before = row("Equipment", 10L, DriftPeer.HUB).getLastDetectedAt();

        DriftDetectionService.DriftScanResult r = svc.detectHubForType("Equipment");

        assertThat(r.flagged).isZero();
        assertThat(r.stillDrifting).isEqualTo(1);
        assertThat(row("Equipment", 10L, DriftPeer.HUB).getStatus()).isEqualTo(DriftStatus.ACKNOWLEDGED);
        assertThat(row("Equipment", 10L, DriftPeer.HUB).getLastDetectedAt()).isAfterOrEqualTo(before);
    }

    @Test
    @DisplayName("HUB: a row that converges is auto-RECONCILED (AUTO_CONVERGED)")
    void hub_converged_autoReconciles() {
        stubHub("Loto", List.of(10L), List.of(), List.of());
        svc.detectHubForType("Loto");
        stubHub("Loto", List.of(), List.of(), List.of());

        DriftDetectionService.DriftScanResult r = svc.detectHubForType("Loto");

        assertThat(r.reconciled).isEqualTo(1);
        assertThat(row("Loto", 10L, DriftPeer.HUB).getStatus()).isEqualTo(DriftStatus.RECONCILED);
        assertThat(row("Loto", 10L, DriftPeer.HUB).getResolution()).isEqualTo("AUTO_CONVERGED");
    }

    @Test
    @DisplayName("HUB: a reconciled row that drifts again is re-opened to FLAGGED with the prior resolution cleared")
    void hub_reconciledThenDriftsAgain_reopens() {
        stubHub("ZeroEnergy", List.of(10L), List.of(), List.of());
        svc.detectHubForType("ZeroEnergy");
        stubHub("ZeroEnergy", List.of(), List.of(), List.of());
        svc.detectHubForType("ZeroEnergy");
        stubHub("ZeroEnergy", List.of(10L), List.of(), List.of());

        DriftDetectionService.DriftScanResult r = svc.detectHubForType("ZeroEnergy");

        assertThat(r.flagged).isEqualTo(1);
        assertThat(row("ZeroEnergy", 10L, DriftPeer.HUB).getStatus()).isEqualTo(DriftStatus.FLAGGED);
        assertThat(row("ZeroEnergy", 10L, DriftPeer.HUB).getResolvedAt()).isNull();
    }

    @Test
    @DisplayName("SP: a local row missing from SharePoint opens a SHAREPOINT-peer MISSING_ON_PEER record")
    void sp_missingFromSp_flagsSharePointPeer() {
        stubSp("FileObject", true, List.of(77L));

        DriftDetectionService.DriftScanResult r = svc.detectSpForType("FileObject");

        assertThat(r.flagged).isEqualTo(1);
        DriftRecord rec = row("FileObject", 77L, DriftPeer.SHAREPOINT);
        assertThat(rec.getPeer()).isEqualTo(DriftPeer.SHAREPOINT);
        assertThat(rec.getKind()).isEqualTo(DriftKind.MISSING_ON_PEER);
        assertThat(rec.getStatus()).isEqualTo(DriftStatus.FLAGGED);
    }

    private DriftRecord seed(String type, long id, DriftPeer peer, DriftStatus status) {
        DriftRecord r = new DriftRecord();
        r.setEntityType(type);
        r.setEntityId(id);
        r.setFieldName(DriftRecord.ROW);
        r.setPeer(peer);
        r.setKind(DriftKind.DIFFERING);
        r.setStatus(status);
        r.setFirstDetectedAt(java.time.Instant.now());
        r.setLastDetectedAt(java.time.Instant.now());
        return repo.save(r);
    }

    @Test
    @DisplayName("markReconciled closes a row's records for ONE peer only (the accept-field reconcile hook)")
    void markReconciled_scopedToPeerAndRow() {
        seed("MarkRecType", 5L, DriftPeer.HUB, DriftStatus.FLAGGED);
        seed("MarkRecType", 5L, DriftPeer.SHAREPOINT, DriftStatus.FLAGGED);
        seed("MarkRecType", 6L, DriftPeer.HUB, DriftStatus.FLAGGED);

        int closed = svc.markReconciled("MarkRecType", 5L, DriftPeer.HUB, "ACCEPTED_HUB", "tester");

        assertThat(closed).isEqualTo(1);
        assertThat(row("MarkRecType", 5L, DriftPeer.HUB).getStatus()).isEqualTo(DriftStatus.RECONCILED);
        assertThat(row("MarkRecType", 5L, DriftPeer.HUB).getResolution()).isEqualTo("ACCEPTED_HUB");
        assertThat(row("MarkRecType", 5L, DriftPeer.SHAREPOINT).getStatus()).as("other peer untouched").isEqualTo(DriftStatus.FLAGGED);
        assertThat(row("MarkRecType", 6L, DriftPeer.HUB).getStatus()).as("other row untouched").isEqualTo(DriftStatus.FLAGGED);
    }

    @Test
    @DisplayName("acknowledge flips FLAGGED -> ACKNOWLEDGED but is a no-op on a resolved record")
    void acknowledge_onlyActive() {
        DriftRecord active = seed("AckType", 9L, DriftPeer.HUB, DriftStatus.FLAGGED);
        DriftRecord done = seed("AckType", 10L, DriftPeer.HUB, DriftStatus.RECONCILED);

        assertThat(svc.acknowledge(active.getId())).isTrue();
        assertThat(svc.acknowledge(done.getId())).as("cannot re-open a resolved record").isFalse();

        assertThat(row("AckType", 9L, DriftPeer.HUB).getStatus()).isEqualTo(DriftStatus.ACKNOWLEDGED);
        assertThat(row("AckType", 10L, DriftPeer.HUB).getStatus()).isEqualTo(DriftStatus.RECONCILED);
    }

    @Test
    @DisplayName("SP: an unreachable SharePoint is a no-op — never flags, never auto-reconciles (state unknown)")
    void sp_unreachable_isNoOp() {
        // Seed an existing active SP record.
        stubSp("FileObject", true, List.of(88L));
        svc.detectSpForType("FileObject");
        assertThat(row("FileObject", 88L, DriftPeer.SHAREPOINT).getStatus()).isEqualTo(DriftStatus.FLAGGED);

        // Now SP is unreachable — the scan must NOT clear the existing record (its true state is unknown).
        stubSp("FileObject", false, List.of());
        DriftDetectionService.DriftScanResult r = svc.detectSpForType("FileObject");

        assertThat(r.flagged).isZero();
        assertThat(r.reconciled).as("must not falsely auto-reconcile on an unreachable peer").isZero();
        assertThat(row("FileObject", 88L, DriftPeer.SHAREPOINT).getStatus()).isEqualTo(DriftStatus.FLAGGED);
    }
}
