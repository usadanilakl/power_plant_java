package com.dk_power.power_plant_java.controller.angular.file;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.files.ConnectorMigrationReportDto;
import com.dk_power.power_plant_java.dto.files.FileConnectorDto;
import com.dk_power.power_plant_java.dto.files.FileConnectorIdDto;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileConnectorService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST endpoints for {@link com.dk_power.power_plant_java.entities.files.FileConnector}.
 * Path prefix {@code /ng/file-connectors} — consistent with the Ng convention.
 */
@RestController
@RequestMapping("/ng/file-connectors")
@RequiredArgsConstructor
public class NgFileConnectorRestController {
    private static final Logger log = LoggerFactory.getLogger(NgFileConnectorRestController.class);

    private final NgFileConnectorService connectorService;

    /** All connectors drawn on a given source file — viewer fetches on file load. */
    @GetMapping("/by-source-file/{fileId}")
    public ResponseEntity<NgApiResponse<List<FileConnectorDto>>> bySourceFile(@PathVariable Long fileId) {
        try {
            var list = connectorService.findBySourceFile(fileId);
            return ResponseEntity.ok(new NgApiResponse<>(list, list.size() + " connector(s)"));
        } catch (Exception e) {
            log.error("by-source-file failed for {}: {}", fileId, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Single connector by id — used by the click handler to resolve target file. */
    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<FileConnectorDto>> getById(@PathVariable Long id) {
        try {
            return connectorService.findDtoById(id)
                .map(dto -> ResponseEntity.ok(new NgApiResponse<>(dto, "Connector retrieved")))
                .orElseGet(() -> ResponseEntity.status(404).body(new NgApiResponse<>(null, "Not found")));
        } catch (Exception e) {
            log.error("getById failed for {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Create or update — caller posts a FileConnectorIdDto, service validates
     * sourceFile + targetFile resolve. Single POST handles both create (id=null/0)
     * and update (id set), matching the project's convention for other resources.
     */
    @PostMapping
    public ResponseEntity<NgApiResponse<FileConnectorDto>> save(@RequestBody FileConnectorIdDto dto) {
        try {
            var result = connectorService.save(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Connector saved"));
        } catch (Exception e) {
            log.error("save connector failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Soft-delete (sets deleted=true). Also clears the surviving counterpart's
     * pointer back — handled inside the service so the invariant holds.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            connectorService.softDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Connector deleted"));
        } catch (Exception e) {
            log.error("delete connector {} failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Bidirectional link between two existing connectors. Use this rather than
     * patching {@code counterpartConnectorId} through the regular save —
     * service enforces atomic dual-save + no-self-link.
     */
    @PostMapping("/{id}/link-counterpart/{otherId}")
    public ResponseEntity<NgApiResponse<Void>> linkCounterpart(
            @PathVariable Long id, @PathVariable Long otherId) {
        try {
            connectorService.linkCounterparts(id, otherId);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Connector counterpart linked"));
        } catch (Exception e) {
            log.error("link-counterpart {}/{} failed: {}", id, otherId, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Bidirectional unlink — clears the pointer on both sides. */
    @PostMapping("/{id}/unlink-counterpart")
    public ResponseEntity<NgApiResponse<Void>> unlinkCounterpart(@PathVariable Long id) {
        try {
            connectorService.unlinkCounterpart(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Connector counterpart unlinked"));
        } catch (Exception e) {
            log.error("unlink-counterpart {} failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * One-shot migration: walk every Equipment with eqType.name='connector'
     * (case-insensitive), convert each to a FileConnector when safe, and
     * pair connectors that point at each other when unambiguous.
     *
     * <p>Idempotent — safe to re-run. Returns a detailed per-Equipment audit
     * report (one item per row processed) plus aggregate counts.
     *
     * <p>Query params:
     * <ul>
     *   <li>{@code dryRun} (default false): true → log what WOULD happen,
     *       no DB writes. Use this first to preview impact.</li>
     *   <li>{@code minTagLength} (default 5): below this tag length,
     *       substring matches are too generic to trust → row goes to
     *       SKIP_SHORT_TAG bucket for manual review. Values below 3 are
     *       clamped to 3 (runaway-match safeguard).</li>
     * </ul>
     */
    @PostMapping("/migrate-from-equipment")
    public ResponseEntity<NgApiResponse<ConnectorMigrationReportDto>> migrateFromEquipment(
            @RequestParam(defaultValue = "false") boolean dryRun,
            @RequestParam(defaultValue = "5") int minTagLength) {
        try {
            ConnectorMigrationReportDto report = connectorService.migrateFromEquipment(dryRun, minTagLength);
            String message = String.format(
                "%s migrated=%d paired=%d skipped(short=%d,data=%d,noSrc=%d,noMatch=%d,ambig=%d,already=%d)",
                dryRun ? "DRY RUN —" : "Migration complete:",
                report.migrated(), report.paired(),
                report.skippedShortTag(), report.skippedHasData(), report.skippedNoSourceFile(),
                report.skippedNoMatch(), report.skippedAmbiguous(), report.skippedAlreadyMigrated()
            );
            return ResponseEntity.ok(new NgApiResponse<>(report, message));
        } catch (Exception e) {
            log.error("connector migration failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
