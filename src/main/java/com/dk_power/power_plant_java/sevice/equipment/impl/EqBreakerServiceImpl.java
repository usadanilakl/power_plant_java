package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.EqBreakerDto;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.EqBreaker;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.mappers.equipment.EqBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.EqBreakerRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import com.dk_power.power_plant_java.sevice.equipment.EqBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.util.Util;
import org.hibernate.SessionFactory;
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


    public EqBreakerServiceImpl(EqBreakerMapper eqBreakerMapper, EqBreakerRepo eqBreakerRepo, SessionFactory sessionFactory, RevisedLotoPointService revisedLotoPointService, ElectricalPanelService electricalPanelService, EquipmentService equipmentService) {
        this.eqBreakerMapper = eqBreakerMapper;
        this.eqBreakerRepo = eqBreakerRepo;
        this.sessionFactory = sessionFactory;
        this.revisedLotoPointService = revisedLotoPointService;
        this.electricalPanelService = electricalPanelService;
        this.equipmentService = equipmentService;
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
        List<RevisedLotoPoints> breakers = revisedLotoPointService.getAll().stream().filter(e->e.getTemperature().toLowerCase().trim().equals("checked")).toList();
        for (ElectricalPanel panel : panels) {
            List<RevisedLotoPoints> revisedLotoPoints = breakers.stream().filter(b -> Util.lettersAndNumbersOnly(b.getLocation()).contains(Util.lettersAndNumbersOnly(panel.getTagNumber()))).toList();
            for (RevisedLotoPoints rp : revisedLotoPoints) {
                List<Equipment> eqt = equipmentService.getByTagNumber(rp.getTagNumber().trim());
                EqBreaker b = new EqBreaker();
                b.setPanel(panel);
                b.setDescription(rp.getDescription());
                b.setTagNumber(rp.getTagNumber());
                b.setBrNumber(rp.getLocation().replace(panel.getTagNumber(),""));
                b.setEquipmentList(eqt);
                save(b);
            }
        }
        //set breaker
        //set equipment
    }
}
