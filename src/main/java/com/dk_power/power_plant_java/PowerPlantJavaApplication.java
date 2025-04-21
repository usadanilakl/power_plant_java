package com.dk_power.power_plant_java;


import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.ConflictRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.FilePathService;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLockService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.app_services.SyncService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.TransferToDataServiceProject;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.TransferExcecutionServiceImpl;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.*;
import com.dk_power.power_plant_java.sevice.equipment.*;
import com.dk_power.power_plant_java.sevice.file.FileUploaderService;
import com.dk_power.power_plant_java.sevice.image.OCRService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointMergeService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.util.DataGenerator;
import com.dk_power.power_plant_java.util.data_transfer.TransferMethods;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.ArrayList;
import java.util.Arrays;

@SpringBootApplication
@RequiredArgsConstructor
@EnableJpaRepositories(basePackages = "com.dk_power.power_plant_java.repository")
@EntityScan(basePackages = "com.dk_power.power_plant_java.entities")
@EnableScheduling
public class PowerPlantJavaApplication implements CommandLineRunner {

    private final NgLockService ngLockService;
    private final NgLotoBoxService ngLotoBoxService;
    private final NgUserService userService;
    private final NgValueService ngValueService;



    public static void main(String[] args) {
//        SpringApplication.run(PowerPlantJavaApplication.class, args);

        SpringApplicationBuilder builder = new SpringApplicationBuilder(PowerPlantJavaApplication.class);
        builder.headless(false);
        builder.run(args);
    }


    @Override
    @Transactional
    public void run(String... args) throws Exception {

//        // Create 10 LotoBoxes
//        for (int i = 1; i <= 10; i++) {
//            LotoBox lotoBox = new LotoBox();
//            lotoBox.setNumber(i);
//            ngLotoBoxService.save(lotoBox);
//        }
//
//        // Create 100 Locks
//        for (int i = 1; i <= 100; i++) {
//            Lock lock = new Lock();
//            lock.setNumber(i);
//            ngLockService.save(lock);
//        }
//
//        // Create 10 Users with normal names
//        String[] names = {
//                "John Smith", "Emma Johnson", "Michael Brown", "Olivia Davis", "William Wilson",
//                "Sophia Taylor", "James Anderson", "Isabella Thomas", "Robert Jackson", "Ava White"
//        };
//
//        for (String name : names) {
//            User user = new User();
//            user.setName(name);
//            user.setEmail(name.toLowerCase().replaceAll("\\s", "") + "@example.com");
//            user.setPassword("123");
//            user.setRole("USER");
//            user.setIsActive(true);
//            user.setUsername(name.toLowerCase().replaceAll("\\s", ""));
//
//            userService.save(user);
//        }
//
//        ngValueService.createValue("Permit Type","LOTO");
//        ngValueService.createValue("Permit Status","Active");
//        ngValueService.createValue("Permit Status","Inactive");
//        ngValueService.createValue("LOTO Accessory Status","In Use");
//        ngValueService.createValue("LOTO Accessory Status","Available");

        System.err.println("=====================================================");
        System.out.println("App is Ready: open browser and type: http://localhost:8082");


    }
}
