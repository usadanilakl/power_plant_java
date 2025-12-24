package com.dk_power.power_plant_java.sevice.angular.refactor_equipment;

import java.util.HashMap;
import java.util.Map;

public class CoordinateParser {
    
    public static CoordinateInfo parse(String coordinateString) {
        if (coordinateString == null || coordinateString.isEmpty()) {
            return new CoordinateInfo(0, 0, 0, 0, 0, 0);
        }
        
        Map<String, Integer> coords = new HashMap<>();
        String[] parts = coordinateString.split(",");
        
        for (String part : parts) {
            String[] keyValue = part.trim().split(":");
            if (keyValue.length == 2) {
                try {
                    coords.put(keyValue[0].trim(), Integer.parseInt(keyValue[1].trim()));
                } catch (NumberFormatException e) {
                    // Skip invalid values
                }
            }
        }
        
        return new CoordinateInfo(
                coords.getOrDefault("startX", 0),
                coords.getOrDefault("startY", 0),
                coords.getOrDefault("endX", 0),
                coords.getOrDefault("endY", 0),
                coords.getOrDefault("width", 0),
                coords.getOrDefault("height", 0)
        );
    }
}