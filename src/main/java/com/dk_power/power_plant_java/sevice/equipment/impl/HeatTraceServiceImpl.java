package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.equipment.HeatTraceMapper;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.util.Util;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class HeatTraceServiceImpl implements HeatTraceService {
    private final HeatTraceRepo heatTraceRepo;
    private final HeatTraceMapper heatTraceMapper;
    private final SessionFactory sessionFactory;
    private final HtBreakerService htBreakerService;
    private final HtPanelService htPanelService;
    private final EquipmentService equipmentService;
    private final FileService fileService;
    private final DataDistributionService dataDistributionService;

    public HeatTraceServiceImpl(HeatTraceRepo heatTraceRepo, HeatTraceMapper heatTraceMapper, SessionFactory sessionFactory, HtBreakerService htBreakerService, HtPanelService htPanelService, EquipmentService equipmentService, FileService fileService, @Lazy DataDistributionService dataDistributionService) {
        this.heatTraceRepo = heatTraceRepo;
        this.heatTraceMapper = heatTraceMapper;
        this.sessionFactory = sessionFactory;
        this.htBreakerService = htBreakerService;
        this.htPanelService = htPanelService;
        this.equipmentService = equipmentService;
        this.fileService = fileService;
        this.dataDistributionService = dataDistributionService;
    }

    @Override
    public HeatTrace getEntity() {
        return new HeatTrace();
    }

    @Override
    public HeatTraceDto getDto() {
        return new HeatTraceDto();
    }

    @Override
    public HeatTraceRepo getRepo() {
        return heatTraceRepo;
    }

    @Override
    public HeatTraceMapper getMapper() {
        return heatTraceMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }


    @Override
    public void transferToDb() {
        List<HeatTraceJson> htJson = dataDistributionService.getHtJson();
        for (HeatTraceJson ht : htJson) {
            //Set panel - create if not found
            HtPanel htPanel = htPanelService.getByTagNumber(ht.getPanel());
            if(htPanel==null){
                htPanel = new HtPanel();
                htPanel.setTagNumber(ht.getPanel());
                htPanel.setLocation(ht.getLocation());
                htPanelService.save(htPanel);
            }

            //Set breaker - create if not found
            HtBreaker htBreaker = htPanel.getHtBreakers().stream().filter(e -> e.getBrNumber().equals(ht.getBreaker())).findFirst().orElse(null);
            if(htBreaker==null){
                htBreaker = new HtBreaker();
                htBreaker.setPanel(htPanel);
                htBreaker.setTagNumber(ht.getTo());
                htBreaker.setBrNumber(ht.getBreaker());
                htBreakerService.save(htBreaker);
            }

            //Set heat trace - create if not found
            HeatTrace heatTrace = htBreaker.getEquipmentList().stream().filter(e -> e.getTagNumber().equals(ht.getHtt())).findFirst().orElse(null);
            if(heatTrace==null){
                heatTrace = new HeatTrace();
                heatTrace.setBreaker(htBreaker);
                heatTrace.setTagNumber(ht.getHtt());
            }

            //Set Equipment - save as string if not found
            String tagNumber = Util.lettersAndNumbersOnly(ht.getLine()).toLowerCase();
            List<Equipment> list = equipmentService.getAll().stream().filter(e -> tagNumber.contains(Util.lettersAndNumbersOnly(e.getTagNumber()).toLowerCase())).toList();
            if(list == null || list.isEmpty()){
                heatTrace.setTempEquipment(ht.getLine());
            }else{
                if(heatTrace.getEquipmentList()==null)heatTrace.setEquipmentList(new ArrayList<>());
                heatTrace.getEquipmentList().addAll(list);
            }
            //Set pids
            List<FileObject> pid = fileService.getIfNumberContains(ht.getPid());
            if(pid==null || pid.isEmpty()) heatTrace.setTempPids(ht.getPid());
            else heatTrace.getPid().addAll(pid);

            //Set iso
            String num = ht.getIsoLink().replace("./PIDs/heat_trace/pd/","").replace(".pdf","");
            List<FileObject> isos = fileService.getIfNumberContains(num);
            if(isos.size()!=1) heatTrace.setTempIso(num);
            else heatTrace.setHtIso(isos.get(0));

            save(heatTrace);

        }
    }
}
