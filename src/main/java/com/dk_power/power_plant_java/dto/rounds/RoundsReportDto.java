package com.dk_power.power_plant_java.dto.rounds;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Transfer object for a scraped WebView AMS "Rounds" report.
 *
 * On POST from the desktop scraper, {@code columns} and {@code rows} carry the
 * parsed table. On GET /list they are omitted (metadata only); on GET /latest
 * they are populated.
 */
@Getter
@Setter
@NoArgsConstructor
public class RoundsReportDto {

    private Long id;
    private String title;
    private String facility;
    private String generatedAt;
    private String filterLine;
    private int resultCount;
    private int rowCount;
    private int columnCount;
    private String contentHash;
    private String scrapedAt;
    private LocalDateTime dateCreated;

    /** Column headers. */
    private List<String> columns;

    /** Table body — one inner list per response row, aligned to {@code columns}. */
    private List<List<String>> rows;

    /** Shift-aggregated reports: "YYYY-MM-DD|Day"/"…|Night" per row for trend extraction. */
    private List<String> shiftKeys;
}
