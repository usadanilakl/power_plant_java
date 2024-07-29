package com.dk_power.power_plant_java;


import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.sevice.FilePathService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.TransferExcecutionServiceImpl;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.OldLotoPointService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import com.dk_power.power_plant_java.sevice.loto.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.util.DataGenerator;
import com.dk_power.power_plant_java.util.data_transfer.TransferMethods;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

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


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }


    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");

        List<ElectricalPanel> allPanels = electricalPanelService.getAll();
        String panelLocations = "00-LVB-PPL-173 TUB 1, ELECTRIC ROOM\n" +
                "00-LVB-PPL-173 TUB 2, ELECTRIC ROOM\n" +
                "00-LVB-PPL-1731, ELECTRICAL ROOM 113\n" +
                "00-LVF-PPL-01, MVB\n" +
                "01-LVB-PPL-1111, NE TURBINE BULDING\n" +
                "01-LVB-PPL-1112, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "01-LVB-PPL-11121, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "01-LVB-PPL-1113, PIPE RACK 1 BY STARTUP HTR\n" +
                "01-LVB-PPL-1114, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "01-LVB-PPL-1115, INSIDE HRSG SWG ENCLOSURE\n" +
                "01-LVB-PPL-1311, ACC MCC\n" +
                "01-LVB-PPL-1511, ACC MCC ENCLOSURE\n" +
                "01-LVB-PPL-2111, TOP OF HRSG HP DRUM\n" +
                "01-LVB-PPL-2112, INSIDE HRSG SWG ENCLOSURE\n" +
                "01-LVB-PPL-2113, OUTSIDE CHROMATOGRAPH BLDG\n" +
                "01-LVB-PPL-21132, TURBINE DECK SE\n" +
                "01-LVB-PPL-21133, TURBINE DECK SW\n" +
                "01-LVB-SWB-171, MVB\n" +
                "01-LVB-SWB-2113, NE CORNER TURBINE BLDG\n" +
                "01-LVD-PPL-1111, INSIDE HRSG SWG ENCLOSURE\n" +
                "01-LVD-PPL-1311, ACC MCC ENCLOSURE\n" +
                "01-LVD-PPL-1712, MVB\n" +
                "01-LVD-PPL-1731 TUB 1, ELECTRICAL ROOM 113\n" +
                "01-LVD-PPL-1731 TUB 2, ELECTRICAL ROOM 113\n" +
                "01-LVD-PPL-1731 TUB 3, ELECTRICAL ROOM 113\n" +
                "01-LVD-PPL-2111, INSIDE HRSG SWG ENCLOSURE\n" +
                "01-LVD-PPL-21111, TOP OF HRSG HP DRUM\n" +
                "01-LVD-PPL-21131, NE CORNER TURBINE BLDG\n" +
                "01-LVD-PPL-21133, TURBINE DECK SW\n" +
                "01-LVD-PPL-2311, OUTSIDE OF ACC MCC ENCLOSURE\n" +
                "01-LVD-PPL-2511, ACC MCC ENCLOSURE\n" +
                "01-LVE-PPL-01, DC DISTRIBUTION PANEL\n" +
                "01-LVE-PPL-012, U2 HRSG MCC\n" +
                "01-LVF-PPL-01, MV PDC\n" +
                "01-LVF-PPL-011, U1 HRSG MCC\n" +
                "01-LVF-PPL-012, U2 HRSG MCC\n" +
                "01-LVF-PPL-013, ADMIN BLDG U1 UPS\n" +
                "01-LVF-PPL-014, ACC 1 U1 UPS PANEL\n" +
                "01-LVF-PPL-015, ACC 2 U1 UPS PANEL\n" +
                "02-LVB-PPL-1211, HRSG MCC ENCLOSURE\n" +
                "02-LVB-PPL-1212, HRSG 2 AREA\n" +
                "02-LVB-PPL-1213, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "02-LVB-PPL-1214, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "02-LVB-PPL-1215, AUX BOILER WEST WALL\n" +
                "02-LVB-PPL-1217, WAREHOUSE BUILDING\n" +
                "02-LVB-PPL-1218, NE CORNER OF RO BLDG\n" +
                "02-LVB-PPL-1411, ACC MCC ENCLOSURE\n" +
                "02-LVB-PPL-1611, ACC MCC ENCLOSURE\n" +
                "02-LVB-PPL-2211 TUB 1, WAREHOUSE BUILDING\n" +
                "02-LVB-PPL-2211 TUB 2, WAREHOUSE BUILDING\n" +
                "02-LVB-PPL-22112, SE TURBINE DECK\n" +
                "02-LVB-PPL-22113, SW TURBINE DECK\n" +
                "02-LVB-PPL-2212, INSIDE HRSG SWG ENCLOSURE\n" +
                "02-LVB-PPL-2213, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "02-LVB-PPL-22131, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "02-LVB-PPL-2214, NE CORNER OF RO BLDG\n" +
                "02-LVB-PPL-2215, NE CORNER TURBINE BLDG\n" +
                "02-LVB-SWB-2211, MAINTENANCE SHOP NW\n" +
                "02-LVB-SWB-271, MVB\n" +
                "02-LVD-PPL-1211, INSIDE HRSG SWG ENCLOSURE\n" +
                "02-LVD-PPL-12121, TOP OF HRSG HP DRUM\n" +
                "02-LVD-PPL-12151, AUX BOILER WEST WALL\n" +
                "02-LVD-PPL-12181, EAST WALL RO BLDG\n" +
                "02-LVD-PPL-1412, ACC MCC ENCLOSURE\n" +
                "02-LVD-PPL-2211, OUTSIDE HRSG SWG ENCLOSURE\n" +
                "02-LVD-PPL-22111, NE CORNER TURNBINE BLDG\n" +
                "02-LVD-PPL-22113, SW TURBINE DECK\n" +
                "02-LVD-PPL-22141, ELECTRICAL ROOM EAST WALL\n" +
                "02-LVD-PPL-2216, WAREHOUSE BUILDING\n" +
                "02-LVD-PPL-2411, OUTSIDE OF ACC MCC ENCLOSURE\n" +
                "02-LVD-PPL-2611, ACC MCC ENCLOSURE\n" +
                "02-LVD-PPL-2712, MVB PDC\n" +
                "02-LVE-PPL-01, DC DISTRIBUTION PANEL\n" +
                "02-LVE-PPL-012, HRSG 2 MCC\n" +
                "02-LVF-PPL-01, MVB\n" +
                "02-LVF-PPL-011, HRSG 1 PDC\n" +
                "02-LVF-PPL-012, HRSG 2 PDC\n" +
                "02-LVF-PPL-013, ADMIN BLDG U2 UPS\n" +
                "02-LVF-PPL-014, ACC 1 U2 UPS PANEL\n" +
                "02-LVF-PPL-015, ACC 2 U1 UPS PANEL\n" +
                "SWG 11, MVB";

        for (String s : panelLocations.split("\n")) {
            String panelFromExcel = s.substring(0,s.indexOf(","));
            ElectricalPanel panel = electricalPanelService.getByTagNumber(panelFromExcel);
            if(panel==null) System.out.println(panelFromExcel);
        }

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
