package com.dk_power.power_plant_java.dto.data_service_project_dtos.files;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.base.DS_ConnectableDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
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
    private String fileNumber;
    private String docNumber;
    private String extension;
    private String path;
    private DS_ValueDto fileType;
    private DS_ValueDto vendor;
    private List<DS_ValueDto> systems;
    private List<DS_ValueDto> tags;
    private List<DS_FileElementDto> elements;

    public String buildFileLink() {
        if (rootPath == null || extension == null || fileNumber == null) {
            throw new IllegalStateException("Required fields are not set");
        }
        Path filePath = Paths.get(rootPath, extension,
                Optional.ofNullable(fileType).map(DS_ValueDto::getName).orElse(""),
                Optional.ofNullable(vendor).map(DS_ValueDto::getName).orElse(""),
                fileNumber + "." + extension);
        path = filePath.toString();
        return path;
    }

    public void extractFieldsFromPath(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            throw new IllegalArgumentException("File path cannot be null or empty");
        }

        Path path = Paths.get(filePath);

        if (path.getNameCount() < 5) {
            throw new IllegalArgumentException("Invalid file path structure");
        }

        // Extract components
        this.path = filePath;
        this.rootPath = path.getRoot().toString();
        this.extension = path.getName(1).toString();

        String fileTypeName = path.getName(2).toString();
        String vendorName = path.getName(3).toString();

        String fileName = path.getFileName().toString();
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0) {
            this.fileNumber = fileName.substring(0, lastDotIndex);
            // Verify if the extension in the filename matches the one in the path
            String fileExtension = fileName.substring(lastDotIndex + 1);
            if (!fileExtension.equals(this.extension)) {
                throw new IllegalArgumentException("File extension in the path does not match the actual file extension");
            }
        } else {
            throw new IllegalArgumentException("Invalid file name format");
        }

        // Set fileType and vendor
        this.fileType = new DS_ValueDto();
        this.fileType.setName(fileTypeName);

        this.vendor = new DS_ValueDto();
        this.vendor.setName(vendorName);

        // Build folder
        this.folder = Paths.get(rootPath, extension, fileTypeName, vendorName).toString();
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
                ", fileNumber='" + fileNumber + '\'' +
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