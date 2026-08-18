package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Background FILE-drift sweep + auto-heal. File drift (content BYTES, not entity rows) previously had NO
 * scheduled detection — {@link FileDriftService} scan/pull/push were UI-only, so a client missing files, or
 * whose hub copy was mis-filed, sat drifting until an admin opened the Drift Center → Files panel. This runs
 * the scan on a longer cadence than entity drift (a full uploads-tree walk + a hub round-trip is heavier),
 * then repairs:
 * <ul>
 *   <li>MISSING_LOCALLY / SIZE_DIFFERS → pull from the hub (authoritative), EXCEPT the fallback-path
 *       companion of a mis-file (same FileObject also shows MISSING_ON_HUB) — that pair is healed by the push
 *       below, and pulling the stale hub path would only create a duplicate at a non-canonical location.</li>
 *   <li>MISSING_ON_HUB → push (queues an upload; on the hub the store relocates a legacy mis-filed copy to
 *       the canonical path, which clears BOTH the false MISSING_ON_HUB and its MISSING_LOCALLY companion).</li>
 * </ul>
 * Gated (non-hub, sync server configured) exactly like {@link DriftScanScheduler}; the manual Drift Center
 * buttons remain. Auto-heal is flag-guarded and I/O-capped per run.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FileDriftScanScheduler {

    private final FileDriftService fileDriftService;
    private final SyncConfig syncConfig;
    private final FileRepo fileRepo;

    @Value("${sync.drift.files.scan-enabled:true}")
    private boolean enabled;
    @Value("${sync.drift.files.auto-heal-enabled:true}")
    private boolean autoHeal;
    /** Bound the file I/O per run — the rest is picked up on the next sweep. */
    @Value("${sync.drift.files.heal-cap:200}")
    private int healCap;

    @Scheduled(fixedDelayString = "${sync.drift.files.scan-interval-ms:3600000}",
               initialDelayString = "${sync.drift.files.scan-initial-delay-ms:120000}")
    public void scheduledScan() {
        if (!enabled) return;
        if (syncConfig.isHubMode() || !syncConfig.isServerSyncConfigured()) return;
        String url = syncConfig.getSyncServerUrl();
        if (url == null || url.isBlank()) return;

        try {
            FileDriftService.FileDriftReport report = fileDriftService.scan();
            if (report.getError() != null) {
                log.debug("file_drift.scheduled_scan skipped: {}", report.getError());
                return;
            }
            if (report.isInSync()) return;

            log.info("file_drift.scheduled_scan drift: missingLocally={} missingOnHub={} sizeDiffers={}{}",
                    report.getMissingLocally(), report.getMissingOnHub(), report.getSizeDiffers(),
                    report.getTruncated() > 0 ? " (+" + report.getTruncated() + " over cap)" : "");

            if (!autoHeal) return;

            List<FileDriftService.FileDriftEntry> entries = report.getEntries();

            // A FileObject that appears as MISSING_ON_HUB is usually a path mismatch (its bytes are on the hub
            // at a legacy fallback path). Push heals it, and the hub's relocate-to-canonical also removes the
            // stale path that makes its MISSING_LOCALLY companion appear — so DON'T pull that companion (a pull
            // would recreate a duplicate at the stale path). Both companions resolve to the same fileObjectId.
            Set<Long> pushPairFileObjects = entries.stream()
                    .filter(e -> e.getKind() == FileDriftService.FileDriftKind.MISSING_ON_HUB && e.getFileObjectId() != null)
                    .map(FileDriftService.FileDriftEntry::getFileObjectId)
                    .collect(Collectors.toSet());

            List<String> toPull = entries.stream()
                    .filter(e -> e.getKind() == FileDriftService.FileDriftKind.MISSING_LOCALLY
                            || e.getKind() == FileDriftService.FileDriftKind.SIZE_DIFFERS)
                    // Only auto-pull files that map to a LIVE FileObject. The hub manifest is a raw disk walk,
                    // so it also lists orphans and the leftover bytes of soft-deleted entities (whose
                    // HubSyncedFile is flagged deleted but the physical file remains). Auto-pulling those would
                    // resurrect deleted files / import junk onto every client. Unmapped paths (fileObjectId
                    // null — resolveOwners can't map them; deleted entities resolve to null via @Where) are
                    // left report-only; a human can still pull them from the Drift Center if genuinely wanted.
                    .filter(e -> e.getFileObjectId() != null)
                    // ...and only when the drifting path is genuinely THIS FileObject's canonical path. Owner
                    // resolution maps by filename→fileNumber alone, so an orphan / legacy mis-filed hub path
                    // whose filename happens to match a live fileNumber would otherwise be auto-imported to
                    // every client. Requiring the path to sit under the entity's own {ext}/{type}/{vendor}
                    // folder rejects those.
                    .filter(this::pullPathIsEntityCanonical)
                    // Let push+relocate heal a mis-file pair; don't also pull its stale companion (a duplicate).
                    .filter(e -> !pushPairFileObjects.contains(e.getFileObjectId()))
                    .map(FileDriftService.FileDriftEntry::getRelativePath)
                    .limit(healCap)
                    .collect(Collectors.toList());

            List<String> toPush = entries.stream()
                    .filter(e -> e.getKind() == FileDriftService.FileDriftKind.MISSING_ON_HUB)
                    .map(FileDriftService.FileDriftEntry::getRelativePath)
                    .limit(healCap)
                    .collect(Collectors.toList());

            if (!toPull.isEmpty()) {
                FileDriftService.RepairResult r = fileDriftService.pull(toPull);
                log.info("file_drift.auto_pull requested={} succeeded={} failed={}",
                        r.getRequested(), r.getSucceeded(), r.getFailed());
            }
            if (!toPush.isEmpty()) {
                FileDriftService.RepairResult r = fileDriftService.push(toPush);
                log.info("file_drift.auto_push requested={} succeeded={} failed={} unmapped={}",
                        r.getRequested(), r.getSucceeded(), r.getFailed(), r.getUnmapped().size());
            }
        } catch (Exception e) {
            log.warn("file_drift.scheduled_scan failed: {}", e.getMessage());
        }
    }

    /** True only when the drifting path sits under the resolved FileObject's own canonical folder
     *  ({ext}/{fileType}/{vendor}) — so an orphan/mis-filed hub path that merely shares a filename with a
     *  live fileNumber is NOT auto-imported. Any lookup miss → false (skip; a human can still pull manually). */
    private boolean pullPathIsEntityCanonical(FileDriftService.FileDriftEntry e) {
        Long id = e.getFileObjectId();
        if (id == null) return false;
        FileObject fo = fileRepo.findById(id).orElse(null);
        if (fo == null) return false;
        String rel = e.getRelativePath();
        if (rel == null) return false;
        int dot = rel.lastIndexOf('.');
        String ext = dot >= 0 ? rel.substring(dot + 1) : "pdf";
        String folder = fo.buildRelativeFolder(ext);
        return folder != null && rel.startsWith(folder + "/");
    }
}
