package com.dk_power.power_plant_java.dto.data_service_project_dtos.files;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.base.DS_ConnectableDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.HashMap;
import java.util.Map;

@SuperBuilder
    @Getter
    @Setter
    @JsonIdentityInfo(
            generator = ObjectIdGenerators.PropertyGenerator.class,
            property = "id"
    )

    public class FileElementDto extends BaseDto {
        public FileElementDto(){super();}


        private DS_FileObjectDtoDS fileObject;
        private String coordinates;
        private String originalPictureSize;
        private String tagNumber;
        private DS_ConnectableDto connection;
        private ValueDto elementType;
        private ValueDto shapeType;

        private Map<String,Float> shapeData;

        public void buildShapeCoordinates(Map<String, Float> shapeData) {
            StringBuilder sb = new StringBuilder();
            boolean isFirst = true;

            for (Map.Entry<String, Float> entry : shapeData.entrySet()) {
                String key = entry.getKey();
                Float value = entry.getValue();

                if (key.equals("originalPictureWidth") || key.equals("originalPictureHeight") || key.equals("fill")) {
                    continue;
                }

                if (!isFirst) {
                    sb.append(",");
                }
                sb.append(key).append(":").append(value);
                isFirst = false;
            }

            this.coordinates = sb.toString();
            this.originalPictureSize = "originalPictureWidth:"+shapeData.get("originalPictureWidth") + "," + "originalPictureHeight:"+shapeData.get("originalPictureHeight");;
        }

        public Map<String, Float> decodeShapeCoordinates() {
            if (this.coordinates == null || this.coordinates.isEmpty()) {
                throw new IllegalStateException("Coordinates string is null or empty");
            }

            Map<String, Float> decodedCoordinates = new HashMap<>();
            String[] pairs = this.coordinates.split(",");
            for (String pair : pairs) {
                String[] keyValue = pair.split(":");
                if (keyValue.length != 2) {
                    throw new IllegalArgumentException("Invalid coordinate pair: " + pair);
                }
                decodedCoordinates.put(keyValue[0].trim(), Float.parseFloat(keyValue[1].trim()));
            }

            if (this.originalPictureSize != null && !this.originalPictureSize.isEmpty()) {
                String[] sizeParts = this.originalPictureSize.split(",");
                for (String part : sizeParts) {
                    String[] keyValue = part.split(":");
                    if (keyValue.length == 2) {
                        String key = keyValue[0].trim();
                        try {
                            float value = Float.parseFloat(keyValue[1].trim());
                            decodedCoordinates.put(key, value);
                        } catch (NumberFormatException e) {
                            // Log error or handle invalid number format
                            System.err.println("Invalid number format in originalPictureSize: " + part);
                        }
                    }
                }
            }

            return decodedCoordinates;
        }
        @Override
        public String toString() {
            return "FileElementDto{" +
                    "id=" + getId() +
                    ", fileObject=" + (fileObject != null ? fileObject.getId() : null) +
                    ", coordinates='" + coordinates + '\'' +
                    ", originalPictureSize='" + originalPictureSize + '\'' +
                    ", tagNumber='" + tagNumber + '\'' +
                    ", connection=" + (connection != null ? connection.getId() : null) +
                    ", elementType=" + elementType +
                    ", shapeData=" + shapeData +
                    '}';
        }

    }