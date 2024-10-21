package com.dk_power.power_plant_java;


import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDtoLight;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.*;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.FilePathService;
import com.dk_power.power_plant_java.sevice.S3Service;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.TransferExcecutionServiceImpl;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.*;
import com.dk_power.power_plant_java.sevice.equipment.*;
import com.dk_power.power_plant_java.sevice.file.FileUploaderService;
import com.dk_power.power_plant_java.sevice.image.OCRService;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointMergeService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.util.DataGenerator;
import com.dk_power.power_plant_java.util.data_transfer.TransferMethods;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@SpringBootApplication
@RequiredArgsConstructor
@EnableJpaRepositories(basePackages = "com.dk_power.power_plant_java.repository")
@EntityScan(basePackages = "com.dk_power.power_plant_java.entities")
public class PowerPlantJavaApplication implements CommandLineRunner {
//private final FileUploaderService fileUploaderService;
//private final FileRepo fileRepo;
private final FileService fileService;
private final TransferMethods transferMethods;
private final ExcelService excelService;
private final DataGenerator dataGenerator;
private final EquipmentService equipmentService;
private final TransferExcecutionServiceImpl transferExcecutionService;
private final DataDistributionService dataDistributionService;
private final CategoryService categoryService;
private final ValueService valueService;
private final LotoPointService lotoPointService;
private final RevisedLotoPointService revisedLotoPointService;
private final OldLotoPointService oldLotoPointService;
private final FilePathService filePathService;
private final HeatTraceService heatTraceService;
private final HtPanelService htPanelService;
private final ElectricalPanelService electricalPanelService;
private final HtBreakerService htBreakerService;
private final EqBreakerService eqBreakerService;
private final ElectricalTableService electricalTableService;
private final OCRService ocrService;
private final HighlightService highlightService;
private final EquipmentRepo equipmentRepo;
private final LotoPointMergeService lotoPointMergeService;
private final LotoPointRepo lotoPointRepo;
private final ElectricalPanelTransferService electricalPanelTransferService;
private final HtTransferService htTransferService;
private final HeatTraceRepo heatTraceRepo;
private final FileUploaderService fileUploaderService;
private final ExcelReaderService excelReaderService;
private final S3Service s3Service;


    public static void main(String[] args) {
//        SpringApplication.run(PowerPlantJavaApplication.class, args);

        SpringApplicationBuilder builder = new SpringApplicationBuilder(PowerPlantJavaApplication.class);
        builder.headless(false);
        builder.run(args);
    }


    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");
        System.out.println("App is Ready: open browser and type: http://localhost:8082");


    }
}
