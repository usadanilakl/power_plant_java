package com.dk_power.power_plant_java.dto.files.clone;

/**
 * Counts emitted by {@code NgFileCloneService.cloneToUnit} so the UI can show a
 * one-glance result banner ("12 equipment cloned, 38 LOTO points auto-linked,
 * 4 suggestions need review").
 */
public record CloneSummaryDto(
    int equipmentCount,
    int autoLinkedLotoCount,
    int suggestionCount,
    int reusedLotoCount,
    int copiedDiskFiles
) {}
