package com.dk_power.power_plant_java.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Fixes VARCHAR(255) columns that should be TEXT.
 *
 * H2's ddl-auto=update does NOT alter existing column types when
 * {@code @Column(columnDefinition = "TEXT")} is added to an entity field
 * after the table was already created. This component scans all tables
 * at startup and ALTERs any matching VARCHAR columns to TEXT.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TextColumnSchemaFixer {

    private final DataSource dataSource;

    /**
     * Column names (uppercase) that should be TEXT based on JPA annotations.
     * Covers BasePermitEntity.workScope, all JSON columns, and other TEXT fields.
     */
    private static final Set<String> TEXT_COLUMNS = Set.of(
            // BasePermitEntity (inherited by all 9 permit entities)
            "WORK_SCOPE",
            // BaseIdEntity
            "REFACTOR_NOTES",
            // SafeWork
            "HAZARDS_JSON", "PERMITS_JSON", "PPE_JSON",
            // HotWork
            "MEASURES_JSON",
            // ConfinedSpace
            "HAZARDS", "PRECAUTIONS", "PPE",
            // Jha
            "JOB_STEPS",
            // EnergizedWorkPermit
            "CIRCUIT_DESCRIPTION", "WORK_DESCRIPTION", "JUSTIFICATION", "CHECKLIST_JSON",
            // ExcavationPermit
            "EXCAVATION_DESCRIPTION", "TYPE_OF_WORK_JSON", "INSPECTIONS_JSON",
            // VentingPermit
            "PURPOSE", "DRAWING_NUMBERS", "STACK_DESCRIPTION",
            "EQUIPMENT_TO_BE_DEENERGIZED", "LOTO_DESCRIPTION",
            // DailyPermitPackage
            "CLOSURE_COMMENTS", "CLOSURE_SCOPE_DETAILS", "MODIFICATIONS_JSON", "ACTIVATION_SNAPSHOT_JSON",
            // JobLog
            // (workScope already covered above)
            // WorkArea
            "DESCRIPTION", "CONSTANT_HAZARDS_JSON", "CONSTANT_HOT_WORK_MEASURES_JSON",
            "CONSTANT_CONFINED_SPACE_HAZARDS_JSON",
            // WorkAreaMapShape
            "COORDINATES",
            // PermitAttachment
            "BASE64_CONTENT", "SYNCED_TO_MACHINES",
            // Other entities with TEXT columns
            "FIELDS_JSON", "ALIAS", "SVG_PATH"
    );

    @EventListener(ApplicationReadyEvent.class)
    @Order(1) // After SyncSchemaPreparation (order 0)
    public void fixTextColumns() {
        int altered = 0;

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Find all VARCHAR columns that should be TEXT
            List<String[]> toFix = new ArrayList<>();
            ResultSet rs = stmt.executeQuery(
                    "SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE DATA_TYPE = 'CHARACTER VARYING' " +
                    "AND CHARACTER_MAXIMUM_LENGTH = 255");

            while (rs.next()) {
                String table = rs.getString("TABLE_NAME");
                String col = rs.getString("COLUMN_NAME");
                if (TEXT_COLUMNS.contains(col)) {
                    toFix.add(new String[]{table, col});
                }
            }
            rs.close();

            for (String[] pair : toFix) {
                try {
                    stmt.executeUpdate("ALTER TABLE " + pair[0] +
                            " ALTER COLUMN " + pair[1] + " SET DATA TYPE TEXT");
                    altered++;
                    log.debug("Fixed column {}.{} from VARCHAR(255) to TEXT", pair[0], pair[1]);
                } catch (Exception e) {
                    log.trace("Could not alter {}.{}: {}", pair[0], pair[1], e.getMessage());
                }
            }

            if (altered > 0) {
                log.info("Text column fix: altered {} columns from VARCHAR(255) to TEXT", altered);
            }

        } catch (Exception e) {
            log.warn("Text column fix failed (non-fatal): {}", e.getMessage());
        }
    }
}
