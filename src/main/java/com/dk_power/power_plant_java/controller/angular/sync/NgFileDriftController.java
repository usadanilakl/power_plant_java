package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.sync.FileDriftService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * File-content drift (the bytes channel), separate from the entity drift in {@link NgDriftController}.
 *
 * <p>Entity drift compares ROWS; this compares the uploads tree against the hub's, because a FileObject
 * row can be perfectly in sync while its PDF is missing from disk. Scans are ON-DEMAND (the walk is far
 * heavier than the content-hash probe), so there is no persisted record type here — the report is
 * computed live and repair is verified by re-scanning.
 */
@RestController
@RequestMapping("/ng/sync/drift/files")
@RequiredArgsConstructor
@Slf4j
public class NgFileDriftController {

    private final FileDriftService fileDriftService;

    /** Compare local uploads vs the hub's file manifest. */
    @PostMapping("/scan")
    public ResponseEntity<NgApiResponse<FileDriftService.FileDriftReport>> scan() {
        try {
            FileDriftService.FileDriftReport r = fileDriftService.scan();
            return ResponseEntity.ok(new NgApiResponse<>(r, r.getError() != null ? r.getError()
                    : r.isInSync() ? "Files in sync" : "File drift detected"));
        } catch (Exception e) {
            log.error("file drift scan failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Scan failed: " + e.getMessage()));
        }
    }

    /** Download the given paths from the hub (fixes missing-locally and size-differs). Synchronous. */
    @PostMapping("/pull")
    public ResponseEntity<NgApiResponse<FileDriftService.RepairResult>> pull(@RequestBody List<String> relativePaths) {
        FileDriftService.RepairResult r = fileDriftService.pull(relativePaths);
        return ResponseEntity.ok(new NgApiResponse<>(r, r.getMessage()));
    }

    /** Queue the owning FileObjects for upload (fixes missing-on-hub). ASYNCHRONOUS — see the service. */
    @PostMapping("/push")
    public ResponseEntity<NgApiResponse<FileDriftService.RepairResult>> push(@RequestBody List<String> relativePaths) {
        FileDriftService.RepairResult r = fileDriftService.push(relativePaths);
        return ResponseEntity.ok(new NgApiResponse<>(r, r.getMessage()));
    }
}
