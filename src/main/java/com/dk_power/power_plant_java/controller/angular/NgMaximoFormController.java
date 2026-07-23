package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormSubmissionDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormTemplateDto;
import com.dk_power.power_plant_java.dto.maximo.PmAuditCardDto;
import com.dk_power.power_plant_java.dto.maximo.PmAuditRowDto;
import com.dk_power.power_plant_java.dto.maximo.PmCompletionDetailDto;
import com.dk_power.power_plant_java.dto.maximo.ReorderLineDto;
import com.dk_power.power_plant_java.dto.maximo.ReorderResultDto;
import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.sevice.maximo.ChemInventoryReorderService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormCompletionService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormSeeder;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoPmAuditService;
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
import org.springframework.web.bind.annotation.PutMapping;
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
    private final ChemInventoryReorderService reorder;
    private final MaximoPmAuditService audit;

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
     * The completion form(s) ASSIGNED to a WO's recurring PM (matched by pmnum, then description). Drives the
     * WO Complete tab: none = manual completion; one = rendered automatically; several = the operator picks one.
     * Explicit assignment (the PM's own formKeys), not description-matching — see {@code /templates/for-wo}.
     */
    @GetMapping("/for-wo")
    public ResponseEntity<NgApiResponse<List<MaximoFormTemplateDto>>> completionFormsForWo(
            @RequestParam(value = "pmnum", required = false) String pmnum,
            @RequestParam(value = "description", required = false) String description) {
        List<String> keys = recurringPms.findForWorkOrder(pmnum, description)
                .map(RecurringPm::getFormKeyList).orElse(List.of());
        return ResponseEntity.ok(new NgApiResponse<>(forms.getTemplatesByFormKeys(keys), "ok"));
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

    /**
     * The newest submission of a form across all work orders — used to carry settings/values forward into a
     * fresh run (e.g. the chem-inventory target levels + reorder settings). Null when the form has none yet.
     */
    @GetMapping("/submissions/latest-for-form")
    public ResponseEntity<NgApiResponse<MaximoFormSubmissionDto>> latestForForm(
            @RequestParam("formKey") String formKey) {
        return ResponseEntity.ok(new NgApiResponse<>(forms.getLatestSubmissionForForm(formKey), "ok"));
    }

    /** Dry-run: which reagents on a filled inventory form are below target (need to reorder). No email/writes. */
    @PostMapping("/submissions/reorder-preview")
    public ResponseEntity<NgApiResponse<List<ReorderLineDto>>> reorderPreview(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(reorder.computeReorder(dto), "ok"));
        } catch (Exception e) {
            log.warn("[MaximoForms] reorder-preview failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Send the vendor reorder email and attach the order summary to the work order. Caller confirms first. */
    @PostMapping("/submissions/reorder-send")
    public ResponseEntity<NgApiResponse<ReorderResultDto>> reorderSend(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            ReorderResultDto result = reorder.sendReorder(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.isSent() ? "sent" : "not-sent"));
        } catch (Exception e) {
            log.warn("[MaximoForms] reorder-send failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
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

    // ── PM audit ────────────────────────────────────────────────────────────────

    /** Audit list: every PM (or only recurring) with catalog facts (cadence, target, overdue) — for sort/filter. */
    @GetMapping("/pm-audit")
    public ResponseEntity<NgApiResponse<List<PmAuditRowDto>>> pmAudit(
            @RequestParam(value = "recurringOnly", defaultValue = "false") boolean recurringOnly) {
        return ResponseEntity.ok(new NgApiResponse<>(audit.audit(recurringOnly), "ok"));
    }

    /**
     * Fully-populated audit CARDS (eager): every PM with its real last completed/closed WO (worklog comment +
     * form), next scheduled WO, and colour-coding flags — all PMs fanned out to Maximo in parallel. One call,
     * a few seconds for ~50-70 PMs; the cards then show everything with no per-card click.
     */
    @GetMapping("/pm-audit-cards")
    public ResponseEntity<NgApiResponse<List<PmAuditCardDto>>> pmAuditCards(
            @RequestParam(value = "recurringOnly", defaultValue = "false") boolean recurringOnly) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(audit.auditCards(recurringOnly), "ok"));
        } catch (Exception e) {
            log.warn("[MaximoForms] pm-audit-cards failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /**
     * Completion detail for one WO (the last completed occurrence of a PM), loaded on expand: worklog comment,
     * a "troubled" flag (keyword in the comment, or a failing form answer), and the attached form + PDF id.
     */
    @GetMapping("/completion-detail")
    public ResponseEntity<NgApiResponse<PmCompletionDetailDto>> completionDetail(
            @RequestParam("wonum") String wonum,
            @RequestParam(value = "href", required = false) String href) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(audit.completionDetail(wonum, href), "ok"));
        } catch (Exception e) {
            log.warn("[MaximoForms] completion-detail {} failed: {}", wonum, e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** The completed-form PDF for a submission, re-rendered with its real completion date (for the audit thumbnail). */
    @GetMapping("/submissions/{id}/pdf")
    public ResponseEntity<byte[]> submissionPdf(@PathVariable Long id) {
        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"completed-form.pdf\"")
                    .body(completion.renderSubmissionPdf(id));
        } catch (Exception e) {
            log.warn("[MaximoForms] submission pdf {} failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("PDF failed: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }
}
