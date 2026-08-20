package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.clients.OnLocationClient;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.users.ContractorDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
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
import java.util.Map;

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
        /** Relayed from the hub — a desktop's normal source. */
        HUB,
        /** Nothing fetched yet this run — the snapshot left over from a previous one. */
        SNAPSHOT
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Directory(Instant fetchedAt, Source source, List<ContractorDto> contractors) {
        public static Directory empty() {
            return new Directory(null, Source.SNAPSHOT, List.of());
        }
    }

    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final org.springframework.web.client.RestTemplate restTemplate;
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
     * Pull from OnLocation into the cache.
     *
     * <p>A failure keeps whatever we already had rather than blanking the screen — a slightly old
     * list carrying an honest timestamp beats an empty one.
     */
    public Directory refresh() {
        // A desktop relays the hub's copy: only the hub holds the OnLocation credential, and every
        // desktop polling OnLocation independently would multiply that API traffic by the install
        // count. Falls through to a direct pull when the hub can't be reached AND this machine
        // happens to have a key of its own.
        if (!syncConfig.isHubMode()) {
            Directory fromHub = fetchFromHub();
            if (fromHub != null) return store(fromHub);
        }

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
        } else if (syncConfig.isHubMode()) {
            log.warn("[ContractorDirectory] OnLocation is not configured (onlocation.api.key) — "
                    + "the hub cannot populate the directory");
        } else {
            log.warn("[ContractorDirectory] Hub unreachable and no local OnLocation key — "
                    + "serving whatever was cached");
        }
        return current;
    }

    /** @return the hub's directory, or null when it can't be reached or has nothing. */
    private Directory fetchFromHub() {
        String hubUrl = syncConfig.getSyncServerUrl();
        if (hubUrl == null || hubUrl.isBlank()) return null;
        String base = hubUrl.endsWith("/") ? hubUrl.substring(0, hubUrl.length() - 1) : hubUrl;
        try {
            // No credential by design — /api/contractors/ is LAN-gated on the hub, the same trust
            // this desktop already uses for sync.
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.getForObject(base + "/api/contractors/directory", Map.class);
            if (body == null) return null;
            Object rows = body.get("contractors");
            if (!(rows instanceof List<?> list) || list.isEmpty()) return null;

            List<ContractorDto> contractors = objectMapper.convertValue(list, new TypeReference<List<ContractorDto>>() {});
            Object stamp = body.get("fetchedAt");
            // Keep the HUB's timestamp, not ours: the question a client asks is how old the
            // OnLocation data is, not when this desktop last copied it.
            Instant fetchedAt = stamp == null ? Instant.now() : Instant.parse(String.valueOf(stamp));
            return new Directory(fetchedAt, Source.HUB, contractors);
        } catch (Exception e) {
            log.debug("[ContractorDirectory] Hub fetch failed ({}) — falling back", e.getMessage());
            return null;
        }
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
