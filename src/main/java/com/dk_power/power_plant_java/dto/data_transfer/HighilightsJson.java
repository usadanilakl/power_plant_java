package com.dk_power.power_plant_java.dto.data_transfer;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class HighilightsJson {
    private String id;
    private String name;
    private String description;
    private String type;
    private String location;
    private String pid;
    private String system;
    private String vendor;
    private String ht;
    private String br;
    private OriginalSize originalSize;
    private Area area;
    private Manuals manuals;

    // Getters and Setters
    @Getter
    @Setter
    public static class OriginalSize {
        private int width;
        private int height;

        // Getters and Setters
    }
    @Getter
    @Setter
    public static class Area {
        private int startX;
        private int startY;
        private int endX;
        private int endY;
        private int width;
        private int height;

        // Getters and Setters
    }
    @Getter
    @Setter
    public static class Manuals {
        private String full;
        private String maintenance;
        private String ops;
        private String sop;
        private String eop;
        private String loto;

        // Getters and Setters
    }
}