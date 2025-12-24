package com.dk_power.power_plant_java.dto.browser;


import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class BrEquipmentDto {
    private Long id;
    private String tagNumber;
    private String description;
    private String specificLocation;
    private String eqType;
    private Set<Long> files;
    private String vendor;
    private String location;
    private String system;
    private String coordinates;
    private String originalPictureSize;
    private String mainFile;
    private Set<Long> lotoPoints;
    private Set<Long> possiblyRelatedFiles;
    private Set<Long> relatedEquipment;
    private String fileName;
    private String fileNumber;
}
