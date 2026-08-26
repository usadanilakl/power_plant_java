package com.dk_power.power_plant_java.dto.maximo;

/**
 * Create a TOI/TMOD (Temporary Operation Instruction / Temporary Modification) record. Becomes a Maximo WO
 * (WAPPR) tagged in its description; the risk assessment + instruction-form fields are written as the first
 * worklog note (the "log section"). {@code siteid}/{@code worktype} default server-side when blank.
 */
public record ToiCreateRequest(
        String title,
        String location,
        String assetnum,
        String worktype,
        String siteid,
        // Instruction form (screenshot #2)
        String instructions,        // "TOI/TMOD Instructions"
        String riskIdentified,
        String countermeasures,
        String originator,
        String approvedBy,
        String approvedDate,
        String expectedCompletion,
        // Risk assessment (screenshot #1) — one selection each per section
        RiskSection safety,
        RiskSection environmental,
        RiskSection operations
) {
    /** One risk section = a chosen consequence (points) + a chosen probability (points). Section score = sum. */
    public record RiskSection(String consequenceLabel, Integer consequencePts,
                              String probabilityLabel, Integer probabilityPts) {
        public int score() {
            return (consequencePts == null ? 0 : consequencePts) + (probabilityPts == null ? 0 : probabilityPts);
        }
    }
}
