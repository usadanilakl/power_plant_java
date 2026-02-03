package com.dk_power.power_plant_java;


import com.dk_power.power_plant_java.config.TestCleanupConfig;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.refactor_equipment.EquipmentRefactorService;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import com.dk_power.power_plant_java.sevice.EtaProService;
import com.dk_power.power_plant_java.sevice.angular.DefaultValueGeneratorService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.file.ReferenceObjectService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import com.dk_power.power_plant_java.sevice.loto.loto_box.LotoBoxInitializationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.Arrays;
import java.util.List;

@SpringBootApplication
@RequiredArgsConstructor
@EnableJpaRepositories(basePackages = "com.dk_power.power_plant_java.repository")
@EntityScan(basePackages = "com.dk_power.power_plant_java.entities")
@EnableScheduling
@EnableAsync
public class PowerPlantJavaApplication implements CommandLineRunner {

    private final RedTagAutomationService redTagAutomationService;
    private final EtaProService etaProService;
    private final DefaultValueGeneratorService defaultValueGeneratorService;
    private final LotoBoxInitializationService lotoBoxInitializationService;
    private final NgFileService fileService;
    private final ReferenceObjectService referenceObjectService;
    private final LotoService lotoService;
    private final NgLotoPointService lotoPointService;
    private final NgEquipmentService equipmentService;
    private final EquipmentRefactorService equipmentRefactorService;

    @Value("${files.root.path}")
    private String filesRoot;



    public static void main(String[] args) {
        // Run cleanup BEFORE Spring initializes (before database connection)
        TestCleanupConfig.runCleanup();

        SpringApplicationBuilder builder = new SpringApplicationBuilder(PowerPlantJavaApplication.class);
        builder.headless(false);
        builder.run(args);
    }


    @Override
    @Transactional
    public void run(String... args) throws Exception {

//        redTagAutomationService.openApp();

        defaultValueGeneratorService.generateAllValues();
        defaultValueGeneratorService.generateCommentTypes();
//        lotoBoxInitializationService.initializeLotoBoxesWithEspDevices();

        String currentUser = System.getProperty("user.name");
        System.out.println("Current User: " + currentUser);

//        List<FileObject> all = fileService.getFilesWithNoExtension();
//        System.out.println(all.size() + " files found with no extension"  );
//        for (FileObject f : all) {
//            String jpgLink = f.buildFileLink("jpg");
//            String pdfLink = f.buildFileLink("pdf");
//
//            Path jpgPath = Paths.get(filesRoot.replace("\\uploads","").replace("/uploads",""), jpgLink);
//            Path pdfPath = Paths.get(filesRoot.replace("\\uploads","").replace("/uploads",""), pdfLink);
//
//
//            System.out.println(jpgPath);
//
//            if (Files.exists(jpgPath)) {
//                f.addExtension("jpg");
//            }
//            if (Files.exists(pdfPath)) {
//                f.addExtension("pdf");
//            }
//
//            fileService.save(f);
//        }

//        fileService.createObjectsFromDirectoryUsingMetaDataExcel("uploads\\pdf\\HRSG Valves\\John Cockerill","HRSG Valves","pdf","John Cockerill","");
//        fileService.createObjectsFromDirectoryUsingMetaDataExcel("uploads\\pdf\\HRSG Isometrics\\John Cockerill","HRSG Isometrics","pdf","John Cockerill","");
//        fileService.createObjectsFromDirectoryUsingMetaDataExcel("uploads\\pdf\\BOP Valves\\Kiewit","BOP Valves","pdf","Kiewit","");
//        fileService.createObjectsFromDirectoryUsingMetaDataExcel("uploads\\pdf\\Isometric Large Bore Piping none-stressed\\Kiewit","Isometric Large Bore Piping none-stressed","pdf","Kiewit","");
//        fileService.createObjectsFromDirectoryUsingMetaDataExcel("uploads\\pdf\\Isometric Large Bore Piping stressed\\Kiewit","Isometric Large Bore Piping stressed","pdf","Kiewit","");
//        fileService.createObjectsFromDirectoryUsingMetaDataExcel("uploads\\pdf\\Isometric Small Bore Piping stressed\\Kiewit","Isometric Small Bore Piping stressed","pdf","Kiewit","");
//
//        referenceObjectService.deleteAll();
//        referenceObjectService.importHrsgValveList();
//        referenceObjectService.importBopValveList();
//        referenceObjectService.importHrsgPipeList();
//        referenceObjectService.importBopPipeList();

//        referenceObjectService.printAll();

//        lotoService.deleteAllLotos();
//        lotoService.modifyLotoSchema();
//        lotoService.modifyLotoSnapshotSchema();
//        lotoService.deleteLotoSnapshotTable();

//        fileService.cleanUpFileTypeValueDuplicates();


        System.err.println("=====================================================");
        System.out.println("App is Ready: open browser and type: http://localhost:8082");

//        equipmentRefactorService.splitAllEquipmentWithMultipleLotoPoints();

//        equipmentRefactorService.assignEquipmentLocationAndTypeToLotoPoints();





    }
}
