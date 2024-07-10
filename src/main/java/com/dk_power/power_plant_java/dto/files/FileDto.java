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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileDto {
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
    private List<EquipmentDto> filePoints;

    public void buildFileLink(){
        fileLink = baseLink+"/"+ folder +"/"+fileNumber;
    }

    public void setFileType(String fileType) {
        Value value =new Value();
        Category cat = new Category();
        value.setName(fileType);
        cat.setName("File Type");
        value.setCategory(cat);
        cat.updateValues(value);
        this.fileType = value;
    }

    public void setRelatedSystems(List<String> systems) {
        this.relatedSystems = systems.toString();
    }

    public void setVendor(String vendor) {
        Value value =new Value();
        Category cat = new Category();
        value.setName(vendor);
        cat.setName("File Type");
        value.setCategory(cat);
        cat.updateValues(value);
        this.vendor = value;
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
                ", filePoints=" + filePoints +
                '}';
    }
}
