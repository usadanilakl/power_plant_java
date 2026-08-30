package com.dk_power.power_plant_java.dto.permits;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Assigning a work area to records straight from the permits map.
 *
 * <p>The map's "Not on the map" list is the one place an operator sees, together, every open item
 * the system could not place — and they are usually looking at the plant layout while they do. So
 * that list is where the fix belongs, rather than in five separate record forms.
 */
public final class PermitMapAssignDto {

    private PermitMapAssignDto() {}

    @Data
    @NoArgsConstructor
    public static class Request {
        private Long workAreaId;
        private List<Ref> items = new ArrayList<>();
    }

    /** Identifies one record: which map layer it is on, and its id within that type. */
    @Data
    @NoArgsConstructor
    public static class Ref {
        private String layer;
        private Long id;
    }

    @Data
    @NoArgsConstructor
    public static class Result {
        private int assigned;
        private Long workAreaId;
        private String workAreaName;
    }
}
