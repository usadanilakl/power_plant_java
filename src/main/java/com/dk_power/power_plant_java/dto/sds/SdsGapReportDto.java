package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * What's still missing after the initial seed, computed against the bundled eBinder catalog:
 * website chemicals not yet in our DB, and DB chemicals that have no SDS PDF attached.
 * The Electron "Close gaps" scrape closes both (creates missing entries + downloads PDFs).
 */
@Data
public class SdsGapReportDto {
    private int catalogCount;          // chemicals in the eBinder catalog (the website)
    private int activeCount;           // active chemicals in our DB

    /** In the eBinder catalog but not yet in our DB (need a full entry + PDF). */
    private List<Gap> missingFromDb = new ArrayList<>();
    /** Active DB chemicals with no SDS PDF attached (the seeded book items). */
    private List<Gap> missingPdf = new ArrayList<>();

    /**
     * Book entries from the curated map that had no row in the eBinder export at seed time, and
     * still have no DB record at their Book/Section. The renderer lets the user manually pick an
     * eBinder candidate for each, then upserts via /import — close-gaps attaches the PDF after.
     */
    private List<UnmatchedBookEntry> unmatchedBookEntries = new ArrayList<>();

    @Data
    public static class UnmatchedBookEntry {
        private String name;
        private Integer bookNumber;
        private Integer sectionNumber;

        public UnmatchedBookEntry() {}
        public UnmatchedBookEntry(String name, Integer bookNumber, Integer sectionNumber) {
            this.name = name;
            this.bookNumber = bookNumber;
            this.sectionNumber = sectionNumber;
        }
    }

    @Data
    public static class Gap {
        private String sourceId;
        private String name;
        private Integer bookNumber;
        private Integer sectionNumber;

        public Gap() {}
        public Gap(String sourceId, String name, Integer bookNumber, Integer sectionNumber) {
            this.sourceId = sourceId;
            this.name = name;
            this.bookNumber = bookNumber;
            this.sectionNumber = sectionNumber;
        }
    }
}
