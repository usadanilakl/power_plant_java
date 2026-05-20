package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.util.ArrayList;
import java.util.List;

/**
 * A LOTO standard as it exists inside the external Red Tag system,
 * digitized from a screenshot. Holds the verbatim isolation-device table
 * ({@link RedTagStandardRow}s) plus the source image, so the user can
 * see the "actual Red Tag version" while reconciling its rows against
 * the local LOTO point database and generating a native
 * {@link LotoStandard}.
 *
 * <p>See {@code project/features/loto-standard/red-tag-standards-plan.md}.
 */
@Entity
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class RedTagStandard extends BaseAuditEntity {

    /** Reused JSON codec — never throws out of the typed accessors below. */
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Plant unit this standard belongs to — "U1", "U2", or "BOP". */
    private String unit;

    /** JSON array of {@link RedTagStandardRow}. Persisted column; use {@link #getRows()}. */
    @Lob
    @Column(name = "rows_json", columnDefinition = "TEXT")
    private String rowsJson;

    /**
     * The source Red Tag table screenshot, base64-encoded (PNG). Stored
     * inline so the detail view renders it directly via a data URI with
     * no separate file lookup.
     */
    @Lob
    @Column(name = "source_image_base64", columnDefinition = "TEXT")
    private String sourceImageBase64;

    /**
     * Set once the user generates a native {@link LotoStandard} from this
     * Red Tag standard's reconciled points. Null until then.
     */
    @Column(name = "generated_standard_id")
    private Long generatedStandardId;

    /** Free-text caveats captured during digitization (OCR uncertainty, etc.). */
    @Column(name = "import_notes", columnDefinition = "TEXT")
    private String importNotes;

    // ── Typed access to the JSON rows ────────────────────────────────────────

    /** Deserialize the row list. Returns an empty list when unset/invalid. */
    @Transient
    public List<RedTagStandardRow> getRows() {
        if (rowsJson == null || rowsJson.isBlank()) return new ArrayList<>();
        try {
            return MAPPER.readValue(rowsJson, new TypeReference<List<RedTagStandardRow>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /** Serialize and store the row list. */
    public void setRows(List<RedTagStandardRow> rows) {
        try {
            this.rowsJson = MAPPER.writeValueAsString(rows != null ? rows : new ArrayList<>());
        } catch (Exception e) {
            this.rowsJson = "[]";
        }
    }
}
