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

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileDto extends BaseDto {



    private Long id;
    private String name;
    @JsonIgnore
    private MultipartFile file;
    private ValueDto fileType;
    private String fileLink;
    private String baseLink;
    private String folder;
    private ValueDto system;
    @JsonProperty("systems")
    private String relatedSystems;
    private String fileNumber;
    private ValueDto vendor;
    private List<EquipmentDto> points;
//    private List<EquipmentDto> filePoints;
    private String objectType;
    private String extension;
    private List<HeatTraceDto> heatTraceList;
    private String bulkEditStep;
    private List<HighlightDto> highlights;
    private String docNum;

    public String buildFileLink(){
        fileLink = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+extension;
        return fileLink;
    }
    public String buildFolder(){
        folder = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName();
        return folder;
    }

    public void setFileType(String fileType) {
        ValueDto value =new ValueDto();
        value.setName(fileType);
        this.fileType = value;
    }
    public void setFileType(ValueDto fileType) {
        this.fileType = fileType;
    }

    public void setRelatedSystems(List<String> systems) {
        this.relatedSystems = systems.toString();
    }
    public void setRelatedSystems(String systems) {
        this.relatedSystems = systems;
    }

    public void setVendor(String vendor) {
        ValueDto value =new ValueDto();
        value.setName(vendor);
        this.vendor = value;
    }
    public void setVendor(ValueDto vendor) {
        this.vendor = vendor;
    }

    @Override
    public String toString() {
        return "FileDto{" +
                "\n\tid=" + id +
                "\n\tname='" + name + '\'' +
                "\n\tfileType=" + fileType +
                "\n\tfileLink='" + fileLink + '\'' +
                "\n\tbaseLink='" + baseLink + '\'' +
                "\n\tfolder='" + folder + '\'' +
                "\n\tsystem=" + system +
                "\n\tfileNumber='" + fileNumber + '\'' +
                "\n\tvendor=" + vendor +
                "\n\tpoints=" + points +
                "\n\tobjectType=" + objectType +
                "\n}";
    }
}
