package com.dk_power.power_plant_java.entities.files;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

/**
 * Off-page reference / "continuation arrow" drawn on a P&ID that points at
 * another file. First-class entity instead of overloading Equipment — the
 * Equipment table accumulated connectors as rows with {@code eqType.name='connector'},
 * which silently inherited every Equipment relationship (vendor/eqType/location/system/
 * lotoPoints/files/heatTrace/breakers) and made the matching from connector→file
 * a runtime substring search instead of a stored link.
 *
 * <p>Reciprocal pairing via {@link #counterpartConnectorId} mirrors
 * {@code LotoPoint.counterpartId} and {@code FileObject.counterpartId} —
 * plain Long, no JPA relationship, avoids cascade entanglement. Service-level
 * invariants enforce: no self-link, both sides updated atomically, opposite
 * side cleared on soft-delete/unlink.
 *
 * <p>Soft-deleted via the inherited {@code deleted} boolean on BaseIdEntity
 * + {@code @Where(deleted IS NOT TRUE)} — same convention as the rest of
 * the drawing model.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Where(clause = "deleted IS NOT TRUE")
public class FileConnector extends BaseAuditEntity {

    /**
     * The P&ID this connector shape is drawn on. Required — a connector with
     * no source file is meaningless. Plain {@code @ManyToOne} with NO cascade:
     * a FileConnector must never create/delete/update a FileObject indirectly.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_file_id", nullable = false)
    @JsonBackReference("connector-source-file")
    private FileObject sourceFile;

    /**
     * The file this connector points at — clicking the shape navigates here.
     * Required. Same no-cascade rationale as {@link #sourceFile}.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_file_id", nullable = false)
    @JsonBackReference("connector-target-file")
    private FileObject targetFile;

    // ------------------------------------------------------------------------
    // Shape on canvas — same field names as Equipment so the existing shape
    // mapper / interactive-image pipeline doesn't need a new vocabulary.
    // ------------------------------------------------------------------------

    /** "x,y,w,h" or JSON-ish coordinate string (same convention as Equipment.coordinates). */
    private String coordinates;

    /** Image dimensions at draw time, for coordinate scaling on re-render. */
    private String originalPictureSize;

    /** Rotation in degrees, 0 if unset. */
    private Double rotation;

    /** Symbol catalog id from PIDSymbolsService (e.g. "off-page-connector"). Null → rectangle. */
    private String symbolId;

    /** Cached SVG path for the symbol, lets the viewer render without re-resolving the catalog. */
    @Column(columnDefinition = "TEXT")
    private String svgPath;

    // ------------------------------------------------------------------------
    // Pairing
    // ------------------------------------------------------------------------

    /**
     * Soft FK to the connector on {@link #targetFile} that points back at this
     * one — when set, jumping to the target file can highlight where the user
     * came from. Plain Long, mirrors {@code LotoPoint.counterpartId} and
     * {@code FileObject.counterpartId} so the codebase has one consistent
     * counterpart pattern.
     *
     * <p>Service invariants (enforced in {@code NgFileConnectorService}):
     * <ul>
     *   <li>Cannot equal this connector's own id (no self-link).</li>
     *   <li>Both sides updated together (saveAndFlush atomically).</li>
     *   <li>Soft-deleting or unlinking one side clears the other side's pointer
     *       so we don't leave a dangling reference.</li>
     * </ul>
     */
    private Long counterpartConnectorId;

    /**
     * Optional user-supplied display label override. When null, the viewer
     * derives the label from {@code targetFile.fileNumber} at render time —
     * intentionally NOT stored, so renaming the target file updates every
     * connector pointing at it without a backfill.
     */
    private String label;

    /**
     * Whether the canvas should draw the {@link #label} text inside the
     * connector shape. {@code null} treated as {@code false} on the viewer —
     * connectors created before this column existed stay clean by default
     * and the user opts in per-connector via the edit dialog's checkbox.
     *
     * <p>Stored as a nullable Boolean (not primitive) for the same reason —
     * Hibernate's {@code ddl-auto=update} adds the column to existing rows
     * as NULL; switching to a primitive would force every legacy row to
     * appear as {@code true} or trip a NOT NULL violation on read. Treat
     * null as false at the boundary instead.
     */
    private Boolean showLabel;
}
