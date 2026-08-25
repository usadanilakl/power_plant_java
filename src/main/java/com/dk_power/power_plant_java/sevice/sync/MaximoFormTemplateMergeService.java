package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.maximo.MaximoFormTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Sync-time dedup for {@link MaximoFormTemplate} (natural key: formKey). Hub-only. Canonical: prefer the
 * active row (if exactly one of the pair is active); else smallest id. No child re-point — both
 * RecurringPm.formKeyList and MaximoFormSubmission.templateFormKey reference templates by the STRING formKey
 * (identical across the duplicate pair), never by entity id.
 */
@Service
@Slf4j
public class MaximoFormTemplateMergeService extends SharePointMergeTemplate<MaximoFormTemplate> {

    public MaximoFormTemplateMergeService(SyncContext syncContext) { super(syncContext); }

    @Override protected String tableName() { return "maximo_form_template"; }
    @Override protected String entityName() { return "MaximoFormTemplate"; }
    @Override protected Class<MaximoFormTemplate> entityClass() { return MaximoFormTemplate.class; }
    @Override protected String naturalKeyColumn() { return "form_key"; }
    @Override protected String jpaFieldName() { return "formKey"; }
    @Override protected String logPrefix() { return "[MaximoFormTemplate Merge]"; }
    @Override protected void markDeleted(MaximoFormTemplate entity) { entity.setDeleted(true); }

    @Override
    protected MaximoFormTemplate selectCanonical(List<MaximoFormTemplate> sorted) {
        List<MaximoFormTemplate> active = sorted.stream()
                .filter(t -> Boolean.TRUE.equals(t.getActive())).toList();
        return active.size() == 1 ? active.get(0) : sorted.get(0);
    }

    @Override
    protected void transferRelationships(Long duplicateId, Long canonicalId, String naturalKeyValue) {
        // No FK re-point, but surface a genuinely-divergent loser so an admin can reconcile content that
        // differs beyond the formKey collision (fieldsJson / matchPmnum). Cheap: only runs on an actual merge.
        MaximoFormTemplate dup = entityManager.find(MaximoFormTemplate.class, duplicateId);
        if (dup != null && dup.getFieldsJson() != null && !dup.getFieldsJson().isBlank()) {
            log.info("{} discarding loser template ID={} (formKey='{}') fieldsJson len={} — reconcile if authors diverged",
                    logPrefix(), duplicateId, naturalKeyValue, dup.getFieldsJson().length());
        }
    }
}
