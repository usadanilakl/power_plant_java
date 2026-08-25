package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.maximo.MaximoFormStatus;
import com.dk_power.power_plant_java.entities.maximo.MaximoFormSubmission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Sync-time dedup for {@link MaximoFormSubmission} (natural key: submissionKey = templateFormKey|wonum).
 * Hub-only. HIGH-VALUE + data-sensitive: a COMPLETED submission already fired Maximo side effects (PDF
 * doclink, worklog, status/write-back), so it must NEVER be shadowed by a stray draft.
 * <ul>
 *   <li>exactly one COMPLETED → it wins;</li>
 *   <li>two+ COMPLETED (a real double-submit race) → DECLINE (leave both, admin reconciles) rather than
 *       silently deleting a completed submission's answers;</li>
 *   <li>all DRAFT → smallest id, and the loser's valuesJson is logged (not silently dropped).</li>
 * </ul>
 * No child re-point — nothing FK-references MaximoFormSubmission.
 */
@Service
@Slf4j
public class MaximoFormSubmissionMergeService extends SharePointMergeTemplate<MaximoFormSubmission> {

    public MaximoFormSubmissionMergeService(SyncContext syncContext) { super(syncContext); }

    @Override protected String tableName() { return "maximo_form_submission"; }
    @Override protected String entityName() { return "MaximoFormSubmission"; }
    @Override protected Class<MaximoFormSubmission> entityClass() { return MaximoFormSubmission.class; }
    @Override protected String naturalKeyColumn() { return "submission_key"; }
    @Override protected String jpaFieldName() { return "submissionKey"; }
    @Override protected String logPrefix() { return "[MaximoFormSubmission Merge]"; }
    @Override protected void markDeleted(MaximoFormSubmission entity) { entity.setDeleted(true); }

    @Override
    protected MaximoFormSubmission selectCanonical(List<MaximoFormSubmission> sorted) {
        List<MaximoFormSubmission> completed = sorted.stream()
                .filter(s -> s.getStatus() == MaximoFormStatus.COMPLETED).toList();
        if (completed.size() == 1) return completed.get(0);
        if (completed.size() > 1) {
            String key = sorted.get(0).getSubmissionKey();
            log.warn("{} {} COMPLETED duplicates for key='{}' — DECLINING auto-merge (double-submit race; admin review)",
                    logPrefix(), completed.size(), key);
            return null; // do not auto-resolve — a completed submission must not be deleted by a heuristic
        }
        return sorted.get(0); // all DRAFT → deterministic smallest id
    }

    @Override
    protected void transferRelationships(Long duplicateId, Long canonicalId, String naturalKeyValue) {
        // No FK re-point; log the discarded loser's answers so a genuine double-draft can be reconciled.
        MaximoFormSubmission dup = entityManager.find(MaximoFormSubmission.class, duplicateId);
        if (dup != null && dup.getValuesJson() != null && !dup.getValuesJson().isBlank()) {
            log.info("{} discarding loser submission ID={} (key='{}', status={}) valuesJson len={} — reconcile if a genuine double-draft",
                    logPrefix(), duplicateId, naturalKeyValue, dup.getStatus(), dup.getValuesJson().length());
        }
    }
}
