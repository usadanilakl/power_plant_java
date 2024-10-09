package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.entities.base_entities.BaseBreaker;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.HtTransferService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
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
    private final LotoPointService lotoPointService;
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
        int n = 0;
        int n2 = 0;
        List<HeatTrace> all = heatTraceService.getAll();
        for (HeatTrace h : all) {
            if(h.getTagNumber().contains("ENC")){
                n2++;
                String tag = h.getTagNumber();
                tag = tag.substring(tag.indexOf("ENC")+3).trim();
                List<Equipment> eq = equipmentService.getByTagNumberContains(tag).stream().filter(e->e.getEqType()!=null && e.getEqType().getName().equalsIgnoreCase("instrument")).toList();
                if(eq.size()>0){
                    Equipment equipment = eq.stream().filter(e -> e.getTagNumber().substring(0, 2).equals(h.getTagNumber().substring(0, 2))).findFirst().orElse(null);
                    if(equipment==null) continue;
//                    System.out.println(h.getTagNumber() + " " + equipment.getTagNumber());
                    h.getEquipmentList().add(equipment);
                    heatTraceService.save(h);
                    n++;
                }
            }


//                heatTraceService.save(h);
            }
        System.out.println(n+"/"+n2);
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

    @Override
    public void updateEqList() {
        List<HeatTrace> all = heatTraceService.getAll(); //get all heat trace
        for (HeatTrace ht : all) {
            List<Equipment> eqList = ht.getEquipmentList(); //get current eq list of current ht
            eqList.forEach(eq->{
                List<Equipment> byTagNumber = equipmentService.getByTagNumber(ht.getTagNumber().trim());
                byTagNumber.forEach(e->{
                    if(!eqList.contains(e)) eqList.add(e); //add missing eq to current ht
                });
            });
            heatTraceService.save(ht);
        }
    }

    @Override
    public void connectHtPanelsWithFiles() {
        List<HtPanel> all = htPanelService.getAll();
        all.forEach(p->{
            List<FileObject> files = fileService.getIfNameContains(p.getTagNumber());
            if(files.size()>0)p.setPanelSchedule(files.get(0));
            htPanelService.save(p);
        });
    }

    @Override
    public void addHtLotoPointsToEq() {
        List<HeatTrace> all = heatTraceService.getAll();
        for (HeatTrace ht : all) {
            List<Equipment> eqList = ht.getEquipmentList();
            eqList.forEach(eq->{
                if(eq.getLotoPoints()==null)eq.setLotoPoints(new HashSet<>());
                else eq.getLotoPoints().add(ht.getLotoPoint());
                equipmentService.save(eq);
            });
        }
    }

    @Override
    public void addLotoPointsToHt() {
        List<HeatTrace> all = heatTraceService.getAll();
        System.out.println(all.size());
        for (HeatTrace ht : all) {
            List<LotoPoint> lotoPoints = lotoPointService.getIfDescriptionContains(ht.getTagNumber());
            if(lotoPoints.size()>0){
                ht.setLotoPoint(lotoPoints.get(0));
            }
            heatTraceService.save(ht);
        }
    }

}
