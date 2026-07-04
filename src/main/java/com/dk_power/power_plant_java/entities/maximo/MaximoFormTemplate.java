package com.dk_power.power_plant_java.entities.maximo;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

/**
 * A data-driven electronic task form definition — the in-app replacement for a printable Maximo job-plan /
 * PM procedure. Fields are stored as JSON (no code per form), so new forms are authored in the admin
 * builder and rendered by the Angular SmartFormComponent. A form is matched to a work order by PM number or
 * a description fragment, or picked manually when filling.
 *
 * <p>Keyed by {@link #formKey} (a stable slug, e.g. {@code "MONTHLY_PUMP_INSP"}). CRDT-synced so a template
 * authored on one device appears on all of them. See project memory project-maximo-electronic-forms.
 */
@Entity
@Table(name = "maximo_form_template",
       indexes = { @Index(name = "idx_mft_form_key", columnList = "form_key") })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted IS NOT TRUE")
public class MaximoFormTemplate extends BaseAuditEntity {

    /** Stable slug natural key (e.g. "MONTHLY_PUMP_INSP"). Always set. */
    @Column(name = "form_key", nullable = false, length = 128)
    private String formKey;

    /** Display name (e.g. "Monthly Portable Fuel Tank Inspection"). */
    @Column(name = "form_name")
    private String formName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * JSON array of field definitions:
     * {@code [{ "name":"oilLevel", "label":"Oil level", "type":"passfail", "required":true, "section":"Checks",
     *          "unit":null, "options":[] }, ...]}. Rendered by SmartFormComponent; authored in the builder.
     */
    @Column(name = "fields_json", columnDefinition = "TEXT")
    private String fieldsJson;

    /** Optional auto-association: match WOs whose Maximo pmnum equals this (exact). Nullable. */
    @Column(name = "match_pmnum", length = 64)
    private String matchPmnum;

    /** Optional auto-association: match WOs whose description contains this (case-insensitive). Nullable. */
    @Column(name = "match_description_contains", length = 256)
    private String matchDescriptionContains;

    /** WO status to move to when a submission is completed (e.g. "COMP"); null = leave status unchanged. */
    @Column(name = "complete_wo_status", length = 16)
    private String completeWoStatus;

    @lombok.Builder.Default
    @Column(name = "active")
    private Boolean active = Boolean.TRUE;
}
