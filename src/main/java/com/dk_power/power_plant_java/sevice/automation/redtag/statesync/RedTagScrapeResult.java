package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Result of a single {@link com.dk_power.power_plant_java.sevice.automation.redtag.flow.RedTagStateSyncFlow}
 * scrape: the status tab that was expanded plus every row that was OCR'd inside it.
 *
 * <p>Cached by
 * {@link com.dk_power.power_plant_java.sevice.automation.redtag.RedTagStateSyncAutomationService}
 * so the reconciler + preview UI can act on it after the scrape session finishes.
 * The result is single-writer / last-wins — a second scrape overwrites the first.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RedTagScrapeResult {
    private RedTagStatus status;
    private List<RedTagRow> rows = new ArrayList<>();
    /** When the scrape completed. Populated by the facade, not the flow. */
    private Instant scrapedAt;
    /** Free-form flow-side notes (e.g. "reset grouping"), for the preview UI. */
    private String notes;
}
