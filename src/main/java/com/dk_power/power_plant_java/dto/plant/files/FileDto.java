package com.dk_power.power_plant_java.dto.plant.files;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
public class FileDto {
    private Long id;
    private String name;
    private MultipartFile file;
}
