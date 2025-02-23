package com.dk_power.power_plant_java.dto.data_service_project_dtos.files;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.base.DS_ConnectableDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@SuperBuilder
@Getter
@Setter
//@JsonIgnoreProperties(ignoreUnknown = true)
//@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id"
)
@NoArgsConstructor
public class DS_FileObjectDtoDS extends DS_ConnectableDto {
    private String rootPath;
    private String folder;
    private Set<DS_TagNumberDto> tagNumbers;
    private String extension;
    private String path;
    private DS_ValueDto fileType;
    private DS_ValueDto vendor;
    private Set<DS_ValueDto> systems;
    private List<DS_ValueDto> tags;
    private List<DS_FileElementDto> elements;

    public String retrievePrimaryFileNumber(){
        if(tagNumbers == null || tagNumbers.isEmpty()) return null;
        DS_TagNumberDto tagNumberDto = tagNumbers.stream().filter(DS_TagNumberDto::getIsPrimary).findFirst().orElse(null);
        if(tagNumberDto == null) return null;
        return tagNumberDto.getNumber();
    }

    public String buildFileLink() {
        if (rootPath == null || extension == null || retrievePrimaryFileNumber() == null) {
            throw new IllegalStateException("Required fields are not set");
        }
        Path filePath = Paths.get(rootPath, extension,
                Optional.ofNullable(fileType).map(DS_ValueDto::getName).orElse(""),
                Optional.ofNullable(vendor).map(DS_ValueDto::getName).orElse(""),
                retrievePrimaryFileNumber() + "." + extension);
        path = filePath.toString();
        return path;
    }

    public String buildFolder() {
        if (rootPath == null || extension == null) {
            throw new IllegalStateException("Required fields are not set");
        }
        Path folderPath = Paths.get(rootPath, extension,
                Optional.ofNullable(fileType).map(DS_ValueDto::getName).orElse(""),
                Optional.ofNullable(vendor).map(DS_ValueDto::getName).orElse(""));
        folder = folderPath.toString();
        return folder;
    }

    public String buildFileLink(String extension) {
        this.extension = extension;
        return buildFileLink();
    }

    @Override
    public String toString() {
        return "FileObjectDto{" +
                "id=" + getId() +
                ", rootPath='" + rootPath + '\'' +
                ", folder='" + folder + '\'' +
                ", name='" + getName() + '\'' +
                ", fileNumber='" + retrievePrimaryFileNumber() + '\'' +
                ", extension='" + extension + '\'' +
                ", path='" + path + '\'' +
                ", fileType=" + fileType +
                ", vendor=" + vendor +
                ", systems=" + systems +
                ", tags=" + tags +
                ", elements=" + (elements != null ? elements.size() : "null") +
                '}';
    }

}