package com.dk_power.power_plant_java.sevice.esp;

import java.util.Map;

public class LotoStatusColorMapping {

    public record RgbColor(int r, int g, int b, int brightness) {}

    private static final Map<String, RgbColor> STATUS_COLORS = Map.of(
        "Building", new RgbColor(0, 255, 0, 255),
        "Active",   new RgbColor(255, 0, 0, 255),
        "Test",     new RgbColor(255, 255, 0, 255),
        "Closed",   new RgbColor(0, 0, 32, 128)
    );

    private static final RgbColor DEFAULT_COLOR = new RgbColor(0, 0, 32, 128);

    public static RgbColor getColorForStatus(String statusName) {
        if (statusName == null) return DEFAULT_COLOR;
        return STATUS_COLORS.getOrDefault(statusName, DEFAULT_COLOR);
    }
}
