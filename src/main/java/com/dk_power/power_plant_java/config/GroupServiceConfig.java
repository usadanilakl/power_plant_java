package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.plant.*;
import com.dk_power.power_plant_java.entities.plant.System;
import com.dk_power.power_plant_java.repository.plant.*;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.sevice.plant.impl.GroupServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@AllArgsConstructor
public class GroupServiceConfig {
    private EquipmentTypeRepo equipmentTypeRepo;
    private FileRepo fileRepo;
    private FileTypeRepo fileTypeRepo;
    private LocationRepo locationRepo;
    private PointRepo pointRepo;
    private SystemRepo systemRepo;
    private VendorRepo vendorRepo;

    @Bean
    public GroupService<EquipmentType> groupServiceEqType(){return new GroupServiceImpl<EquipmentType>(equipmentTypeRepo);}
    @Bean
    public GroupService<FileType> groupServiceFileType(){return new GroupServiceImpl<FileType>(fileTypeRepo);}
    @Bean
    public GroupService<File> groupServiceFile(){return new GroupServiceImpl<File>(fileRepo);}
    @Bean
    public GroupService<Location> groupServiceLocation(){return new GroupServiceImpl<Location>(locationRepo);}
    @Bean
    public GroupService<Point> groupServicePoint(){return new GroupServiceImpl<Point>(pointRepo);}
    @Bean
    public GroupService<System> groupServiceSystem(){return new GroupServiceImpl<System>(systemRepo);}
    @Bean
    public GroupService<Vendor> groupServiceVendor(){return new GroupServiceImpl<Vendor>(vendorRepo);}

}
