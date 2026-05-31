package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Three symmetric gap categories after seeding, computed against the live eBinder catalog
 * (or the bundled snapshot when no live catalog is supplied):
 * <ul>
 *   <li><b>missingFromDb</b> — chemicals in the eBinder but not in our DB (need create + PDF).</li>
 *   <li><b>missingPdf</b> — chemicals in our DB without an SDS PDF (close-gaps attaches it).</li>
 *   <li><b>missingFromEbinder</b> — chemicals in our DB whose sourceId isn't in the eBinder
 *       catalog: either book-only seed entries with synthetic {@code BOOK-{book}-{section}} ids,
 *       or eBinder chemicals that were removed from the website. Operators manually map each to
 *       a current eBinder candidate via {@code POST /ng/sds-chemicals/{id}/match}.</li>
 * </ul>
 */
@Data
public class SdsGapReportDto {
    private int catalogCount;
    private int activeCount;

    private List<Gap> missingFromDb = new ArrayList<>();
    private List<Gap> missingPdf = new ArrayList<>();
    private List<Gap> missingFromEbinder = new ArrayList<>();

    @Data
    public static class Gap {
        /** DB row id — set for missingPdf / missingFromEbinder; null for missingFromDb. */
        private Long id;
        private String sourceId;
        private String name;
        private Integer bookNumber;
        private Integer sectionNumber;

        public Gap() {}
        public Gap(Long id, String sourceId, String name, Integer bookNumber, Integer sectionNumber) {
            this.id = id;
            this.sourceId = sourceId;
            this.name = name;
            this.bookNumber = bookNumber;
            this.sectionNumber = sectionNumber;
        }
        /** Convenience for missingFromDb where there's no DB id. */
        public Gap(String sourceId, String name, Integer bookNumber, Integer sectionNumber) {
            this(null, sourceId, name, bookNumber, sectionNumber);
        }
    }
}
