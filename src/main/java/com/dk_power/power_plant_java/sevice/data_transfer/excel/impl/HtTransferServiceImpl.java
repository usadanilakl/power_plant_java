package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.HtTransferService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
@RequiredArgsConstructor
public class HtTransferServiceImpl implements HtTransferService {
    private final HeatTraceService heatTraceService;
    private final FileService fileService;
    private final EquipmentService equipmentService;
    @Override
    public void connectHtWithIsoFiles() {
        List<HeatTrace> all = heatTraceService.getAll();
        for (HeatTrace h : all) {
            List<FileObject> files = fileService.getIfNumberContains(h.getTagNumber());
            if(files.size()==1) h.setHtIso(files.get(0));
            heatTraceService.save(h);
        }
    }

    @Override
    public void connectInstrumentsWithPids() {
        List<HeatTrace> all = heatTraceService.getAll();
        for (HeatTrace h : all) {
            if(h.getTagNumber().contains("ENC")){
                String tag = h.getTagNumber();
                tag = tag.substring(tag.indexOf("ENC")+3).trim();
                List<Equipment> eq = equipmentService.getByTagNumberContains(tag);
                if(eq==null || eq.size()==0) System.out.println(h.getTagNumber());
            }
//            heatTraceService.save(h);
        }
    }
}
