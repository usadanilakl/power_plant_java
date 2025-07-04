package com.dk_power.power_plant_java.dto.files;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileIdDto extends BaseDto {
    private Long fileType;
    private String fileLink;
    private String baseLink;
    private String folder;
    private Long system;
    private List<String> relatedSystems;
    private List<String> fileNumber;
    private Long vendor;
    private List<Long> points;
    private String objectType;
    private String extension;
    private List<String> extensions = new ArrayList<>();
    private String bulkEditStep;
    private String docNum;
    private Boolean isVerified = false;

    @JsonIgnore
    public void setRelatedSystemsAsString(String systems) {
        this.relatedSystems = List.of(systems.split(","));
    }

    @JsonIgnore
    public String getRelatedSystemsAsString() {
        return String.join(",", relatedSystems);
    }
}
