package com.dk_power.power_plant_java.dto.data_transfer;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PidJson {
    private String fileNumber;
    private String pidNumber;
    private String folder;
    private String vendor;
    private List<String> systems;
    private String fileType;
    private String extension;
    private String name;
}