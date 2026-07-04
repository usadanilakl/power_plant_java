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
 * A filled instance of a {@link MaximoFormTemplate} against one Maximo work order — the electronic record
 * that replaces the scanned paper. On completion the values are rendered to a PDF (attached to the WO as a
 * doclink), a worklog note is added, the WO status may advance, and mapped fields are written back to Maximo.
 *
 * <p>Keyed by {@link #submissionKey} = {@code templateFormKey + "|" + wonum} (one live submission per
 * WO+template). CRDT-synced so a form filled on one device is visible/durable everywhere.
 */
@Entity
@Table(name = "maximo_form_submission",
       indexes = {
           @Index(name = "idx_mfs_submission_key", columnList = "submission_key"),
           @Index(name = "idx_mfs_wonum", columnList = "wonum")
       })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted IS NOT TRUE")
public class MaximoFormSubmission extends BaseAuditEntity {

    /** Natural key: templateFormKey + "|" + wonum. Always set. */
    @Column(name = "submission_key", nullable = false, length = 200)
    private String submissionKey;

    @Column(name = "template_form_key", length = 128)
    private String templateFormKey;

    /** Denormalized template name for display without a join. */
    @Column(name = "template_name")
    private String templateName;

    @Column(name = "wonum", length = 64)
    private String wonum;

    /** Maximo OSLC href of the WO (for attach/worklog/status write-back). */
    @Column(name = "wo_href", length = 512)
    private String woHref;

    @Column(name = "siteid", length = 16)
    private String siteid;

    /** JSON map of fieldName → entered value. */
    @Column(name = "values_json", columnDefinition = "TEXT")
    private String valuesJson;

    @Enumerated(EnumType.STRING)
    @lombok.Builder.Default
    @Column(name = "status", length = 16)
    private MaximoFormStatus status = MaximoFormStatus.DRAFT;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /** Maximo doclink id of the attached completed-form PDF (set on completion). */
    @Column(name = "pdf_doclink_id", length = 128)
    private String pdfDoclinkId;

    /** Audit of what was pushed to Maximo on completion (attach/worklog/status/write-back outcome). */
    @Column(name = "write_back_note", columnDefinition = "TEXT")
    private String writeBackNote;
}
