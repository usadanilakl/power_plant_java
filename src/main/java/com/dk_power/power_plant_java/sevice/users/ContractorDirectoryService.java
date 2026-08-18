package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.clients.OnLocationClient;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.users.ContractorDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A read-only contractor directory for lookup: who they are, how to reach them, and when their
 * orientation runs out.
 *
 * <p>Deliberately NOT the same path as {@link ContractorReconciler}. That one diffs OnLocation
 * against the {@code User} table and parks the result for an admin to accept, because those rows
 * carry identity and access — deactivating someone should be a human decision. This is the opposite
 * problem: someone at the gate asking "is this person's orientation current?" needs today's answer,
 * not one waiting in a queue. So the directory refreshes on its own and touches no User row.
 *
 * <p>Held in memory rather than in a table. It is reference data OnLocation owns, it turns over
 * constantly, and nobody needs its history — and making it an entity would replicate contractor
 * names, emails and phone numbers to every desktop through CRDT sync. A JSON snapshot on disk covers
 * the one thing memory doesn't: a restart while OnLocation is unreachable.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContractorDirectoryService {

    /** Where the rows came from, so the client can be honest about what it is showing. */
    public enum Source {
        /** Straight from OnLocation. */
        ONLOCATION,
        /** OnLocation was unreachable or unconfigured; these are the local User rows. */
        LOCAL_RECORDS,
        /** Nothing fetched yet this run — the snapshot left over from a previous one. */
        SNAPSHOT
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Directory(Instant fetchedAt, Source source, List<ContractorDto> contractors) {
        public static Directory empty() {
            return new Directory(null, Source.LOCAL_RECORDS, List.of());
        }
    }

    private final SyncConfig syncConfig;
    private final ContractorSyncService contractorSyncService;
    private final ObjectMapper objectMapper;
    /** OnLocationClient is {@code @ConditionalOnProperty} — absent on installs without the key. */
    private final ObjectProvider<OnLocationClient> onLocationClientProvider;

    @Value("${contractor.directory.snapshot-path:data/contractor-directory.json}")
    private String snapshotPath;

    private volatile Directory current = Directory.empty();

    /**
     * Hourly, not nightly like the reconciler. A lookup screen answering "is this orientation
     * current" is worth less the staler it gets, and one extra call an hour is nothing next to the
     * per-request traffic OnLocation already sees.
     */
    @Scheduled(fixedDelayString = "${contractor.directory.refresh-ms:3600000}", initialDelay = 60_000)
    public void scheduledRefresh() {
        if (!syncConfig.isHubMode()) return;
        try {
            refresh();
        } catch (Exception e) {
            // Never let a refresh failure kill the schedule — the last good snapshot keeps serving.
            log.warn("[ContractorDirectory] Refresh failed, serving previous data: {}", e.getMessage());
        }
    }

    /** Current directory. Loads the disk snapshot on first use so a fresh boot is not empty. */
    public Directory get() {
        if (current.fetchedAt() == null) {
            synchronized (this) {
                if (current.fetchedAt() == null) loadSnapshot();
            }
        }
        return current;
    }

    /**
     * Pull from OnLocation, falling back to the local User rows.
     *
     * <p>The fallback matters on installs where the hub has no OnLocation key: Electron pushes
     * contractors into the User table anyway ({@code ContractorSyncService.importFromElectron}), so
     * there is still a useful answer — just one whose freshness we cannot vouch for, which is why
     * the source travels with it.
     */
    public Directory refresh() {
        OnLocationClient client = onLocationClientProvider.getIfAvailable();
        if (client != null) {
            try {
                List<ContractorDto> live = client.getContractors();
                if (!live.isEmpty()) {
                    return store(new Directory(Instant.now(), Source.ONLOCATION, live));
                }
                log.warn("[ContractorDirectory] OnLocation returned no contractors — keeping previous data");
            } catch (Exception e) {
                log.warn("[ContractorDirectory] OnLocation fetch failed: {}", e.getMessage());
            }
        } else {
            log.debug("[ContractorDirectory] OnLocation not configured (onlocation.api.key) — using local records");
        }

        List<ContractorDto> local = contractorSyncService.listContractors();
        if (!local.isEmpty()) {
            return store(new Directory(Instant.now(), Source.LOCAL_RECORDS, local));
        }
        // Nothing anywhere — keep whatever we already had rather than blanking the screen.
        return current;
    }

    private Directory store(Directory directory) {
        current = directory;
        writeSnapshot(directory);
        log.info("[ContractorDirectory] {} contractors from {}", directory.contractors().size(), directory.source());
        return directory;
    }

    // ── Disk snapshot ────────────────────────────────────────────────────────

    private void loadSnapshot() {
        File file = new File(snapshotPath);
        if (!file.isFile()) return;
        try {
            Directory saved = objectMapper.readValue(file, Directory.class);
            if (saved != null && saved.contractors() != null && !saved.contractors().isEmpty()) {
                // Keep the original timestamp: the client decides what counts as too old, and
                // stamping it "now" on load would hide exactly the staleness it needs to see.
                current = new Directory(saved.fetchedAt(), Source.SNAPSHOT, saved.contractors());
                log.info("[ContractorDirectory] Restored {} contractors from snapshot ({})",
                        saved.contractors().size(), saved.fetchedAt());
            }
        } catch (Exception e) {
            log.warn("[ContractorDirectory] Could not read snapshot {}: {}", snapshotPath, e.getMessage());
        }
    }

    private void writeSnapshot(Directory directory) {
        try {
            File file = new File(snapshotPath);
            File parent = file.getParentFile();
            if (parent != null && !parent.isDirectory() && !parent.mkdirs()) {
                log.warn("[ContractorDirectory] Could not create {}", parent);
                return;
            }
            objectMapper.writeValue(file, directory);
        } catch (Exception e) {
            // A snapshot we cannot write only costs us the next cold start.
            log.warn("[ContractorDirectory] Could not write snapshot {}: {}", snapshotPath, e.getMessage());
        }
    }

    /** Case-insensitive match on name, company, email or title. Blank query returns everything. */
    public List<ContractorDto> search(String query) {
        List<ContractorDto> all = get().contractors();
        if (query == null || query.isBlank()) return all;
        String q = query.trim().toLowerCase();
        List<ContractorDto> hits = new ArrayList<>();
        for (ContractorDto c : all) {
            if (matches(c.getName(), q) || matches(c.getCompany(), q)
                    || matches(c.getEmail(), q) || matches(c.getTitle(), q)) {
                hits.add(c);
            }
        }
        return hits;
    }

    private boolean matches(String value, String lowerQuery) {
        return value != null && value.toLowerCase().contains(lowerQuery);
    }
}
