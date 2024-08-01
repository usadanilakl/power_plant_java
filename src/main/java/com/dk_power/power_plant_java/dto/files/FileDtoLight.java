package com.dk_power.power_plant_java.dto.files;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FileDtoLight {
    public FileDtoLight(Long id, String name, String fileLink, String relatedSystems, String fileNumber, Value vendor, Value fileType) {
        this.id =id;
        this.name = name;
        this.fileLink = fileLink;
        this.relatedSystems = relatedSystems;
        this.fileNumber = fileNumber;
        ValueDto v = new ValueDto();
        v.setId(vendor.getId());
        v.setName(vendor.getName());
        this.vendor = v;
        ValueDto f = new ValueDto();
        f.setId(fileType.getId());
        f.setName(fileType.getName());
        this.fileType = f;
    }
    private Long id;
    private String name, fileLink,fileNumber,relatedSystems;
    private String objectType = "FileObject";
    private ValueDto vendor;
    private ValueDto fileType;


}
