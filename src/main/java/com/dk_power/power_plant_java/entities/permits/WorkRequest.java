package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.DeclaredHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkProfile;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.Where;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "work_request")
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
@BatchSize(size = 50)
public class WorkRequest extends BasePermitEntity {

    private String dateOfWorkToBePerformed;
    private String timeOfWorkToBePerformed;
    private String requestedBy;
    private String company;
    private String location;
    private String affectedEquipment;

    // workScope inherited from BasePermitEntity (do not re-declare â€” causes field shadowing)

    private Boolean isHotWorkRequired;
    private String foreman;
    private String fireWatch;

    private Boolean isLotoRequired;
    private Boolean isConfinedSpaceEntryRequired;
    private String space;
    // sharepointId, localUuid inherited from BasePermitEntity

    @OneToMany(mappedBy = "workRequest", fetch = FetchType.LAZY)
    private List<Jha> jhas = new ArrayList<>();

    @Column(name = "time_submitted")
    private String timeSubmitted;

    @Column(name = "submitter_name")
    private String submitterName;

    @Column(name = "submitter_email")
    private String submitterEmail;

    @Column(name = "submitter_phone")
    private String submitterPhone;

    @Column(name = "submitter_company")
    private String submitterCompany;

    // Same reason as the lookups in BasePermitEntity: Value is @Where-filtered on
    // soft delete, so a merged/deleted category would otherwise fail the whole page.
    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "work_category_id")
    private Value workCategory;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_permit_package_id")
    private DailyPermitPackage dailyPermitPackage;

    /**
     * Job the grouping-key match suggests this request belongs to. A SUGGESTION ONLY — it never
     * attaches the request to anything and never changes its status. The operator confirms (or
     * overrides) it in the Process dialog, which is the single place a request actually joins a job.
     *
     * <p>Before this field existed the PWA submit path silently ran the full process-into-a-job
     * routine, so every hub-submitted request arrived already "Processed" with a package built,
     * while requests that reached us through SharePoint arrived "Active" and waited for an operator
     * — the same action producing two different outcomes depending on whether the hub happened to
     * be reachable. Recording the match instead of acting on it keeps the automation's value and
     * gives every request one lifecycle.
     *
     * <p>Deliberately a plain Long, not a {@code @ManyToOne} — the same choice
     * {@code WorkArea.physicalObjectId} makes. JobLog is soft-deletable, and an association
     * carrying {@code @NotFound(IGNORE)} has to be fetched eagerly, which would put an extra
     * load behind every row of the work-request table for a hint the operator may never look at.
     */
    @Column(name = "suggested_job_log_id")
    private Long suggestedJobLogId;

    // ------------------------------------------------------------------
    // Hazards declared BY THE REQUESTER on the request itself.
    //
    // Same three POJOs the Safe Work / Hot Work / Confined Space permits use, and the same JSON-in-a
    // -TEXT-column storage WorkArea uses for its constant hazards — so a declaration made here drops
    // straight onto the permits the operator generates, with no translation layer to drift.
    // ------------------------------------------------------------------

    @Column(columnDefinition = "TEXT")
    private String declaredHazardsJson;

    @Column(columnDefinition = "TEXT")
    private String declaredHotWorkMeasuresJson;

    @Column(columnDefinition = "TEXT")
    private String declaredConfinedSpaceHazardsJson;

    /** Type of hot work + the Cr(VI) assessment. Only meaningful when isHotWorkRequired is true. */
    @Column(columnDefinition = "TEXT")
    private String hotWorkProfileJson;

    private static final ObjectMapper HAZARD_MAPPER = new ObjectMapper();

    public SwHazards getDeclaredHazards() {
        return readHazards(declaredHazardsJson, SwHazards.class, SwHazards::new);
    }

    public void setDeclaredHazards(SwHazards hazards) {
        this.declaredHazardsJson = writeHazards(hazards);
    }

    public HotWorkMeasures getDeclaredHotWorkMeasures() {
        return readHazards(declaredHotWorkMeasuresJson, HotWorkMeasures.class, HotWorkMeasures::new);
    }

    public void setDeclaredHotWorkMeasures(HotWorkMeasures measures) {
        this.declaredHotWorkMeasuresJson = writeHazards(measures);
    }

    public ConfinedSpaceHazards getDeclaredConfinedSpaceHazards() {
        return readHazards(declaredConfinedSpaceHazardsJson, ConfinedSpaceHazards.class, ConfinedSpaceHazards::new);
    }

    public void setDeclaredConfinedSpaceHazards(ConfinedSpaceHazards hazards) {
        this.declaredConfinedSpaceHazardsJson = writeHazards(hazards);
    }

    public HotWorkProfile getHotWorkProfile() {
        return readHazards(hotWorkProfileJson, HotWorkProfile.class, HotWorkProfile::new);
    }

    public void setHotWorkProfile(HotWorkProfile profile) {
        this.hotWorkProfileJson = writeHazards(profile);
    }

    /**
     * The three blocks as one JSON envelope for the SharePoint column, or null when nothing is
     * declared. See {@link DeclaredHazards} for why SharePoint gets one column rather than three.
     */
    public String getDeclaredHazardsEnvelope() {
        return DeclaredHazards.toJson(
                getDeclaredHazards(), getDeclaredHotWorkMeasures(),
                getDeclaredConfinedSpaceHazards(), getHotWorkProfile());
    }

    /**
     * Apply an envelope pulled back from SharePoint.
     *
     * <p>A blank envelope is a NO-OP, never a wipe. The column is added to an existing list by the
     * provisioner, so every row already in SharePoint returns empty for it on the first sync pass
     * after provisioning — treating that as "clear the declaration" would erase every hazard set in
     * the database in one cycle. Same null-means-no-opinion rule the DTO mappers follow.
     */
    public void applyDeclaredHazardsEnvelope(String json) {
        if (json == null || json.isBlank() || "null".equals(json.trim())) {
            return;
        }
        DeclaredHazards envelope = DeclaredHazards.fromJson(json);
        if (envelope.getHazards() != null) setDeclaredHazards(envelope.getHazards());
        if (envelope.getHotWork() != null) setDeclaredHotWorkMeasures(envelope.getHotWork());
        if (envelope.getConfinedSpace() != null) setDeclaredConfinedSpaceHazards(envelope.getConfinedSpace());
        if (envelope.getHotWorkProfile() != null) setHotWorkProfile(envelope.getHotWorkProfile());
    }

    /**
     * Never throws. WorkArea's equivalents rethrow as RuntimeException, which is survivable there
     * because a work area is edited on one admin screen; a work request is read on every table page
     * and every sync pass, so one row holding malformed JSON must not be able to fail the page.
     * An unreadable value reads as "nothing declared".
     */
    private static <T> T readHazards(String json, Class<T> type, java.util.function.Supplier<T> empty) {
        if (json == null || json.isBlank() || "null".equals(json.trim())) return empty.get();
        try {
            T parsed = HAZARD_MAPPER.readValue(json, type);
            return parsed != null ? parsed : empty.get();
        } catch (Exception e) {
            return empty.get();
        }
    }

    private static String writeHazards(Object hazards) {
        if (hazards == null) return null;
        try {
            return HAZARD_MAPPER.writeValueAsString(hazards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot serialize work request hazards", e);
        }
    }
}
