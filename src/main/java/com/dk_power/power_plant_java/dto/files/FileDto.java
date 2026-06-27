package com.dk_power.power_plant_java.dto.files;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.fasterxml.jackson.annotation.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")

public class FileDto extends BaseDto {



    private Long id;
    private String name;
    @JsonIgnore
    private MultipartFile file;
    private ValueDto fileType;
    private String fileLink;
    private String baseLink = "uploads";
    private String folder;
    private ValueDto system;
//    @JsonProperty("systems")
//    @JsonIgnore
    private List<String> relatedSystems;
    /**
     * Proper systems collection (replaces system+relatedSystems for the new UI).
     * <p>Null = "field not set" (mapper didn't initialize because the @ManyToMany
     * lazy collection wasn't loaded). The @JsonInclude(NON_NULL) below skips the
     * key entirely so the wire and frontend can distinguish "absent" (preserve
     * existing joins) from `[]` (explicit clear). Don't default this to an empty
     * list or partial-load paths silently wipe saved systems.
     */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private List<ValueDto> systems;
    /** Tag values (free-form labels). Same null-vs-empty contract as {@link #systems}. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private List<ValueDto> tags;
    private List<String> fileNumber;
    private ValueDto vendor;
    private List<EquipmentDto> points;
//    private List<EquipmentDto> filePoints;
    private String objectType;
    private String extension;
    private List<String> extensions = new ArrayList<>();

    private List<HeatTraceDto> heatTraceList;
    private String bulkEditStep;
    private List<HighlightDto> highlights;
    private String docNum;
    private Boolean isVerified = false;
    /** Soft FK to the source file when this row was created via clone-to-unit. */
    private Long clonedFromId;
    /** Bidirectional pointer to the same drawing's other-unit counterpart file. */
    private Long counterpartId;

    public String buildFileLink(){
        fileLink = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+extension;
        return fileLink;
    }
    public String buildFolder(){
        folder = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName();
        return folder;
    }

    public String buildFileLink(String extension) {
        this.extension = extension;
        fileLink = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+getFileNumberAsString()+"."+extension;
        return fileLink;
    }
    public String buildFolder(String extension) {
        this.extension = extension;
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


    @JsonIgnore
    public void setRelatedSystemsAsString(String systems) {
        this.relatedSystems = List.of(systems.split(","));
    }

    @JsonIgnore
    public String getRelatedSystemsAsString() {
        if(relatedSystems !=null)return String.join(",", relatedSystems);
        return null;
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

    public String getFileNumberAsString() {
        if (this.fileNumber != null && !this.fileNumber.isEmpty()) {
            String joinedFileNumber = this.fileNumber.stream()
                    .map(part -> part.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("\\s+", "-"))
                    .collect(Collectors.joining("__SEP__"));

            // Optionally limit the length
            if (joinedFileNumber.length() > 255) {  // adjust max length as needed
                joinedFileNumber = joinedFileNumber.substring(0, 255);
            }
            return joinedFileNumber;
        }
        return null;

    }
}
