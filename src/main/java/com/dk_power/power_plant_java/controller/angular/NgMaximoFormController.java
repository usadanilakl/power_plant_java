package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormSubmissionDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormTemplateDto;
import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormCompletionService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormSeeder;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormService;
import com.dk_power.power_plant_java.sevice.maximo.RecurringPmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Electronic Maximo task forms: author data-driven templates and save filled submissions. The completion
 * bridge (PDF + doclink attach + worklog/status + write-back) is added in phase 3.
 */
@Slf4j
@RestController
@RequestMapping("/ng/maximo/forms")
@RequiredArgsConstructor
@RestrictedAllowed  // access gated on ROLE_PLANT/ROLE_ADMIN (SecurityConfig); no separate FULL grant required
public class NgMaximoFormController {

    private final MaximoFormService forms;
    private final MaximoFormCompletionService completion;
    private final MaximoFormSeeder seeder;
    private final RecurringPmService recurringPms;

    // ── Templates ─────────────────────────────────────────────────────────────

    @GetMapping("/templates")
    public ResponseEntity<NgApiResponse<List<MaximoFormTemplateDto>>> listTemplates() {
        return ResponseEntity.ok(new NgApiResponse<>(forms.getTemplates(), "ok"));
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<NgApiResponse<MaximoFormTemplateDto>> getTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(new NgApiResponse<>(forms.getTemplate(id), "ok"));
    }

    @PostMapping("/templates")
    public ResponseEntity<NgApiResponse<MaximoFormTemplateDto>> saveTemplate(@RequestBody MaximoFormTemplateDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(forms.saveTemplate(dto), "saved"));
        } catch (Exception e) {
            log.warn("[MaximoForms] saveTemplate failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        forms.deleteTemplate(id);
        return ResponseEntity.ok(new NgApiResponse<>(null, "deleted"));
    }

    /** Seed the curated procedure-form templates (idempotent upsert by formKey). */
    @PostMapping("/templates/seed")
    public ResponseEntity<NgApiResponse<List<MaximoFormTemplateDto>>> seed() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(seeder.seedProcedureForms(), "seeded"));
        } catch (Exception e) {
            log.warn("[MaximoForms] seed failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Templates whose match rule fits a WO (by pmnum and/or description). */
    @GetMapping("/templates/for-wo")
    public ResponseEntity<NgApiResponse<List<MaximoFormTemplateDto>>> templatesForWo(
            @RequestParam(value = "pmnum", required = false) String pmnum,
            @RequestParam(value = "description", required = false) String description) {
        return ResponseEntity.ok(new NgApiResponse<>(forms.templatesForWorkOrder(pmnum, description), "ok"));
    }

    /**
     * The completion form ASSIGNED to a WO's recurring PM (matched by pmnum, then description), or null if
     * none. Drives the WO Complete tab: when non-null, the operator completes the WO by filling this form.
     */
    @GetMapping("/for-wo")
    public ResponseEntity<NgApiResponse<MaximoFormTemplateDto>> completionFormForWo(
            @RequestParam(value = "pmnum", required = false) String pmnum,
            @RequestParam(value = "description", required = false) String description) {
        RecurringPm pm = recurringPms.findForWorkOrder(pmnum, description).orElse(null);
        String key = (pm == null) ? null : pm.getFormKey();
        MaximoFormTemplateDto t = (key == null || key.isBlank()) ? null : forms.getTemplateByFormKey(key);
        return ResponseEntity.ok(new NgApiResponse<>(t, "ok"));
    }

    // ── Submissions ────────────────────────────────────────────────────────────

    @GetMapping("/submissions/{id}")
    public ResponseEntity<NgApiResponse<MaximoFormSubmissionDto>> getSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(new NgApiResponse<>(forms.getSubmission(id), "ok"));
    }

    /** Existing submissions for a work order (newest first). */
    @GetMapping("/submissions/for-wo")
    public ResponseEntity<NgApiResponse<List<MaximoFormSubmissionDto>>> submissionsForWo(
            @RequestParam("wonum") String wonum) {
        return ResponseEntity.ok(new NgApiResponse<>(forms.getSubmissionsForWo(wonum), "ok"));
    }

    /** Save a submission draft (does not push to Maximo — use /complete to submit). */
    @PostMapping("/submissions")
    public ResponseEntity<NgApiResponse<MaximoFormSubmissionDto>> saveDraft(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(forms.saveDraft(dto), "saved"));
        } catch (Exception e) {
            log.warn("[MaximoForms] saveDraft failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Complete a submission: save it, render a PDF, attach it to the WO, add a worklog + per-field write-back,
     * and advance the WO status if the template asks. A failed PDF/attach aborts (submission stays a draft).
     */
    @PostMapping("/submissions/complete")
    public ResponseEntity<NgApiResponse<MaximoFormSubmissionDto>> complete(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(completion.completeFromDto(dto), "completed"));
        } catch (Exception e) {
            log.warn("[MaximoForms] complete failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Preview the completion PDF WITHOUT touching Maximo — returns the exact same PDF bytes that
     * {@code /submissions/complete} would attach, for testing/development on the fill page. Nothing is saved
     * and no work-order write-back happens. Returns {@code application/pdf} (or a plain-text error on failure).
     */
    @PostMapping("/submissions/preview-pdf")
    public ResponseEntity<byte[]> previewPdf(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            byte[] pdf = completion.renderPreviewPdf(dto);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"form-preview.pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            log.warn("[MaximoForms] preview-pdf failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("Preview failed: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }
}
