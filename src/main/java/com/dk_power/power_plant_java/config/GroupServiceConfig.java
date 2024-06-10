package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.plant.*;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.dk_power.power_plant_java.repository.plant.*;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.sevice.plant.impl.GroupServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GroupServiceConfig {
    @Autowired
    private EquipmentTypeRepo equipmentTypeRepo;
    @Autowired
    private FileRepo fileRepo;
    @Autowired
    private FileTypeRepo fileTypeRepo;
    @Autowired
    private LocationRepo locationRepo;
    @Autowired
    private PointRepo pointRepo;
    @Autowired
    private SystemRepo systemRepo;
    @Autowired
    private VendorRepo vendorRepo;

    @Bean
    public GroupService<EquipmentType> groupServiceEqType(){return new GroupServiceImpl<EquipmentType>(equipmentTypeRepo);}
    @Bean
    public GroupService<FileType> groupServiceFileType(){return new GroupServiceImpl<FileType>(fileTypeRepo);}
    @Bean
    public GroupService<FileObject> groupServiceFile(){return new GroupServiceImpl<FileObject>(fileRepo);}
    @Bean
    public GroupService<Location> groupServiceLocation(){return new GroupServiceImpl<Location>(locationRepo);}
    @Bean
    public GroupService<Point> groupServicePoint(){return new GroupServiceImpl<Point>(pointRepo);}
    @Bean
    public GroupService<Syst> groupServiceSystem(){return new GroupServiceImpl<Syst>(systemRepo);}
    @Bean
    public GroupService<Vendor> groupServiceVendor(){return new GroupServiceImpl<Vendor>(vendorRepo);}

}
