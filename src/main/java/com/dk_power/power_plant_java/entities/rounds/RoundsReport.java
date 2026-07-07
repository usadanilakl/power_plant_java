package com.dk_power.power_plant_java.entities.rounds;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

/**
 * A single scraped snapshot of the WebView AMS "Rounds" Trend Table report.
 *
 * <p>Extends {@link BaseAuditEntity} so it participates in the field-level CRDT
 * sync flow — a scrape done on one desktop propagates through the hub to the
 * other desktop clients. Registered in {@code ServiceFacade} and
 * {@code EntityTableRegistry}. The parsed table is stored verbatim as JSON
 * ({@code columnsJson} / {@code rowsJson}).
 */
@Entity
@Table(name = "rounds_report")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class RoundsReport extends BaseAuditEntity {

    /** Report header metadata, straight from the Excel. */
    private String title;
    private String facility;
    private String generatedAt;

    @Column(columnDefinition = "TEXT")
    private String filterLine;

    /** "Results: N" count reported by the Excel. */
    private int resultCount;

    /** Parsed table dimensions (kept for cheap metadata queries). */
    private int rowCount;
    private int columnCount;

    /** sha256 of columns+rows — used to skip storing an unchanged report. */
    @Column(length = 64)
    private String contentHash;

    /** When the desktop scraped it (ISO-8601 string from the scraper). */
    private String scrapedAt;

    /** Column headers — JSON array of strings. */
    @Column(columnDefinition = "TEXT")
    private String columnsJson;

    /** Table body — JSON array of row arrays. */
    @Column(columnDefinition = "TEXT")
    private String rowsJson;

    /**
     * Shift-aggregated reports only: machine "YYYY-MM-DD|Day"/"…|Night" key per
     * row ("" for pass-through rows), aligned to {@code rowsJson}. Lets trend
     * extraction recover the exact shift date without parsing the display label.
     */
    @Column(columnDefinition = "TEXT")
    private String shiftKeysJson;
}
