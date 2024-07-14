package com.dk_power.power_plant_java.util.data_transfer;


import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.impl.HrsgValveServiceImpl;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@AllArgsConstructor
public class TransferMethods {
    private final FileService fileService;
    private final EquipmentService pointService;
    private final ExcelService excelService;
    private final LotoPointService lotoPointService;
    private final HrsgValveServiceImpl hrsgValveService;
    public void transferPids(){
        List<FileDto> files = new JsonToPojo<FileDto>().readProductsFromFile("/static/data_transfer/files/pids_json_mod.js", FileDto.class);
        System.out.println(files.size());

        for (FileDto file : files) {
            fileService.saveForTransfer(file);
        }
    }

    public void transferPoints(){
        List<Equipment> points = new JsonToPojo<Equipment>().readProductsFromFile("/static/data_transfer/files/Equipment_mod.js", Equipment.class);
        System.out.println(points.size());
        int n = 0;
        for (Equipment point : points) {
            Equipment p = pointService.saveForTransfer(point);
            pointService.save(p);
            System.out.println(++n +" " + point.getPid());
            //if(n==2) break;

        }
    }


}
