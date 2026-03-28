package com.dk_power.power_plant_java.sevice.angular.admin;

import com.dk_power.power_plant_java.dto.admin.SyncAuditEntityReportDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditMachineCompareReportDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditRecentEntityDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditReconstructionDto;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class SyncAuditServiceTest {

    @Autowired
    private SyncAuditService syncAuditService;

    @Autowired
    private FieldChangeRepository fieldChangeRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void tearDown() {
        fieldChangeRepository.deleteAll();
        jdbcTemplate.update("DELETE FROM work_request WHERE id IN (900000001, 900000002)");
    }

    @Test
    void entityReportFlagsMissingRowAndBuildsMachineSummaries() {
        seedChange("WorkRequest", 900000001L, "company", null, "\"Acme\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T10:00:00Z"), null);
        seedChange("WorkRequest", 900000001L, "permitStatus", "\"Active\"", "\"Processed\"", "HUB", "Hub", FieldChange.ChangeType.UPDATE, Instant.parse("2026-03-27T10:05:00Z"), "ManyToOne");
        seedChange("WorkRequest", 900000001L, "dailyPermitPackage", "\"200\"", "null", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.UPDATE, Instant.parse("2026-03-27T10:06:00Z"), "ManyToOne");

        SyncAuditEntityReportDto report = syncAuditService.getEntityReport("WorkRequest", 900000001L, 200, null, null, null, null, null);

        assertEquals("WorkRequest", report.entityType());
        assertEquals(3, report.totalChanges());
        assertTrue(report.signals().currentRowMissing());
        assertTrue(report.signals().relationshipDetachDetected());
        assertEquals(2, report.machineSummaries().size());
        assertTrue(report.warnings().stream().anyMatch(warning -> warning.contains("missing")));
    }

    @Test
    void recentEntitiesApplyMachineFilter() {
        seedChange("WorkRequest", 900000001L, "company", null, "\"Acme\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T09:00:00Z"), null);
        seedChange("WorkRequest", 900000002L, "company", null, "\"Beta\"", "DESKTOP_2", "Desktop 2", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T09:01:00Z"), null);

        List<SyncAuditRecentEntityDto> desktop1Only = syncAuditService.getRecentEntities("WorkRequest", 25, "DESKTOP_1", null, null, null, null);

        assertEquals(1, desktop1Only.size());
        assertEquals(900000001L, desktop1Only.get(0).entityId());
    }

    @Test
    void entityReportLoadsCurrentRowAndRelatedPackageLink() {
        jdbcTemplate.update(
            "INSERT INTO daily_permit_package (id, version, deleted, is_verified, object_type, date_created, date_modified, job_log_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            910000001L, 0L, false, false, "DailyPermitPackage", "2026-03-27 12:00:00", "2026-03-27 12:05:00", null
        );
        jdbcTemplate.update(
            "INSERT INTO work_request (id, version, deleted, is_verified, object_type, date_created, date_modified, daily_permit_package_id, company) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            900000002L, 1L, false, false, "WorkRequest", "2026-03-27 12:00:00", "2026-03-27 12:06:00", 910000001L, "Gamma"
        );

        seedChange("WorkRequest", 900000002L, "company", null, "\"Gamma\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T12:00:00Z"), null);
        seedChange("WorkRequest", 900000002L, "dailyPermitPackage", "null", "\"910000001\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.UPDATE, Instant.parse("2026-03-27T12:01:00Z"), "ManyToOne");

        SyncAuditEntityReportDto report = syncAuditService.getEntityReport("WorkRequest", 900000002L, 200, null, null, null, null, null);

        assertTrue(report.currentRow().rowExists());
        assertFalse(report.signals().currentRowMissing());
        assertTrue(report.relatedEntities().stream().anyMatch(related ->
            "DailyPermitPackage".equals(related.entityType()) && related.entityId().equals(910000001L)));
    }

    @Test
    void compareMachinesHighlightsDivergentAndOneSidedEntities() {
        seedChange("WorkRequest", 900000001L, "company", null, "\"Acme\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T09:00:00Z"), null);
        seedChange("WorkRequest", 900000001L, "company", null, "\"Acme\"", "DESKTOP_2", "Desktop 2", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T09:00:00Z"), null);
        seedChange("WorkRequest", 900000001L, "permitStatus", "\"Active\"", "\"Processed\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.UPDATE, Instant.parse("2026-03-27T09:05:00Z"), null);
        seedChange("WorkRequest", 900000002L, "company", null, "\"Beta\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T09:10:00Z"), null);
        seedChange("WorkRequest", 900000003L, "company", null, "\"Gamma\"", "DESKTOP_2", "Desktop 2", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T09:11:00Z"), null);

        SyncAuditMachineCompareReportDto report = syncAuditService.compareMachines("WorkRequest", "DESKTOP_1", "DESKTOP_2", 50, null, null, null, null);

        assertEquals(3, report.totalCompared());
        assertEquals(1, report.divergentCount());
        assertEquals(1, report.leftOnlyCount());
        assertEquals(1, report.rightOnlyCount());
        assertTrue(report.entities().stream().anyMatch(entity -> entity.entityId().equals(900000001L) && "DIVERGENT".equals(entity.status())));
    }

    @Test
    void reconstructEntityAtTimeBuildsEarlierSnapshot() {
        jdbcTemplate.update(
            "INSERT INTO work_request (id, version, deleted, is_verified, object_type, date_created, date_modified, company, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            900000001L, 2L, false, false, "WorkRequest", "2026-03-27 08:00:00", "2026-03-27 10:00:00", "Acme", "New Location"
        );

        seedChange("WorkRequest", 900000001L, "company", null, "\"Acme\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T08:00:00Z"), null);
        seedChange("WorkRequest", 900000001L, "location", null, "\"Old Location\"", "DESKTOP_1", "Desktop 1", FieldChange.ChangeType.CREATE, Instant.parse("2026-03-27T08:00:00Z"), null);
        seedChange("WorkRequest", 900000001L, "location", "\"Old Location\"", "\"New Location\"", "HUB", "Hub", FieldChange.ChangeType.UPDATE, Instant.parse("2026-03-27T09:00:00Z"), null);

        SyncAuditReconstructionDto reconstruction = syncAuditService.reconstructEntityAtTime(
            "WorkRequest",
            900000001L,
            "2026-03-27T08:30:00Z"
        );

        assertEquals("\"Old Location\"", reconstruction.reconstructedFields().get("location"));
        assertTrue(reconstruction.diffsFromCurrent().stream().anyMatch(diff ->
            "location".equals(diff.fieldName()) &&
                "\"Old Location\"".equals(diff.reconstructedValue()) &&
                "New Location".equals(diff.currentValue())));
    }

    private void seedChange(String entityType,
                            Long entityId,
                            String fieldName,
                            String oldValue,
                            String newValue,
                            String machineId,
                            String machineName,
                            FieldChange.ChangeType changeType,
                            Instant timestamp,
                            String relationshipType) {
        FieldChange change = new FieldChange(entityType, entityId, fieldName, oldValue, newValue, machineId, machineName, changeType);
        change.setTimestamp(timestamp);
        change.setReceivedAt(timestamp);
        change.setRelationshipType(relationshipType);
        fieldChangeRepository.save(change);
    }
}
