package com.dk_power.power_plant_java.entities.permits;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Out-of-row storage for {@link PermitAttachment} base64 content.
 *
 * <p>Shares the parent's primary key via {@link MapsId}, so {@code content.id == attachment.id}
 * on every node — there is no independent id that could drift across the sync channel.
 *
 * <p><b>Why this table exists:</b> base64 stored inline on PermitAttachment made every metadata /
 * sync-flag update rewrite the whole ~1.3&nbsp;MB row in H2's copy-on-write MVStore (the
 * {@code getAndMarkSynced} per-download fan-out → ~20× write-amplification and DB bloat). With the
 * blob in a sibling row, a sync-flag update rewrites only the small metadata row; the blob row is
 * written once on insert and deleted (cascade) when the attachment is removed.
 */
@Entity
@Table(name = "permit_attachment_content")
@Getter
@Setter
@NoArgsConstructor
public class PermitAttachmentContent {

    /** Equal to the owning {@link PermitAttachment#getId()} (shared primary key). */
    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    // DB-level cascade so NATIVE parent deletes (e.g. PermitAttachmentRepo.purgeTombstonesOlderThan,
    // which bypasses JPA lifecycle) also remove the content row instead of orphaning it.
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private PermitAttachment attachment;

    @Column(columnDefinition = "TEXT")
    private String base64Content;

    public PermitAttachmentContent(PermitAttachment attachment, String base64Content) {
        this.attachment = attachment;
        this.base64Content = base64Content;
    }
}
