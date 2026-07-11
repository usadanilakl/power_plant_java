package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryItemDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

/**
 * The searchable inventory catalog: one stock line per item × warehouse for the whole site, held in memory and
 * mirrored to a gzipped JSON snapshot on disk. Search filters it in Java — no Maximo round-trip per keystroke.
 *
 * <p>Why a cache at all: a full pull is ~6,000 stock lines at Maximo's ~110 rows/sec, plus a description pass
 * over the item master — roughly <b>100 seconds</b>. That cost cannot be paid on a user's first search.
 *
 * <p>Design:
 * <ul>
 *   <li><b>Snapshot on disk</b> — loaded at boot in tens of ms, so a restart never means a cold 100s rebuild.
 *       Written atomically (temp file + rename) so a crash can't leave a torn file. It is a cache, not
 *       business data: no H2 table, no entity, nothing on the CRDT sync bus.</li>
 *   <li><b>Never evict, never block</b> — the catalog is kept forever and refreshed on a background thread that
 *       publishes by swapping one volatile reference. A search always reads a complete catalog, old or new.</li>
 *   <li><b>Smart refresh</b> — two ~0.1s probes decide whether the expensive fetch is needed at all:
 *       a <i>change probe</i> ({@code statusdate > watermark}) drives an incremental merge of just the changed
 *       rows, and a <i>drift probe</i> ({@code totalCount} vs cached size) catches deletions.</li>
 *   <li><b>Live fallback</b> — an exact itemnum that the catalog has never seen is looked up live (~0.2s), so a
 *       part stocked minutes ago is findable immediately.</li>
 * </ul>
 *
 * <p><b>Balances are not authoritative here.</b> INVENTORY has no {@code changedate}, so a {@code curbal} change
 * is invisible to the watermark; the cached balance is only as fresh as the last full rebuild. Callers that are
 * about to act on stock (add a checkout line, issue material) must re-read it live via
 * {@link MaximoInventoryAdapter#getStock}. Status <i>is</i> tracked, because a status flip bumps statusdate.
 */
@Slf4j
@Service
public class MaximoInventoryCatalogService {

    private static final int SNAPSHOT_VERSION = 1;

    private final MaximoInventoryAdapter adapter;
    private final Path snapshotFile;
    private final long fullRebuildIntervalMs;

    /** AUTO_CLOSE_TARGET off: we own the gzip stream's lifecycle in try-with-resources. */
    private final ObjectMapper json = new ObjectMapper().disable(JsonGenerator.Feature.AUTO_CLOSE_TARGET);

    private final AtomicBoolean refreshing = new AtomicBoolean(false);
    private final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "maximo-inventory-catalog");
        t.setDaemon(true);
        return t;
    });

    /** The published catalog. Treated as immutable: refreshes build a new Snapshot and swap this reference. */
    private volatile Snapshot state = Snapshot.empty();

    public MaximoInventoryCatalogService(
            MaximoInventoryAdapter adapter,
            @Value("${maximo.inventory.catalog-file:./data/cache/maximo-inventory-catalog.json.gz}") String catalogFile,
            @Value("${maximo.inventory.full-rebuild-hours:12}") long fullRebuildHours) {
        this.adapter = adapter;
        this.snapshotFile = Paths.get(catalogFile).toAbsolutePath();
        this.fullRebuildIntervalMs = Duration.ofHours(Math.max(1, fullRebuildHours)).toMillis();
    }

    // ---------------------------------------------------------------- reads (request threads)

    /**
     * Search stocked items with an AND word-bucket over itemnum + description; each hit carries its warehouse,
     * bin, unit and per-warehouse status. Exact itemnum matches sort first, then itemnum prefixes.
     * {@code storeroom} (blank/ALL = every warehouse) narrows to one warehouse.
     *
     * <p>Served entirely from memory. Falls back to a live Maximo lookup when the catalog has no hit for what
     * looks like an item number — the only way a brand-new part can be found before the next refresh.
     */
    public List<MaximoInventoryItemDto> search(String query, String siteid, String storeroom, int pageSize) {
        String site = resolveSite(siteid);
        Snapshot snap = state;
        int cap = Math.max(1, pageSize);
        boolean allStores = storeroom == null || storeroom.isBlank() || "ALL".equalsIgnoreCase(storeroom);
        List<String> words = MaximoOslcMapper.words(query);

        List<MaximoInventoryItemDto> hits = List.of();
        if (site.equals(snap.getSite())) {
            hits = snap.getRows().stream()
                    .filter(d -> allStores || storeroom.equalsIgnoreCase(d.getStoreroom()))
                    .filter(d -> matchesWords(d, words))
                    .sorted(byRelevance(query))
                    .limit(cap).collect(Collectors.toList());
        }
        if (snap.getRows().isEmpty()) warm();   // not built yet — start it, but don't make this request wait
        if (hits.isEmpty() && !words.isEmpty()) hits = liveItemnumFallback(query, site, storeroom, allStores, cap);
        return hits;
    }

    /** Distinct warehouses (storerooms) holding stock at the site — for the warehouse filter. */
    public List<String> storerooms(String siteid) {
        Snapshot snap = state;
        if (snap.getRows().isEmpty()) {
            warm();
            return List.of();
        }
        return snap.getRows().stream()
                .map(MaximoInventoryItemDto::getStoreroom)
                .filter(s -> s != null && !s.isBlank())
                .distinct().sorted().collect(Collectors.toList());
    }

    /** Catalog readiness — lets the UI show an honest "building the catalog" state instead of a silent empty search. */
    public Map<String, Object> status() {
        Snapshot snap = state;
        boolean ready = !snap.getRows().isEmpty();
        if (!ready) warm();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ready", ready);
        m.put("building", refreshing.get());
        m.put("rows", snap.getRows().size());
        m.put("site", snap.getSite());
        m.put("builtAt", snap.getBuiltAt() > 0 ? Instant.ofEpochMilli(snap.getBuiltAt()).toString() : null);
        m.put("fullBuiltAt", snap.getFullBuiltAt() > 0 ? Instant.ofEpochMilli(snap.getFullBuiltAt()).toString() : null);
        return m;
    }

    private String resolveSite(String siteid) {
        return (siteid != null && !siteid.isBlank()) ? siteid : adapter.defaultSite();
    }

    private static boolean matchesWords(MaximoInventoryItemDto d, List<String> words) {
        if (words.isEmpty()) return true;
        String hay = ((d.getItemnum() == null ? "" : d.getItemnum()) + " "
                + (d.getDescription() == null ? "" : d.getDescription())).toLowerCase();
        for (String w : words) if (!hay.contains(w.toLowerCase())) return false;
        return true;
    }

    private static Comparator<MaximoInventoryItemDto> byRelevance(String query) {
        String q = query == null ? "" : query.trim().toLowerCase();
        return Comparator.comparingInt((MaximoInventoryItemDto d) -> tier(d, q))
                .thenComparing(MaximoInventoryItemDto::getItemnum, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(d -> d.getStoreroom() == null ? "" : d.getStoreroom());
    }

    private static int tier(MaximoInventoryItemDto d, String q) {
        if (q.isEmpty() || d.getItemnum() == null) return 2;
        String n = d.getItemnum().toLowerCase();
        if (n.equals(q)) return 0;
        if (n.startsWith(q)) return 1;
        return 2;
    }

    /** A single bare token with no cached hit is very likely an item number typed from a bin label — check Maximo. */
    private List<MaximoInventoryItemDto> liveItemnumFallback(String query, String site, String storeroom,
                                                             boolean allStores, int cap) {
        String token = query == null ? "" : query.trim();
        if (token.length() < 2 || token.contains(" ")) return List.of();
        return adapter.findLiveByItemnum(token, site).stream()
                .filter(d -> allStores || storeroom.equalsIgnoreCase(d.getStoreroom()))
                .limit(cap).collect(Collectors.toList());
    }

    // ---------------------------------------------------------------- refresh (background thread only)

    /** Kick a refresh off the request thread. A search must never wait on Maximo. */
    public void warm() {
        if (refreshing.get()) return;
        worker.submit(this::refresh);
    }

    /**
     * Cheap probes first; the ~100s full rebuild only when they prove it is needed.
     * <ol>
     *   <li>change probe (~0.1s): rows with {@code statusdate > watermark} → merge just those</li>
     *   <li>drift probe (~0.1s): Maximo's {@code totalCount} vs cached size → a deletion happened → full rebuild</li>
     *   <li>age: INVENTORY has no {@code changedate}, so balance / description / bin edits are invisible to the
     *       watermark. A periodic full rebuild is the only thing that can refresh them.</li>
     * </ol>
     */
    @Scheduled(initialDelayString = "${maximo.inventory.refresh-initial-delay-ms:20000}",
               fixedDelayString = "${maximo.inventory.refresh-interval-ms:300000}")
    public void scheduledRefresh() {
        // Hand off to our own thread rather than refreshing inline: Spring's scheduler pool is one thread by
        // default, and a full rebuild would park it for ~100s, stalling every other @Scheduled job in the app.
        warm();
    }

    private void refresh() {
        if (!refreshing.compareAndSet(false, true)) return;   // one refresh at a time; the next tick will retry
        try {
            String site = adapter.defaultSite();
            Snapshot snap = state;

            if (snap.getRows().isEmpty() || !site.equals(snap.getSite()) || snap.watermarkTs() == null) {
                fullRebuild(site);
                return;
            }
            long age = System.currentTimeMillis() - snap.getFullBuiltAt();
            if (age >= fullRebuildIntervalMs) {
                log.info("[Maximo] inventory catalog is {} h old — full rebuild to refresh balances/descriptions",
                        Duration.ofMillis(age).toHours());
                fullRebuild(site);
                return;
            }

            int changed = adapter.countChangedSince(site, nextBoundary(snap.watermarkTs()));
            if (changed > 0) snap = incrementalMerge(site, snap);

            // Compare against the raw member count Maximo last gave us, NOT rows.size(): rows are de-duplicated
            // by itemnum|location, and any collapse would otherwise read as permanent drift → a rebuild storm.
            int total = adapter.countStockLines(site);
            if (total >= 0 && total != snap.getSourceCount()) {
                log.info("[Maximo] inventory catalog drift: Maximo reports {} stock lines, catalog was built from {}"
                        + " — full rebuild", total, snap.getSourceCount());
                fullRebuild(site);
            }
        } catch (Exception e) {
            log.warn("[Maximo] inventory catalog refresh failed, keeping the catalog we have: {}", e.toString());
        } finally {
            refreshing.set(false);
        }
    }

    private void fullRebuild(String site) {
        long t0 = System.currentTimeMillis();
        MaximoInventoryAdapter.StockFetch fetch = adapter.fetchStockLines(site, null);
        List<MaximoInventoryItemDto> rows = fetch.rows();
        if (rows.isEmpty()) {
            log.warn("[Maximo] inventory full rebuild returned no stock lines — keeping the existing catalog");
            return;
        }
        Map<String, String> descriptions = adapter.fetchDescriptions(
                rows.stream().map(MaximoInventoryItemDto::getItemnum).collect(Collectors.toList()));
        rows.forEach(d -> d.setDescription(descriptions.get(d.getItemnum())));

        long now = System.currentTimeMillis();
        publish(snapshotOf(site, fetch.maxStatusdate(), fetch.rawCount(), rows, now, now));
        log.info("[Maximo] inventory catalog rebuilt: {} stock lines, {} descriptions, {} ms",
                rows.size(), descriptions.size(), now - t0);
    }

    /**
     * The exclusive lower bound for "changed since the watermark".
     *
     * <p>Maximo stores statusdate with sub-second precision but only ever emits whole seconds, so a row whose
     * real timestamp is {@code 09:07:55.412} reads back as {@code 09:07:55} — and {@code statusdate > "09:07:55"}
     * still matches it. Probing at the raw watermark would therefore report "1 changed" on every single tick
     * forever, merging and rewriting the snapshot for nothing. Round up to the next whole second instead.
     *
     * <p>The cost: a change landing later in the same second as the watermark is invisible to the incremental
     * pass. New stock lines are still caught by the drift probe, and the periodic full rebuild catches the rest.
     */
    private static OffsetDateTime nextBoundary(OffsetDateTime watermark) {
        return watermark.truncatedTo(ChronoUnit.SECONDS).plusSeconds(1);
    }

    private Snapshot incrementalMerge(String site, Snapshot snap) {
        long t0 = System.currentTimeMillis();
        // Same boundary the probe counted with, so the rows we fetch are exactly the rows it said had changed.
        MaximoInventoryAdapter.StockFetch fetch = adapter.fetchStockLines(site, nextBoundary(snap.watermarkTs()));
        if (fetch.rows().isEmpty()) return snap;

        // Descriptions come from the item master and rarely change: carry them forward by itemnum and pull
        // only for itemnums the catalog has never seen (a handful, ~0.2s) instead of re-fetching all ~5,500.
        Map<String, String> descriptions = new HashMap<>();
        for (MaximoInventoryItemDto d : snap.getRows()) {
            if (d.getDescription() != null) descriptions.putIfAbsent(d.getItemnum(), d.getDescription());
        }
        List<String> unseen = fetch.rows().stream().map(MaximoInventoryItemDto::getItemnum)
                .filter(n -> n != null && !descriptions.containsKey(n)).distinct().collect(Collectors.toList());
        if (!unseen.isEmpty()) descriptions.putAll(adapter.fetchDescriptions(unseen));
        fetch.rows().forEach(d -> d.setDescription(descriptions.get(d.getItemnum())));

        Map<String, MaximoInventoryItemDto> byKey = new LinkedHashMap<>();
        for (MaximoInventoryItemDto d : snap.getRows()) byKey.put(MaximoInventoryAdapter.key(d.getItemnum(), d.getStoreroom()), d);
        int added = 0;
        for (MaximoInventoryItemDto d : fetch.rows()) {
            if (byKey.put(MaximoInventoryAdapter.key(d.getItemnum(), d.getStoreroom()), d) == null) added++;
        }

        // Rows without a readable statusdate leave max null; the watermark must never move backwards.
        OffsetDateTime max = fetch.maxStatusdate();
        if (max == null || max.isBefore(snap.watermarkTs())) max = snap.watermarkTs();

        // Every merged row is one Maximo already counted, so the drift baseline moves by exactly the new keys.
        Snapshot next = snapshotOf(site, max, snap.getSourceCount() + added, new ArrayList<>(byKey.values()),
                System.currentTimeMillis(), snap.getFullBuiltAt());
        publish(next);
        log.info("[Maximo] inventory catalog merged {} changed stock lines ({} new, {} new items) in {} ms",
                fetch.rows().size(), added, unseen.size(), System.currentTimeMillis() - t0);
        return next;
    }

    private static Snapshot snapshotOf(String site, OffsetDateTime watermark, int sourceCount,
                                       List<MaximoInventoryItemDto> rows, long builtAt, long fullBuiltAt) {
        canonicalize(rows);
        Snapshot s = new Snapshot();
        s.setVersion(SNAPSHOT_VERSION);
        s.setSite(site);
        s.setWatermark((watermark == null ? OffsetDateTime.now() : watermark).toString());
        s.setSourceCount(sourceCount);
        s.setRows(rows);
        s.setBuiltAt(builtAt);
        s.setFullBuiltAt(fullBuiltAt);
        return s;
    }

    private void publish(Snapshot next) {
        state = next;
        saveSnapshot(next);
    }

    /** ~6,000 rows share under 20 distinct storeroom/unit/status values — pooling them cuts catalog memory ~40%. */
    private static void canonicalize(List<MaximoInventoryItemDto> rows) {
        Map<String, String> pool = new HashMap<>();
        for (MaximoInventoryItemDto d : rows) {
            d.setStoreroom(pooled(pool, d.getStoreroom()));
            d.setIssueunit(pooled(pool, d.getIssueunit()));
            d.setStatus(pooled(pool, d.getStatus()));
        }
    }

    private static String pooled(Map<String, String> pool, String s) {
        return s == null ? null : pool.computeIfAbsent(s, Function.identity());
    }

    // ---------------------------------------------------------------- snapshot file

    @PostConstruct
    void loadSnapshot() {
        try {
            if (!Files.isRegularFile(snapshotFile)) {
                log.info("[Maximo] no inventory catalog snapshot at {} — the first refresh will build one", snapshotFile);
                return;
            }
            Snapshot s;
            try (InputStream in = new GZIPInputStream(new BufferedInputStream(Files.newInputStream(snapshotFile)))) {
                s = json.readValue(in, Snapshot.class);
            }
            if (s == null || s.getVersion() != SNAPSHOT_VERSION || s.getRows() == null || s.getRows().isEmpty()) {
                log.warn("[Maximo] ignoring unusable inventory catalog snapshot at {}", snapshotFile);
                return;
            }
            canonicalize(s.getRows());
            state = s;
            log.info("[Maximo] inventory catalog loaded from snapshot: {} stock lines, site {}, watermark {}",
                    s.getRows().size(), s.getSite(), s.getWatermark());
        } catch (Exception e) {
            log.warn("[Maximo] could not read inventory catalog snapshot {}: {}", snapshotFile, e.toString());
        }
    }

    /** Temp file + rename, so a crash mid-write can never leave a half-written snapshot to be loaded at boot. */
    private void saveSnapshot(Snapshot snap) {
        Path tmp = snapshotFile.resolveSibling(snapshotFile.getFileName() + ".tmp");
        try {
            Path parent = snapshotFile.getParent();
            if (parent != null) Files.createDirectories(parent);
            try (OutputStream out = Files.newOutputStream(tmp);
                 GZIPOutputStream gz = new GZIPOutputStream(new BufferedOutputStream(out))) {
                json.writeValue(gz, snap);
                gz.finish();
            }
            try {
                Files.move(tmp, snapshotFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tmp, snapshotFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception e) {
            log.warn("[Maximo] could not write inventory catalog snapshot {}: {}", snapshotFile, e.toString());
            try {
                Files.deleteIfExists(tmp);
            } catch (Exception ignored) {
                // best effort
            }
        }
    }

    @PreDestroy
    void shutdown() {
        worker.shutdownNow();
    }

    /** On-disk (and in-memory) form of the catalog. Immutable once published. */
    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Snapshot {   // deliberately not @Data — its toString() would render every row
        private int version = SNAPSHOT_VERSION;
        private String site;
        /** Maximo's own newest {@code statusdate} across the catalog — its clock, so no timezone/skew guessing. */
        private String watermark;
        /** Raw stock lines Maximo reported for what this catalog was built from — the drift-probe baseline. */
        private int sourceCount;
        private long builtAt;
        private long fullBuiltAt;
        private List<MaximoInventoryItemDto> rows = List.of();

        static Snapshot empty() {
            return new Snapshot();
        }

        OffsetDateTime watermarkTs() {
            if (watermark == null || watermark.isBlank()) return null;
            try {
                return OffsetDateTime.parse(watermark);
            } catch (DateTimeParseException e) {
                return null;
            }
        }
    }
}
