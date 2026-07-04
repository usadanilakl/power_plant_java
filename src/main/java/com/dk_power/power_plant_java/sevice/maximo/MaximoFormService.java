package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoFormSubmissionDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormTemplateDto;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormStatus;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormSubmission;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormTemplate;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormSubmissionRepo;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormTemplateRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Business logic for electronic Maximo task forms: template authoring (data-driven, JSON field defs) and
 * submission drafts. The Maximo completion bridge (PDF + doclink + worklog/status + write-back) lives in a
 * separate service added in phase 3. See project memory project-maximo-electronic-forms.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MaximoFormService {

    private final MaximoFormTemplateRepo templateRepo;
    private final MaximoFormSubmissionRepo submissionRepo;

    // ── Templates ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MaximoFormTemplateDto> getTemplates() {
        return templateRepo.findAllByOrderByFormNameAsc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public MaximoFormTemplateDto getTemplate(Long id) {
        return templateRepo.findById(id).map(this::toDto).orElse(null);
    }

    /** Create or update a template (upsert by formKey). formKey is required and immutable per template. */
    public MaximoFormTemplateDto saveTemplate(MaximoFormTemplateDto dto) {
        if (dto == null || dto.getFormKey() == null || dto.getFormKey().isBlank()) {
            throw new IllegalArgumentException("A form key is required");
        }
        String key = dto.getFormKey().trim();
        MaximoFormTemplate t = templateRepo.findFirstByFormKey(key).orElse(null);
        if (t == null) t = MaximoFormTemplate.builder().formKey(key).build();
        t.setFormName(dto.getFormName());
        t.setDescription(dto.getDescription());
        t.setFieldsJson(dto.getFieldsJson());
        t.setMatchPmnum(blankToNull(dto.getMatchPmnum()));
        t.setMatchDescriptionContains(blankToNull(dto.getMatchDescriptionContains()));
        t.setCompleteWoStatus(blankToNull(dto.getCompleteWoStatus()));
        t.setActive(dto.getActive() == null ? Boolean.TRUE : dto.getActive());
        return toDto(templateRepo.save(t));
    }

    public void deleteTemplate(Long id) {
        templateRepo.findById(id).ifPresent(t -> { t.setDeleted(true); templateRepo.save(t); });
    }

    /** Templates whose match rule fits a WO (exact pmnum, then description-contains); active only. */
    @Transactional(readOnly = true)
    public List<MaximoFormTemplateDto> templatesForWorkOrder(String pmnum, String description) {
        List<MaximoFormTemplateDto> out = new ArrayList<>();
        java.util.Set<Long> seen = new java.util.HashSet<>();
        if (pmnum != null && !pmnum.isBlank()) {
            for (MaximoFormTemplate t : templateRepo.findByActiveTrueAndMatchPmnum(pmnum.trim())) {
                if (seen.add(t.getId())) out.add(toDto(t));
            }
        }
        if (description != null && !description.isBlank()) {
            String d = description.toLowerCase();
            for (MaximoFormTemplate t : templateRepo.findAllByOrderByFormNameAsc()) {
                if (!Boolean.TRUE.equals(t.getActive())) continue;
                String m = t.getMatchDescriptionContains();
                if (m != null && !m.isBlank() && d.contains(m.toLowerCase()) && seen.add(t.getId())) {
                    out.add(toDto(t));
                }
            }
        }
        return out;
    }

    // ── Submissions ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MaximoFormSubmissionDto getSubmission(Long id) {
        return submissionRepo.findById(id).map(this::toDto).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<MaximoFormSubmissionDto> getSubmissionsForWo(String wonum) {
        if (wonum == null || wonum.isBlank()) return List.of();
        return submissionRepo.findByWonumOrderByDateModifiedDesc(wonum.trim()).stream().map(this::toDto).toList();
    }

    /**
     * Save a submission draft (upsert by submissionKey = templateFormKey|wonum). Does NOT push to Maximo —
     * that happens on completion (phase 3). A COMPLETED status may only be set by the completion bridge.
     */
    public MaximoFormSubmissionDto saveDraft(MaximoFormSubmissionDto dto) {
        if (dto == null || dto.getTemplateFormKey() == null || dto.getTemplateFormKey().isBlank()
                || dto.getWonum() == null || dto.getWonum().isBlank()) {
            throw new IllegalArgumentException("templateFormKey and wonum are required");
        }
        String key = dto.getTemplateFormKey().trim() + "|" + dto.getWonum().trim();
        MaximoFormSubmission s = submissionRepo.findFirstBySubmissionKey(key).orElse(null);
        if (s == null) s = MaximoFormSubmission.builder().submissionKey(key).build();
        s.setTemplateFormKey(dto.getTemplateFormKey().trim());
        s.setTemplateName(dto.getTemplateName());
        s.setWonum(dto.getWonum().trim());
        s.setWoHref(dto.getWoHref());
        s.setSiteid(dto.getSiteid());
        s.setValuesJson(dto.getValuesJson());
        // Drafts stay DRAFT; completion is done via the (phase-3) complete endpoint, never here.
        if (s.getStatus() == null) s.setStatus(MaximoFormStatus.DRAFT);
        return toDto(submissionRepo.save(s));
    }

    // ── Mapping / helpers ────────────────────────────────────────────────────────

    private MaximoFormTemplateDto toDto(MaximoFormTemplate t) {
        return MaximoFormTemplateDto.builder()
                .id(t.getId())
                .formKey(t.getFormKey())
                .formName(t.getFormName())
                .description(t.getDescription())
                .fieldsJson(t.getFieldsJson())
                .matchPmnum(t.getMatchPmnum())
                .matchDescriptionContains(t.getMatchDescriptionContains())
                .completeWoStatus(t.getCompleteWoStatus())
                .active(t.getActive())
                .build();
    }

    private MaximoFormSubmissionDto toDto(MaximoFormSubmission s) {
        return MaximoFormSubmissionDto.builder()
                .id(s.getId())
                .submissionKey(s.getSubmissionKey())
                .templateFormKey(s.getTemplateFormKey())
                .templateName(s.getTemplateName())
                .wonum(s.getWonum())
                .woHref(s.getWoHref())
                .siteid(s.getSiteid())
                .valuesJson(s.getValuesJson())
                .status(s.getStatus())
                .submittedBy(s.getSubmittedBy())
                .submittedAt(s.getSubmittedAt())
                .pdfDoclinkId(s.getPdfDoclinkId())
                .writeBackNote(s.getWriteBackNote())
                .build();
    }

    private static String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }
}
