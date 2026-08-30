package com.dk_power.power_plant_java.dto.permits;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Everything the permits map view needs in one response: which areas exist, which map shape each
 * one is drawn as, and every open permit placed onto the areas it touches.
 *
 * <p>One call rather than one per layer, because the map is a single picture — five independent
 * requests would let the layers disagree with each other while they landed, and the client would
 * have to run the placement rules itself to reconcile them.
 */
@Data
@NoArgsConstructor
public class PermitMapDto {

    private List<Area> areas = new ArrayList<>();
    private List<Item> items = new ArrayList<>();

    /** Items in no area at all — the operator needs to see these, not have them silently vanish. */
    private List<Item> unplaced = new ArrayList<>();

    /**
     * A work area as the map cares about it: a name and the shape it is drawn as. Areas with no
     * shape are still returned — they are exactly the ones an admin needs to go draw.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Area {
        private Long id;
        private String name;
        private Long shapeId;
    }

    /** One permit, request or LOTO, and where it landed. */
    @Data
    @NoArgsConstructor
    public static class Item {
        /** WR | SW | HW | CS | LOTO — the map layer this belongs to. */
        private String layer;
        private Long id;

        /**
         * Every area this item touches. Usually one. A LOTO reached through two packages in two
         * different areas legitimately belongs to both, so it is drawn on both rather than being
         * arbitrarily assigned to one of them.
         */
        private List<Long> workAreaIds = new ArrayList<>();

        /**
         * How the placement was decided — AREA (the entity's own work-area FK), TEXT (its location
         * string named the area), PACKAGE (inherited from the daily package it belongs to) or
         * STANDARD (a LOTO reached through the work areas that list its source standard).
         *
         * <p>Surfaced in the UI because the four are not equally trustworthy: AREA is a fact a
         * person recorded, TEXT is this system's guess about a sentence.
         */
        private String matchedBy;

        /**
         * The daily package this belongs to, when it has one. Carried so the UI can open the
         * permit where it is actually edited — the package builder — since Safe Work / Hot Work /
         * Confined Space have no page of their own that takes an id.
         */
        private Long packageId;

        private String permitNumber;
        private String title;
        private String status;
        private String date;
        private String company;
        /** Foreman / issued-to / requestor, whichever the type carries. */
        private String person;
        /** The location text exactly as it was entered, so a bad match is diagnosable on sight. */
        private String location;
    }
}
