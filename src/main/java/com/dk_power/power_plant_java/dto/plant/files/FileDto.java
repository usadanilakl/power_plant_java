package com.dk_power.power_plant_java.dto.plant.files;

import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.Vendor;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.fasterxml.jackson.annotation.JacksonAnnotation;
import com.fasterxml.jackson.annotation.JsonBackReference;
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
    private MultipartFile file;
    @JsonIgnore
    private FileType fileType;
    private String fileLink;
    private String baseLink;
    private String groupFolder;
    @JsonIgnore
    private Syst system;
    private String fileNumber;
    @JsonIgnore
    private Vendor vendor;
    @JsonIgnore
    private List<Point> points;
    public void buildFileLink(){
        fileLink = baseLink+"/"+groupFolder+"/"+fileNumber;
    }

}
