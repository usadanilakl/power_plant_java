package com.dk_power.power_plant_java;


import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.ExcelService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.file.FileUploaderService;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import com.dk_power.power_plant_java.util.DataGenerator;
import com.dk_power.power_plant_java.util.data_transfer.TransferMethods;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@AllArgsConstructor
@EnableJpaRepositories(basePackages = "com.dk_power.power_plant_java.repository")
@EntityScan(basePackages = "com.dk_power.power_plant_java.entities")
public class PowerPlantJavaApplication implements CommandLineRunner {
//private final FileUploaderService fileUploaderService;
//private final FileRepo fileRepo;
private final FileService fileService;
private final TransferMethods transferMethods;
private final ExcelService excelService;
private final DataGenerator dataGenerator;
private final EquipmentRepo equipmentRepo;


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");
/***************************TransferMethods*************************************************/
        transferMethods.transferPids();
        System.out.println(fileService.getAll().size() + " file upload completed");

//        transferMethods.transferPoints();
//        System.out.println("pointRepo.getAll().size() = " + equipmentRepo.findAll().size());
//
//        transferMethods.transferPointsFromExcel();
 /********************************************************************************/

//        fileService.getAll().forEach(FileObject::buildFileLink);
//        System.out.println("fileService.getAll().get(33) = " + fileService.getAllDtos().get(48));

//        dataGenerator.createUser();


    }
}
