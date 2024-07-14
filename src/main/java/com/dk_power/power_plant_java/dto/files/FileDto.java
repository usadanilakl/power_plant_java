package com.dk_power.power_plant_java.dto.files;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.jpa.repository.Query;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileDto {

    public FileDto(Long id, String name, String fileLink, String relatedSystems, String fileNumber, Value vendor) {
        this.id = id;
        this.name = name;
        this.fileLink = fileLink;
        this.relatedSystems = relatedSystems;
        this.fileNumber = fileNumber;
        this.vendor = vendor;
    }

    private Long id;
    private String name;
    @JsonIgnore
    private MultipartFile file;
    private Value fileType;
    private String fileLink;
    private String baseLink;
    private String folder;
    private Value system;
    @JsonProperty("systems")
    private String relatedSystems;
    private String fileNumber;
    private Value vendor;
    private List<EquipmentDto> points;
//    private List<EquipmentDto> filePoints;

    public void buildFileLink(){
        fileLink = baseLink+"/"+ folder +"/"+fileNumber;
    }

    public void setFileType(String fileType) {
        Value value =new Value();
        value.setName(fileType);
        this.fileType = value;
    }
    public void setFileType(Value fileType) {
        this.fileType = fileType;
    }

    public void setRelatedSystems(List<String> systems) {
        this.relatedSystems = systems.toString();
    }

    public void setVendor(String vendor) {
        Value value =new Value();
        value.setName(vendor);
        this.vendor = value;
    }
    public void setVendor(Value vendor) {
        this.vendor = vendor;
    }

    @Override
    public String toString() {
        return "FileDto{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", file=" + file +
                ", fileType=" + fileType +
                ", fileLink='" + fileLink + '\'' +
                ", baseLink='" + baseLink + '\'' +
                ", groupFolder='" + folder + '\'' +
                ", system=" + system +
                ", fileNumber='" + fileNumber + '\'' +
                ", vendor=" + vendor +
                ", points=" + points +
                '}';
    }
}
