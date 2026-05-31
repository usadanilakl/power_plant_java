package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.dto.sds.SdsGapReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportItemDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsSeedReportDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * One-shot seeding of the SDS inventory from the bundled book-to-eBinder match map
 * ({@code resources/sds/sds-book-map.json}) enriched with the eBinder catalog
 * ({@code resources/sds/ebinder-export.csv}). Loads metadata + Book/Section only — no PDFs;
 * the Electron "Close gaps" scrape downloads the PDFs afterwards. Also computes the gap report
 * (website chemicals not yet in the DB + DB chemicals with no PDF) the Electron page shows.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SdsSeedService {

    private static final String CATALOG_CSV = "sds/ebinder-export.csv";
    private static final String BOOK_MAP_JSON = "sds/sds-book-map.json";

    private final NgSdsChemicalService chemicalService;
    private final SdsChemicalRepo repo;
    private final PermitAttachmentRepo attachmentRepo;
    private final ObjectMapper objectMapper;

    /** One eBinder catalog row (the website's record for a chemical). */
    public record CatalogRow(String sourceId, String name, String manufacturer, String revisionDate) {}

    /** Synthetic sourceId for book entries that had no eBinder match at seed time. Stable per slot
     *  so re-seeding is idempotent; numeric eBinder Document IDs can never collide with these. When
     *  an operator manually maps such a chemical to an eBinder candidate, this is swapped for the
     *  real Document ID via {@code POST /ng/sds-chemicals/{id}/match}. */
    public static String bookOnlySourceId(int book, int section) {
        return "BOOK-" + book + "-" + section;
    }

    /**
     * Seed the inventory from the curated match map. Every book slot becomes a Filed chemical, no
     * PDF — matched slots get eBinder metadata + the real Document ID; unmatched slots get a synthetic
     * {@code BOOK-{book}-{section}} sourceId and surface later in the gap report's "missing from
     * eBinder" category for manual matching. Idempotent.
     */
    public SdsSeedReportDto seed() {
        Map<String, CatalogRow> catalog = loadCatalog();
        JsonNode root = loadBookMap();

        SdsSeedReportDto report = new SdsSeedReportDto();
        List<SdsImportItemDto> items = new ArrayList<>();

        for (JsonNode m : root.path("matched")) {
            String sourceId = m.path("sourceId").asText(null);
            if (sourceId == null || sourceId.isBlank()) continue;
            CatalogRow row = catalog.get(sourceId);

            List<String> names = new ArrayList<>();
            for (JsonNode n : m.path("names")) addUnique(names, n.asText());
            if (row != null) addUnique(names, row.name());

            SdsImportItemDto item = new SdsImportItemDto();
            item.setSourceItemId(sourceId);
            item.setNames(String.join("\n", names));
            item.setBookNumber(m.path("book").isMissingNode() ? null : m.path("book").asInt());
            item.setSectionNumber(m.path("section").isMissingNode() ? null : m.path("section").asInt());
            if (row != null) {
                item.setManufacturer(row.manufacturer());
                item.setRevisionDate(row.revisionDate());
            }
            items.add(item);
            report.setMatchedSlots(report.getMatchedSlots() + 1);
        }

        for (JsonNode u : root.path("unmatched")) {
            Integer book = u.path("book").isMissingNode() ? null : u.path("book").asInt();
            Integer section = u.path("section").isMissingNode() ? null : u.path("section").asInt();
            if (book == null || section == null) continue;
            SdsImportItemDto item = new SdsImportItemDto();
            item.setSourceItemId(bookOnlySourceId(book, section));
            item.setNames(u.path("name").asText());
            item.setBookNumber(book);
            item.setSectionNumber(section);
            // no manufacturer / revisionDate / PDF — the user will set these by matching to eBinder
            items.add(item);
            report.setBookOnlyCount(report.getBookOnlyCount() + 1);
        }

        SdsImportReportDto imported = chemicalService.importFromSource(items);
        report.setCreated(imported.getCreated());
        report.setUpdated(imported.getUpdated());
        log.info("[SDS] Seed complete: {} matched + {} book-only slots → {} created, {} updated",
                report.getMatchedSlots(), report.getBookOnlyCount(),
                report.getCreated(), report.getUpdated());
        return report;
    }

    /**
     * Gaps remaining after the seed, computed against a FRESH eBinder list scraped by the Electron
     * manager (so the report can't go stale). Each catalog item carries {@code sourceItemId} + names.
     * When the scraped list is empty (e.g. the scraper found nothing) we fall back to the bundled
     * catalog so the report still renders. Returns: website chemicals not in the DB + DB chemicals
     * with no SDS PDF.
     */
    public SdsGapReportDto gapReport(List<SdsImportItemDto> scrapedCatalog) {
        Map<String, String> catalog = new LinkedHashMap<>();   // sourceId -> primary name
        if (scrapedCatalog != null) {
            for (SdsImportItemDto item : scrapedCatalog) {
                String sourceId = item.getSourceItemId();
                if (sourceId == null || sourceId.isBlank()) continue;
                catalog.put(sourceId, primaryName(item.getNames()));
            }
        }
        if (catalog.isEmpty()) {
            loadCatalog().forEach((id, row) -> catalog.put(id, row.name()));
        }

        List<SdsChemical> active = repo.findByStatus_NameIn(
                List.of(NgSdsChemicalService.STATUS_INCOMING,
                        NgSdsChemicalService.STATUS_PENDING,
                        NgSdsChemicalService.STATUS_FILED));

        SdsGapReportDto report = new SdsGapReportDto();
        report.setCatalogCount(catalog.size());
        report.setActiveCount(active.size());

        java.util.Set<String> dbSourceIds = new java.util.HashSet<>();
        for (SdsChemical c : active) {
            String sid = c.getSourceId();
            if (sid != null && !sid.isBlank()) dbSourceIds.add(sid);

            String name = SdsChemicalMapper.primaryName(c.getNames());

            boolean hasPdf = !attachmentRepo
                    .findByEntityTypeAndEntityId(SdsChemicalMapper.ENTITY_TYPE, c.getId()).isEmpty();
            if (!hasPdf) {
                report.getMissingPdf().add(new SdsGapReportDto.Gap(
                        c.getId(), sid, name, c.getBookNumber(), c.getSectionNumber()));
            }

            // Missing from eBinder: a DB record whose sourceId isn't in the live catalog.
            // Naturally catches book-only seed records (BOOK-x-y synthetic ids) AND chemicals that
            // were removed from the eBinder since the last scrape.
            if (sid != null && !sid.isBlank() && !catalog.containsKey(sid)) {
                report.getMissingFromEbinder().add(new SdsGapReportDto.Gap(
                        c.getId(), sid, name, c.getBookNumber(), c.getSectionNumber()));
            }
        }

        for (Map.Entry<String, String> e : catalog.entrySet()) {
            if (!dbSourceIds.contains(e.getKey())) {
                report.getMissingFromDb().add(new SdsGapReportDto.Gap(e.getKey(), e.getValue(), null, null));
            }
        }

        return report;
    }

    /** First non-blank line/segment of a names value (newline- or comma-delimited). */
    private static String primaryName(String names) {
        if (names == null) return "";
        String[] parts = names.contains("\n") ? names.split("\\r?\\n") : names.split(",");
        for (String p : parts) { String t = p.trim(); if (!t.isEmpty()) return t; }
        return "";
    }

    // ============ Resource loading ============

    private Map<String, CatalogRow> loadCatalog() {
        Map<String, CatalogRow> catalog = new LinkedHashMap<>();
        try (InputStream in = new ClassPathResource(CATALOG_CSV).getInputStream()) {
            String text = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            if (!text.isEmpty() && text.charAt(0) == '﻿') text = text.substring(1);  // strip UTF-8 BOM
            List<List<String>> rows = parseCsv(text);
            if (rows.isEmpty()) return catalog;

            List<String> header = rows.get(0);
            int nameIdx = indexOf(header, "Product Name");
            int mfrIdx = indexOf(header, "Manufacturer");
            int revIdx = indexOf(header, "Revision Date");
            int idIdx = indexOf(header, "Document ID");
            if (idIdx < 0) throw new IllegalStateException("eBinder catalog missing 'Document ID' column");

            for (int i = 1; i < rows.size(); i++) {
                List<String> r = rows.get(i);
                String sourceId = cell(r, idIdx);
                if (sourceId.isBlank()) continue;
                catalog.put(sourceId, new CatalogRow(sourceId, cell(r, nameIdx), cell(r, mfrIdx), cell(r, revIdx)));
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to load eBinder catalog (" + CATALOG_CSV + "): " + e.getMessage(), e);
        }
        return catalog;
    }

    private JsonNode loadBookMap() {
        try (InputStream in = new ClassPathResource(BOOK_MAP_JSON).getInputStream()) {
            return objectMapper.readTree(in);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load SDS book map (" + BOOK_MAP_JSON + "): " + e.getMessage(), e);
        }
    }

    private static void addUnique(List<String> list, String value) {
        if (value == null) return;
        String v = value.trim();
        if (v.isEmpty()) return;
        for (String existing : list) if (existing.equalsIgnoreCase(v)) return;
        list.add(v);
    }

    private static int indexOf(List<String> header, String name) {
        for (int i = 0; i < header.size(); i++) if (header.get(i).trim().equalsIgnoreCase(name)) return i;
        return -1;
    }

    private static String cell(List<String> row, int idx) {
        return (idx < 0 || idx >= row.size() || row.get(idx) == null) ? "" : row.get(idx).trim();
    }

    /** Minimal RFC4180 parser (quoted fields may contain commas and newlines). */
    private static List<List<String>> parseCsv(String text) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < text.length() && text.charAt(i + 1) == '"') { field.append('"'); i++; }
                    else inQuotes = false;
                } else field.append(c);
            } else if (c == '"') {
                inQuotes = true;
            } else if (c == ',') {
                row.add(field.toString()); field.setLength(0);
            } else if (c == '\n') {
                row.add(field.toString()); field.setLength(0); rows.add(row); row = new ArrayList<>();
            } else if (c == '\r') {
                // ignore — handled by \n
            } else {
                field.append(c);
            }
        }
        if (field.length() > 0 || !row.isEmpty()) { row.add(field.toString()); rows.add(row); }
        return rows;
    }
}
