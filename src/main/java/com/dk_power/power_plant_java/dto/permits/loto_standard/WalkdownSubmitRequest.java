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

    /** Positions are Value FKs — corrections carry the chosen Value id, not free text. */
    public record PointCorrectionInput(String tagNumber, String description, Long isoPosId, Long normPosId) {}
}
