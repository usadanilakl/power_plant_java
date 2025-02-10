package com.dk_power.power_plant_java.mappers.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.ConflictService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DS_FileElementMapper {
    public DS_FileElementDto map(Equipment e) {
        Map<String, Float> stringFloatMap = convertToCoordinatesMap(e.getCoordinates(), e.getOriginalPictureSize());
        if(!isCoordinatesValid(stringFloatMap)){
            throw new IllegalArgumentException("Coordinates are not valid");
        }
        return DS_FileElementDto.builder()
                .tagNumber(e.getTagNumber())
                .shapeData(stringFloatMap)
                .color("rgb(7, 89, 189)")
                .shapeType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Shape Type").build()).name("rectangle").build())
                .elementType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Element Type").build()).name("equipment").build())
                .oldPidProjectItemId(e.getId())
                .build();
    }

    private Map<String, Float> convertToCoordinatesMap(String coordinates, String originalPictureSize) {
        Map<String, Float> result = new HashMap<>();

        // Parse coordinates
        String[] coordParts = coordinates.split(",");
        for (String part : coordParts) {
            String[] keyValue = part.split(":");
            if (keyValue.length == 2) {
                String key = keyValue[0].trim();
                float value = Float.parseFloat(keyValue[1].trim());
                switch (key) {
                    case "startX":
                        result.put("x", value);
                        break;
                    case "startY":
                        result.put("y", value);
                        break;
                    case "endX":
                        result.put("x2", value);
                        break;
                    case "endY":
                        result.put("y2", value);
                        break;
                    case "width":
                        result.put("width", value);
                        break;
                    case "height":
                        result.put("height", value);
                        break;
                }
            }
        }

        // Parse original picture size
        String[] sizeParts = originalPictureSize.split(",");
        for (String part : sizeParts) {
            String[] keyValue = part.split(":");
            if (keyValue.length == 2) {
                String key = keyValue[0].trim();
                float value = Float.parseFloat(keyValue[1].trim());
                switch (key) {
                    case "width":
                        result.put("originalPictureWidth", value);
                        break;
                    case "height":
                        result.put("originalPictureHeight", value);
                        break;
                }
            }
        }

        System.out.println(result);
        return result;
    }
    
    private boolean isCoordinatesValid(Map<String, Float> coordinates) {
        boolean allValuesPresent = coordinates.containsKey("x") && coordinates.containsKey("y") &&
                coordinates.containsKey("width") && coordinates.containsKey("height") &&
                coordinates.containsKey("originalPictureWidth") && coordinates.containsKey("originalPictureHeight");
        if (!allValuesPresent) return false;

        boolean heightAndWidthMatch = true;
        if (coordinates.containsKey("x2") && coordinates.containsKey("y2")) {
            final float EPSILON = 5f; // Adjust this value based on your acceptable error margin

            float expectedX2 = coordinates.get("x") + coordinates.get("width");
            float expectedY2 = coordinates.get("y") + coordinates.get("height");

            boolean equalsX = Math.abs(coordinates.get("x2") - expectedX2) < EPSILON;
            boolean equalsY = Math.abs(coordinates.get("y2") - expectedY2) < EPSILON;

            heightAndWidthMatch = equalsX && equalsY;
        }
        if(!heightAndWidthMatch){
            System.out.println("Coordinates do not match height and width");
            return false;
        }
        return true;
    }
}
