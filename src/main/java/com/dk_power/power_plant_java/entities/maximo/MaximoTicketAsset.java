package com.dk_power.power_plant_java.entities.maximo;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * An asset-identification index row for one Maximo ticket (a Service Request or Work Order).
 *
 * <p>At this plant operators often type the equipment identifier into the SR/WO description or long
 * description and pick a very top-level location, so it's hard to find the ticket for a given piece of
 * equipment. A batch job (backfill + periodic incremental, hub-only — see {@code MaximoTicketIndexService})
 * pulls the tickets, runs the tag matcher against the live Maximo asset master, and stores the identified
 * asset (or the most-likely suggestions) here so the data can be searched by tag number.
 *
 * <p>Keyed by {@link #ticketKey} (e.g. {@code "WO:J26-41492"} / {@code "SR:12345"}). CRDT-synced so every
 * desktop shares the index the hub built.
 */
@Entity
@Table(name = "maximo_ticket_asset",
       indexes = {
           @Index(name = "idx_mta_ticket_key", columnList = "ticket_key"),
           @Index(name = "idx_mta_identified", columnList = "identified_assetnum")
       })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted IS NOT TRUE")
public class MaximoTicketAsset extends BaseAuditEntity {

    /** Stable natural key: {@code ticketType + ":" + ticketId} (e.g. {@code "WO:J26-41492"}). Always set. */
    @Column(name = "ticket_key", nullable = false, length = 64)
    private String ticketKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_type")
    private MaximoTicketType ticketType;

    /** The Maximo SR ticketid or WO wonum. */
    @Column(name = "ticket_id", length = 64)
    private String ticketId;

    /** Maximo OSLC resource id (href) — lets the UI open the underlying record. */
    @Column(name = "href", length = 512)
    private String href;

    /** The ticket's short description (title). */
    @Column(name = "title", columnDefinition = "TEXT")
    private String title;

    @Column(name = "status", length = 32)
    private String status;

    @Column(name = "siteid", length = 16)
    private String siteid;

    /** The ticket's reportdate (raw Maximo datetime string). */
    @Column(name = "report_date", length = 40)
    private String reportDate;

    /** The assetnum Maximo already had on the ticket (often blank or wrong — the reason this index exists). */
    @Column(name = "maximo_assetnum", length = 64)
    private String maximoAssetnum;

    /** The location Maximo had on the ticket (often a very top-level node). */
    @Column(name = "maximo_location", length = 64)
    private String maximoLocation;

    /** The single asset we identified with confidence (canonical Maximo assetnum), or null. */
    @Column(name = "identified_assetnum", length = 64)
    private String identifiedAssetnum;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence", length = 16)
    private AssetMatchConfidence confidence;

    /** How the identification was made: MAXIMO_FIELD / TEXT_EXACT / TEXT_COMPACT / TEXT_PARTIAL / NONE. */
    @Column(name = "match_source", length = 24)
    private String matchSource;

    /** Comma-joined candidate assetnums the ticket most likely belongs to (when not a single confident match). */
    @Column(name = "suggested_assetnums", columnDefinition = "TEXT")
    private String suggestedAssetnums;

    /** Comma-joined normalized tag tokens the matcher pulled from the ticket text (for search + debugging). */
    @Column(name = "extracted_tags", columnDefinition = "TEXT")
    private String extractedTags;

    /**
     * Delimiter-stripped (alnum-only) form of every tag/assetnum on this row, joined — so a search for
     * "01ACCHEX01B" matches a stored "01-ACC-HEX-01B" (the matcher itself is delimiter-insensitive).
     */
    @Column(name = "search_compact", columnDefinition = "TEXT")
    private String searchCompact;

    /** The Maximo timestamp used for incremental updates (WO statusdate; SR reportdate). */
    @Column(name = "ticket_changed_at", length = 40)
    private String ticketChangedAt;

    /** When this index row was last (re)computed. */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
