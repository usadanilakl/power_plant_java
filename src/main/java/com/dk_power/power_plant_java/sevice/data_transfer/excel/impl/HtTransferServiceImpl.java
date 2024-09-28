package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.entities.base_entities.BaseBreaker;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.HtTransferService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class HtTransferServiceImpl implements HtTransferService {
    private final HeatTraceService heatTraceService;
    private final FileService fileService;
    private final EquipmentService equipmentService;
    private final HtBreakerService htBreakerService;
    private final HtPanelService htPanelService;
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
    public void connectHtWithPids() {
        List<HeatTrace> all = heatTraceService.getAll();
        for (HeatTrace ht : all) {
            List<FileObject> pids = ht.getPid();
            List<Equipment> equipmentList = ht.getEquipmentList();
            equipmentList.forEach(eq->{
                if(!pids.contains(eq.getMainFile())) pids.add(eq.getMainFile());
            });
            heatTraceService.save(ht);
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

    @Override
    public void combineCircuits() {
        List<String> htTags = heatTraceService.getAllTags();
        for (String t : htTags) {
            List<HeatTrace> byTagNumber = heatTraceService.getByTagNumber(t);
            HeatTrace keeper = byTagNumber.get(0);
            for (HeatTrace h : byTagNumber) {
                if(keeper.getEquipmentList()==null)keeper.setEquipmentList(new ArrayList<>());
                h.getEquipmentList().forEach(e->{
                    if(!keeper.getEquipmentList().contains(e)) keeper.getEquipmentList().add(e);
                });
                if(keeper.getPid()==null)keeper.setPid(new ArrayList<>());
                if(h.getPid()!=null)h.getPid().forEach(e->{
                    if(!keeper.getPid().contains(e)) keeper.getPid().add(e);
                });
                if(keeper.getBreaker()==null && h.getBreaker()!=null)keeper.setBreaker(h.getBreaker());
                if(keeper.getHtIso()==null && h.getHtIso()!=null)keeper.setHtIso(h.getHtIso());
                if(keeper.getTempEquipment()==null && h.getTempEquipment()!=null)keeper.setTempEquipment(h.getTempEquipment());
                if(keeper.getTempPids()==null && h.getTempPids()!=null)keeper.setTempPids(h.getTempPids());
                if(keeper.getTempIso()==null && h.getTempIso()!=null)keeper.setTempIso(h.getTempIso());


            }
            heatTraceService.save(keeper);
            byTagNumber.forEach(e->{
                if(e.getId()!=keeper.getId()){
                    e.setNote("Deleted due to merging with " + keeper.getId());
                    heatTraceService.softDelete(e);
                }
            });
        }
    }

    @Override
    public void combineBreakers() {
        List<HtPanel> all = htPanelService.getAll();
        for (HtPanel htPanel : all) {
            Set<String> breakers = htPanel.getHtBreakers().stream().map(BaseBreaker::getBrNumber).collect(Collectors.toSet());
            breakers.forEach(b->{
                List<HtBreaker> byNumber = htPanel.getHtBreakers().stream().filter(br -> br.getBrNumber().equals(b)).toList();
                HtBreaker keeper = byNumber.get(0);
                for (HtBreaker htBreaker : byNumber) {
                    htBreaker.getEquipmentList().forEach(e->{
                        e.setBreaker(keeper);
                        heatTraceService.save(e);
                    });
                }
                htBreakerService.save(keeper);
                byNumber.forEach(br->{
                    if(!br.getId().equals(keeper.getId())){
                        br.setNote("Deleted due to merging with "+keeper.getId());
                        htBreakerService.softDelete(br);
                    }

                });
            });

        }
    }

}
