package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.repository.plant.*;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GroupServiceConfig {
    private EquipmentTypeRepo equipmentTypeRepo;
    private FileRepo fileRepo;
    private FileTypeRepo fileTypeRepo;
    private LocationRepo locationRepo;
    private PointRepo pointRepo;
    private SystemRepo systemRepo;
    private VendorRepo vendorRepo;

}
