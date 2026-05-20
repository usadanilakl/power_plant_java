package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.entities.loto.RedTagStandardRow;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Reconciliation result for one {@link RedTagStandardRow}: the suggested
 * existing LOTO points whose tag number matches the row's PNID, plus a
 * status the UI uses to render a badge.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedTagStandardMatchDto {

    /** Resolution status — values consumed by the Angular match badge. */
    public enum Status {
        /** Exactly one LOTO point matches the PNID. */
        MATCHED,
        /** More than one LOTO point shares the PNID — user must pick. */
        MULTIPLE,
        /** No LOTO point matches — the user can create one from this row. */
        NONE
    }

    private RedTagStandardRow row;
    private Status status;
    private List<MatchedPoint> matches;

    /** Lightweight LOTO point summary — enough for the UI to label + select. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchedPoint {
        private Long id;
        private String tagNumber;
        private String description;
    }
}
