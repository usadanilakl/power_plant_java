package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoTicketAssetDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.entities.maximo.AssetMatchConfidence;
import com.dk_power.power_plant_java.entities.maximo.MaximoTicketAsset;
import com.dk_power.power_plant_java.entities.maximo.MaximoTicketType;
import com.dk_power.power_plant_java.repository.maximo.MaximoTicketAssetRepo;
import com.dk_power.power_plant_java.sevice.maximo.MaximoAssetMatcher.AssetIndex;
import com.dk_power.power_plant_java.sevice.maximo.MaximoAssetMatcher.MatchResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

/**
 * Builds and maintains the {@link MaximoTicketAsset} index: pull Maximo SRs + WOs, run the tag matcher
 * against the live asset master, and store the identified/suggested asset per ticket so tickets can be
 * searched by tag number. Runs on the hub (Maximo access) and syncs the index to every desktop.
 *
 * <p>{@link #backfill(int, boolean)} does the one-time full scan (last N years, default 5); the periodic
 * {@link #incremental(boolean)} re-scans only tickets changed since the last run. Both upsert by the
 * ticket's natural key so re-runs are idempotent.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MaximoTicketIndexService {

    private static final int DEFAULT_YEARS = 5;
    private static final int PAGE_SIZE = 2000;
    private static final int MAX_PAGES = 25;            // 2000*25 = 50k per query ceiling
    private static final int ASSET_CAP = 500 * 40;      // MaximoAssetAdapter.getAllAssets pages 500 x 40
    private static final int SEARCH_LIMIT = 200;
    /** Flush + clear the persistence context every N upserts so a multi-year backfill can't bloat it. */
    private static final int BATCH_FLUSH = 500;
    /** Persisted last-run marker (mirrors SharePointSyncOrchestrator's sp-last-sync.properties). */
    private static final Path LAST_RUN_FILE = Path.of("./maximo-ticket-index.properties");
    private static final String LAST_RUN_KEY = "lastRunAt";

    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoServiceRequestAdapter serviceRequests;
    private final MaximoAssetAdapter assets;
    private final MaximoAssetMatcher matcher;
    private final MaximoTicketAssetRepo repo;
    private final MaximoAccessService access;

    @PersistenceContext
    private EntityManager em;

    // ── Backfill ────────────────────────────────────────────────────────────────

    /**
     * One-time backfill: index every SR + WO with a reportdate in the last {@code years} years. Idempotent
     * (upsert by ticket key). {@code dryRun} counts without writing. Records the run time for incrementals.
     */
    public Map<String, Object> backfill(int years, boolean dryRun) {
        int window = years > 0 ? years : DEFAULT_YEARS;
        String fromIso = LocalDate.now().minusYears(window) + "T00:00:00";
        AssetIndex index = buildAssetIndex();

        MaximoWorkOrderCriteria woc = new MaximoWorkOrderCriteria();
        woc.setReportdateFrom(fromIso);
        List<MaximoWorkOrderDto> wos = workOrders.listAllByCriteria(woc, PAGE_SIZE, MAX_PAGES);

        MaximoServiceRequestCriteria src = new MaximoServiceRequestCriteria();
        src.setReportdateFrom(fromIso);
        List<MaximoServiceRequestDto> srs = serviceRequests.listAllByCriteria(src, PAGE_SIZE, MAX_PAGES);

        Tally tally = new Tally();
        LocalDateTime now = LocalDateTime.now();
        for (MaximoWorkOrderDto wo : wos) processWo(index, wo, dryRun, now, tally);
        for (MaximoServiceRequestDto sr : srs) processSr(index, sr, dryRun, now, tally);

        if (!dryRun) writeLastRun(now);
        Map<String, Object> summary = tally.toMap();
        summary.put("assetsIndexed", index.size());
        summary.put("windowYears", window);
        summary.put("woScanned", wos.size());
        summary.put("srScanned", srs.size());
        // A query that hit its page ceiling was truncated (oldest tickets / tail of the asset list dropped) —
        // surface it so the operator knows the index may be incomplete (narrow the window or raise the caps).
        boolean truncated = wos.size() >= PAGE_SIZE * MAX_PAGES || srs.size() >= PAGE_SIZE * MAX_PAGES
                || index.size() >= ASSET_CAP;
        summary.put("truncated", truncated);
        summary.put("dryRun", dryRun);
        log.info("[TicketIndex] backfill ({}yr, dryRun={}): {} WOs + {} SRs, {} assets — {}",
                window, dryRun, wos.size(), srs.size(), index.size(), summary);
        return summary;
    }

    // ── Incremental ──────────────────────────────────────────────────────────────

    /**
     * Re-index tickets changed since the last run: new WOs/SRs (by reportdate) plus WOs whose status
     * changed (by statusdate). Idempotent upsert. Defaults to the last 7 days if no prior run is recorded.
     */
    public Map<String, Object> incremental(boolean dryRun) {
        LocalDateTime lastRun = readLastRun();
        String fromIso = lastRun.toLocalDate() + "T00:00:00";
        AssetIndex index = buildAssetIndex();

        // WOs: union new-by-reportdate + changed-by-statusdate, keyed by wonum.
        Map<String, MaximoWorkOrderDto> woByNum = new LinkedHashMap<>();
        MaximoWorkOrderCriteria woNew = new MaximoWorkOrderCriteria();
        woNew.setReportdateFrom(fromIso);
        for (MaximoWorkOrderDto w : workOrders.listAllByCriteria(woNew, PAGE_SIZE, MAX_PAGES)) {
            if (w.getWonum() != null) woByNum.putIfAbsent(w.getWonum(), w);
        }
        MaximoWorkOrderCriteria woChanged = new MaximoWorkOrderCriteria();
        woChanged.setStatusdateFrom(fromIso);
        for (MaximoWorkOrderDto w : workOrders.listAllByCriteria(woChanged, PAGE_SIZE, MAX_PAGES)) {
            if (w.getWonum() != null) woByNum.putIfAbsent(w.getWonum(), w);
        }

        // SRs: union new-by-reportdate + changed-by-statusdate, keyed by ticketid (mirrors the WO path).
        Map<String, MaximoServiceRequestDto> srByNum = new LinkedHashMap<>();
        MaximoServiceRequestCriteria srNew = new MaximoServiceRequestCriteria();
        srNew.setReportdateFrom(fromIso);
        for (MaximoServiceRequestDto s : serviceRequests.listAllByCriteria(srNew, PAGE_SIZE, MAX_PAGES)) {
            if (s.getTicketid() != null) srByNum.putIfAbsent(s.getTicketid(), s);
        }
        MaximoServiceRequestCriteria srChanged = new MaximoServiceRequestCriteria();
        srChanged.setStatusdateFrom(fromIso);
        for (MaximoServiceRequestDto s : serviceRequests.listAllByCriteria(srChanged, PAGE_SIZE, MAX_PAGES)) {
            if (s.getTicketid() != null) srByNum.putIfAbsent(s.getTicketid(), s);
        }

        Tally tally = new Tally();
        LocalDateTime now = LocalDateTime.now();
        for (MaximoWorkOrderDto wo : woByNum.values()) processWo(index, wo, dryRun, now, tally);
        for (MaximoServiceRequestDto sr : srByNum.values()) processSr(index, sr, dryRun, now, tally);

        if (!dryRun) writeLastRun(now);
        Map<String, Object> summary = tally.toMap();
        summary.put("since", lastRun.toString());
        summary.put("woScanned", woByNum.size());
        summary.put("srScanned", srByNum.size());
        summary.put("dryRun", dryRun);
        log.info("[TicketIndex] incremental since {} (dryRun={}): {} WOs + {} SRs — {}",
                lastRun, dryRun, woByNum.size(), srByNum.size(), summary);
        return summary;
    }

    // ── Search ──────────────────────────────────────────────────────────────────

    /** Search the index by (partial) tag number. Returns up to {@code limit} matches, newest first. */
    @Transactional(readOnly = true)
    public List<MaximoTicketAssetDto> searchByTag(String tag, int limit) {
        if (tag == null || tag.isBlank()) return List.of();
        String t = tag.trim().toUpperCase();
        String likeUpper = "%" + t + "%";
        // Also match the delimiter-stripped form so "01ACCHEX01B" finds a stored "01-ACC-HEX-01B".
        String compact = MaximoAssetMatcher.compactKey(t);
        String likeCompact = compact.isEmpty() ? " " : "%" + compact + "%"; // sentinel that matches nothing
        int cap = (limit > 0 && limit <= SEARCH_LIMIT) ? limit : SEARCH_LIMIT;
        return repo.searchByTag(likeUpper, likeCompact, PageRequest.of(0, cap)).stream().map(this::toDto).toList();
    }

    // ── Processing / upsert ───────────────────────────────────────────────────────

    private AssetIndex buildAssetIndex() {
        return matcher.buildIndex(assets.getAllAssets(access.defaultSite()));
    }

    private void processWo(AssetIndex index, MaximoWorkOrderDto wo, boolean dryRun, LocalDateTime now, Tally tally) {
        if (wo.getWonum() == null || wo.getWonum().isBlank()) return;
        MatchResult m = matcher.match(index, wo.getAssetnum(), wo.getDescription(), wo.getLongDescription());
        upsert(MaximoTicketType.WO, wo.getWonum(), wo.getHref(), wo.getDescription(), wo.getStatus(),
                wo.getSiteid(), wo.getReportdate(), wo.getAssetnum(), wo.getLocation(), wo.getStatusDate(),
                m, dryRun, now, tally);
    }

    private void processSr(AssetIndex index, MaximoServiceRequestDto sr, boolean dryRun, LocalDateTime now, Tally tally) {
        if (sr.getTicketid() == null || sr.getTicketid().isBlank()) return;
        MatchResult m = matcher.match(index, sr.getAssetnum(), sr.getDescription(), sr.getLongDescription());
        String changedAt = (sr.getStatusDate() != null && !sr.getStatusDate().isBlank()) ? sr.getStatusDate() : sr.getReportdate();
        upsert(MaximoTicketType.SR, sr.getTicketid(), sr.getHref(), sr.getDescription(), sr.getStatus(),
                sr.getSiteid(), sr.getReportdate(), sr.getAssetnum(), sr.getLocation(), changedAt,
                m, dryRun, now, tally);
    }

    private void upsert(MaximoTicketType type, String ticketId, String href, String title, String status,
                        String siteid, String reportDate, String maximoAssetnum, String maximoLocation,
                        String changedAt, MatchResult m, boolean dryRun, LocalDateTime now, Tally tally) {
        tally.count(m.confidence());
        if (dryRun) return;

        String key = type.name() + ":" + ticketId;
        MaximoTicketAsset row = repo.findFirstByTicketKey(key).orElse(null);
        boolean isNew = row == null;
        if (row == null) row = MaximoTicketAsset.builder().ticketKey(key).build();

        row.setTicketType(type);
        row.setTicketId(ticketId);
        row.setHref(href);
        row.setTitle(title);
        row.setStatus(status);
        row.setSiteid(siteid);
        row.setReportDate(reportDate);
        row.setMaximoAssetnum(blankToNull(maximoAssetnum));
        row.setMaximoLocation(blankToNull(maximoLocation));
        row.setIdentifiedAssetnum(m.identifiedAssetnum());
        row.setConfidence(m.confidence());
        row.setMatchSource(m.matchSource());
        row.setSuggestedAssetnums(join(m.suggested()));
        row.setExtractedTags(join(m.extractedTags()));
        row.setSearchCompact(buildSearchCompact(m.identifiedAssetnum(), maximoAssetnum, m.suggested(), m.extractedTags()));
        row.setTicketChangedAt(changedAt);
        row.setProcessedAt(now);
        repo.save(row);
        tally.upsert(isNew);
        // Keep the persistence context bounded on a large backfill (also fires the sync listener per batch).
        if ((tally.created + tally.updated) % BATCH_FLUSH == 0) {
            em.flush();
            em.clear();
        }
    }

    private MaximoTicketAssetDto toDto(MaximoTicketAsset t) {
        return MaximoTicketAssetDto.builder()
                .id(t.getId())
                .ticketKey(t.getTicketKey())
                .ticketType(t.getTicketType())
                .ticketId(t.getTicketId())
                .href(t.getHref())
                .title(t.getTitle())
                .status(t.getStatus())
                .siteid(t.getSiteid())
                .reportDate(t.getReportDate())
                .maximoAssetnum(t.getMaximoAssetnum())
                .maximoLocation(t.getMaximoLocation())
                .identifiedAssetnum(t.getIdentifiedAssetnum())
                .confidence(t.getConfidence())
                .matchSource(t.getMatchSource())
                .suggestedAssets(split(t.getSuggestedAssetnums()))
                .extractedTags(split(t.getExtractedTags()))
                .processedAt(t.getProcessedAt())
                .build();
    }

    // ── Last-run persistence ──────────────────────────────────────────────────────

    private LocalDateTime readLastRun() {
        try {
            if (Files.exists(LAST_RUN_FILE)) {
                Properties p = new Properties();
                try (InputStream in = Files.newInputStream(LAST_RUN_FILE)) { p.load(in); }
                String v = p.getProperty(LAST_RUN_KEY);
                if (v != null && !v.isBlank()) return LocalDateTime.parse(v.trim());
            }
        } catch (Exception e) {
            log.warn("[TicketIndex] could not read {} — defaulting to last 7 days: {}", LAST_RUN_FILE, e.getMessage());
        }
        return LocalDateTime.now().minusDays(7);
    }

    private void writeLastRun(LocalDateTime t) {
        try {
            Properties p = new Properties();
            p.setProperty(LAST_RUN_KEY, t.toString());
            try (OutputStream out = Files.newOutputStream(LAST_RUN_FILE)) {
                p.store(out, "Maximo ticket-index last run");
            }
        } catch (IOException e) {
            log.warn("[TicketIndex] could not persist last-run to {}: {}", LAST_RUN_FILE, e.getMessage());
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────────

    private static String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

    /** Comma-joined delimiter-stripped forms of every tag/assetnum on the row — the delimiter-insensitive search column. */
    private static String buildSearchCompact(String identified, String maximoAssetnum,
                                             List<String> suggested, List<String> extracted) {
        Set<String> parts = new LinkedHashSet<>();
        addCompact(parts, identified);
        addCompact(parts, maximoAssetnum);
        if (suggested != null) for (String s : suggested) addCompact(parts, s);
        if (extracted != null) for (String s : extracted) addCompact(parts, s);
        return parts.isEmpty() ? null : String.join(",", parts);
    }

    private static void addCompact(Set<String> parts, String s) {
        if (s == null || s.isBlank()) return;
        String c = MaximoAssetMatcher.compactKey(s);
        if (!c.isEmpty()) parts.add(c);
    }

    private static String join(List<String> values) {
        if (values == null || values.isEmpty()) return null;
        return String.join(",", values);
    }

    private static List<String> split(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        List<String> out = new ArrayList<>();
        for (String s : csv.split(",")) if (!s.isBlank()) out.add(s.trim());
        return out;
    }

    /** Running counters for a backfill/incremental pass. */
    private static final class Tally {
        int exact, strong, partial, none, created, updated;
        void count(AssetMatchConfidence c) {
            switch (c) {
                case EXACT -> exact++;
                case STRONG -> strong++;
                case PARTIAL -> partial++;
                case NONE -> none++;
            }
        }
        void upsert(boolean isNew) { if (isNew) created++; else updated++; }
        Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("created", created);
            m.put("updated", updated);
            m.put("matchedExact", exact);
            m.put("matchedStrong", strong);
            m.put("suggestedPartial", partial);
            m.put("unmatched", none);
            return m;
        }
    }
}
