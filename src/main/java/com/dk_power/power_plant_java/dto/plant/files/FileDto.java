package com.dk_power.power_plant_java.dto.plant.files;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
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
    private String fileNumber;
    private Value vendor;
    private List<EquipmentDto> points;
    private List<EquipmentDto> filePoints;

    public void buildFileLink(){
        fileLink = baseLink+"/"+ folder +"/"+fileNumber;
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
