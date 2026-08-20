package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.entities.loto.LotoStandardWalkdown.PointChecklist;

import java.util.Map;

/**
 * One-shot offline walkdown submission. The mobile client does the whole verification/walkdown locally
 * (no per-item network calls) and submits this once, when back online.
 *
 * @param capturedVersion the standard's {@code currentVersion} at the time the checklist was cached — used
 *                        to reject a submit against a standard that has since changed server-side.
 * @param transition      {@code "verify"}, {@code "walkdown"}, or {@code null} to only record evidence.
 * @param notes           optional notes attached to the transition.
 * @param globalItems      standard-level checkmarks keyed by item key.
 * @param pointResults     per-point 7-check field walkdown keyed by loto-point id.
 * @param corrections      in-field tag / description / position corrections keyed by loto-point id.
 */
public record WalkdownSubmitRequest(
        Integer capturedVersion,
        String transition,
        String notes,
        Map<String, GlobalItemInput> globalItems,
        Map<Long, PointChecklist> pointResults,
        Map<Long, PointCorrectionInput> corrections
) {
    public record GlobalItemInput(Boolean checked, String notes) {}

    /**
     * In-field corrections a walker can apply to a LOTO point. All fields are OPTIONAL — a
     * correction is applied only when present (non-null). isoPosId / normPosId / locationId
     * are Value FKs, so those carry the chosen Value id rather than free text.
     * specificLocation is a free-text string mirroring the LotoPoint column (there's no
     * generalLocation counterpart — that dead field has been retired from the UI).
     * isLockable / isLabeled are the durable physical flags — Boolean (not primitive) so
     * null means "leave as is" and true/false explicitly sets the flag.
     */
    public record PointCorrectionInput(
            String tagNumber,
            String description,
            Long isoPosId,
            Long normPosId,
            Long locationId,
            String specificLocation,
            Boolean isLockable,
            Boolean isLabeled,
            /** Persistent "point has been walked down and everything checks out" flag on LotoPoint.
             *  Set by the walker once every per-point check passes; visible to future permit builders. */
            Boolean isVerified) {}
}
