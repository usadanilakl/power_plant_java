package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * What kind of hot work is planned, and — for welding — the hexavalent chromium exposure
 * assessment from the Cr(VI) worksheet.
 *
 * <p>Two levels, because only the second one is expensive to fill in:
 * <ol>
 *   <li><b>Type</b> — welding / grinding / cutting / … Collected whenever hot work is required.</li>
 *   <li><b>Cr(VI) assessment</b> — fume level × base metal chrome content. Collected only when
 *       <em>welding</em> is one of the types, because that is the operation that generates
 *       hexavalent chromium from chrome-bearing base metal.</li>
 * </ol>
 *
 * <h2>The score</h2>
 * The worksheet prints a weight beside each option (9 / 3 / 1) and the assessment is their product,
 * so {@link #getExposureScore()} returns {@code fumeWeight × chromeWeight} — 1 at the low end,
 * 81 at the high end. That multiplication is defined by the form; this class does the arithmetic
 * and stops there. It deliberately does <b>not</b> band the score into required controls or PPE —
 * that is a safety judgement belonging to the people who own the worksheet, not to a guess encoded
 * here. If banding is wanted, get the thresholds from them and add them explicitly.
 *
 * <p>Stored inside the {@link DeclaredHazards} envelope rather than in its own SharePoint column:
 * the envelope is already a versionless JSON payload that both ends tolerate unknown keys in, so a
 * new section costs nothing on the SharePoint or Power Automate side.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HotWorkProfile {

    // ---- Level 1: type of hot work ----
    private boolean welding;
    private boolean grinding;
    private boolean torchCutting;
    private boolean plasmaCutting;
    private boolean arcGouging;
    private boolean brazingSoldering;
    private boolean openFlameHeating;
    private boolean other;
    private String otherDescription;

    // ---- Level 2: Cr(VI) assessment (welding only) ----
    /** {@link #HIGH} / {@link #MEDIUM} / {@link #LOW}, or null when not assessed. */
    private String fumeLevel;
    /** {@link #HIGH} / {@link #MEDIUM} / {@link #LOW}, or null when not assessed. */
    private String chromeContent;

    public static final String HIGH = "HIGH";
    public static final String MEDIUM = "MEDIUM";
    public static final String LOW = "LOW";

    /**
     * Worksheet weight for a tier, or 0 when unset/unrecognised.
     *
     * <p>0 rather than a default tier on purpose: an unanswered assessment must score 0 and read as
     * "not assessed", never silently borrow a plausible-looking value and read as "assessed low".
     */
    public static int weightOf(String tier) {
        if (tier == null) return 0;
        return switch (tier.trim().toUpperCase()) {
            case HIGH -> 9;
            case MEDIUM -> 3;
            case LOW -> 1;
            default -> 0;
        };
    }

    /** {@code fume × chrome} per the worksheet, or 0 when either half is unanswered. */
    public int getExposureScore() {
        return weightOf(fumeLevel) * weightOf(chromeContent);
    }

    /** Has the Cr(VI) assessment actually been answered on both axes? */
    public boolean isAssessmentComplete() {
        return weightOf(fumeLevel) > 0 && weightOf(chromeContent) > 0;
    }

    /** Is any hot work type selected at all? */
    public boolean isAnyTypeSelected() {
        return welding || grinding || torchCutting || plasmaCutting
                || arcGouging || brazingSoldering || openFlameHeating || other;
    }
}
