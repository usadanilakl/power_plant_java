package com.dk_power.power_plant_java;


import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.FilePathService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.TransferExcecutionServiceImpl;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.*;
import com.dk_power.power_plant_java.sevice.equipment.*;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
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


//        htTransferService.connectInstrumentsWithPids();

//        electricalPanelTransferService.deleteOldPanelObjects();
//        electricalPanelTransferService.createElectricalPanelFileObjectsFromExcelList();
//        electricalPanelTransferService.createFileObjectsForPanelPictures();
//        electricalPanelTransferService.connectPanelsFilesWithPanelObjects();
//        htTransferService.connectHtWithIsoFiles();
//        htTransferService.combineCircuits();
//        htTransferService.combineBreakers();
//        htTransferService.connectHtWithPids();

//        lotoPointMergeService.generateGeneralLocationFromEquipment();+

//        highlightService.performTransfer();
        heatTraceService.getAll().forEach(h->{
            h.getEquipmentList().forEach(e->{
                if(e.getDeleted()) System.out.println(e.getTagNumber());
            });
        });

        System.out.println("App is Ready: open browser and type: http://localhost:8082");



        FileObject entityById = fileService.getEntityById(5256l);
//        entityById.buildFileLink("jpg");
//        fileService.save(entityById);

//        equipmentService.getAll().forEach(highlightService::transferEqToHighlights);

//        System.out.println("equipmentService.getAll().size() = " + equipmentService.getAll().size());
//        System.out.println("highlightService.getAll().size() = " + highlightService.getAll().size());
//        System.out.println("Completed");
////        equipmentService.hardDelete(equipmentService.getEntityById(26399L));
//
//        List<String> duplicateTagNumbers = equipmentRepo.findDuplicateTagNumbers();
//        List<String> uniqueTagNumbers = equipmentRepo.findUniqueTagNumbers();
//        System.out.println("duplicateTagNumbers.size() = " + duplicateTagNumbers.size());
//        System.out.println("uniqueTagNumbers.size() = " + uniqueTagNumbers.size());

//        duplicateTagNumbers.forEach(System.out::println);
//        int n = 0;
//        for(String e : duplicateTagNumbers){
//
//            try{
//                equipmentService.combineDuplicates(e);
//                System.out.println("++++++++++++++++++++++++++++++++++++++++++++++++++++");
//            }catch (NullPointerException ex){
//                n++;
//            }
//
//        }
//        System.out.println(n);


/******************************************************************************************************************************************
 *  Creating File Objects from files in a folder
 ****************************************************************************************************************************************/
//        System.out.println("fileService.getAllLight().size() = " + fileService.getAllLight().size());
//        fileService.createFileObjectsFromFolder(
//                "C:\\Users\\usada\\IdeaProjects\\power_plant_java\\src\\main\\resources\\static\\uploads\\jpg\\Panel Pictures\\Kiewit",
//                "Panel Pictures",
//                "jpg",
//                "Kiewit",
//                "Electrical"
//
//        );
//        System.out.println("fileService.getAllLight().size() = " + fileService.getAllLight().size());


//        System.out.println("equipmentService.getAll().size() = " + eqBreakerService.getAll().size());
//        eqBreakerService.transferToDb();
//        System.out.println("equipmentService.getAll().size() = " + eqBreakerService.getAll().size());
//        electricalPanelService.getAll().forEach(e->{
//            System.out.println(e.getTagNumber() + ", " + e.getLocation());
//            e.getEqBreakers().forEach(b-> System.out.println(b.getTagNumber()+", "+b.getBrNumber()));
//            System.out.println("=================================================");
//        });

//        List<RevisedLotoPoints> list = revisedLotoPointService.getAll().stream().filter(e -> e.getType().toLowerCase().contains("molded case") || e.getType().toLowerCase().contains("rack out")).toList();
//        Set<String> panels = new HashSet<>();
//        for (RevisedLotoPoints point : list) {
//            String panel = point.getLocation();
//            if(panel.contains(",")) panel = panel.substring(0,panel.indexOf(","));
//            else if(panel.toLowerCase().contains("cubicle")) panel = panel.substring(0,panel.toLowerCase().indexOf("cubicle"));
//        }


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
//        transferExcecutionService.transferElTableFromExcel();
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
