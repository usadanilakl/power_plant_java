package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.EqBreakerDto;
import com.dk_power.power_plant_java.entities.data_transfer.ElectricalTable;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.EqBreaker;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.mappers.equipment.EqBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.EqBreakerRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ElectricalTableService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import com.dk_power.power_plant_java.sevice.equipment.EqBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.util.Util;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class EqBreakerServiceImpl implements EqBreakerService {
    private final EqBreakerMapper eqBreakerMapper;
    private final EqBreakerRepo eqBreakerRepo;
    private final SessionFactory sessionFactory;
    private final RevisedLotoPointService revisedLotoPointService;
    private final ElectricalPanelService electricalPanelService;
    private final EquipmentService equipmentService;
    private final ElectricalTableService electricalTableService;


    public EqBreakerServiceImpl(@Lazy EqBreakerMapper eqBreakerMapper, EqBreakerRepo eqBreakerRepo, SessionFactory sessionFactory, RevisedLotoPointService revisedLotoPointService, @Lazy ElectricalPanelService electricalPanelService, @Lazy EquipmentService equipmentService, @Lazy ElectricalTableService electricalTableService) {
        this.eqBreakerMapper = eqBreakerMapper;
        this.eqBreakerRepo = eqBreakerRepo;
        this.sessionFactory = sessionFactory;
        this.revisedLotoPointService = revisedLotoPointService;
        this.electricalPanelService = electricalPanelService;
        this.equipmentService = equipmentService;
        this.electricalTableService = electricalTableService;
    }

    @Override
    public EqBreaker getEntity() {
        return new EqBreaker();
    }

    @Override
    public EqBreakerDto getDto() {
        return new EqBreakerDto();
    }

    @Override
    public EqBreakerRepo getRepo() {
        return eqBreakerRepo;
    }

    @Override
    public EqBreakerMapper getMapper() {
        return eqBreakerMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public EqBreaker convertToEntity(EqBreakerDto dto) {
        return getMapper().convertToEntity(dto);
    }

    @Override
    public EqBreakerDto convertToDto(EqBreaker entity) {
        return getMapper().convertToDto(entity);
    }

    @Override
    public void transferToDb() {
        List<ElectricalPanel> panels = electricalPanelService.getAll();
        List<RevisedLotoPoints> breakers = revisedLotoPointService.getAll().stream().filter(e->e.getTemperature()!=null && e.getTemperature().toLowerCase().trim().equalsIgnoreCase("checked")).toList();
        for (ElectricalPanel panel : panels) {
            List<RevisedLotoPoints> revisedLotoPoints = breakers
                    .stream()
                    .filter(b -> b.getLocation().substring(0,b.getLocation().indexOf(",")).trim().equalsIgnoreCase(panel.getTagNumber()))
                    .toList();
            for (RevisedLotoPoints rp : revisedLotoPoints) {
                String panelTagNum = rp.getLocation().substring(0,rp.getLocation().indexOf(",")).trim();
                String panelLocation = panel.getLocation().trim();
                String breaker = rp.getLocation()
                        .replace(panelTagNum,"")
                        .replace(panelLocation,"")
                        .trim();
                if(breaker.startsWith(",")) breaker =breaker.replace(",","").trim();
                if(breaker.endsWith(",")) breaker =breaker.substring(0,breaker.lastIndexOf(",")).trim();
                List<Equipment> eqt = equipmentService.getAll()
                        .stream()
                        .filter(e->Util.lettersAndNumbersOnly(e.getTagNumber()).equalsIgnoreCase(Util.lettersAndNumbersOnly(rp.getTagNumber())))
                        .toList();
                EqBreaker b = new EqBreaker();
                b.setPanel(panel);
                b.setDescription(rp.getDescription());
                b.setTagNumber(rp.getTagNumber().trim());
                b.setBrNumber(breaker);
                b.setEquipmentList(eqt);
                save(b);
            }
        }
        //set breaker
        //set equipment
    }

    @Override
    public void transerToDb2() {
        List<ElectricalTable> list = electricalTableService.getAll().stream().filter(e ->
                e.getBreakerType().toLowerCase().contains("molded") ||
                e.getBreakerType().toLowerCase().contains("rack") ||
                e.getBreakerType().toLowerCase().contains("fues")
        ).toList();


        for (ElectricalTable e : list) {
            ElectricalPanel panel = electricalPanelService.getByTagNumber(e.getBus().trim());
            if(panel==null){
                panel = new ElectricalPanel();
                panel.setTagNumber(e.getBus().trim());
                panel.setVoltage(e.getBreakerType());
                electricalPanelService.save(panel);
            }

            EqBreaker breaker = panel.getEqBreakers().stream().filter(b->b.getTagNumber().trim().equalsIgnoreCase(e.getTagNumber().trim())).findFirst().orElse(null);
            if(breaker==null){
                List<Equipment> eqt = equipmentService.getAll()
                        .stream()
                        .filter(el->Util.lettersAndNumbersOnly(el.getTagNumber()).equalsIgnoreCase(Util.lettersAndNumbersOnly(e.getTagNumber())))
                        .toList();
                breaker = new EqBreaker();
                breaker.setPanel(panel);
                breaker.setDescription(e.getPowerUser());
                breaker.setTagNumber(e.getTagNumber().trim());
                breaker.setBrType(e.getBreakerType());
                breaker.setBrNumber(e.getBreakerLocation());
                breaker.setEquipmentList(eqt);
                save(breaker);
            }
        }
    }

    @Override
    public List<String> getAllTags() {
        return eqBreakerRepo.findDistinctByTagNumber();
    }
}
