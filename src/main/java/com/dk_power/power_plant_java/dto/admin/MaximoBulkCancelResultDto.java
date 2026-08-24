package com.dk_power.power_plant_java.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Result payload for the Drift Center's bulk-cancel execute call. Reports what was
 * attempted, what succeeded, and which rows failed with per-row error strings so the admin
 * can retry or hand the list to ops for manual cleanup.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaximoBulkCancelResultDto {
    private int attempted;
    private int cancelled;
    private int failed;
    /** Per-failure detail — one entry per row that couldn't be cancelled. */
    private List<Failure> failures;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Failure {
        private Long id;
        private String wonum;
        private String error;
    }
}
