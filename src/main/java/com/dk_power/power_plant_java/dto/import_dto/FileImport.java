package com.dk_power.power_plant_java.dto.import_dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
@Getter
@Setter
public class FileImport {
    private String fileNumber;
    private String pidNumber;
    private String folder;
    private String vendor;
    private List<String> systems;
    private String fileType;
    private String extension;
    private String name;
}
