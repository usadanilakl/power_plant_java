package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.CompleteWorkOrderRequest;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormSubmissionDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormStatus;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormSubmission;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormTemplate;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormSubmissionRepo;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormTemplateRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * The completion bridge: turns a filled {@link MaximoFormSubmission} into Maximo write-backs — render a PDF,
 * attach it to the WO as a doclink (the scan replacement, REQUIRED), add a worklog note, apply per-field
 * structured write-back (worklog lines + labor hours), and optionally advance the WO status.
 *
 * <p>Deliberately NOT one big {@code @Transactional}: Maximo is a non-transactional external system, so we
 * commit in discrete steps around the network calls — (1) the draft is committed first (via
 * {@code formService.saveDraft}) so a completion failure leaves a retriable DRAFT, not a rollback; (2) the
 * PDF doclink id is persisted immediately after a successful upload so a retry skips the re-upload (no
 * duplicate PDF); (3) an already-COMPLETED submission is a no-op. Secondary writes (worklog/labor/status) are
 * best-effort and recorded in {@code writeBackNote}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaximoFormCompletionService {

    private static final String WO_OS = "mxapiwodetail";

    private final MaximoFormSubmissionRepo submissionRepo;
    private final MaximoFormTemplateRepo templateRepo;
    private final MaximoFormPdfService pdfService;
    private final MaximoDoclinksAdapter doclinks;
    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoFormService formService;
    private final UserRepo userRepo;
    private final ObjectMapper objectMapper;

    /**
     * Per-(formKey|wonum) locks so two in-flight completions of the same submission can't both attach. The
     * sequential no-op guard in {@link #complete} only fires once the first has committed COMPLETED; without
     * this lock, two concurrent "Submit" taps (e.g. a slow mobile request the user retries) both read DRAFT and
     * each render+attach a PDF — the duplicate-attachment bug. Single-instance hub, so a JVM lock is sufficient.
     */
    private final java.util.concurrent.ConcurrentMap<String, Object> completionLocks =
            new java.util.concurrent.ConcurrentHashMap<>();

    /** Save the submission then complete it (one call for the fill page). Serialized per submission. */
    public MaximoFormSubmissionDto completeFromDto(MaximoFormSubmissionDto dto) {
        String key = lockKey(dto);
        if (key == null) {   // let saveDraft raise the precise validation error, unlocked
            return complete(formService.saveDraft(dto).getId(), dto != null && dto.isCompleteWo());
        }
        Object lock = completionLocks.computeIfAbsent(key, k -> new Object());
        synchronized (lock) {
            MaximoFormSubmissionDto saved = formService.saveDraft(dto);
            return complete(saved.getId(), dto.isCompleteWo());
        }
    }

    /** The saveDraft dedup key ({@code templateFormKey|wonum}); null when either part is missing. */
    private static String lockKey(MaximoFormSubmissionDto dto) {
        if (dto == null || dto.getTemplateFormKey() == null || dto.getTemplateFormKey().isBlank()
                || dto.getWonum() == null || dto.getWonum().isBlank()) return null;
        return dto.getTemplateFormKey().trim() + "|" + dto.getWonum().trim();
    }

    /**
     * Render the completion PDF for a submission WITHOUT touching Maximo — the exact same bytes {@link #complete}
     * would attach (identical template load, field/value parsing, formName/submittedBy resolution, signature,
     * and {@link MaximoFormPdfService#render} call). For the fill page's "Preview PDF" button: see the attachment
     * as it will ship, for testing/development, without saving a draft or writing anything back to Maximo.
     */
    public byte[] renderPreviewPdf(MaximoFormSubmissionDto dto) {
        if (dto == null) throw new IllegalArgumentException("A form submission is required");
        MaximoFormTemplate t = (dto.getTemplateFormKey() == null) ? null
                : templateRepo.findFirstByFormKey(dto.getTemplateFormKey()).orElse(null);
        List<Map<String, Object>> fields = parseList(t == null ? null : t.getFieldsJson());
        Map<String, Object> values = parseMap(dto.getValuesJson());
        User user = currentUser();
        String submittedBy = (user != null && user.getName() != null && !user.getName().isBlank()) ? user.getName() : "app";
        String formName = (t != null && t.getFormName() != null) ? t.getFormName()
                : (dto.getTemplateName() != null && !dto.getTemplateName().isBlank() ? dto.getTemplateName() : dto.getTemplateFormKey());
        byte[] signatureBytes = loadSignatureBytes(user);
        return pdfService.render(formName, dto.getWonum(), submittedBy, fields, values, signatureBytes);
    }

    public MaximoFormSubmissionDto complete(Long submissionId) {
        return complete(submissionId, false);
    }

    /**
     * @param forceCompleteWo when the template has no {@code completeWoStatus}, still advance the WO to COMP.
     *                        The mobile "Submit &amp; complete" flow sets this so performing a PM closes its WO.
     */
    public MaximoFormSubmissionDto complete(Long submissionId, boolean forceCompleteWo) {
        MaximoFormSubmission s = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown submission " + submissionId));

        // Idempotent: an already-completed submission is a no-op — re-running would attach a duplicate PDF and
        // double the labor/worklog write-back into Maximo (the external system of record).
        if (s.getStatus() == MaximoFormStatus.COMPLETED) {
            log.info("[MaximoForms] complete: {} already COMPLETED — no-op", s.getSubmissionKey());
            return formService.getSubmission(s.getId());
        }

        MaximoFormTemplate t = (s.getTemplateFormKey() == null) ? null
                : templateRepo.findFirstByFormKey(s.getTemplateFormKey()).orElse(null);

        List<Map<String, Object>> fields = parseList(t == null ? null : t.getFieldsJson());
        Map<String, Object> values = parseMap(s.getValuesJson());

        String href = (s.getWoHref() != null && !s.getWoHref().isBlank()) ? s.getWoHref() : resolveHref(s.getWonum());
        if (href == null || href.isBlank()) {
            throw new IllegalStateException("Could not find Maximo work order " + s.getWonum() + " to attach the form to.");
        }

        User user = currentUser();
        String submittedBy = (user != null && user.getName() != null && !user.getName().isBlank()) ? user.getName() : "app";
        String personid = (user == null) ? null : user.getMaximoPersonid();
        String formName = (t != null && t.getFormName() != null) ? t.getFormName() : s.getTemplateFormKey();
        List<String> notes = new ArrayList<>();

        // 1. Render + attach the PDF (REQUIRED — the scan replacement). Skip if a prior attempt already attached
        //    one (retry-safe: never a duplicate PDF), and persist the id immediately once attached.
        String doclinkId = s.getPdfDoclinkId();
        if (doclinkId != null && !doclinkId.isBlank()) {
            notes.add("PDF already attached");
        } else {
            byte[] signatureBytes = loadSignatureBytes(user);
            byte[] pdf = pdfService.render(formName, s.getWonum(), submittedBy, fields, values, signatureBytes);
            String fileName = safeName(formName + "_" + s.getWonum()) + ".pdf";
            doclinkId = doclinks.upload(WO_OS, href, fileName, "application/pdf", pdf, "Attachments").getHref();
            if (doclinkId == null || doclinkId.isBlank()) {
                throw new IllegalStateException(
                        "Maximo returned no attachment id — the form PDF may not have attached; not marking complete.");
            }
            s.setWoHref(href);
            s.setPdfDoclinkId(doclinkId);
            s = submissionRepo.saveAndFlush(s);   // commit the attach before the best-effort steps (retry-safe)
            notes.add("PDF attached");
        }

        // 2. Per-field structured write-back → worklog details + labor hours.
        StringBuilder details = new StringBuilder();
        double laborHours = 0;
        for (Map<String, Object> f : fields) {
            if ("image".equalsIgnoreCase(str(f, "type"))) continue;   // reference photos have no value
            String target = str(f, "maximoTarget");
            Object v = values.get(str(f, "name"));
            String vs = format(v);
            if ("laborhours".equalsIgnoreCase(target)) {
                Double h = toDouble(vs);
                if (h != null) laborHours += h;
            }
            if ("worklog".equalsIgnoreCase(target) || "reading".equalsIgnoreCase(target)) {
                String unit = str(f, "unit");
                String u = (unit == null || unit.isBlank()) ? "" : " " + unit;
                String prefix = "reading".equalsIgnoreCase(target) ? "READING — " : "";
                details.append(prefix).append(nz(str(f, "label"), str(f, "name"))).append(": ").append(vs).append(u).append('\n');
            }
        }
        List<CompleteWorkOrderRequest.LaborEntry> labor = new ArrayList<>();
        if (laborHours > 0 && personid != null && !personid.isBlank()) {
            CompleteWorkOrderRequest.LaborEntry le = new CompleteWorkOrderRequest.LaborEntry();
            le.setLaborcode(personid);
            le.setRegularhrs(laborHours);
            labor.add(le);
            notes.add("labor " + laborHours + "h");
        } else if (laborHours > 0) {
            notes.add("labor " + laborHours + "h skipped (no personid)");
        }

        String summary = "Completed form: " + formName;
        try {
            workOrders.reportActuals(href, labor.isEmpty() ? null : labor, summary,
                    details.length() > 0 ? details.toString() : null, "CLIENTNOTE");
            notes.add("worklog added");
        } catch (Exception e) {
            notes.add("worklog failed: " + e.getMessage());
            log.warn("[MaximoForms] worklog write failed for {}: {}", s.getWonum(), e.getMessage());
        }

        // 3. Advance the WO status. The template's completeWoStatus wins; otherwise the caller can ask for COMP
        //    (the mobile "Submit & complete" flow), so performing a PM actually closes its work order.
        String templateStatus = (t == null) ? null : t.getCompleteWoStatus();
        String targetStatus = (templateStatus != null && !templateStatus.isBlank()) ? templateStatus
                : (forceCompleteWo ? "COMP" : null);
        if (targetStatus != null && !targetStatus.isBlank()) {
            try {
                workOrders.changeStatus(href, targetStatus, summary);
                notes.add("status → " + targetStatus.trim().toUpperCase());
            } catch (Exception e) {
                notes.add("status change failed: " + e.getMessage());
                log.warn("[MaximoForms] status change failed for {}: {}", s.getWonum(), e.getMessage());
            }
        }

        s.setStatus(MaximoFormStatus.COMPLETED);
        s.setSubmittedBy(submittedBy);
        s.setSubmittedAt(LocalDateTime.now());
        s.setWoHref(href);
        s.setPdfDoclinkId(doclinkId);
        s.setWriteBackNote(String.join("; ", notes));
        submissionRepo.save(s);
        log.info("[MaximoForms] completed {} on WO {} — {}", s.getSubmissionKey(), s.getWonum(), notes);
        return formService.getSubmission(s.getId());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Resolve a WO href from its wonum (for submissions filled without a href). */
    private String resolveHref(String wonum) {
        if (wonum == null || wonum.isBlank()) return null;
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setWonumContains(wonum.trim());
        for (MaximoWorkOrderDto w : workOrders.listByCriteria(c, 20)) {
            if (wonum.trim().equalsIgnoreCase(w.getWonum())) return w.getHref();
        }
        return null;
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (!(principal instanceof CustomUserDetails cud)) return null;
        return userRepo.findById(cud.getId()).orElse(null);
    }

    /** Read the user's stored signature PNG to bytes, or null when none is on file / unreadable (the PDF then falls back to a blank line). */
    private byte[] loadSignatureBytes(User user) {
        if (user == null || user.getSignaturePath() == null || user.getSignaturePath().isBlank()) return null;
        try {
            Path p = Paths.get(user.getSignaturePath());
            if (!Files.exists(p)) return null;
            return Files.readAllBytes(p);
        } catch (IOException e) {
            log.warn("[MaximoForms] could not read signature for user {}: {}", user.getId(), e.getMessage());
            return null;
        }
    }

    private List<Map<String, Object>> parseList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {}); }
        catch (Exception e) { return List.of(); }
    }
    private Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}); }
        catch (Exception e) { return Map.of(); }
    }

    private static String str(Map<String, Object> m, String k) {
        Object o = m == null ? null : m.get(k);
        return o == null ? null : String.valueOf(o);
    }
    private static String format(Object v) {
        if (v == null) return "";
        if (v instanceof Boolean b) return b ? "Yes" : "No";
        if (v instanceof Collection<?> col) {
            StringBuilder sb = new StringBuilder();
            for (Object o : col) { if (sb.length() > 0) sb.append(", "); sb.append(o); }
            return sb.toString();
        }
        return String.valueOf(v);
    }
    private static Double toDouble(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return null; }
    }
    private static String nz(String s, String dflt) { return (s == null || s.isBlank()) ? dflt : s; }
    private static String safeName(String s) {
        return (s == null ? "form" : s).replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
