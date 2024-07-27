package com.dk_power.power_plant_java;


import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_transfer.RevisedLotoPointsDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.data_transfer.OldLotoPoint;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.FilePathService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.TransferExcecutionServiceImpl;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.OldLotoPointService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.util.DataGenerator;
import com.dk_power.power_plant_java.util.Util;
import com.dk_power.power_plant_java.util.data_transfer.TransferMethods;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.util.ArrayList;
import java.util.List;

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
private final CategoryService categoryService;
private final ValueService valueService;
private final LotoPointService lotoPointService;
private final RevisedLotoPointService revisedLotoPointService;
private final OldLotoPointService oldLotoPointService;
private final FilePathService filePathService;
//private final MegaSession megaSession;


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }


    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");

/***************************TransferMethods*************************************************/
//        fileService.getAll().forEach(fileService::hardDelete);
//        categoryService.getAll().forEach(categoryService::hardDelete);
//        valueService.getAll().forEach(valueService::hardDelete);
//        transferMethods.transferPids();
//        System.out.println(fileService.getAll().size() + " file upload completed");
//
//
//        transferMethods.transferPoints();
//        System.out.println("pointRepo.getAll().size() = " + equipmentRepo.findAll().size());

//        System.out.println(lotoPointService.getAll().size());
//        lotoPointService.getAll().forEach(lotoPointService::hardDelete);
//        System.out.println(lotoPointService.getAll().size());
//        lotoPointService.transferExcelToDB();
//        System.out.println(lotoPointService.getAll().size());

 /********************************************************************************/

//        fileService.getAll().forEach(FileObject::buildFileLink);
//        System.out.println("fileService.getAll().get(33) = " + fileService.getAllDtos().get(48));

//        dataGenerator.createUser();

//        transferExcecutionService.getHighlitsFromJson();
//        transferExcecutionService.getHtFromJson();
//        transferExcecutionService.getPidsFromJson();
/*************************************************************************************************
 *                  Excel Data Transfer
 *********************************************************************************************/
//        transferExcecutionService.transferBypassFromExcel();
//        transferExcecutionService.transferHrsgPipeFromExcel();
//        transferExcecutionService.transferHrsgValvesFromExcel();
//        transferExcecutionService.transferKiewitPipeFromExcel();
//        transferExcecutionService.transferKiewitValveFromExcel();
//        transferExcecutionService.transferOldLotoPointsFromExcel();
//        transferExcecutionService.transferLotoPointsFromExcel();
//        transferExcecutionService.transferRevisedLotoPointsFromExcel();
//        categoryService.save(new Category("System"));
        /**************************************************************
         *Adding objectType field to existing tables
         *************************************************************/
//        fileService.getAll().forEach(e->{
//            e.setObjectType(e.getClass().getSimpleName());
//            e.setModifiedBy("Danil Klokov");
//            fileService.save(e);
//        });

//        equipmentService.getAll().forEach(e->{
//            e.setObjectType(e.getClass().getSimpleName());
//            e.setModifiedBy("Danil Klokov");
//            equipmentService.save(e);
//        });

//        lotoPointService.getAll().forEach(e->{
//            e.setObjectType(e.getClass().getSimpleName());
//            e.setModifiedBy("Danil Klokov");
//            lotoPointService.save(e);
//        });

        /******************************************************************************************
         * Testing mappers
         ******************************************************************************************/

//        System.out.println(equipmentService.getAll().get(0).getTagNumber() + " tag number");
//        Equipment equipment = equipmentService.getAll().get(0);
//        EquipmentDto dtoById = equipmentService.getDtoById(equipment.getId());
//        System.out.println(dtoById.toString());
//        System.out.println(equipmentService.getEntityById(dtoById.getId()).toString());
//
//        FileObject fileObject = fileService.getAll().get(120);
//        FileDto fdtoById = fileService.getDtoById(fileObject.getId());
//        System.out.println(fdtoById.toString());
//        System.out.println(fileService.getEntityById(fdtoById.getId()).toString());

//        Value v = valueService.getAll().get(0);
//        Category c = v.getCategory();

//        ValueDto vdto = valueService.getDtoById(v.getId());
//        CategoryDto cdto = categoryService.getDtoById(c.getId());


//        System.out.println(vdto);
//        System.out.println("++++++++++++++++++++++");
//        System.out.println(valueService.getEntityById(vdto.getId()));
//        System.out.println("++++++++++++++++++++++");
//        System.out.println(cdto);
//        System.out.println("++++++++++++++++++++++");
//        System.out.println(categoryService.getEntityById(cdto.getId()));

    }
}
